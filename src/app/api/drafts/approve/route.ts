import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { ensureTenantForUser } from "@/lib/tenant";
import { logAction } from "@/lib/actionLog";
import { calculateFineExposure, getRegionIntel } from "@/lib/regulatory";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL?.trim() ||
  "Limphus Global <onboarding@resend.dev>";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await ensureTenantForUser(userId);
    const body = await req.json().catch(() => ({}));
    const draftId = body.draftId as string | undefined;
    if (!draftId) return NextResponse.json({ error: "draftId required" }, { status: 400 });

    const draft = await prisma.draft.findFirst({
      where: { id: draftId, tenantId },
      include: { lead: true },
    });
    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const lead = draft.lead;
    const domain = (lead?.domain ?? "").trim() || "example.com";
    const to = (lead?.contactEmail ?? "").trim() || `compliance@${domain}`;
    if (!to || !to.includes("@")) {
      return NextResponse.json(
        { error: "No valid contact email for this lead. Use Edit in Gmail and paste the body, or add an email to the lead.", details: "Missing contact email" },
        { status: 400 }
      );
    }

    const draftJson = draft.draftJson as { subject?: string; body?: string } | null;
    const subject = (draftJson?.subject ?? "").replace(/\s+/g, " ").trim() || "Compliance outreach";
    const bodyPlain = (draftJson?.body ?? "").trim() || "";
    const htmlBody = bodyPlain
      ? bodyPlain.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br/>")
      : "<p>Compliance outreach.</p>";

    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html: htmlBody,
    });

    if (error) {
      console.error("Resend send failed:", error);
      const message = error.message ?? "Send failed";
      return NextResponse.json(
        { error: "Resend failed", details: message },
        { status: 502 }
      );
    }

    await prisma.$transaction([
      prisma.draft.update({
        where: { id: draftId },
        data: { status: "approved", approvedAt: new Date() },
      }),
      prisma.lead.update({
        where: { id: draft.leadId },
        data: { workflowStatus: "CONTACTED" },
      }),
    ]);

    const fineEstimated = lead
      ? calculateFineExposure({
          countryCode: lead.countryCode ?? "US",
          industry: lead.industry ?? "legal",
          dmarcOk: lead.dmarcOk,
        })
      : 0;
    const region = lead ? getRegionIntel(lead.countryCode ?? "US", lead.industry ?? "legal") : null;
    const hookUsed = region?.framework ?? region?.name ?? "generic";

    await logAction(
      tenantId,
      "EMAIL_SENT",
      `Sovereign approved and sent email to ${domain}`,
      {
        draftId,
        leadId: draft.leadId,
        domain,
        resend_id: data?.id ?? null,
        fineEstimated,
        hookUsed,
      },
      draft.leadId
    );

    return NextResponse.json({
      ok: true,
      leadId: draft.leadId,
      domain,
      resendId: data?.id,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Server error", message: e instanceof Error ? e.message : "Send failed" },
      { status: 500 }
    );
  }
}
