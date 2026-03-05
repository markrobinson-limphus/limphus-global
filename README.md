# Limphus Global

Multi-tenant SaaS for MSPs: global compliance lead-gen and one-click advisory delivery (LawPRO, SRA, HIPAA, NY RPC 1.6, NIS2).

## Stack

- **Next.js 15** (App Router), TypeScript, Tailwind
- **Clerk** — auth & multi-tenant (orgs)
- **Prisma** — Postgres (tenants, leads, drafts, branding, subscriptions)
- **Stripe** — placeholder for Starter / Pro / Enterprise

## Folder structure

```
limphus-global/
├── src/
│   ├── app/          # Next.js App Router (dashboard, API routes)
│   ├── components/   # UI (BulkIntake, LeadsTable, DraftsTable, DashboardShell)
│   └── lib/          # db, regulatory_intel, tenant
├── prisma/           # Schema (Tenant, Lead, Draft, Branding, Subscription)
├── workers/          # Phase 2: Python scrapers (Justia, SRA, HIPAA)
├── auditor/          # Phase 2: DNS/HTTPS/DMARC audit engine
└── docs/             # Regulatory guides (LawPRO, SRA, etc.)
```

## Setup

1. **Copy env**
   - Copy `.env.example` to **`.env`** (Prisma CLI reads this for `db push` / migrations).
   - Copy `.env.example` to **`.env.local`** for Next.js (or use `.env` for both).
   Fill in:
   - `DATABASE_URL` — Postgres connection string (e.g. Neon or local).
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from [dashboard.clerk.com](https://dashboard.clerk.com).
   - Optional: `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for Approve & Send.

2. **Database**
   ```bash
   npm install
   npx prisma generate
   npx prisma db push
   ```

3. **Run**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Sign in with Clerk; you get a personal tenant and can use Bulk Lead Intake and Drafts (Approve & Open Gmail).

## Troubleshooting: "Missing secretKey" (Clerk)

If you see **@clerk/nextjs: Missing secretKey**:

1. **File location** — Put your keys in **`.env.local`** (or **`.env`**) in the **project root** (same folder as `package.json`), i.e. `limphus-global/.env.local`.
2. **Exact variable names** — Clerk expects:
   - `CLERK_SECRET_KEY=sk_test_...` (Secret key from Clerk dashboard → API Keys)
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...` (Publishable key from the same page)
3. **Format** — One per line, no space around `=`. Example:
   ```env
   CLERK_SECRET_KEY=sk_test_abc123...
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xyz789...
   ```
4. **Restart** — Stop the dev server (Ctrl+C), then run `npm run dev` again. Next.js only reads env at startup.

## Reset and run (clean state)

If things are broken or you want a clean run:

1. **Stop** any running dev server (Ctrl+C in the terminal where `npm run dev` is running).
2. Ensure **`.env`** exists with `DATABASE_URL` (Prisma needs this for `db push`). Copy from `.env.example` if needed.
3. In the project root:
   ```bash
   npm install
   npm run reset
   npm run dev
   ```
   `npm run reset` runs `prisma generate` and `prisma db push`. Then open http://localhost:3000.

## Deploy to the cloud (always-on, free to start)

Use **Neon** (Postgres) + **GitHub** (code) + **Vercel** (host). One live URL, auto-updates on push. Full steps: **[docs/DEPLOY-VERCEL-NEON.md](docs/DEPLOY-VERCEL-NEON.md)**.

## Features (current)

- **Command Center** — dashboard with shortcuts to Leads, Drafts, Exports, Workers
- **Bulk Lead Intake** — paste 100+ URLs; stored per tenant with `pending` audit status
- **Leads table** — domain, country, industry, contact, DMARC, risk score (when audit runs)
- **Drafts** — list + preview; **Approve & Open Gmail** fills `mailto:` with subject/body (regulatory hooks from `regulatory_intel.json` by region)
- **Regulatory map** — `src/lib/regulatory_intel.json` + `regulatory.ts` for US-NY, US-CA, UK, ON, HIPAA, PHIPA, NYDFS

## Next (Phase 2)

- Python workers: scrape Justia, SRA, NPI; insert leads into Postgres
- Auditor: DNS (SPF, DMARC, DKIM), HTTPS, privacy policy; set `regulatoryRiskScore`
- Drafting service: generate draft body using `getHookForLead(countryCode, industry)`
- Stripe: Starter $199, Pro $499, Enterprise custom
- Global risk heat map on dashboard

## Money can scale with clients

Pricing is configurable; tiers and amounts can be adjusted as you scale (Starter / Pro / Whale or custom).
Deployed via Vercel.
