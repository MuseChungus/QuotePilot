# PROGRESS.md — QuotePilot Web SaaS

## Status (2026-10-13)
- **Done:** Full-stack v1 built locally. Auth, qualify, proposal builder, share + PDF, pipeline, dashboard, PWA, tests, docs.
- **In progress:** Verification (tests + local run + audit) — see below.
- **Next:** Owner provides repo URL + secure auth (token via secure vault or SSH deploy key) → push `quotepilot-web/` to repo → enable Pages/hosting per DEPLOYMENT.md. Do NOT deploy from VM.
- **Blocked:** GitHub push — no repo URL yet, no secure auth. Password alone does not work for git push (GitHub requires token/SSH). No browser login attempted.

## What's done
- `src/server.js` — Express app, helmet headers, rate limiting, auth, qualify, proposals, public view, dashboard.
- `src/db.js` — SQLite + migration v1 (users, sessions, qualifications, proposals, tiers, items).
- `src/scoring.js` — qualify scoring + totals (pure, tested).
- `src/templates.js` — 5 templates, totals verified.
- `src/auth.js` — bcrypt, session tokens, email validation, sanitizers.
- `src/seed.js` — demo user + proposal + qualification.
- `public/` — mobile-first index, public view, app.js, styles, manifest, service worker, icon.
- `tests/run.test.js` — qualify, totals, discount, auth + isolation, public view, unauth 401.
- Docs: README, DECISIONS, SECURITY, DEPLOYMENT, PROGRESS (this file).

## Open questions for Owner
- Repo URL + secure auth method for push (token via vault or SSH deploy key)?
- Keep name QuotePilot? Trademark/domain not checked.
- Confirm v1 scope is correct (no e-sign, no payments).

## How to resume if VM is wiped
1. Clone repo (once pushed) or restore `quotepilot-web/` from backup.
2. `npm install`, copy `.env.example` to `.env`, set `SESSION_SECRET`.
3. `npm run seed` (optional), `npm start`, `npm test`.
4. See README.md for run/test, DEPLOYMENT.md for hosting options.
