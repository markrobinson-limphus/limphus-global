 "use client";

 const ITEMS = [
   "NYDFS 500",
   "NIS2",
   "HIPAA 2026",
   "LawPRO",
   "UK SRA",
   "AU Privacy Act / NDB",
 ];

 export function RegulatoryMarquee() {
   const items = [...ITEMS, ...ITEMS];

   return (
     <section className="px-6 py-8 border-y border-zinc-800 bg-zinc-950/70">
       <div className="mx-auto max-w-5xl">
         <div className="flex items-center justify-between gap-4 pb-3">
           <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
             Regulatory intelligence layer
           </p>
           <p className="hidden text-[0.7rem] text-zinc-500 sm:block">
             Limphus maps technical failures to these regimes in dollars.
           </p>
         </div>
         <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40">
           <div className="marquee-track flex items-center gap-6 px-6 py-3 whitespace-nowrap">
             {items.map((label, index) => (
               <span
                 key={`${label}-${index}`}
                 className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1 text-xs font-medium text-zinc-200"
               >
                 <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                 {label}
               </span>
             ))}
           </div>
         </div>
       </div>
     </section>
   );
 }

