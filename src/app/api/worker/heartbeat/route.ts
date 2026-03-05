import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logAction } from "@/lib/actionLog";
import { runLeadAudit } from "@/lib/scalper";
import { searchLeads, normalizeUrl, isValidDomain, inferCountryFromDomain } from "@/lib/hunt";
import { getHookForLead } from "@/lib/regulatory";

const READY_TARGET = 20;
const HUNT_BATCH = 10;
const SCALP_BATCH = 10;
const CLOSER_BATCH = 100;

function isCronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/**
 * Worker heartbeat: Hunt → Scalp (audit) → Closer (draft).
 * GET /api/worker/heartbeat — trigger manually in browser or via cron.
 * If CRON_SECRET is not set, no auth required.
 */
export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tenant = await prisma.tenant.findFirst({ select: { id: true, workerManualOverride: true } });
    if (!tenant) {
      return NextResponse.json({ ok: true, message: "No tenant" });
    }
    const tenantId = tenant.id;

    if (tenant.workerManualOverride) {
      await logAction(tenantId, "WORKER_CYCLE", "Autonomous worker skipped (Manual Override ON)", {
        skipped: true,
      });
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: "Manual Override ON — cycle skipped",
      });
    }

    let found = 0;
    let audited = 0;
    let drafted = 0;

    // —— Hunt: if READY + HUNTED below target, search and add as HUNTED (Shield can promote to READY) ——
    const [readyCount, huntedCount] = await Promise.all([
      prisma.lead.count({ where: { tenantId, workflowStatus: "READY" } }),
      prisma.lead.count({ where: { tenantId, workflowStatus: "HUNTED" } }),
    ]);
    const poolSize = readyCount + huntedCount;
    if (poolSize < READY_TARGET) {
      const { domains } = await searchLeads(undefined, HUNT_BATCH);
      const valid = [...new Set(domains.map(normalizeUrl))].filter(isValidDomain);
      for (const domain of valid) {
        const countryCode = inferCountryFromDomain(domain);
        await prisma.lead.upsert({
          where: { tenantId_domain: { tenantId, domain } },
          create: {
            tenantId,
            domain,
            countryCode,
            industry: "legal",
            auditStatus: "pending",
            workflowStatus: "HUNTED",
          },
          update: {},
        });
        found++;
      }
      if (found > 0) {
        await logAction(tenantId, "HUNT", `Bot found ${found} leads`, { count: found, domains: valid });
      }
    }

    // —— Scalp: READY → runLeadAudit → AUDITED ——
    const ready = await prisma.lead.findMany({
      where: { tenantId, workflowStatus: "READY" },
      orderBy: { createdAt: "asc" },
      take: SCALP_BATCH,
      select: { id: true, domain: true },
    });

    const auditPromises = ready.map(async (lead) => {
      try {
        const r = await runLeadAudit(lead.domain);
        return { lead, dmarcOk: r.dmarcOk, contactEmail: r.contactEmail, failed: false as const };
      } catch (e) {
        return { lead, failed: true as const, error: e };
      }
    });
    const auditResults = await Promise.all(auditPromises);

    for (const outcome of auditResults) {
      if (outcome.failed) {
        try {
          await prisma.lead.update({
            where: { id: outcome.lead.id },
            data: {
              auditStatus: "audited",
              workflowStatus: "AUDITED",
              mapRiskScore: 50,
              riskLevel: "MEDIUM",
              auditResultJson: {
                failed: true,
                error: outcome.error instanceof Error ? outcome.error.message : "Audit failed",
                auditedAt: new Date().toISOString(),
              },
            },
          });
          console.log(`>>> DB UPDATE: Lead [${outcome.lead.domain}] saved riskLevel=MEDIUM mapRiskScore=50 workflowStatus=AUDITED (audit failed)`);
        } catch (e) {
          console.error("DB update failed for lead", outcome.lead.id, e);
        }
        audited++;
        continue;
      }
      const { lead, dmarcOk, contactEmail } = outcome;
      const riskLevel = !dmarcOk ? "HIGH" : "LOW";
      const mapRiskScore = !dmarcOk ? 90 : 20;
      try {
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            dmarcOk,
            contactEmail: contactEmail ?? undefined,
            auditStatus: "audited",
            workflowStatus: "AUDITED",
            mapRiskScore,
            riskLevel,
            auditResultJson: {
              dmarcOk,
              contactEmail: contactEmail ?? null,
              auditedAt: new Date().toISOString(),
              mapRiskScore,
              riskLevel,
            },
          },
        });
        console.log(`>>> DB UPDATE: Lead [${lead.domain}] saved riskLevel=${riskLevel} mapRiskScore=${mapRiskScore} workflowStatus=AUDITED`);
      } catch (e) {
        console.error("DB update failed for lead", lead.id, e);
      }
      audited++;
    }
    if (audited > 0) {
      await logAction(tenantId, "AUDIT_BATCH", `Bot audited ${audited} leads`, { count: audited });
    }

    // —— Closer: ALL leads with workflowStatus === 'AUDITED' and no draft yet → create draft, set lead to WAITING ——
    const auditedLeads = await prisma.lead.findMany({
      where: { tenantId, workflowStatus: "AUDITED" },
      select: { id: true, domain: true, countryCode: true, industry: true, contactEmail: true, dmarcOk: true },
      take: 2000,
    });

    const leadIdsWithDraft = new Set(
      (
        await prisma.draft.findMany({
          where: { leadId: { in: auditedLeads.map((l) => l.id) } },
          select: { leadId: true },
        })
      ).map((d) => d.leadId)
    );

    const needsDraft = auditedLeads.filter((l) => !leadIdsWithDraft.has(l.id)).slice(0, CLOSER_BATCH);

    for (const lead of needsDraft) {
      const domain = (lead.domain ?? "").trim() || "unknown";
      const countryCode = lead.countryCode ?? "US";
      const industry = lead.industry ?? "legal";
      const recipientEmail = lead.contactEmail?.trim() || "compliance@" + domain;
      const needsReview = !lead.contactEmail?.trim();
      const hook = getHookForLead(countryCode, industry);
      const subject = needsReview
        ? "Compliance Warning — " + domain
        : "Compliance risk at " + domain + " — " + countryCode + " 2026";
      const body =
        "Hi,\n\n" +
        hook +
        "\n\nWe help firms like yours close the gap before regulators do.\n\nBest,\nYour Team";

      try {
        await prisma.draft.create({
          data: {
            tenantId,
            leadId: lead.id,
            draftJson: { subject, body, needsReview },
            emailSecurity: { dmarcOk: lead.dmarcOk ?? false },
            status: "draft",
          },
        });
        await prisma.lead.update({
          where: { id: lead.id },
          data: { contactEmail: recipientEmail, workflowStatus: "WAITING" },
        });
        drafted++;
        console.log(">>> SOVEREIGN: Created draft for " + domain);
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        console.error("CLOSER: Draft failed for " + domain + ":", errMsg, e);
      }
    }

    if (drafted > 0) {
      await logAction(tenantId, "DRAFT", `Bot drafted ${drafted} emails`, { count: drafted });
    }

    const message = `Autonomous Worker Cycle Complete: ${found} Found, ${audited} Audited, ${drafted} Drafted`;
    await logAction(tenantId, "WORKER_CYCLE", message, {
      found,
      audited,
      drafted,
    });

    return NextResponse.json({
      ok: true,
      found,
      audited,
      drafted,
      draftsCreated: drafted,
      message,
    });
  } catch (e) {
    console.error("Worker heartbeat error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
