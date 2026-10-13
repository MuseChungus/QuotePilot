# QuotePilot — Full Web SaaS

**SDLC ownership (2026-10-13, Brandon approval):** Chungus owns the SDLC including deployment. The old "do NOT deploy yourself" gate is lifted. NEVER SPEND MONEY and no account creation without explicit per-service approval still apply.

**Deployment:** Static demo → GitHub Pages (`gh-pages` branch, free, existing repo). Full-stack app (this code, `master` branch) needs a Node host — see DEPLOYMENT.md. Chungus will propose a free-tier Node host and wait for explicit approval to create that host account.

**One-liner:** Stop writing free proposals for people who can't afford you. Qualify budget first, then build a 3-option proposal in 10 minutes.

**Who it's for:** Freelancers, web designers, marketing consultants, small agencies (1–10 people) writing 3–10 proposals/month.

## What it does
1. **Qualify** — intake (client, project type, budget range, timeline, scope) → Green / Yellow / Red score with reasons + polite decline template.
2. **Build** — 3-tier proposal (Essential / Standard / Complete), editable line items, live totals, add-ons, discount, expiry, deposit, terms. 5 templates pre-filled.
3. **Send + follow up** — DB-backed shareable link (`/p/:public_id`), print/save as PDF, email intro copy, pipeline (Draft / Sent / Viewed / Accepted / Lost), follow-up templates, dashboard (win rate, avg deal, est. time saved).

**Honest limit:** V1 is draft + share + PDF. It is **not** legal e-sign with audit trail, not CRM sync, not open-tracking, not payments, not team collaboration.

## Stack
Node.js + Express + SQLite (`node:sqlite`) + vanilla JS + PWA. No Docker, no paid services for local dev. Bcrypt for passwords, httpOnly cookies, parameterized queries.

## How to run
```bash
cd quotepilot-web
npm install
npm run seed   # optional: demo@quotepilot.local / DemoPass123!
npm start
# visit http://localhost:3000/
```
Env: copy `.env.example` to `.env` and set `SESSION_SECRET` to a long random value. Never commit a real `.env`.

## How to test
```bash
npm test
npm run audit
```
Tests cover qualify scoring (6 cases), template totals (15 tiers), discount math, auth + multi-tenant isolation (user B cannot access user A proposal), public view without user data leak, unauthenticated 401.

## Known limitations
- No legal e-sign, no payments, no CRM sync, no open-tracking, no team collab.
- Photos/uploads: not in v1 (proposals are text + numbers).
- Single-server SQLite — for production, use backups + a managed DB if you outgrow it (see DEPLOYMENT.md).
- Name QuotePilot is a working title — check trademark/domain before launch.
- Competitor prices in market research came from secondary comparison pages — re-verify live before quoting to buyers.
