import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureTenantForUser } from "@/lib/tenant";

export type BotMember = {
  id: string;
  name: string;
  role: string;
  responsibility: string;
  currentTask: string;
  status: "processing" | "idle" | "waiting_for_approval";
  manualOption: string;
  manualAction: string;
  lastActivityAt?: string;
};

export async function GET() {
  try {
    const { userId, orgId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await ensureTenantForUser(userId);
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { workerManualOverride: true },
    });

    const manualOverride = tenant?.workerManualOverride ?? false;

    const [lastLogs, draftCount] = await Promise.all([
      prisma.actionLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { actionType: true, message: true, createdAt: true, metadata: true },
      }),
      prisma.draft.count({ where: { tenantId, status: "draft" } }),
    ]);

    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const lastHunt = lastLogs.find((l) => l.actionType === "HUNT" || l.actionType === "FOUND_LEADS");
    const lastScalp = lastLogs.find((l) => l.actionType === "AUDIT_BATCH");
    const lastDraft = lastLogs.find((l) => l.actionType === "DRAFT");
    const lastCycle = lastLogs.find((l) => l.actionType === "WORKER_CYCLE");

    const statusFor = (log: { createdAt: Date } | undefined, waitingCondition: boolean): "processing" | "idle" | "waiting_for_approval" => {
      if (waitingCondition) return "waiting_for_approval";
      if (log && new Date(log.createdAt) > twoMinutesAgo) return "processing";
      return "idle";
    };

    const bots: BotMember[] = [
      {
        id: "hunter",
        name: "The Hunter",
        role: "Lead Discovery",
        responsibility: "Automatically finds 10–50 leads per hour in your target niche.",
        currentTask: lastHunt?.message ?? "Searching: legal & compliance firms.",
        status: statusFor(lastHunt, false),
        manualOption: "Hunt Now",
        manualAction: "/dashboard/leads?bulk=1",
        lastActivityAt: lastHunt?.createdAt.toISOString(),
      },
      {
        id: "scalper",
        name: "The Scalper",
        role: "Technical Auditor",
        responsibility: "Scrapes sites, checks DMARC, and calculates $500k+ fine exposure.",
        currentTask: lastScalp?.message ?? "Auditing: waiting for READY leads.",
        status: statusFor(lastScalp, false),
        manualOption: "Audit Lead",
        manualAction: "audit",
        lastActivityAt: lastScalp?.createdAt.toISOString(),
      },
      {
        id: "triage",
        name: "Triage AI",
        role: "Manager (Layer 2)",
        responsibility: "Categorizes leads by risk level and selects the best hook for the email.",
        currentTask: lastCycle?.message ?? "Sorting leads by risk.",
        status: statusFor(lastCycle, false),
        manualOption: "View Leads",
        manualAction: "/dashboard/leads",
        lastActivityAt: lastCycle?.createdAt.toISOString(),
      },
      {
        id: "closer",
        name: "The Closer",
        role: "Outreach Bot",
        responsibility: "Drafts personalized emails and prepares them for your approval.",
        currentTask: lastDraft?.message ?? (draftCount > 0 ? `Drafting: ${draftCount} email(s) pending.` : "Drafting: waiting for audited leads."),
        status: statusFor(lastDraft, draftCount > 0),
        manualOption: "Edit & Send",
        manualAction: "/dashboard/drafts",
        lastActivityAt: lastDraft?.createdAt.toISOString(),
      },
      {
        id: "archivist",
        name: "The Archivist",
        role: "Compliance Log",
        responsibility: "Records every action for history and reporting.",
        currentTask: lastCycle?.message ?? "Logging: ready.",
        status: lastCycle && new Date(lastCycle.createdAt) > twoMinutesAgo ? "processing" : "idle",
        manualOption: "View History",
        manualAction: "/dashboard",
        lastActivityAt: lastCycle?.createdAt.toISOString(),
      },
    ];

    let sovereignName = "Sovereign";
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
sovereignName = ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.emailAddresses[0]?.emailAddress) ?? "Sovereign";
(add parentheses around the part before ?? "Sovereign")
    } catch {
      // keep default
    }

    const sovereign = {
      name: sovereignName,
      role: "CEO / Admin",
      responsibility: "Manually approves drafts, overrides bots, and closes deals.",
      currentTask: manualOverride ? "Manual Override ON: you are in control." : "Online: Monitoring Pipeline.",
      status: manualOverride ? ("waiting_for_approval" as const) : ("idle" as const),
    };

    let members: Array<{ id: string; name: string; role: string; currentTask: string }> = [];

    if (orgId) {
      try {
        const client = await clerkClient();
        const res = await client.organizations.getOrganizationMembershipList({
          organizationId: orgId,
          limit: 50,
        });
        members = res.data.map((m) => {
          const pd = (m as { publicUserData?: { identifier?: string; userId?: string } }).publicUserData;
          const name = pd?.identifier ?? pd?.userId ?? "Team member";
          return {
            id: m.id,
            name: String(name),
            role: m.role ?? "member",
            currentTask: "Manual review / available",
          };
        });
      } catch (e) {
        console.error("Clerk org members:", e);
      }
    }

    return NextResponse.json({
      bots,
      sovereign,
      members,
      manualOverride,
      orgEnabled: !!orgId,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await ensureTenantForUser(userId);
    const body = await req.json().catch(() => ({}));
    const manualOverride = body.manualOverride === true;

    await prisma.tenant.update({
      where: { id: tenantId },
      data: { workerManualOverride: manualOverride },
    });

    return NextResponse.json({ manualOverride });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
