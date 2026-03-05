import Link from "next/link";
import { MapPin, FileText, Inbox, Mail } from "lucide-react";
import { DashboardHeatMapAndFeed } from "@/components/DashboardHeatMapAndFeed";
import { ActionPipelineBar } from "@/components/ActionPipelineBar";
import { WorkHistorySidebar } from "@/components/WorkHistorySidebar";
import { ResetPipelineButton } from "@/components/ResetPipelineButton";
import { JumpstartButton } from "@/components/JumpstartButton";

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Command Center</h1>
          <p className="text-zinc-400 mt-1">Global compliance lead-gen. One approval, one send.</p>
        </div>
        <ActionPipelineBar />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/dashboard/leads"
          className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-emerald-600/50 hover:bg-zinc-800/50 transition-colors"
        >
          <MapPin className="w-8 h-8 text-emerald-500 mb-2" />
          <h2 className="font-semibold">Leads</h2>
          <p className="text-sm text-zinc-400">Bulk discover & triage by region</p>
        </Link>
        <Link
          href="/dashboard/drafts"
          className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-emerald-600/50 hover:bg-zinc-800/50 transition-colors"
        >
          <FileText className="w-8 h-8 text-emerald-500 mb-2" />
          <h2 className="font-semibold">Drafts</h2>
          <p className="text-sm text-zinc-400">Approve & Open Gmail</p>
        </Link>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <Inbox className="w-8 h-8 text-zinc-500 mb-2" />
          <h2 className="font-semibold">Exports</h2>
          <p className="text-sm text-zinc-400">Branded PDF packs (Pro)</p>
        </div>
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50">
          <Mail className="w-8 h-8 text-zinc-500 mb-2" />
          <h2 className="font-semibold">Workers</h2>
          <p className="text-sm text-zinc-400">Scrapers & auditors (Phase 2)</p>
        </div>
      </div>

      <DashboardHeatMapAndFeed />

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
        <h2 className="font-semibold mb-2">Quick actions</h2>
        <ul className="space-y-2 text-sm text-zinc-400">
          <li>• <Link href="/dashboard/leads?bulk=1" className="text-emerald-400 hover:underline">Bulk Lead Intake</Link> — paste 100+ URLs</li>
          <li>• <Link href="/dashboard/drafts" className="text-emerald-400 hover:underline">Drafts</Link> — one-click Approve & Open Gmail with LawPRO/SRA/HIPAA hooks</li>
          <li>• Regulatory map: NY RPC 1.6, SRA 2.1, HIPAA 2026, NIS2, LawPRO — auto-selected by lead country/industry</li>
          <li className="pt-2 flex items-center gap-2">
            <JumpstartButton />
            <span>— set AUDITING/HUNTED leads to READY so Shield can process them</span>
          </li>
          <li className="pt-2 flex items-center gap-2">
            <ResetPipelineButton />
            <span>— set all leads to READY and clear risk data so you can re-run the pipeline</span>
          </li>
        </ul>
      </section>
        </div>
        <div className="lg:col-span-1">
          <WorkHistorySidebar />
        </div>
      </div>
    </div>
  );
}
