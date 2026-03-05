import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureTenantForUser } from "@/lib/tenant";
import { logAction } from "@/lib/actionLog";

/**
 * Jumpstart: set ALL leads that are not READY to READY (AUDITING, HUNTED, AUDITED, WAITING, etc.)
 * so you can trigger them with the Shield icon.
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await ensureTenantForUser(userId);

    const result = await prisma.lead.updateMany({
      where: {
        tenantId,
        workflowStatus: { not: "READY" },
      },
      data: { workflowStatus: "READY" },
    });

    await logAction(tenantId, "JUMPSTART", `Set ${result.count} AUDITING/HUNTED leads to READY`, {
      count: result.count,
    });

    return NextResponse.json({
      ok: true,
      count: result.count,
      message: `${result.count} leads set to READY. Click Shield to process.`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
