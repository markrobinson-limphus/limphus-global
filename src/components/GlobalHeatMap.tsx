"use client";

import { useMemo, useState, useEffect } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { calculateFineExposure } from "@/lib/regulatory";

const GEO_URL =
  "https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson";

type Lead = {
  countryCode?: string;
  /** Some APIs send country; normalize to countryCode */
  country?: string;
  industry: string;
  dmarcOk?: boolean | null;
  fineExposure?: number | null;
  mapRiskScore?: number | null;
  riskLevel?: string | null;
};

type GlobalHeatMapProps = {
  leads: Lead[];
  /** Trigger a "ping" when this count changes (new lead processed) */
  leadCount?: number;
};

/** GeoJSON (datasets/geo-countries): uses properties["ISO3166-1-Alpha-2"], ["ISO3166-1-Alpha-3"], and "name" (full name). No geo.id. */
function getCountryId(geo: { id?: string; properties?: Record<string, unknown> }): string {
  const props = geo.properties ?? {};
  const alpha2 = props["ISO3166-1-Alpha-2"];
  const alpha3 = props["ISO3166-1-Alpha-3"];
  const name = props.name;
  if (alpha2 && typeof alpha2 === "string") return alpha2.trim().toUpperCase();
  if (alpha3 && typeof alpha3 === "string") return alpha3.trim().toUpperCase();
  if (name && typeof name === "string") {
    const code = GEO_NAME_TO_CODE[name.trim()];
    if (code) return code;
    return name.trim().toUpperCase().replace(/\s+/g, "_");
  }
  if (geo.id && typeof geo.id === "string") return geo.id.trim().toUpperCase();
  return "";
}

/** Full country name → 2-letter code (GeoJSON "name" fallback). */
const GEO_NAME_TO_CODE: Record<string, string> = {
  "United Kingdom": "GB",
  "United Kingdom of Great Britain and Northern Ireland": "GB",
  "United States of America": "US",
  "United States": "US",
  "Canada": "CA",
  "Australia": "AU",
  "Germany": "DE",
  "France": "FR",
  "Ireland": "IE",
  "New Zealand": "NZ",
  "India": "IN",
  "Indonesia": "ID",
  "Malaysia": "MY",
  "Chile": "CL",
  "Brazil": "BR",
  "Netherlands": "NL",
  "Spain": "ES",
  "Italy": "IT",
  "Japan": "JP",
  "South Africa": "ZA",
  "Mexico": "MX",
  "Singapore": "SG",
};

/**
 * Universal translator: 2-letter codes (US, GB) from our data → 3-letter (USA, GBR) used by TopoJSON/GeoJSON.
 * The map stays gray when it gets "US" but only has "USA" in the lookup—so we store and check both.
 */
const countryMap: Record<string, string> = {
  US: "USA",
  USA: "USA",
  GB: "GBR",
  UK: "GBR",
  GBR: "GBR",
  CA: "CAN",
  CAN: "CAN",
  AU: "AUS",
  AUS: "AUS",
  DE: "DEU",
  DEU: "DEU",
  FR: "FRA",
  FRA: "FRA",
  IE: "IRL",
  IRL: "IRL",
  NZ: "NZL",
  NZL: "NZL",
  IN: "IND",
  IND: "IND",
};

function toMapCode(code: string): string {
  const u = code.toUpperCase();
  return countryMap[u] ?? u;
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

  const { exposureByCountry, maxRiskByCountry, maxExposure, maxScoreByCountry } = useMemo(() => {
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
        const existing = riskByCountry[code2];
        const order = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        if (!existing || order[level] >= order[existing]) riskByCountry[code2] = level;
        if (code3 !== code2) {
          const ex3 = riskByCountry[code3];
          if (!ex3 || order[level] >= order[ex3]) riskByCountry[code3] = level;
        }
      }
    });
    if (byCountry.USA != null) byCountry.US = byCountry.US ?? byCountry.USA;
    if (byCountry.US != null) byCountry.USA = byCountry.USA ?? byCountry.US;
    if (byCountry.GBR != null) byCountry.GB = byCountry.GB ?? byCountry.GBR;
    if (byCountry.GB != null) byCountry.GBR = byCountry.GBR ?? byCountry.GB;
    if (byCountry.CAN != null) byCountry.CA = byCountry.CA ?? byCountry.CAN;
    if (byCountry.CA != null) byCountry.CAN = byCountry.CAN ?? byCountry.CA;
    if (byCountry.AUS != null) byCountry.AU = byCountry.AU ?? byCountry.AUS;
    if (byCountry.AU != null) byCountry.AUS = byCountry.AUS ?? byCountry.AU;
    if (riskByCountry.USA) riskByCountry.US = riskByCountry.US ?? riskByCountry.USA;
    if (riskByCountry.US) riskByCountry.USA = riskByCountry.USA ?? riskByCountry.US;
    if (riskByCountry.GBR) riskByCountry.GB = riskByCountry.GB ?? riskByCountry.GBR;
    if (riskByCountry.GB) riskByCountry.GBR = riskByCountry.GBR ?? riskByCountry.GB;
    if (maxScoreByCountry.USA != null) maxScoreByCountry.US = Math.max(maxScoreByCountry.US ?? 0, maxScoreByCountry.USA);
    if (maxScoreByCountry.US != null) maxScoreByCountry.USA = Math.max(maxScoreByCountry.USA ?? 0, maxScoreByCountry.US);
    if (maxScoreByCountry.GBR != null) maxScoreByCountry.GB = Math.max(maxScoreByCountry.GB ?? 0, maxScoreByCountry.GBR);
    if (maxScoreByCountry.GB != null) maxScoreByCountry.GBR = Math.max(maxScoreByCountry.GBR ?? 0, maxScoreByCountry.GB);
    return { exposureByCountry: byCountry, maxRiskByCountry: riskByCountry, maxExposure: max, maxScoreByCountry };
  }, [leads]);

  /** Fill by riskLevel from DB (countryCode + riskLevel): HIGH = #ef4444, MEDIUM = #f59e0b. Fallback: mapRiskScore > 70 = red. */
  function getFillForGeo(geo: { id?: string; properties?: Record<string, unknown> }): string {
    const countryId = getCountryId(geo);
    const keys = [countryId, countryId ? toMapCode(countryId) : ""].filter(Boolean);
    let maxRisk: "HIGH" | "MEDIUM" | "LOW" | undefined;
    let exposure = 0;
    let maxScore = 0;
    for (const key of keys) {
      const r = maxRiskByCountry[key];
      if (r) maxRisk = r;
      const val = exposureByCountry[key];
      if (val != null && val > exposure) exposure = val;
      const sc = maxScoreByCountry[key];
      if (sc != null && sc > maxScore) maxScore = sc;
    }
    if (maxRisk === "HIGH") return "#ef4444";
    if (maxRisk === "MEDIUM") return "#f59e0b";
    if (maxScore > 70) return "#ef4444";
    if (exposure <= 0) return "rgba(39, 39, 42, 0.6)";
    const ratio = maxExposure > 0 ? exposure / maxExposure : 0;
    const r = Math.round(180 + ratio * 75);
    const g = Math.round(38 + (1 - ratio) * 80);
    const b = Math.round(38 + (1 - ratio) * 80);
    return `rgb(${r}, ${g}, ${b})`;
  }

  const hasLeads = Array.isArray(leads) && leads.length > 0;

  /** Key that changes when leads or risk data updates so the map fully re-draws. */
  const mapDataKey = hasLeads
    ? `${leads.length}-${leads.filter((l) => l.riskLevel || (l.mapRiskScore != null && l.mapRiskScore > 0)).length}-${leads.reduce((a, l) => a + (l.mapRiskScore ?? 0), 0)}`
    : "0";

  if (typeof window !== "undefined" && hasLeads) {
    const sample = leads.slice(0, 5).map((l) => ({
      country: (l.countryCode ?? (l as { country?: string }).country ?? "").toUpperCase(),
      risk: l.riskLevel,
      mapRiskScore: l.mapRiskScore,
    }));
    console.log("MAP DATA CHECK:", { leadCount: leads.length, sample });
  }

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
        <div
          className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
          aria-hidden
        >
          <span className="text-emerald-400 font-semibold text-sm animate-pulse bg-zinc-900/90 px-3 py-1 rounded-full border border-emerald-500/50">
            Live audit
          </span>
        </div>
      )}
      <div className="grid grid-cols-[1fr_8rem] items-stretch">
        <div className="min-w-0 aspect-video">
          {hasLeads && (
            <ComposableMap
              key={`heatmap-${mapDataKey}`}
              projection="geoMercator"
              projectionConfig={{ scale: 120 }}
              className="w-full aspect-video"
            >
              <ZoomableGroup center={[0, 20]} zoom={1}>
                <Geographies key={`geos-${mapDataKey}`} geography={GEO_URL}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const countryId = getCountryId(geo);
                      const keys = [countryId, countryId ? toMapCode(countryId) : ""].filter(Boolean);
                      const match = keys.some(
                        (k) =>
                          maxRiskByCountry[k] ||
                          (exposureByCountry[k] ?? 0) > 0 ||
                          (maxScoreByCountry[k] ?? 0) > 70
                      );
                      if (typeof window !== "undefined" && match) {
                        console.log("Drawing geography:", (geo.properties as { name?: string })?.name ?? countryId, "id:", countryId, "Match found?", match);
                      }
                      const fill = getFillForGeo(geo);
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          fill={fill}
                          stroke="rgba(63, 63, 70, 0.8)"
                          strokeWidth={0.5}
                          style={{
                            default: { outline: "none" },
                            hover: { outline: "none", fill: "rgba(34, 197, 94, 0.4)" },
                            pressed: { outline: "none" },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          )}
        </div>
        <div
          className="flex flex-col items-center py-4 pr-4 pl-2 border-l border-zinc-800"
          aria-label="Risk score legend"
        >
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mb-2">
            Risk score
          </span>
          <div
            className="flex-1 w-4 rounded-full overflow-hidden border border-zinc-700 min-h-[80px]"
            style={{
              background: "linear-gradient(to top, rgb(127, 29, 29), rgb(185, 28, 28), rgb(220, 38, 38), rgb(251, 146, 60), rgb(234, 179, 8), rgba(39, 39, 42, 0.6))",
            }}
          />
          <ul className="mt-2 space-y-1.5 text-[10px] text-zinc-400 text-left w-full">
            <li className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-zinc-600 shrink-0" aria-hidden />
              <span>No leads</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 shrink-0" aria-hidden />
              <span>Low (&lt;$1M)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" aria-hidden />
              <span>High ($1M–$10M+)</span>
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-900 shrink-0" aria-hidden />
              <span>Extreme risk (action imminent)</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-t border-zinc-800 text-xs text-zinc-400">
        <span>Red = higher fine exposure (2026 frameworks)</span>
        <span>{Object.keys(exposureByCountry).length} countries with leads</span>
      </div>
    </div>
  );
}
