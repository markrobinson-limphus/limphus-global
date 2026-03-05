import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureTenantForUser } from "@/lib/tenant";
import { logAction } from "@/lib/actionLog";
import { runLeadAudit } from "@/lib/scalper";

const BATCH_SIZE = 10;

type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await ensureTenantForUser(userId);

    let ready = await prisma.lead.findMany({
      where: { tenantId, workflowStatus: "READY" },
      orderBy: { createdAt: "asc" },
      take: BATCH_SIZE,
      select: { id: true, domain: true },
    });

    if (ready.length === 0) {
      const hunted = await prisma.lead.findMany({
        where: { tenantId, workflowStatus: "HUNTED" },
        orderBy: { createdAt: "asc" },
        take: 5,
        select: { id: true, domain: true },
      });
      if (hunted.length > 0) {
        await prisma.lead.updateMany({
          where: { id: { in: hunted.map((l) => l.id) } },
          data: { workflowStatus: "READY" },
        });
        ready = hunted;
      }
    }

    if (ready.length === 0) {
      return NextResponse.json(
        { message: "No READY leads to process", moved: 0 },
        { status: 200 }
      );
    }

    await prisma.lead.updateMany({
      where: { id: { in: ready.map((r) => r.id) } },
      data: { workflowStatus: "AUDITING" },
    });

    const domains = ready.map((r) => r.domain);
    await logAction(tenantId, "AUDIT_BATCH", `Audit batch started: ${ready.length} leads`, {
      count: ready.length,
      domains,
    });

    const auditPromises = ready.map(async (lead) => {
      try {
        const r = await runLeadAudit(lead.domain);
        return { lead, dmarcOk: r.dmarcOk, contactEmail: r.contactEmail, failed: false as const };
      } catch (e) {
        return { lead, failed: true as const, error: e };
      }
    });

    const results = await Promise.all(auditPromises);

    let missingDmarc = 0;
    let contactsFound = 0;

    for (const outcome of results) {
      const leadId = outcome.lead.id;
      const domain = outcome.lead.domain;

      let riskLevel: RiskLevel;
      let mapRiskScore: number;
      let auditData: Record<string, unknown>;
      let contactEmail: string | undefined;
      let dmarcOk: boolean | null | undefined;

      if (outcome.failed) {
        riskLevel = "MEDIUM";
        mapRiskScore = 50;
        contactEmail = undefined;
        dmarcOk = undefined;
        auditData = {
          failed: true,
          error: outcome.error instanceof Error ? outcome.error.message : "Audit failed",
          auditedAt: new Date().toISOString(),
          riskLevel,
          mapRiskScore,
        };
        console.error(`Audit failed for ${domain}:`, outcome.error);
      } else {
        dmarcOk = outcome.dmarcOk;
        contactEmail = outcome.contactEmail ?? undefined;
        if (contactEmail) contactsFound++;
        if (!dmarcOk) missingDmarc++;
        riskLevel = dmarcOk ? "LOW" : "HIGH";
        mapRiskScore = dmarcOk ? 20 : 90;
        auditData = {
          dmarcOk,
          contactEmail: contactEmail ?? null,
          auditedAt: new Date().toISOString(),
          riskLevel,
          mapRiskScore,
        };
      }

      // Force persistence: explicit nulls so Prisma always writes (undefined = "don't update")
      const updatePayload = {
        dmarcOk: dmarcOk ?? null,
        contactEmail: contactEmail ?? null,
        auditStatus: "audited" as const,
        mapRiskScore,
        riskLevel,
        auditResultJson: auditData,
        workflowStatus: "AUDITED" as const,
      };
      console.log(`>>> SOVEREIGN DEBUG Saving Lead:`, { domain, ...updatePayload });

      try {
        await prisma.lead.update({
          where: { id: leadId },
          data: updatePayload,
        });
        console.log(`>>> DB UPDATE: Lead [${domain}] saved riskLevel=${riskLevel} mapRiskScore=${mapRiskScore} workflowStatus=AUDITED`);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        const errCode = (e as { code?: string })?.code;
        console.error(`DB update failed for lead ${domain}:`, errMsg, errCode ? `(code: ${errCode})` : "");
        try {
          await prisma.lead.update({
            where: { id: leadId },
            data: {
              auditStatus: "audited",
              riskLevel: "MEDIUM" as RiskLevel,
              mapRiskScore: 50,
              workflowStatus: "AUDITED",
              auditResultJson: { ...auditData, dbError: errMsg, dbCode: errCode ?? null },
            },
          });
          console.log(`>>> DB UPDATE (fallback): Lead [${domain}] saved riskLevel=MEDIUM mapRiskScore=50 workflowStatus=AUDITED`);
        } catch (e2) {
          const err2Msg = e2 instanceof Error ? e2.message : String(e2);
          console.error(`Fallback update failed for lead ${domain}:`, err2Msg);
        }
      }
    }

    const updatedLeadIds = ready.map((r) => r.id);
    const updatedLeads =
      updatedLeadIds.length > 0
        ? await prisma.lead.findMany({
            where: { id: { in: updatedLeadIds } },
            select: {
              id: true,
              domain: true,
              contactEmail: true,
              dmarcOk: true,
              mapRiskScore: true,
              riskLevel: true,
              workflowStatus: true,
            },
          })
        : [];

    await logAction(
      tenantId,
      "AUDIT_BATCH",
      `Audited ${ready.length} leads: ${missingDmarc} missing DMARC, ${contactsFound} contacts found`,
      { count: ready.length, missingDmarc, contactsFound }
    );

    return NextResponse.json({
      message: `Audited ${ready.length} lead${ready.length !== 1 ? "s" : ""}: ${missingDmarc} missing DMARC, ${contactsFound} contacts found`,
      moved: ready.length,
      domains,
      missingDmarc,
      contactsFound,
      updatedLeads,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
