"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

export function ResetPipelineButton() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);

  async function handleReset() {
    if (loading) return;
    setLoading(true);
    setDone(false);
    setError(null);
    setCount(null);
    try {
      const res = await fetch("/api/leads/reset-pipeline", { method: "POST", credentials: "include" });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setDone(true);
        setCount(data.count ?? 0);
        window.dispatchEvent(new CustomEvent("leads-updated"));
        setTimeout(() => { setDone(false); setCount(null); }, 4000);
      } else {
        setError(data.error || data.message || `Request failed (${res.status})`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handleReset}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20 text-sm font-medium disabled:opacity-50"
      >
        <RotateCcw className="w-4 h-4" />
        {loading ? "Resetting…" : done ? "Pipeline reset" : "Reset pipeline"}
      </button>
      {count != null && done && (
        <span className="text-xs text-emerald-400">{count} leads reset to READY</span>
      )}
      {error && <span className="text-xs text-red-400">{error}</span>}
    </span>
  );
}
