"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Search,
  Scan,
  Mail,
  Users,
  Bot,
  User,
  ToggleLeft,
  Crown,
  Layers,
  FileText,
  Shield,
} from "lucide-react";

type BotMember = {
  id: string;
  name: string;
  role: string;
  responsibility: string;
  currentTask: string;
  status: "processing" | "idle" | "waiting_for_approval";
  manualOption: string;
  manualAction: string;
  lastActivityAt?: string;
};

type SovereignData = {
  name: string;
  role: string;
  responsibility: string;
  currentTask: string;
  status: "processing" | "idle" | "waiting_for_approval";
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  currentTask: string;
};

const STATUS_LABELS: Record<string, string> = {
  processing: "Processing…",
  idle: "Idle",
  waiting_for_approval: "Waiting for Approval",
};

const STATUS_STYLES: Record<string, string> = {
  processing: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  idle: "bg-zinc-700/50 text-zinc-400 border-zinc-600",
  waiting_for_approval: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
};

export default function TeamPage() {
  const [bots, setBots] = useState<BotMember[]>([]);
  const [sovereign, setSovereign] = useState<SovereignData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [manualOverride, setManualOverride] = useState(false);
  const [orgEnabled, setOrgEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        setBots(data.bots ?? []);
        setSovereign(data.sovereign ?? null);
        setMembers(data.members ?? []);
        setManualOverride(data.manualOverride ?? false);
        setOrgEnabled(data.orgEnabled ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleManualOverrideToggle(on: boolean) {
    setToggling(true);
    try {
      const res = await fetch("/api/team", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manualOverride: on }),
      });
      if (res.ok) {
        const data = await res.json();
        setManualOverride(data.manualOverride ?? on);
        if (sovereign) {
          setSovereign({
            ...sovereign,
            currentTask: (data.manualOverride ?? on)
              ? "Manual Override ON: you are in control."
              : "Online: Monitoring Pipeline.",
            status: (data.manualOverride ?? on) ? "waiting_for_approval" : "idle",
          });
        }
      }
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-zinc-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Limphus Global — Dream Team</h1>
        <p className="text-zinc-400 mt-1">
          Your digital workforce. Each member has a status, live task, and an Override so you can take over anytime.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-zinc-400" />
            <span className="font-medium text-zinc-200">Global Manual Override</span>
          </div>
          <button
            type="button"
            onClick={() => handleManualOverrideToggle(!manualOverride)}
            disabled={toggling}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${manualOverride ? "bg-emerald-600" : "bg-zinc-700"}`}
            role="switch"
            aria-checked={manualOverride}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${manualOverride ? "translate-x-5" : "translate-x-1"}`}
            />
          </button>
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          When ON, the heartbeat skips Hunt/Scalp/Draft so you can run them manually. You remain the Sovereign.
        </p>
      </section>

      <section>
        <h2 className="font-semibold text-zinc-300 mb-4 flex items-center gap-2">
          <Bot className="w-4 h-4 text-emerald-500" />
          Team grid
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {bots.map((bot) => (
            <TeamCard
              key={bot.id}
              name={bot.name}
              role={bot.role}
              responsibility={bot.responsibility}
              currentTask={bot.currentTask}
              status={bot.status}
              manualOption={bot.manualOption}
              manualAction={bot.manualAction}
              icon={botIcon(bot.id)}
            />
          ))}
          {sovereign && (
            <SovereignCard
              name={sovereign.name}
              role={sovereign.role}
              responsibility={sovereign.responsibility}
              currentTask={sovereign.currentTask}
              status={sovereign.status}
              manualOverride={manualOverride}
              onToggle={handleManualOverrideToggle}
              toggling={toggling}
            />
          )}
        </div>
      </section>

      <section>
        <h2 className="font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-500" />
          People
        </h2>
        {!orgEnabled ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-400">
            <User className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-zinc-300">Enable Organizations in Clerk to see team members</p>
            <p className="text-sm mt-1">Add the Organization Switcher and invite members to see them here.</p>
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-center text-zinc-400">
            <p>No members in this organization yet. Invite team members from the Clerk Dashboard.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-800/50 text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Current task</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-800/30">
                    <td className="px-4 py-3 text-zinc-200">{m.name}</td>
                    <td className="px-4 py-3 text-zinc-400">{m.role}</td>
                    <td className="px-4 py-3 text-zinc-400">{m.currentTask}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function botIcon(id: string) {
  switch (id) {
    case "hunter":
      return <Search className="w-5 h-5 text-emerald-400" />;
    case "scalper":
      return <Scan className="w-5 h-5 text-emerald-400" />;
    case "triage":
      return <Layers className="w-5 h-5 text-emerald-400" />;
    case "closer":
      return <Mail className="w-5 h-5 text-emerald-400" />;
    case "archivist":
      return <FileText className="w-5 h-5 text-emerald-400" />;
    default:
      return <Bot className="w-5 h-5 text-emerald-400" />;
  }
}

function TeamCard({
  name,
  role,
  responsibility,
  currentTask,
  status,
  manualOption,
  manualAction,
  icon,
}: {
  name: string;
  role: string;
  responsibility: string;
  currentTask: string;
  status: "processing" | "idle" | "waiting_for_approval";
  manualOption: string;
  manualAction: string;
  icon: React.ReactNode;
}) {
  const statusLabel = STATUS_LABELS[status] ?? status;
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.idle;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {icon}
          <div>
            <span className="font-medium text-zinc-200">{name}</span>
            <span className="text-xs text-zinc-500 ml-2">{role}</span>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded border shrink-0 ${statusStyle}`}>
          {statusLabel}
        </span>
      </div>
      <p className="text-sm text-zinc-500">{responsibility}</p>
      <div className="rounded-lg bg-zinc-800/50 px-3 py-2 border border-zinc-700/50">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Live task</p>
        <p className="text-sm text-zinc-300">{currentTask}</p>
      </div>
      {manualAction === "audit" ? (
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium border border-zinc-600"
        >
          <Shield className="w-4 h-4" />
          Override — {manualOption}
        </Link>
      ) : (
        <Link
          href={manualAction}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-medium border border-zinc-600"
        >
          <Shield className="w-4 h-4" />
          Override — {manualOption}
        </Link>
      )}
    </div>
  );
}

function SovereignCard({
  name,
  role,
  responsibility,
  currentTask,
  status,
  manualOverride,
  onToggle,
  toggling,
}: {
  name: string;
  role: string;
  responsibility: string;
  currentTask: string;
  status: "processing" | "idle" | "waiting_for_approval";
  manualOverride: boolean;
  onToggle: (on: boolean) => void;
  toggling: boolean;
}) {
  const statusLabel = manualOverride ? "In Control" : (STATUS_LABELS[status] ?? "Online");
  const statusStyle = manualOverride ? STATUS_STYLES.waiting_for_approval : "bg-zinc-700/50 text-zinc-400 border-zinc-600";

  return (
    <div className="rounded-xl border-2 border-amber-500/40 bg-zinc-900/80 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          <div>
            <span className="font-medium text-zinc-200">{name}</span>
            <span className="text-xs text-zinc-500 ml-2">({role})</span>
          </div>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded border shrink-0 ${statusStyle}`}>
          {statusLabel}
        </span>
      </div>
      <p className="text-sm text-zinc-500">{responsibility}</p>
      <div className="rounded-lg bg-zinc-800/50 px-3 py-2 border border-zinc-700/50">
        <p className="text-xs text-zinc-500 uppercase tracking-wider mb-0.5">Live task</p>
        <p className="text-sm text-zinc-300">{currentTask}</p>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <span className="text-sm text-zinc-400">Manual Override</span>
        <button
          type="button"
          onClick={() => onToggle(!manualOverride)}
          disabled={toggling}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900 ${manualOverride ? "bg-amber-500" : "bg-zinc-700"}`}
          role="switch"
          aria-checked={manualOverride}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition ${manualOverride ? "translate-x-5" : "translate-x-1"}`}
          />
        </button>
      </div>
    </div>
  );
}
