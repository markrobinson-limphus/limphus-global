"use client";

import { useState } from "react";

export function BulkIntake() {
  const [value, setValue] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [queuedCount, setQueuedCount] = useState<number | null>(null);

  const lines = value
    .trim()
    .split(/[\n,]+/)
    .map((s) => s.trim().replace(/^\s+|\s+$/g, ""))
    .filter(Boolean);
  const count = lines.length;

  async function handleSubmit() {
    if (count === 0) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/leads/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: lines }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json().catch(() => ({}));
      const queued = data?.queued ?? count;
      setStatus("done");
      setValue("");
      window.dispatchEvent(new CustomEvent("leads-updated"));
      setQueuedCount(queued);
      setTimeout(() => setQueuedCount(null), 4000);
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <label className="block text-sm font-medium text-zinc-300 mb-2">Bulk Lead Intake</label>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Paste domains or URLs (one per line or comma-separated). 100+ supported."
        className="w-full h-28 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 placeholder-zinc-500 focus:border-emerald-600 focus:outline-none resize-none"
        rows={4}
      />
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={count === 0 || status === "loading"}
          className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-medium"
        >
          {status === "loading" ? "Processing…" : `Process ${count > 0 ? count : ""} domain${count !== 1 ? "s" : ""}`}
        </button>
        {status === "done" && (
          <span className="text-sm text-emerald-400">
            {queuedCount != null ? `${queuedCount} domain${queuedCount !== 1 ? "s" : ""} saved. Table and map updated.` : "Queued for audit."}
          </span>
        )}
        {status === "error" && <span className="text-sm text-red-400">Request failed. Try again.</span>}
      </div>
    </div>
  );
}
