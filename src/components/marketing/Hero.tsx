 "use client";

 import { useEffect, useState } from "react";
 import Link from "next/link";
 import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/nextjs";

 const currencyFormatter = new Intl.NumberFormat("en-CA", {
   style: "currency",
   currency: "CAD",
   maximumFractionDigits: 0,
 });

 export function Hero() {
   const [fineTotal, setFineTotal] = useState(12750000);

   useEffect(() => {
     const interval = setInterval(() => {
       setFineTotal((prev) => {
         const next = prev + Math.floor(25000 + Math.random() * 45000);
         const cap = 15000000;
         if (next > cap) {
           return 12750000 + (next - cap);
         }
         return next;
       });
     }, 1600);

     return () => clearInterval(interval);
   }, []);

   return (
     <section className="relative border-b border-zinc-800 px-6 pt-20 pb-24 md:pt-28 md:pb-32 overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-950 to-black">
       <div className="mx-auto max-w-5xl grid gap-10 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-center">
         <div>
           <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
             Compliance performance for MSPs
           </p>
           <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl lg:text-[3.2rem]">
             Stop guessing your regulatory exposure.
           </h1>
           <p className="mt-5 text-lg text-zinc-400 max-w-xl">
             Quantify fines in one click. Limphus turns DMARC gaps and policy drift into a{" "}
             <span className="text-zinc-100 font-medium">fine-mitigation conversation</span>{" "}
             instead of another security pitch.
           </p>
           <div className="mt-8 flex flex-wrap items-center gap-4">
             <SignedOut>
               <SignUpButton mode="modal">
                 <button className="px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors">
                   Start mitigating fines
                 </button>
               </SignUpButton>
               <SignInButton mode="modal">
                 <button className="px-6 py-3 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-300 font-medium transition-colors">
                   Sign in
                 </button>
               </SignInButton>
             </SignedOut>
             <SignedIn>
               <Link
                 href="/dashboard"
                 className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
               >
                 Open Compliance Command Center
               </Link>
             </SignedIn>
           </div>
           <p className="mt-4 text-xs text-zinc-500">
             Built for MSPs selling into legal, healthcare, and regulated finance.
           </p>
         </div>

         <div className="relative">
           <div className="pointer-events-none absolute -inset-24 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),_transparent_55%)]" />
           <div className="relative rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 shadow-[0_0_0_1px_rgba(24,24,27,1),0_22px_60px_rgba(0,0,0,0.8)] backdrop-blur">
             <div className="flex items-center justify-between gap-4">
               <div>
                 <p className="text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
                   Live fine exposure
                 </p>
                 <p className="mt-1 text-[1.9rem] font-semibold tabular-nums text-zinc-50">
                   {currencyFormatter.format(fineTotal)}
                 </p>
               </div>
               <span className="inline-flex items-center rounded-full bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-800/70">
                 +3.5% target extraction
               </span>
             </div>
             <p className="mt-4 text-xs text-zinc-500">
               Aggregated across NYDFS, NIS2, LawPRO, HIPAA, and SRA exposure from unenforced DMARC and
               policy gaps.
             </p>

             <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
               <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                 <p className="text-[0.68rem] uppercase tracking-wide text-zinc-500">DMARC missing</p>
                 <p className="mt-1 text-sm font-semibold text-zinc-100">1.5× fine multiplier</p>
                 <p className="mt-1 text-[0.7rem] text-zinc-500">NYDFS / NIS2 tightening.</p>
               </div>
               <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                 <p className="text-[0.68rem] uppercase tracking-wide text-zinc-500">Healthcare</p>
                 <p className="mt-1 text-sm font-semibold text-zinc-100">HIPAA 2026</p>
                 <p className="mt-1 text-[0.7rem] text-zinc-500">PHI + mail flow evidence.</p>
               </div>
               <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                 <p className="text-[0.68rem] uppercase tracking-wide text-zinc-500">Legal</p>
                 <p className="mt-1 text-sm font-semibold text-zinc-100">LawPRO / SRA</p>
                 <p className="mt-1 text-[0.7rem] text-zinc-500">Trust account & wire fraud.</p>
               </div>
             </div>
           </div>
         </div>
       </div>
     </section>
   );
 }

