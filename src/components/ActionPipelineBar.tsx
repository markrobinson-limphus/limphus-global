"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Shield, Send, Inbox } from "lucide-react";

const ACTIONS = [
  { id: "hunt", label: "Find leads", action: "Hunt", href: "/dashboard/leads?bulk=1", icon: Search },
  { id: "audit", label: "Scrape for errors", action: "Audit", api: "/api/leads/process-batch", icon: Shield },
  { id: "drafts", label: "Send emails", action: "Drafts", href: "/dashboard/drafts", icon: Send },
  { id: "inbox", label: "Check replies", action: "Inbox", href: "/dashboard/drafts", icon: Inbox },
] as const;

export function ActionPipelineBar() {
  const [processing, setProcessing] = useState<string | null>(null);
  const [result, setResult] = useState<{ moved?: number; message?: string } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  async function handleProcessBatch() {
    setProcessing("audit");
    setResult(null);
    setToast(null);
    try {
      const res = await fetch("/api/leads/process-batch", { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      const moved = data.moved ?? 0;
      setResult({ moved, message: data.message });
      window.dispatchEvent(new CustomEvent("work-history-updated"));
      window.dispatchEvent(new CustomEvent("leads-updated"));
      window.dispatchEvent(new CustomEvent("drafts-updated"));
      if (moved > 0) {
        setToast(`${moved} lead${moved !== 1 ? "s" : ""} audited — Risk & map updated`);
        setTimeout(() => setToast(null), 4500);
        setTimeout(() => window.dispatchEvent(new CustomEvent("leads-updated")), 400);
      }
    } catch {
      setResult({ message: "Request failed" });
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div
        className="flex items-center gap-1 p-1.5 rounded-full border border-zinc-700/80 bg-zinc-900/80 shadow-lg shadow-black/20"
        role="toolbar"
        aria-label="Quick actions"
      >
        {ACTIONS.map(({ id, label, action, href, api, icon: Icon }) => {
          const isAudit = id === "audit";
          const isLoading = isAudit && processing === "audit";

          const iconButton = (
            <span
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-full
                text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800/80
                transition-colors duration-200
                ${isLoading ? "pointer-events-none" : "cursor-pointer"}
                ${isLoading ? "text-amber-400/90" : ""}
              `}
            >
              {isLoading && (
                <span
                  className="absolute inset-0 rounded-full ring-2 ring-amber-400/80 ring-offset-2 ring-offset-zinc-900 animate-pulse"
                  aria-hidden
                />
              )}
              <Icon className="w-5 h-5 relative z-10" strokeWidth={2} />
            </span>
          );

          if (href) {
            return (
              <Link
                key={id}
                href={href}
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded-full"
                title={label}
                aria-label={label}
              >
                {iconButton}
              </Link>
            );
          }

          return (
            <button
              key={id}
              type="button"
              onClick={handleProcessBatch}
              disabled={!!processing}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 rounded-full disabled:opacity-70"
              title={label}
              aria-busy={isLoading}
              aria-label={isLoading ? "Auditing…" : action}
            >
              {iconButton}
            </button>
          );
        })}
      </div>
      {result && (
        <p className="text-xs text-emerald-400/90 text-right max-w-[220px]">
          {result.moved != null && result.moved > 0
            ? `${result.message}`
            : result.message}
        </p>
      )}
      {toast && (
        <p className="text-xs text-emerald-400 font-medium animate-pulse max-w-[260px] text-right" role="status">
          {toast}
        </p>
      )}
    </div>
  );
}
