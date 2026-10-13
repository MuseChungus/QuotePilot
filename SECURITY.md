# SECURITY.md — QuotePilot Web SaaS

## Implemented
- **Secrets:** None in repo. `.gitignore` covers `.env`, `*.db`, `node_modules/`, `uploads/`. `.env.example` has placeholders only. `SESSION_SECRET` via environment.
- **Auth:** Passwords hashed with bcrypt (cost 10). Sessions: random 32-byte token, stored as SHA-256 hash, 7-day expiry, httpOnly cookie, SameSite=lax, Secure in production. Logout deletes session.
- **Validation/sanitization:** Server-side checks on all inputs. Email regex, length caps via `cleanStr`, numeric checks for qty/price/discount/deposit, enum checks for budget/timeline/status. Client input escaped in frontend via `esc()`.
- **OWASP Top 10:**
  - SQL injection: parameterized queries only (`node:sqlite` prepared statements). No string-concatenated SQL.
  - XSS: CSP via helmet, `esc()` on dynamic HTML, no `innerHTML` with raw user data except escaped values. Public view escapes all fields.
  - CSRF: SameSite=lax cookies + JSON API (no form POSTs to API). State-changing endpoints require auth + JSON.
  - Broken access control: `requireAuth` on every private endpoint. All queries filter by `user_id`. Tests verify user B cannot access user A proposal (404). Public route returns only public fields, no `user_id`.
  - Broken auth: rate limiting (20 auth attempts / 15 min / IP), generic error messages, bcrypt.
  - Sensitive data: only email + proposal data collected. No payment data, no PII beyond client name/email.
- **Headers:** Helmet with CSP, HSTS in production, `X-Content-Type-Options`, etc. Service worker never caches `/api/`.
- **Rate limiting:** In-memory for auth endpoints. Note: in-memory resets on restart; for multi-instance production, use Redis / DB-backed limiter (see DEPLOYMENT.md).
- **HTTPS:** `Secure` cookie + HSTS only when `NODE_ENV=production`. Serve behind HTTPS in production (see DEPLOYMENT.md). Local dev is HTTP only.
- **Dependencies:** Minimal (express, bcryptjs, cookie-parser, helmet). Run `npm audit --audit-level=high` and fix high/critical.

## Known gaps / not in v1
- No legal e-sign with audit trail — explicitly out of scope, stated in UI + README.
- No 2FA, no password reset (add via email service with Owner approval — requires external service).
- In-memory rate limiter (see above).
- SQLite single-file — back up regularly; for multi-instance, move to managed Postgres.
- No automated dependency-update bot (Dependabot) — enable on GitHub after push, with Owner approval.
- CSP allows `'unsafe-inline'` for styles (needed for current CSS). Tighten to hashed styles in a future pass if desired.
