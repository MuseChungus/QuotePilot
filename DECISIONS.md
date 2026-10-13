## 2026-10-13 — Engineering methodology: RED → GREEN → REFACTOR (TDD) is required
- **Decision:** TDD is required for all development going forward.
- **Cycle:** RED (write a failing test first) → GREEN (write minimal code to make it pass) → REFACTOR (clean up, keep tests green).
- **Rule:** All new features/fixes from now on must follow RED-GREEN-REFACTOR, with the failing test committed first in its own local commit where practical.
- **Honest gap:** V1 tests in `tests/run.test.js` were written post-hoc after implementation, not TDD — this is acknowledged as a gap. It does not retroactively make v1 TDD. The requirement applies going forward.

## 2026-10-13 — SDLC ownership: Chungus owns SDLC including deployment
- **Decision:** Owner (Brandon) said: "You may edit the reqs to deploy on your own. YOU OWN THE SDLC." The old "do NOT deploy it yourself" / "do NOT deploy from VM" gate is lifted.
- **What this changes:** Chungus may edit requirements to deploy, owns the SDLC, and will deploy the static demo to GitHub Pages (free, existing repo, no new account) and prepare deployment for the full-stack app.
- **What still applies (NOT lifted):** NEVER SPEND MONEY — no paid plans, trials that convert, payment details, or provisioning paid resources. No account creation on any website/service without explicit approval for that specific service. No exposing the VM publicly. No GitHub paid features. No secrets in repo.
- **Deployment plan under new rules:** Static demo → GitHub Pages (free, existing repo). Full-stack app → Chungus will propose a free-tier Node host, awaiting explicit approval to create that host account. No host account will be created without that per-service approval.

## 2026-10-13 — Product pick: QuotePilot (full web SaaS)
- **Decision:** Build QuotePilot as THE single product, full-stack, not the static prototype.
- **Why:** Market research (see parent goal hidden_files/market-research-brief.md) found proven WTP $13–$65/mo for proposal tools, founder fit (Brandon pitches web services to Jacksonville SMBs), differentiator = qualify-first + flat per-account pricing + 3-tier anchoring + follow-up.
- **Why not FlipCheck:** FlipCheck was picked under the formal brief's mobile-first test, but Owner clarified: "Your choice. Whichever you decide is the best SaaS based on your research." Research says QuotePilot wins on WTP proof. FlipCheck build was stopped per instruction.
- **Why not LocalLift:** HopHQ already owns generic audit at $29/mo. Rejected head-on.

## 2026-10-13 — Stack: Node + Express + SQLite (node:sqlite) + vanilla JS + PWA
- **Why:** Runs locally, zero paid services, no Docker (not available in VM), minimal deps, portable SQLite file, easy migrations. PWA for installable + app-shell cache.
- **Alternatives considered:** Next.js (heavier, slower on 2 CPU / tight RAM), Docker Postgres (Docker not available), Firebase/Supabase (requires account + external service, forbidden without approval).

## 2026-10-13 — Auth: bcrypt + DB session tokens + httpOnly cookies
- **Why:** Well-established, no invented crypto. Tokens are random 32-byte, stored as SHA-256 hash in DB. Cookies httpOnly, SameSite=lax, Secure in production.
- **Rejected:** JWT in localStorage (XSS risk), home-rolled hashing.

## 2026-10-13 — Public proposals via DB public_id, not URL-hash JSON
- **Why:** Static prototype encoded proposal JSON in URL hash (leaky, no revocation, no auth). DB version uses random public_id, server returns only public fields, no user_id leaked. Owner can delete proposal to revoke link.

## 2026-10-13 — No e-sign, no payments in v1
- **Why:** Legal e-sign with audit trail and payments are high-risk / regulated-adjacent and require external services. V1 is honest: draft + share + PDF. Stated in UI, README, SECURITY.md.

## 2026-10-13 — Pricing: model only, no checkout
- **Why:** Brief forbids pricing pages beyond placeholder and forbids spending money / payment details. Model: Free / Pro / Agency, flat per-account, not per-seat. No checkout code in v1.
