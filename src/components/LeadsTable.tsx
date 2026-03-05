"use client";

import { useEffect, useState } from "react";

type Lead = {
  id: string;
  domain: string;
  countryCode: string;
  industry: string;
  contactEmail: string | null;
  auditStatus: string;
  workflowStatus?: string;
  regulatoryRiskScore: number | null;
  dmarcOk: boolean | null;
  fineExposure?: number;
  mapRiskScore?: number | null;
  riskLevel?: string | null;
  createdAt: string;
};

export function LeadsTable() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function fetchLeads() {
      fetch("/api/leads", { credentials: "include", cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          setLeads(data.leads ?? []);
        })
        .catch(() => setLeads([]))
        .finally(() => setLoading(false));
    }
    fetchLeads();
    const onUpdate = () => fetchLeads();
    window.addEventListener("leads-updated", onUpdate);
    return () => window.removeEventListener("leads-updated", onUpdate);
  }, []);

  if (loading) return <div className="text-zinc-400 text-sm">Loading leads…</div>;

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center text-zinc-400">
        No leads yet. Use Bulk Lead Intake above to add domains.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-800/50 text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Domain</th>
            <th className="px-4 py-3 font-medium">Country</th>
            <th className="px-4 py-3 font-medium">Industry</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">DMARC</th>
            <th className="px-4 py-3 font-medium">Fine exposure</th>
            <th className="px-4 py-3 font-medium">Risk</th>
            <th className="px-4 py-3 font-medium">Audit</th>
            <th className="px-4 py-3 font-medium">Pipeline</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {leads.map((lead) => (
            <tr key={lead.id} className="hover:bg-zinc-800/30">
              <td className="px-4 py-3 text-zinc-200">{lead.domain}</td>
              <td className="px-4 py-3 text-zinc-400">{lead.countryCode}</td>
              <td className="px-4 py-3 text-zinc-400">{lead.industry}</td>
              <td className="px-4 py-3">
                {lead.contactEmail ? (
                  <a href={`mailto:${lead.contactEmail}`} className="text-emerald-400 hover:underline">
                    {lead.contactEmail}
                  </a>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                {lead.dmarcOk === true ? (
                  <span className="text-emerald-400">OK</span>
                ) : lead.dmarcOk === false ? (
                  <span className="text-amber-400">Missing</span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                {lead.fineExposure != null && lead.fineExposure > 0 ? (
                  <span className="text-red-400 font-medium">
                    ${(lead.fineExposure / 1_000_000).toFixed(2)}M
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3">
                {lead.riskLevel != null || lead.mapRiskScore != null ? (
                  <span className={lead.riskLevel === "HIGH" ? "text-red-400 font-medium" : lead.riskLevel === "MEDIUM" ? "text-amber-400" : "text-zinc-400"}>
                    {lead.riskLevel ?? "—"} {lead.mapRiskScore != null ? `(${lead.mapRiskScore})` : ""}
                  </span>
                ) : lead.regulatoryRiskScore != null ? (
                  `${lead.regulatoryRiskScore}/10`
                ) : (
                  "—"
                )}
              </td>
              <td className="px-4 py-3 text-zinc-400">{lead.auditStatus}</td>
              <td className="px-4 py-3">
                <span className={lead.workflowStatus === "AUDITING" ? "text-amber-400" : lead.workflowStatus === "REPLIED" || lead.workflowStatus === "CONTACTED" ? "text-emerald-400" : lead.workflowStatus === "HUNTED" ? "text-zinc-500" : "text-zinc-400"}>
                  {lead.workflowStatus ?? "READY"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
