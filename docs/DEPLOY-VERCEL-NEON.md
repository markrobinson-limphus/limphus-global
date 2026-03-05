# Launch Limphus Global in the Cloud (Always-On, Free to Start)

Ditch the local desktop. Put the app in the cloud and get a **live URL** (e.g. `limphus-global.vercel.app`) that is always on, free to start, and updates automatically when you push code.

**The stack:** Neon (Postgres) + GitHub (code) + Vercel (Next.js host). All three have free tiers.

---

## Step 1: Cloud database (Neon)

1. Go to **[neon.tech](https://neon.tech)** and sign up (free).
2. Click **Create a project**. Name it e.g. **Limphus**.
3. Neon gives you a **connection string** like:
   ```text
   postgresql://user:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require
   ```
4. **Optional but recommended for Vercel:** Use the **pooled** connection string from the Neon dashboard (e.g. **Connection string** → **Pooled**). It’s better for serverless and looks like:
   ```text
   postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
   ```
5. Copy that string. You’ll use it as `DATABASE_URL` in Step 3 (Vercel env vars).  
   Locally, put it in `limphus-global/.env.local`:
   ```text
   DATABASE_URL="postgresql://..."
   ```

---

## Step 2: Push code to GitHub

1. Go to **[github.com](https://github.com)** and sign in (or create an account).
2. Click **New repository**. Name it **limphus-global**. Choose **Private** if you want. Create the repo (don’t add a README or .gitignore; the project already has one).
3. Open a terminal in your project folder and run (replace `YOUR_USERNAME` with your GitHub username):

   **PowerShell (Windows):**
   ```powershell
   cd C:\Users\Limph\limphus-global
   git init
   git add .
   git commit -m "Initial launch"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/limphus-global.git
   git push -u origin main
   ```

   **If you don’t have Git yet:** Install from [git-scm.com](https://git-scm.com), then run the same commands.

4. After `git push`, your code is on GitHub. Anyone you give access to can clone it; only you (and Vercel) need to deploy.

---

## Step 3: Deploy on Vercel

1. Go to **[vercel.com](https://vercel.com)** and sign up / log in **with GitHub**.
2. Click **Add New Project**. Select the **limphus-global** repository.
3. **Before Deploy — set environment variables:**
   - Open **Environment Variables**.
   - Add each variable (name + value). Use **Production** (and optionally Preview) for all:

   | Name | Value |
   |------|--------|
   | `DATABASE_URL` | Your **Neon** connection string (pooled recommended) |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | From [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
   | `CLERK_SECRET_KEY` | Same place (Secret key) |

   If you use Clerk production keys, add the same names for production; for the first deploy you can use Clerk’s dev keys and switch later.

4. Click **Deploy**. Vercel will:
   - Run `npm install`
   - Run `prisma generate && next build`
   - Deploy the app

5. When it’s done, you get a **live URL** like `limphus-global-xxx.vercel.app`. You can add a custom domain later (e.g. `app.limphus.ca`) in Vercel → Project → Settings → Domains.

---

## After launch

- **Clerk redirect URLs:** In [Clerk Dashboard](https://dashboard.clerk.com) → your application → **Paths** / **URLs**, add your Vercel URL (e.g. `https://limphus-global.vercel.app`) as an allowed redirect for Sign-in and Sign-up. Use the same for production if you add a custom domain later.
- **Text the link** to your team. They sign up (Clerk), get their own workspace, and start using the Command Center from their laptops.
- **Change code:** Edit in Cursor, commit, push to GitHub (`git add .` → `git commit -m "Your message"` → `git push`). Vercel will rebuild and update the live site automatically.
- **Database:** Run migrations when you change the schema. Locally: `npx prisma db push` (or use migrations). With Neon, point your local `.env.local` at the same `DATABASE_URL` and run the same command; then push code so Vercel’s build uses the updated schema.

---

## First-time DB schema on Neon

Before the app can use the cloud DB, the schema must exist. Do this once:

1. In `limphus-global`, set `.env.local` with the Neon `DATABASE_URL`.
2. Run:
   ```bash
   npx prisma db push
   ```
3. Then push your code and deploy on Vercel (Step 3). The live app will use the same Neon DB.

---

## Summary

| Piece | Service | Role |
|-------|---------|------|
| Database | **Neon** | Serverless Postgres, always on, free tier |
| Code | **GitHub** | Repo; Vercel reads from here |
| App | **Vercel** | Builds and hosts Next.js; free tier, auto-deploy on push |

Once this is done, you can stop running Docker locally. The live URL is always on; you and your buddies use it from anywhere. Changes go: Cursor → GitHub → Vercel → live site in minutes.
