# PROGRESS.md — QuotePilot Web SaaS

## Status (2026-10-13)
- **Done:** Full-stack v1 built locally. Auth, qualify, proposal builder, share + PDF, pipeline, dashboard, PWA, tests, docs. Verified 2026-10-13 (see Verification below).
- **In progress:** None — awaiting Owner for push.
- **Next:** Owner provides repo URL + secure auth (token via secure vault or SSH deploy key) → push `quotepilot-web/` to repo → host per DEPLOYMENT.md (GitHub Pages cannot run Node/SQLite). Do NOT deploy from VM.
- **Blocked:** GitHub push — no repo URL yet, no secure auth. Password alone does not work for git push (GitHub requires token/SSH). No browser login attempted.

## Verification (2026-10-13, local only)
- `npm test` — 5/5 pass: qualify scoring 6 cases, template totals 15 tiers exact, discount math, auth + isolation (user B 404 on user A proposal), qualify endpoint.
- Live server smoke (port 3123/3124): health 200, index 200, manifest 200, sw 200, templates, login demo, me, dashboard, proposals, public API 200, public HTML 200, public view leaks no `user_id`.
- `npm audit` — blocked by sandbox policy (`policy_denied` on audit endpoint), NOT bypassed. Deps are minimal (express, bcryptjs, cookie-parser, helmet). Re-run audit after push on a machine with audit access.
- Secrets check: no `.env` file, no real secrets in repo (only demo `demo@quotepilot.local / DemoPass123!` in seed/README, demo-only). `.gitignore` covers `.env`, `*.db`, `node_modules/`.
- Local git: 1 commit `bf4b159` — v1 full SaaS.

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
