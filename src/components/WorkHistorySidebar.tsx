"use client";

import { useEffect, useState } from "react";
import { History } from "lucide-react";

type Action = {
  id: string;
  actionType: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export function WorkHistorySidebar() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/actions")
      .then((res) => res.json())
      .then((data) => setActions(data.actions ?? []))
      .catch(() => setActions([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUpdate = () => {
      fetch("/api/actions")
        .then((res) => res.json())
        .then((data) => setActions(data.actions ?? []))
        .catch(() => {});
    };
    window.addEventListener("leads-updated", onUpdate);
    window.addEventListener("work-history-updated", onUpdate);
    return () => {
      window.removeEventListener("leads-updated", onUpdate);
      window.removeEventListener("work-history-updated", onUpdate);
    };
  }, []);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
      <h2 className="font-semibold text-sm flex items-center gap-2 mb-3 text-zinc-300">
        <History className="w-4 h-4 text-emerald-500" />
        Work history
      </h2>
      {loading ? (
        <p className="text-xs text-zinc-500">Loading…</p>
      ) : actions.length === 0 ? (
        <p className="text-xs text-zinc-500">No actions yet. Run a hunt or audit batch.</p>
      ) : (
        <ul className="space-y-2">
          {actions.map((log) => (
            <li key={log.id} className="text-xs">
              <p className="text-zinc-300">{log.message}</p>
              <time className="text-zinc-500" dateTime={log.createdAt}>
                {new Date(log.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
