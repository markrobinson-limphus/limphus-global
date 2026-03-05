"use client";

import Link from "next/link";
import { Hero } from "@/components/marketing/Hero";
import { RegulatoryMarquee } from "@/components/marketing/RegulatoryMarquee";
import { FineCalculator } from "@/components/marketing/FineCalculator";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 via-black to-zinc-950 text-zinc-50">
      <Hero />
      <RegulatoryMarquee />

      {/* The $15M problem */}
      <section className="px-6 py-16 md:py-24 border-b border-zinc-800 bg-zinc-950/70">
        <div className="mx-auto max-w-4xl grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              The $15M problem
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-zinc-50">
              Most MSPs sell features. You sell fine mitigation.
            </h2>
            <p className="mt-5 text-sm md:text-base text-zinc-400 leading-relaxed">
              In 2026, boards don&apos;t buy &quot;security&quot; — they buy{" "}
              <span className="font-medium text-zinc-100">risk insulation</span>. Regulators and insurers have
              fixed penalty tables. Missing DMARC, MFA, or encryption isn&apos;t a best-practice gap; it&apos;s a
              line item on a statement of claim.
            </p>
            <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">
              Limphus quantifies that exposure in{" "}
              <span className="font-medium text-zinc-100">dollars per client</span> and hands you the one-click
              advisory to close the loop.
            </p>
          </div>
          <div className="rounded-2xl border border-red-900/70 bg-gradient-to-b from-red-950 via-zinc-950 to-black p-4 shadow-[0_18px_40px_rgba(0,0,0,0.8)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-300">
              Example: Ontario law firm
            </p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.7rem] font-medium text-zinc-400">LawPRO exposure</p>
                <p className="mt-1 text-2xl font-semibold text-red-100">$1,500,000+</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-red-950/80 px-3 py-1 text-[0.7rem] font-medium text-red-200 border border-red-700/80">
                Missing DMARC · public website
              </span>
            </div>
            <p className="mt-3 text-xs text-zinc-400">
              Limphus pulls the domain, checks DMARC, and maps the failure to the{" "}
              <span className="font-medium text-zinc-100">actual indemnity regime</span> your client is bound by.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow: discover → audit → draft → send */}
      <section className="px-6 py-16 md:py-24 border-b border-zinc-800 bg-zinc-950/60">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-semibold text-zinc-50 md:text-3xl text-center">
            One pipeline: discover → audit → draft → send
          </h2>
          <p className="mt-4 text-sm text-zinc-400 text-center max-w-2xl mx-auto">
            From a cold domain to a warm regulatory hook in seconds. The Splinter Fleet hunts, audits, and
            drafts; you approve and send.
          </p>
          <ul className="mt-10 grid gap-6 md:grid-cols-4 text-sm">
            <li className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                1 · Discover
              </span>
              <p className="font-medium text-zinc-100">Bulk intake</p>
              <p className="text-xs text-zinc-400">
                Paste domains or upload a list. We tag by country, industry, and regulator.
              </p>
            </li>
            <li className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                2 · Audit
              </span>
              <p className="font-medium text-zinc-100">Evidence in one view</p>
              <p className="text-xs text-zinc-400">
                DMARC, SPF, DKIM and policy checks converted into a single fine-exposure number.
              </p>
            </li>
            <li className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                3 · Draft
              </span>
              <p className="font-medium text-zinc-100">Regulatory hook</p>
              <p className="text-xs text-zinc-400">
                Limphus writes the advisory with the exact citation for NYDFS, NIS2, LawPRO, HIPAA, or SRA.
              </p>
            </li>
            <li className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 flex flex-col gap-2">
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                4 · Send
              </span>
              <p className="font-medium text-zinc-100">Approve &amp; fire</p>
              <p className="text-xs text-zinc-400">
                Approve &amp; Send via Resend or Edit in Gmail. You stay in the loop; Limphus does the lift.
              </p>
            </li>
          </ul>
        </div>
      </section>

      {/* Risk heatmap teaser */}
      <section className="px-6 py-16 md:py-24 border-b border-zinc-800 bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="mx-auto max-w-4xl grid gap-10 md:grid-cols-[minmax(0,2.2fr)_minmax(0,2fr)] items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Compliance performance dashboard
            </p>
            <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-zinc-50">
              See your book of business as a fine heatmap.
            </h2>
            <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">
              Every tenant, every lead, every missing record — rolled up into a single global map. Limphus
              shows you where the hammer drops first so you can prioritize outreach.
            </p>
            <p className="mt-4 text-sm md:text-base text-zinc-400 leading-relaxed">
              Under the hood, the same engine that powers your dashboard powers this homepage. limphus.ca is{" "}
              <span className="font-medium text-zinc-100">a window into the Command Center</span>, not a
              separate brochure site.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 shadow-[0_22px_60px_rgba(0,0,0,0.85)]">
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span>Risk heatmap (preview)</span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live in dashboard
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-[0.7rem]">
              <div className="rounded-lg bg-gradient-to-br from-red-500/70 via-red-700/80 to-red-950/90 px-3 py-3 text-zinc-50">
                <p className="font-medium">North America</p>
                <p className="mt-1 text-[0.68rem] text-red-100/90">NYDFS · HIPAA · LawPRO</p>
                <p className="mt-2 text-xs font-semibold">HIGH</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-amber-400/60 via-amber-600/70 to-amber-950/90 px-3 py-3 text-zinc-50">
                <p className="font-medium">Europe</p>
                <p className="mt-1 text-[0.68rem] text-amber-100/90">NIS2 · GDPR</p>
                <p className="mt-2 text-xs font-semibold">MEDIUM</p>
              </div>
              <div className="rounded-lg bg-gradient-to-br from-emerald-500/70 via-emerald-600/80 to-emerald-950/90 px-3 py-3 text-zinc-50">
                <p className="font-medium">APAC</p>
                <p className="mt-1 text-[0.68rem] text-emerald-100/90">AU Privacy Act / NDB</p>
                <p className="mt-2 text-xs font-semibold">RISING</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FineCalculator />

      {/* Final CTA + footer */}
      <section className="px-6 py-16 md:py-24 bg-zinc-950">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold text-zinc-50">
            Turn technical debt into a fine-mitigation pipeline.
          </h2>
          <p className="mt-4 text-sm md:text-base text-zinc-400">
            DMARC, SPF, audit logs, indemnity wording — you already do the work. Limphus makes it legible to
            regulators and profitable to your MSP.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3">
            <Link
              href="#calculator"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-8 py-3 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
            >
              Start mitigating fines on limphus.ca
            </Link>
            <p className="text-xs text-zinc-500">
              Already a partner?{" "}
              <Link href="/dashboard" className="text-emerald-400 hover:text-emerald-300">
                Open the Command Center
              </Link>
              .
            </p>
          </div>
          <footer className="mt-14 pt-6 border-t border-zinc-800 text-xs text-zinc-500">
            <p>© {new Date().getFullYear()} Limphus. Compliance Command Center for MSPs.</p>
            <p className="mt-1 text-zinc-600">limphus.ca</p>
          </footer>
        </div>
      </section>
    </div>
  );
}
