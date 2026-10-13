# DECISIONS.md — QuotePilot Web SaaS

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
