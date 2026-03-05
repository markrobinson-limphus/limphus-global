import intel from "./regulatory_intel.json";

export type RegionKey = keyof typeof intel.regions;

export interface RegionIntel {
  name: string;
  framework: string;
  threat: string;
  hook: string;
  fineExposure: string;
  exposureAmount?: number;
  violationHook2026?: string;
}

export function getRegionIntel(countryCode: string, industry: string): RegionIntel | null {
  const code = countryCode.toUpperCase();
  let key: string | null = null;

  if (code === "US" || code === "USA") {
    key = industry === "finance" ? "US-NYDFS" : "US-NY";
  } else if (code === "CA" || code === "CAN") {
    key = industry === "healthcare" ? "PHIPA" : "ON";
  } else if (code === "UK" || code === "GB") {
    key = "UK";
  } else if (industry === "healthcare") {
    key = "HIPAA";
  }

  if (!key || !(key in intel.regions)) return null;
  return (intel.regions as Record<string, RegionIntel>)[key];
}

export function getHookForLead(countryCode: string, industry: string): string {
  const region = getRegionIntel(countryCode, industry);
  return region?.hook ?? "Your jurisdiction increasingly treats email authentication (SPF, DMARC, DKIM) as a baseline control for data protection and fraud prevention.";
}

/** Lead-like shape for exposure calculation */
export interface LeadForExposure {
  countryCode: string;
  industry: string;
  dmarcOk?: boolean | null;
}

/**
 * Calculate fine exposure in USD for a lead based on 2026 regulatory climate.
 * NYDFS (NYC finance): $2M+; HIPAA: Tier 4 cap; NIS2/UK: €10M benchmark.
 * Identity exposure (missing DMARC) multiplies base exposure.
 */
export function calculateFineExposure(lead: LeadForExposure): number {
  const region = getRegionIntel(lead.countryCode, lead.industry);
  let exposure = region?.exposureAmount ?? 0;
  if (exposure <= 0) return 0;
  const dmarcMissing = lead.dmarcOk === false;
  if (dmarcMissing) exposure *= 1.5;
  return Math.round(exposure);
}

export function getViolationHook2026(countryCode: string, industry: string): string {
  const region = getRegionIntel(countryCode, industry);
  return region?.violationHook2026 ?? "Failure to implement baseline email authentication (SPF, DMARC, DKIM) as required by applicable 2026 standards.";
}

export { intel };
