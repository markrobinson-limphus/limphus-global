import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureTenantForUser } from "@/lib/tenant";
import { calculateFineExposure } from "@/lib/regulatory";

/** Returns all drafts for the authenticated tenant. No status filter — includes draft, reviewed, approved. */

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await ensureTenantForUser(userId);

    const drafts = await prisma.draft.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { lead: true },
    });

    return NextResponse.json({
      drafts: drafts.map((d) => {
        const lead = d.lead;
        const fineExposure =
          lead != null
            ? calculateFineExposure({
                countryCode: lead.countryCode ?? "US",
                industry: lead.industry ?? "legal",
                dmarcOk: lead.dmarcOk,
              })
            : 0;
        const draftJson = d.draftJson;
        const safeDraftJson =
          draftJson != null && typeof draftJson === "object" && !Array.isArray(draftJson)
            ? (draftJson as { subject?: string; body?: string; needsReview?: boolean })
            : {};
        return {
          id: String(d.id),
          leadId: String(d.leadId),
          status: String(d.status ?? "draft"),
          draftJson: safeDraftJson,
          emailSecurity: d.emailSecurity as { spfOk?: boolean; dmarcOk?: boolean; dkimOk?: boolean } | undefined,
          lead: lead
            ? {
                domain: String(lead.domain ?? ""),
                countryCode: String(lead.countryCode ?? "US"),
                industry: String(lead.industry ?? "legal"),
                contactEmail: lead.contactEmail ?? null,
                dmarcOk: lead.dmarcOk ?? null,
                fineExposure,
              }
            : undefined,
          createdAt: d.createdAt.toISOString(),
        };
      }),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error", drafts: [] }, { status: 500 });
  }
}
