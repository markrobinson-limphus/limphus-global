import { promises as dns } from "node:dns";

const FETCH_TIMEOUT_MS = 8000;
const USER_AGENT =
  "Mozilla/5.0 (compatible; LimphusGlobal/1.0; +https://limphus.global)";

/**
 * Check if the domain has a DMARC record (TXT at _dmarc.<domain>).
 * The #1 security failure for 2026 fines is missing DMARC.
 */
export async function checkDmarc(domain: string): Promise<boolean> {
  const dmarcHost = `_dmarc.${domain}`;
  try {
    const records = await dns.resolve(dmarcHost, "TXT");
    return Array.isArray(records) && records.length > 0;
  } catch {
    return false;
  }
}

/**
 * Scrape the domain's homepage (and www) for an email ending in @<domain>.
 * Looks for mailto: links first, then any email regex matching *@domain.
 */
export async function scrapeContactEmail(domain: string): Promise<string | null> {
  const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const emailRegex = new RegExp(
    `[a-zA-Z0-9._%+-]+@${escapedDomain}`,
    "gi"
  );
  const mailtoRegex = /mailto:([^"'\s>]+)/gi;

  const urls = [`https://${domain}`, `https://www.${domain}`];

  for (const url of urls) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": USER_AGENT },
        redirect: "follow",
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const html = await res.text();

      const mailtoMatch = mailtoRegex.exec(html);
      if (mailtoMatch) {
        const email = mailtoMatch[1]!.trim().toLowerCase();
        if (email.endsWith(`@${domain}`)) return email;
      }

      const emailMatch = html.match(emailRegex);
      if (emailMatch) {
        const email = emailMatch[0]!.trim().toLowerCase();
        if (email.endsWith(`@${domain}`)) return email;
      }
    } catch {
      // Timeout or network error — try next URL
    }
  }
  return null;
}

export type LeadAuditResult = {
  dmarcOk: boolean;
  contactEmail: string | null;
};

/**
 * Run the Scalper: DMARC check + contact scrape for one domain.
 */
export async function runLeadAudit(domain: string): Promise<LeadAuditResult> {
  const [dmarcOk, contactEmail] = await Promise.all([
    checkDmarc(domain),
    scrapeContactEmail(domain),
  ]);
  return { dmarcOk, contactEmail };
}
