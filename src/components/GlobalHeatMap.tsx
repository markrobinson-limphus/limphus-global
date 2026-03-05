"use client";

import { useMemo, useState, useEffect } from "react";
import { calculateFineExposure } from "@/lib/regulatory";

type Lead = {
  countryCode?: string;
  country?: string;
  industry: string;
  dmarcOk?: boolean | null;
  fineExposure?: number | null;
  mapRiskScore?: number | null;
  riskLevel?: string | null;
};

type GlobalHeatMapProps = {
  leads: Lead[];
  leadCount?: number;
};

const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  USA: "United States",
  GB: "United Kingdom",
  UK: "United Kingdom",
  GBR: "United Kingdom",
  CA: "Canada",
  CAN: "Canada",
  AU: "Australia",
  AUS: "Australia",
  DE: "Germany",
  DEU: "Germany",
  FR: "France",
  FRA: "France",
  IE: "Ireland",
  IRL: "Ireland",
  NZ: "New Zealand",
  NZL: "New Zealand",
  IN: "India",
  IND: "India",
  NL: "Netherlands",
  ES: "Spain",
  IT: "Italy",
  JP: "Japan",
  MX: "Mexico",
  BR: "Brazil",
};

function toMapCode(code: string): string {
  const u = code.toUpperCase();
  const map: Record<string, string> = {
    US: "USA", USA: "USA", GB: "GBR", UK: "GBR", GBR: "GBR",
    CA: "CAN", CAN: "CAN", AU: "AUS", AUS: "AUS", DE: "DEU", DEU: "DEU",
    FR: "FRA", FRA: "FRA", IE: "IRL", IRL: "IRL", NZ: "NZL", NZL: "NZL",
    IN: "IND", IND: "IND",
  };
  return map[u] ?? u;
}

function formatExposure(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

export function GlobalHeatMap({ leads, leadCount = 0 }: GlobalHeatMapProps) {
  const [ping, setPing] = useState(false);
  const prevCount = useMemo(() => ({ value: leadCount }), []);

  useEffect(() => {
    if (leadCount > prevCount.value) {
      prevCount.value = leadCount;
      setPing(true);
      const t = setTimeout(() => setPing(false), 1200);
      return () => clearTimeout(t);
    }
    prevCount.value = leadCount;
  }, [leadCount, prevCount]);

  const { exposureByCountry, maxRiskByCountry, maxExposure, maxScoreByCountry, countryList } = useMemo(() => {
    const byCountry: Record<string, number> = {};
    const riskByCountry: Record<string, "HIGH" | "MEDIUM" | "LOW"> = {};
    const maxScoreByCountry: Record<string, number> = {};
    let max = 0;
    const useMapRisk = leads.some((l) => l.mapRiskScore != null && l.mapRiskScore > 0);
    leads.forEach((lead) => {
      const rawCode = (lead.countryCode ?? (lead as { country?: string }).country ?? "").trim();
      const code2 = rawCode.toUpperCase();
      if (!code2) return;
      const exposure = useMapRisk
        ? (lead.mapRiskScore ?? 0)
        : lead.fineExposure != null && lead.fineExposure > 0
          ? lead.fineExposure
          : calculateFineExposure(lead as Parameters<typeof calculateFineExposure>[0]);
      const value = exposure > 0 ? exposure : 1;
      const code3 = toMapCode(code2);
      const total = (byCountry[code2] ?? 0) + value;
      byCountry[code2] = total;
      if (code3 !== code2) byCountry[code3] = (byCountry[code3] ?? 0) + value;
      if (total > max) max = total;
      const score = lead.mapRiskScore ?? 0;
      if (score > (maxScoreByCountry[code2] ?? 0)) maxScoreByCountry[code2] = score;
      if (code3 !== code2 && score > (maxScoreByCountry[code3] ?? 0)) maxScoreByCountry[code3] = score;
      const level = (lead.riskLevel === "HIGH" || lead.riskLevel === "MEDIUM" || lead.riskLevel === "LOW" ? lead.riskLevel : null) as "HIGH" | "MEDIUM" | "LOW" | null;
      if (level) {
        const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const existing = riskByCountry[code2];
        if (!existing || order[level] >= order[existing]) riskByCountry[code2] = level;
        if (code3 !== code2) {
          const ex3 = riskByCountry[code3];
          if (!ex3 || order[level] >= order[ex3]) riskByCountry[code3] = level;
        }
      }
    });
    const keys = new Set<string>([...Object.keys(byCountry), ...Object.keys(riskByCountry)]);
    const list = Array.from(keys).map((code) => {
      const exposure = byCountry[code] ?? byCountry[toMapCode(code)] ?? 0;
      const risk = riskByCountry[code] ?? riskByCountry[toMapCode(code)];
      const score = maxScoreByCountry[code] ?? maxScoreByCountry[toMapCode(code)] ?? 0;
      let displayRisk: "HIGH" | "MEDIUM" | "LOW" | "NONE" = "NONE";
      if (risk) displayRisk = risk;
      else if (score > 70) displayRisk = "HIGH";
      else if (exposure > 0 && max > 0 && exposure / max > 0.6) displayRisk = "HIGH";
      else if (exposure > 0 && max > 0 && exposure / max > 0.3) displayRisk = "MEDIUM";
      return { code, name: COUNTRY_NAMES[code] ?? code, exposure, displayRisk };
    }).filter((c) => c.code.length <= 3).sort((a, b) => b.exposure - a.exposure);
    return { exposureByCountry: byCountry, maxRiskByCountry: riskByCountry, maxExposure: max, maxScoreByCountry, countryList: list };
  }, [leads]);

  const hasLeads = Array.isArray(leads) && leads.length > 0;

  if (!hasLeads) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 aspect-video flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading map… Add leads to see exposure by country.</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
      {ping && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center" aria-hidden>
          <span className="text-emerald-400 font-semibold text-sm animate-pulse bg-zinc-900/90 px-3 py-1 rounded-full border border-emerald-500/50">
            Live audit
          </span>
        </div>
      )}
      <div className="grid grid-cols-[1fr_8rem] items-stretch">
        <div className="min-h-[240px] overflow-auto p-3">
          <ul className="space-y-1.5">
            {countryList.slice(0, 24).map(({ code, name, exposure, displayRisk }) => {
              const bg = displayRisk === "HIGH" ? "bg-red-500/20 border-red-500/50" : displayRisk === "MEDIUM" ? "bg-amber-500/20 border-amber-500/50" : "bg-zinc-700/30 border-zinc-600";
              return (
                <li key={code} className={`flex items-center justify-between rounded-lg border px-2 py-1.5 text-xs ${bg}`}>
                  <span className="text-zinc-200 font-medium">{name}</span>
                  <span className="text-zinc-400 tabular-nums">{formatExposure(exposure)}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="flex flex-col items-center py-4 pr-4 pl-2 border-l border-zinc-800" aria-label="Risk score legend">
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">Risk score</span>
          <div
            className="flex-1 w-4 rounded-full overflow-hidden border border-zinc-700 min-h-[80px]"
            style={{ background: "linear-gradient(to top, rgb(127, 29, 29), rgb(185, 28, 28), rgb(220, 38, 38), rgb(251, 146, 60), rgb(234, 179, 8), rgba(39, 39, 42, 0.6))" }}
          />
          <ul className="mt-2 space-y-1.5 text-[10px] text-zinc-400 text-left w-full">
            <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-zinc-600 shrink-0" aria-hidden /><span>No leads</span></li>
            <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" aria-hidden /><span>Low (&lt;$1M)</span></li>
            <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" aria-hidden /><span>High ($1M–$10M+)</span></li>
            <li className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-900 shrink-0" aria-hidden /><span>Extreme risk</span></li>
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 text-xs text-zinc-400">
        <span>Red = higher fine exposure (2026 frameworks)</span>
        <span>{countryList.length} countries with leads</span>
      </div>
    </div>
  );
}
