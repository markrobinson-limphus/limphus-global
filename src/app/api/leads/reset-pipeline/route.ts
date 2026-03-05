import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureTenantForUser } from "@/lib/tenant";
import { logAction } from "@/lib/actionLog";

/**
 * Reset pipeline: set all leads back to READY, clear audit data and risk fields.
 * Drafts are left as-is; leads can be re-audited and will get new drafts if needed.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await ensureTenantForUser(userId);

    const count = await prisma.lead.updateMany({
      where: { tenantId },
      data: {
        workflowStatus: "READY",
        auditStatus: "pending",
        contactEmail: null,
        dmarcOk: null,
        spfOk: null,
        dkimOk: null,
        regulatoryRiskScore: null,
        mapRiskScore: null,
        riskLevel: null,
        auditResultJson: null,
        httpsOk: null,
        privacyPolicyFound: null,
      },
    });

    await logAction(tenantId, "PIPELINE_RESET", `Pipeline reset: ${count.count} leads set to READY`, {
      count: count.count,
    });

    return NextResponse.json({ ok: true, count: count.count });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
