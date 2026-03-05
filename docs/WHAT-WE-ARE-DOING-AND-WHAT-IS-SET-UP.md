# Limphus Global — What We Are Doing & What Is Set Up

## What we are doing (the mission)

**One line:** You sell **fine mitigation**, not IT. In 2026, firms don’t buy “security” — they buy *not getting fined*. Limphus is the platform that shows them their exposure in dollars and gives MSPs one-click advisory to close the deal.

**For MSPs:** A **Command Center**: global risk heat map, leads table with **fine exposure** ($500k, $15M, etc.), and **drafts** written with the right regulatory hook (LawPRO, SRA, HIPAA, NIS2, NY RPC 1.6). They click **Approve & Send** (Resend) or **Edit in Gmail** — human in the loop, machine did the research and copy.

**The loop:**  
**Discovery (who’s exposed) → Evidence (audit + fine number) → Draft (regulatory hook) → Approve → Send.**

**Why it sells:** Painful, expensive problem; audience has money (MSPs); direct path to pipeline and closing. We turn compliance into a **sales weapon**.

---

## What is set in place (tech & product)

### Stack
- **Next.js 15** (App Router), TypeScript, Tailwind
- **Clerk** — auth & multi-tenant (orgs)
- **Prisma** — Postgres (Neon): tenants, leads, drafts, branding, subscriptions
- **Resend** — sending emails from “Approve & Send”
- **Stripe** — keys in env; tiers (Starter $199, Pro $499, Enterprise) placeholder for later

### Env / keys (what you have)
- **`.env`** — DATABASE_URL (Neon), RESEND_API_KEY, RESEND_FROM_EMAIL (e.g. noreply@limphus.ca after domain verify), Stripe keys
- **`.env.local`** — Clerk (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY), can also hold DATABASE_URL  
Next.js loads `.env.local` first; empty `CLERK_SECRET_KEY=` in `.env.local` overrides `.env` and breaks auth — keep it filled or remove the line.

### Database (Prisma)
- **Tenant** — one per MSP/org; links to Clerk org; has workerManualOverride
- **Lead** — domain, countryCode, industry, contactEmail, auditStatus, workflowStatus (READY → AUDITED → WAITING → CONTACTED), dmarcOk/spfOk/dkimOk, mapRiskScore, riskLevel
- **Draft** — per lead; draftJson { subject, body, needsReview }; emailSecurity; status draft | approved
- **Branding** — per-tenant white-label (future)
- **Subscription** — Stripe placeholder (starter | pro | enterprise)
- **ActionLog** — audit trail per tenant

### Regulatory engine
- **`src/lib/regulatory_intel.json`** — regions with name, framework, hook, fineExposure, exposureAmount, violationHook2026:
  - **US-NY** — NY RPC 1.6(c), legal, $500k base
  - **US-CA** — CCPA 2026, $7.5k
  - **US-NYDFS** — NYC financial, $2M+
  - **UK** — NIS2/SRA, €10M or 2%
  - **ON** — LawPRO (Ontario legal), $500k
  - **HIPAA** — US healthcare, ~$2.13M cap
  - **PHIPA** — Ontario healthcare, $250k
- **`src/lib/regulatory.ts`** — getRegionIntel(countryCode, industry), getHookForLead(countryCode, industry, domain?), calculateFineExposure(lead). US+healthcare → HIPAA; CA+healthcare → PHIPA; .gov/.edu → federal-friendly generic hook.
- **Fine math:** base exposure × 1.5 when DMARC failed (identity exposure).

### Draft content (no more “same message for everyone”)
- **`src/lib/draft.ts`** — **buildDraftContent()** is the single source of truth: domain, countryCode, industry, needsReview, **dmarcOk**.
  - If **dmarcOk === true** → body says “Your domain has baseline email authentication in place…” (no “Missing DMARC”).
  - Otherwise → getHookForLead(...) by region/industry and .gov/.edu.
- **Country/industry at draft time:** Worker and regenerate use **inferCountryFromDomain(domain)** (e.g. .co.uk → GB, .ca → CA) and **inferIndustryFromDomain(domain)** (e.g. hospital, clinic, dental → healthcare; bank, finance → finance) so UK leads get UK hook, healthcare leads get HIPAA/PHIPA, etc.

### Worker (heartbeat)
- **GET /api/worker/heartbeat** — Hunt (optional, if SERPER_API_KEY set) → Scalp (runLeadAudit: DMARC + contact scrape) → Closer (create draft via buildDraftContent, set lead to WAITING). Uses inferred country/industry from domain; updates lead countryCode/industry when inferred differently.

### Process batch (manual audit)
- **POST /api/leads/process-batch** — Audits READY leads (DMARC + contact scrape), sets dmarcOk, contactEmail, riskLevel, mapRiskScore.

### Scalper (audit)
- **`src/lib/scalper.ts`** — checkDmarc(domain) (DNS TXT _dmarc.<domain>), scrapeContactEmail(domain), runLeadAudit(domain).

### Drafts UI & sending
- **Drafts table** — Domain, calculated fine, DMARC (OK / Failed), subject/body preview.
- **Regenerate** — POST /api/drafts/regenerate with draftId: recomputes subject/body from current rules (domain → country/industry, dmarcOk, .gov); updates lead country/industry if inferred; fixes old drafts created before region/DMARC logic.
- **Edit in Gmail** — mailto with To (fallback compliance@domain if no contact), subject, body; body capped so URL &lt; ~1800 chars; **subject and body copied to clipboard**; blue toast “Subject and body copied to clipboard — paste into the email.”
- **Approve & Send** — POST /api/drafts/approve: sends via Resend to lead contact (or compliance@domain fallback), marks draft approved, lead CONTACTED. **Resend:** domain limphus.ca verified in Resend; RESEND_FROM_EMAIL set to e.g. noreply@limphus.ca so we can send to any recipient.

### Resend & DNS (what you did)
- Domain **limphus.ca** verified in Resend.
- DNS at **Porkbun:** DKIM (TXT resend._domainkey), MX for **send** (send.limphus.ca → feedback-smtp.us-east-1.amazonses.com), SPF (TXT send), optional DMARC (_dmarc). MX is on subdomain **send** only so main inbox (mark@limphus.ca) is unaffected.
- **Enable sending** turned on for limphus.ca in Resend.
- **RESEND_FROM_EMAIL** in `.env` set to an address on limphus.ca (e.g. Limphus Global &lt;noreply@limphus.ca&gt;).

### Auth
- **Clerk** — sign-in/sign-up; keys in `.env.local` (or `.env`). Missing secretKey → check CLERK_SECRET_KEY is set in `.env.local` and restart dev server.

### Folder structure (relevant)
- **src/app** — dashboard, API routes (leads, drafts, worker, team)
- **src/components** — BulkIntake, LeadsTable, DraftsTable, DashboardShell, GlobalHeatMap
- **src/lib** — db, regulatory.ts, regulatory_intel.json, draft.ts, scalper.ts, hunt.ts (inferCountryFromDomain, inferIndustryFromDomain), tenant, actionLog
- **prisma** — schema.prisma
- **workers/** — placeholder for Phase 2 Python scrapers (Justia, SRA, NPI)
- **docs/** — THE-COMPLETE-IDEA.md, DEPLOY-VERCEL-NEON.md, this file

---

## Flow summary (what you do)

1. **Add leads** — Bulk Lead Intake: paste URLs/domains → stored per tenant, country inferred from TLD.
2. **Audit** — Process batch (or worker heartbeat): DMARC check + contact scrape → dmarcOk, contactEmail, risk, fine exposure.
3. **Drafts** — After audit, drafts appear with region-specific hook and calculated fine. Use **Regenerate** if an old draft has wrong hook or fine.
4. **Send** — **Approve & Send** (Resend) or **Edit in Gmail** (paste body if window is blank). Approve & Send works to any recipient once domain is verified and RESEND_FROM_EMAIL is set.

---

## Phase 2 (not built yet)

- Python workers in **workers/** to scrape Justia, SRA, NPI and feed leads.
- **auditor/** — full DNS/HTTPS/DMARC audit engine.
- Stripe Checkout + Customer Portal for Starter/Pro/Enterprise.
- Global risk heat map on dashboard (data ready; map component may exist).

---

This doc is the single reference for “what we are doing” and “what is set in place.”
