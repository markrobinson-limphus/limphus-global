import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ensureTenantForUser } from "@/lib/tenant";
import { logAction } from "@/lib/actionLog";

function normalizeUrl(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/\/.*$/, "").split(":")[0] ?? "";
  return s || input.trim();
}

/** Require at least one dot and no spaces (valid hostname). */
function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  if (/[\s/\\]/.test(domain)) return false;
  const parts = domain.split(".");
  return parts.length >= 2 && parts.every((p) => p.length > 0);
}

/**
 * Infer country code from domain TLD so the map shows a global operation.
 * .uk / .co.uk → GB, .ca → CA, .au → AU, .de → DE, etc. Default US.
 */
function inferCountryFromDomain(domain: string): string {
  const lower = domain.toLowerCase();
  const parts = lower.split(".");
  const tld = parts.length >= 2 ? parts[parts.length - 1]! : "";
  const secondTld = parts.length >= 3 ? parts[parts.length - 2]! : "";

  if (tld === "uk" || secondTld === "uk") return "GB";
  if (tld === "ca") return "CA";
  if (tld === "au") return "AU";
  if (tld === "de") return "DE";
  if (tld === "fr") return "FR";
  if (tld === "ie") return "IE";
  if (tld === "nz") return "NZ";
  if (tld === "in") return "IN";
  if (tld === "gov") return "US";
  if (tld === "edu") return "US";

  return "US";
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tenantId = await ensureTenantForUser(userId);

    const body = await req.json();
    const raw = body?.urls ?? body?.domains ?? [];
    const urls = Array.isArray(raw) ? raw : [raw].filter(Boolean);

    if (urls.length === 0) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    const domains = [...new Set(urls.map((u: string) => normalizeUrl(u)))].filter(
      (d) => isValidDomain(d)
    );

    if (domains.length === 0) {
      return NextResponse.json(
        { error: "No valid domains found (need at least one hostname like example.com)" },
        { status: 400 }
      );
    }

    const created = await prisma.$transaction(
      domains.map((domain) => {
        const countryCode = inferCountryFromDomain(domain);
        return prisma.lead.upsert({
          where: {
            tenantId_domain: { tenantId, domain },
          },
          create: {
            tenantId,
            domain,
            countryCode,
            industry: "legal",
            auditStatus: "pending",
          },
          update: {},
        });
      })
    );

    await logAction(tenantId, "FOUND_LEADS", `Found ${created.length} lead${created.length !== 1 ? "s" : ""}`, {
      count: created.length,
      domains: created.map((c) => c.domain),
    });

    return NextResponse.json({ queued: created.length, ids: created.map((c) => c.id) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
