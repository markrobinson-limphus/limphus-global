"use client";

import { useEffect, useState } from "react";
import { Crown, Mail, Send, AlertTriangle, CheckCircle } from "lucide-react";

type Draft = {
  id: string;
  leadId: string;
  status: string;
  draftJson: { subject?: string; body?: string; needsReview?: boolean };
  emailSecurity?: { spfOk?: boolean; dmarcOk?: boolean; dkimOk?: boolean };
  lead?: {
    domain: string;
    countryCode: string;
    industry: string;
    contactEmail: string | null;
    dmarcOk?: boolean | null;
    fineExposure?: number;
  };
  createdAt: string;
};

function formatFine(exposure: number): string {
  if (exposure >= 1_000_000) return `$${(exposure / 1_000_000).toFixed(1)}M`;
  if (exposure >= 1_000) return `$${(exposure / 1_000).toFixed(1)}k`;
  return `$${exposure}`;
}

export function DraftsTable() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Draft | null>(null);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

  const safeDrafts = Array.isArray(drafts) ? drafts : [];

  function fetchDrafts() {
    fetch("/api/drafts", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        const raw = data?.drafts;
        const list = Array.isArray(raw)
          ? raw.map((d: unknown) => {
              const x = d as Record<string, unknown>;
              const dj = x.draftJson;
              return {
                id: String(x.id ?? ""),
                leadId: String(x.leadId ?? ""),
                status: String(x.status ?? "draft"),
                draftJson:
                  dj != null && typeof dj === "object" && !Array.isArray(dj)
                    ? { subject: (dj as { subject?: string }).subject, body: (dj as { body?: string }).body, needsReview: (dj as { needsReview?: boolean }).needsReview }
                    : {},
                emailSecurity: typeof x.emailSecurity === "object" && x.emailSecurity != null ? x.emailSecurity : undefined,
                lead: typeof x.lead === "object" && x.lead != null ? { domain: String((x.lead as Record<string, unknown>).domain ?? ""), countryCode: String((x.lead as Record<string, unknown>).countryCode ?? "US"), industry: String((x.lead as Record<string, unknown>).industry ?? "legal"), contactEmail: (x.lead as Record<string, unknown>).contactEmail ?? null, dmarcOk: (x.lead as Record<string, unknown>).dmarcOk ?? null, fineExposure: Number((x.lead as Record<string, unknown>).fineExposure) || 0 } : undefined,
                createdAt: String(x.createdAt ?? ""),
              } as Draft;
            })
          : [];
        setDrafts(list);
        if (selected) {
          const next = list.find((d: Draft) => d.id === selected.id);
          setSelected(next ?? null);
        }
      })
      .catch(() => setDrafts([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchDrafts();
    const onUpdate = () => fetchDrafts();
    window.addEventListener("drafts-updated", onUpdate);
    return () => window.removeEventListener("drafts-updated", onUpdate);
  }, []);

  function openGmail(draft: Draft, subject?: string, body?: string) {
    const subj = (subject ?? draft.draftJson?.subject ?? "").replace(/\s+/g, " ").trim();
    const b = (body ?? draft.draftJson?.body ?? "").replace(/\s+/g, " ").trim();
    const domain = draft.lead?.domain ?? "example.com";
    const to = (draft.lead?.contactEmail ?? "").trim() || `compliance@${domain}`;

    const fullText = `Subject: ${subj}\n\n${b}`;
    navigator.clipboard.writeText(fullText).then(
      () => {
        setCopyMessage("Subject and body copied to clipboard — paste into the email.");
        setTimeout(() => setCopyMessage(null), 4000);
      },
      () => {}
    );

    const maxMailtoLen = 1800;
    let mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}`;
    if (b && mailto.length + 7 + encodeURIComponent(b).length <= maxMailtoLen) {
      mailto += `&body=${encodeURIComponent(b)}`;
    } else if (b) {
      const shortBody = b.slice(0, 80) + "...";
      if (mailto.length + 7 + encodeURIComponent(shortBody).length <= maxMailtoLen) {
        mailto += `&body=${encodeURIComponent(shortBody)}`;
      }
    }
    window.open(mailto, "_blank", "noopener");
  }

  async function handleApproveAndSend(draft: Draft) {
    setApprovingId(draft.id);
    setSendError(null);
    setSendSuccess(null);
    try {
      const res = await fetch("/api/drafts/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draftId: draft.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setSendSuccess(data.domain ?? "Email sent");
        setSelected(null);
        fetchDrafts();
        setTimeout(() => setSendSuccess(null), 5000);
      } else {
        setSendError(data?.details ?? data?.error ?? data?.message ?? "Send failed");
      }
    } catch {
      setSendError("Send failed");
    } finally {
      setApprovingId(null);
    }
  }

  if (loading) return <div className="text-zinc-400 text-sm">Loading drafts…</div>;

  const pendingDrafts = safeDrafts.filter((d) => d.status !== "approved");

  if (safeDrafts.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-8 text-center text-zinc-400">
        No drafts yet. Add leads and run the audit to generate LawPRO/SRA/HIPAA-aligned drafts.
      </div>
    );
  }

  if (pendingDrafts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="font-medium text-emerald-200">All drafts sent</p>
          <p className="text-sm text-emerald-200/80">No pending drafts. New ones will appear here after the Closer runs.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/30 px-4 py-3">
        <Crown className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <p className="font-medium text-amber-200">CEO Review mode</p>
          <p className="text-sm text-amber-200/80">
            For each draft: see calculated fine exposure and DMARC status. Approve & Send marks the lead as CONTACTED and logs the action; Edit in Gmail opens your client to refine and send.
          </p>
        </div>
      </div>

      {sendError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{sendError}</span>
          <button
            type="button"
            onClick={() => setSendError(null)}
            className="ml-auto text-red-300 hover:text-red-200"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {sendSuccess && (
        <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>Sent to {sendSuccess}</span>
          <button
            type="button"
            onClick={() => setSendSuccess(null)}
            className="ml-auto text-emerald-300 hover:text-emerald-200"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      {copyMessage && (
        <div className="rounded-lg bg-sky-500/10 border border-sky-500/30 px-4 py-3 flex items-center gap-2 text-sky-400 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{copyMessage}</span>
          <button
            type="button"
            onClick={() => setCopyMessage(null)}
            className="ml-auto text-sky-300 hover:text-sky-200"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-800 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-800/50 text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Domain</th>
                <th className="px-4 py-3 font-medium">Calculated fine</th>
                <th className="px-4 py-3 font-medium">DMARC</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {pendingDrafts.map((draft) => (
                <tr
                  key={draft.id}
                  className={`hover:bg-zinc-800/30 cursor-pointer ${selected?.id === draft.id ? "bg-emerald-600/10" : ""}`}
                  onClick={() => setSelected(draft)}
                >
                  <td className="px-4 py-3 text-zinc-200">{draft.lead?.domain ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">
                    {draft.lead?.fineExposure != null && draft.lead.fineExposure > 0
                      ? formatFine(draft.lead.fineExposure)
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {draft.lead?.dmarcOk === false ? (
                      <span className="text-red-400 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4" /> Failed
                      </span>
                    ) : draft.lead?.dmarcOk === true ? (
                      <span className="text-emerald-400">OK</span>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        draft.status === "approved" ? "text-emerald-400" : "text-zinc-400"
                      }
                    >
                      {draft.status}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {draft.status !== "approved" && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleApproveAndSend(draft)}
                          disabled={approvingId === draft.id}
                          className="text-emerald-400 hover:underline text-xs font-medium inline-flex items-center gap-1"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {approvingId === draft.id ? "Approving…" : "Approve & Send"}
                        </button>
                        <button
                          type="button"
                          onClick={() => openGmail(draft)}
                          className="text-zinc-400 hover:text-zinc-200 text-xs inline-flex items-center gap-1"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Edit in Gmail
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
          {selected ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-zinc-200">{selected.lead?.domain}</h3>

              <div className="flex flex-wrap gap-3">
                <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">Calculated fine</p>
                  <p className="text-lg font-semibold text-zinc-200">
                    {selected.lead?.fineExposure != null && selected.lead.fineExposure > 0
                      ? formatFine(selected.lead.fineExposure)
                      : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-800/60 px-3 py-2">
                  <p className="text-xs text-zinc-500 uppercase tracking-wider">DMARC</p>
                  <p className="text-lg font-semibold">
                    {selected.lead?.dmarcOk === false ? (
                      <span className="text-red-400">Failed — why we&apos;re emailing</span>
                    ) : selected.lead?.dmarcOk === true ? (
                      <span className="text-emerald-400">OK</span>
                    ) : (
                      <span className="text-zinc-500">—</span>
                    )}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Subject</p>
                <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                  {(selected.draftJson?.subject ?? "") || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Body</p>
                <p className="text-sm text-zinc-400 whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {(selected.draftJson?.body ?? "") || "—"}
                </p>
              </div>

              {selected.status !== "approved" && (
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => handleApproveAndSend(selected)}
                    disabled={approvingId === selected.id}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium inline-flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {approvingId === selected.id ? "Approving…" : "Approve & Send"}
                  </button>
                  <button
                    type="button"
                    onClick={() => openGmail(selected)}
                    className="px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium inline-flex items-center gap-2 border border-zinc-600"
                  >
                    <Mail className="w-4 h-4" />
                    Edit in Gmail
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-zinc-500 text-sm">Select a draft to preview, see fine exposure and DMARC, then Approve & Send or Edit in Gmail.</p>
          )}
        </div>
      </div>
    </div>
  );
}
