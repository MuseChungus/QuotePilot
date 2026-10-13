# PROGRESS.md — QuotePilot Web SaaS

## Status (2026-10-13, updated for SDLC ownership)
- **Done:** Full-stack v1 built locally and pushed to GitHub (`master`, 2 commits, clean, tracking `origin/master`). Auth, qualify, proposal builder, share + PDF, pipeline, dashboard, PWA, tests, docs. Verified 2026-10-13 (see Verification below).
- **Done (this update):** Duplicate proposal + pipeline search/filter built via strict RED-GREEN-REFACTOR (see TDD cycle below). Tests 7/7 pass.
- **SDLC ownership (2026-10-13, Brandon approval):** "You may edit the reqs to deploy on your own. YOU OWN THE SDLC." Deployment gate lifted. NEVER SPEND MONEY and no account creation without explicit per-service approval still apply.
- **In progress:** None — awaiting secure auth to push `gh-pages` + enable Pages, and hosting-account approval for full-stack.
- **Next:** (1) Push local `gh-pages` branch (needs secure GitHub auth, transient, no storage) and enable Pages for `gh-pages` / root via repo settings or API. (2) Propose free-tier Node host for full-stack app, await explicit approval to create that host account. Do NOT create host account without that approval. Do NOT spend money.
- **Blocked:**
  - Push `gh-pages` + enable Pages — no secure GitHub auth currently available in this session. Need token via secure vault or SSH deploy key. No browser login, no secrets written. Password alone does not work for git push.
  - Full-stack hosting — needs explicit approval to create a host account for a specific free-tier service. No account created yet.

## TDD cycle — Duplicate + Pipeline search/filter (2026-10-13, first full RED-GREEN-REFACTOR)
- **RED** (`ff400a7`): Wrote failing tests first in `tests/run.test.js` — duplicate (copy + `(Copy)`, draft reset, new `public_id`, same tiers, isolation 404, unauth 401, bad id 400, missing 404) and pipeline filter (`?status`, `?q` case-insensitive client/title, combined, empty, invalid status 400). Verified FAIL before implementation: 5 pass / 2 fail (duplicate 404, filter ignored status).
- **GREEN** (`ecdaf4c`): Minimal implementation — `POST /api/proposals/:id/duplicate` (ownership-checked, copies tiers/items, status `draft`, new `public_id`) + `GET /api/proposals?status=&q=` filtering + pipeline UI (status select, search input, Duplicate button). Verified PASS: 7/7.
- **REFACTOR** (`0d007ab`): Extracted shared `insertProposalTiers()` helper used by create + duplicate (removed duplicated tier/item insert loops). Verified still 7/7 + syntax checks.
- **Feature:** Pipeline list now filters by status (All/Draft/Sent/Viewed/Accepted/Lost) and searches client name or title (case-insensitive substring). Duplicate creates a Draft copy with a new share link.

## Engineering standards — TDD required (2026-10-13)
- **Methodology:** RED → GREEN → REFACTOR (TDD) is required for all development going forward. RED: write a failing test first. GREEN: minimal code to pass. REFACTOR: clean up, keep tests green.
- **Gap (honest):** V1 tests in `tests/run.test.js` were written post-hoc after implementation, not TDD — acknowledged as a gap.
- **Rule:** All new features/fixes must follow RED-GREEN-REFACTOR, with the failing test committed first in its own local commit where practical.
- **Open work:** Next feature/fix must demo a full RED-GREEN-REFACTOR cycle (failing test commit → passing implementation commit → refactor commit, or failing test commit + implementation commit at minimum).

## SDLC ownership change (2026-10-13)
- Old rule: "Do NOT deploy it yourself" / "Do NOT deploy from VM."
- New rule (Brandon): Chungus may edit reqs to deploy on own, owns SDLC including deployment.
- Unchanged: NEVER SPEND MONEY, no paid plans/trials, no payment details, no provisioning paid resources, no account creation without explicit per-service approval, no exposing VM publicly, no GitHub paid features, no secrets in repo.

## Verification (2026-10-13, local only)
- `npm test` — 7/7 pass: qualify scoring 6 cases, template totals 15 tiers exact, discount math, auth + isolation (user B 404 on user A proposal), qualify endpoint, duplicate proposal (copy + isolation), pipeline search/filter.
- Live server smoke (port 3123/3124): health 200, index 200, manifest 200, sw 200, templates, login demo, me, dashboard, proposals, public API 200, public HTML 200, public view leaks no `user_id`.
- `npm audit` — blocked by sandbox policy (`policy_denied` on audit endpoint), NOT bypassed. Deps are minimal (express, bcryptjs, cookie-parser, helmet). Re-run audit after push on a machine with audit access.
- Secrets check: no `.env` file, no real secrets in repo (only demo `demo@quotepilot.local / DemoPass123!` in seed/README, demo-only). `.gitignore` covers `.env`, `*.db`, `node_modules/`.
- Local git: `master` pushed to `origin/master` (2 commits: `bf4b159` v1 full SaaS, `3888c6c` docs verification). Doc updates for SDLC ownership to be committed in this update. `gh-pages` branch prepared locally, unpushed (static demo only).

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
- Secure auth method to push local `gh-pages` branch + enable Pages (token via vault or SSH deploy key)?
- Approval to create a host account for a specific free-tier Node host for the full-stack app (which service)?
- Keep name QuotePilot? Trademark/domain not checked.
- Confirm v1 scope is correct (no e-sign, no payments).

## How to resume if VM is wiped
1. Clone repo `https://github.com/MuseChungus/QuotePilot.git` (`master` = full-stack app, `gh-pages` = static demo once pushed).
2. `npm install`, copy `.env.example` to `.env`, set `SESSION_SECRET`.
3. `npm run seed` (optional), `npm start`, `npm test`.
4. See README.md for run/test, DEPLOYMENT.md for hosting options.
