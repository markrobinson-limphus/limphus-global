 "use client";

 import { FormEvent, useMemo, useState } from "react";

 type CalculatorResult = {
   framework: string;
   region: string;
   fineDisplay: string;
   reason: string;
 };

 function estimateExposure(domainRaw: string): CalculatorResult {
   const domain = domainRaw.trim().toLowerCase();

   if (!domain) {
     return {
       framework: "—",
       region: "—",
       fineDisplay: "$0",
       reason: "Enter a client domain to estimate exposure.",
     };
   }

   const isCA = domain.endsWith(".ca");
   const isUK = domain.endsWith(".uk") || domain.endsWith(".co.uk");
   const isEU = domain.endsWith(".eu");
   const looksLegal = domain.includes("law") || domain.includes("legal") || domain.includes("llp");
   const looksHealthcare =
     domain.includes("clinic") ||
     domain.includes("hospital") ||
     domain.includes("health") ||
     domain.includes("dental");
   const looksFinance = domain.includes("bank") || domain.includes("capital") || domain.includes("wealth");

   if (isCA && looksLegal) {
     return {
       framework: "LawPRO",
       region: "Ontario / CA",
       fineDisplay: "$750,000",
       reason: "Missing DMARC on a law firm domain exposes insured trust accounts to wire fraud claims.",
     };
   }

   if (isUK && looksLegal) {
     return {
       framework: "SRA",
       region: "UK",
       fineDisplay: "£500,000+",
       reason: "Unprotected email channels increase SRA exposure around client money and fraud notifications.",
     };
   }

   if (looksHealthcare) {
     return {
       framework: "HIPAA 2026",
       region: "US",
       fineDisplay: "$1,500,000+",
       reason: "PHI flowing through a mailbox without DMARC and enforced TLS triggers tiered HIPAA penalties.",
     };
   }

   if (isEU || domain.includes(".de") || domain.includes(".fr")) {
     return {
       framework: "NIS2 / GDPR",
       region: "EU",
       fineDisplay: "€1,000,000+",
       reason: "NIS2 treats missing DMARC as a governance failure for essential service providers.",
     };
   }

   if (looksFinance) {
     return {
       framework: "NYDFS 500",
       region: "US / NY",
       fineDisplay: "$2,000,000+",
       reason: "Weak email security in a financial institution invites NYDFS Section 500 enforcement.",
     };
   }

   return {
     framework: "Baseline regulatory exposure",
     region: "Global",
     fineDisplay: "$250,000–$1,500,000",
     reason: "Across NYDFS, NIS2, HIPAA and LawPRO, missing DMARC pushes fines from hypothetical to inevitable.",
   };
 }

 export function FineCalculator() {
   const [domain, setDomain] = useState("");
   const [touched, setTouched] = useState(false);

   const result = useMemo(() => estimateExposure(domain), [domain]);

   function handleSubmit(event: FormEvent) {
     event.preventDefault();
     setTouched(true);
   }

   const showResult = touched && domain.trim().length > 0;

   return (
     <section
       id="calculator"
       className="px-6 py-16 md:py-24 border-b border-zinc-800 bg-zinc-950/60 backdrop-blur"
     >
       <div className="mx-auto max-w-4xl">
         <div className="max-w-2xl">
           <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
             Lead magnet
           </p>
           <h2 className="mt-3 text-2xl md:text-3xl font-semibold text-zinc-50">
             Test a client domain in seconds.
           </h2>
           <p className="mt-4 text-sm md:text-base text-zinc-400">
             Show partners the{" "}
             <span className="font-medium text-zinc-100">fine they&apos;re actually insuring against</span>{" "}
             — not just which ports are open. Limphus turns a DMARC check into a quantified risk conversation.
           </p>
         </div>

         <div className="mt-8 grid gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] items-start">
           <form
             onSubmit={handleSubmit}
             className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.75)]"
           >
             <label className="block text-xs font-medium text-zinc-400">
               Enter a client domain
               <span className="ml-1 text-zinc-600">(e.g., agency.ca)</span>
             </label>
             <div className="mt-2 flex flex-col gap-3 sm:flex-row">
               <input
                 value={domain}
                 onChange={(event) => setDomain(event.target.value)}
                 placeholder="lawfirm.ca"
                 className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/70"
               />
               <button
                 type="submit"
                 className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
               >
                 Estimate exposure
               </button>
             </div>
             <p className="mt-2 text-[0.7rem] text-zinc-500">
               No lookups are run here. The full DMARC audit and one-click draft unlock inside the app.
             </p>
           </form>

           <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
             <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
               Potential exposure
             </p>

             {showResult ? (
               <>
                 <p className="mt-3 text-sm font-medium text-zinc-400">
                   {result.region} · {result.framework}
                 </p>
                 <p className="mt-2 text-2xl font-semibold text-zinc-50">{result.fineDisplay}</p>
                 <p className="mt-3 text-sm text-zinc-400">{result.reason}</p>
                 <p className="mt-4 text-xs text-zinc-500">
                   Limphus turns this estimate into a{" "}
                   <span className="font-medium text-zinc-100">one-click advisory draft</span> with the exact
                   paragraph and citation for that regulator.
                 </p>
               </>
             ) : (
               <>
                 <p className="mt-4 text-sm text-zinc-400">
                   You&apos;ll see a{" "}
                   <span className="font-medium text-zinc-100">
                     mock LawPRO, SRA, HIPAA, NIS2, or NYDFS fine range
                   </span>{" "}
                   here as soon as you enter a domain.
                 </p>
                 <p className="mt-4 text-xs text-zinc-500">
                   Inside the dashboard, this panel is backed by actual DMARC and policy evidence per tenant.
                 </p>
               </>
             )}

             <div className="mt-6 border-t border-zinc-800 pt-4">
               <p className="text-xs text-zinc-500">
                 Next step: unlock the{" "}
                 <span className="font-medium text-zinc-100">full audit and one-click draft</span> in the
                 Limphus Command Center.
               </p>
             </div>
           </div>
         </div>
       </div>
     </section>
   );
 }

