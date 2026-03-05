import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureTenantForUser } from "@/lib/tenant";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await ensureTenantForUser(userId);

    const logs = await prisma.actionLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({
      actions: logs.map((log) => ({
        id: log.id,
        actionType: log.actionType,
        message: log.message,
        metadata: log.metadata,
        createdAt: log.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error", actions: [] }, { status: 500 });
  }
}
