"use client";

import { useEffect, useState } from "react";
import { GlobalHeatMap } from "./GlobalHeatMap";
import { Activity, Bot, Shield, User } from "lucide-react";

type Lead = {
  countryCode: string;
  industry: string;
  dmarcOk?: boolean | null;
  fineExposure?: number | null;
  mapRiskScore?: number | null;
  riskLevel?: string | null;
};

export function DashboardHeatMapAndFeed() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadCount, setLeadCount] = useState(0);
  const [mapKey, setMapKey] = useState(0);

  useEffect(() => {
    function fetchLeads() {
      fetch("/api/leads", { credentials: "include", cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          const list = data.leads ?? [];
          setLeads(list);
          setLeadCount(list.length);
          setMapKey((k) => k + 1);
        })
        .catch(() => {});
    }
    fetchLeads();
    const onUpdate = () => fetchLeads();
    window.addEventListener("leads-updated", onUpdate);
    return () => window.removeEventListener("leads-updated", onUpdate);
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-semibold mb-2">Global risk heat map</h2>
        <p className="text-sm text-zinc-400 mb-3">
          Countries with leads and 2026 fine exposure (NYDFS, NIS2, HIPAA) — red = higher exposure.
        </p>
        <GlobalHeatMap key={mapKey} leads={leads} leadCount={leadCount} />
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
        <h2 className="font-semibold mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" />
          Live feed — team above a team
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-800/50">
            <Bot className="w-4 h-4 text-zinc-500 mt-0.5" />
            <div>
              <p className="font-medium text-zinc-300">Hunters (Layer 1)</p>
              <p className="text-zinc-500">SRA Scraper, HIPAA Sentinel, Auditor — Phase 2</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-800/50">
            <Shield className="w-4 h-4 text-zinc-500 mt-0.5" />
            <div>
              <p className="font-medium text-zinc-300">Managers (Layer 2)</p>
              <p className="text-zinc-500">Triage AI, Compliance Officer — categorise by fine exposure</p>
            </div>
          </div>
          <div className="flex items-start gap-2 p-3 rounded-lg bg-zinc-800/50">
            <User className="w-4 h-4 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-medium text-zinc-300">Sovereign (You)</p>
              <p className="text-zinc-500">Command Center + Approve & Open Gmail</p>
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          {leadCount} lead{leadCount !== 1 ? "s" : ""} in pipeline. Bulk discover to add more; drafts use LawPRO/SRA/HIPAA hooks by region.
        </p>
      </section>
    </div>
  );
}
