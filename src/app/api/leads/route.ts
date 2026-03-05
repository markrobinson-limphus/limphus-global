import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureTenantForUser } from "@/lib/tenant";
import { calculateFineExposure } from "@/lib/regulatory";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await ensureTenantForUser(userId);

    const leads = await prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return NextResponse.json({
      leads: leads.map((l) => {
        const fineExposure = calculateFineExposure({
          countryCode: l.countryCode,
          industry: l.industry,
          dmarcOk: l.dmarcOk,
        });
        return {
          id: l.id,
          domain: l.domain,
          countryCode: l.countryCode,
          industry: l.industry,
          contactEmail: l.contactEmail,
          auditStatus: l.auditStatus,
          workflowStatus: l.workflowStatus,
          regulatoryRiskScore: l.regulatoryRiskScore,
          dmarcOk: l.dmarcOk,
          fineExposure,
          mapRiskScore: l.mapRiskScore,
          riskLevel: l.riskLevel,
          createdAt: l.createdAt.toISOString(),
        };
      }),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error", leads: [] }, { status: 500 });
  }
}
