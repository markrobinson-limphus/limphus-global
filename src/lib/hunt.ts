/**
 * Hunter: search for new lead domains (e.g. Serper/Google).
 * Set SERPER_API_KEY in .env to enable. Otherwise returns [].
 */

const SERPER_URL = "https://google.serper.dev/search";

export function normalizeUrl(input: string): string {
  let s = input.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, "").replace(/\/.*$/, "").split(":")[0] ?? "";
  return s || input.trim();
}

export function inferCountryFromDomain(domain: string): string {
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

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.startsWith("www.")) return host.slice(4);
    return host;
  } catch {
    return null;
  }
}

export function isValidDomain(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  if (/[\s/\\]/.test(domain)) return false;
  const parts = domain.split(".");
  return parts.length >= 2 && parts.every((p) => p.length > 0);
}

export type HuntResult = { domains: string[]; query: string };

/**
 * Search for up to 10 domains in the target niche (legal/compliance by default).
 * Returns unique domains extracted from organic results.
 */
export async function searchLeads(
  query?: string,
  limit = 10
): Promise<HuntResult> {
  const apiKey = process.env.SERPER_API_KEY;
  const q = query ?? "compliance legal firms UK USA";
  if (!apiKey) {
    return { domains: [], query: q };
  }
  try {
    const res = await fetch(SERPER_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q, num: Math.min(limit + 5, 20) }),
    });
    if (!res.ok) return { domains: [], query: q };
    const data = (await res.json()) as {
      organic?: Array<{ link?: string }>;
    };
    const links = data.organic ?? [];
    const domains = new Set<string>();
    for (const item of links) {
      const domain = item.link ? extractDomain(item.link) : null;
      if (domain && isValidDomain(domain)) domains.add(domain);
      if (domains.size >= limit) break;
    }
    return { domains: [...domains].slice(0, limit), query: q };
  } catch (e) {
    console.error("Hunt search failed:", e);
    return { domains: [], query: q };
  }
}
