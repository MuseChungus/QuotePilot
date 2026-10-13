# DEPLOYMENT.md — QuotePilot Web SaaS (do NOT deploy from VM)

This app is a Node + SQLite server. It is NOT a static site — GitHub Pages alone cannot run it (Pages is static only). You need a Node host.

## What you need to set up (Owner action)
1. A Node host (see options below).
2. Environment vars: `PORT`, `DATABASE_PATH`, `SESSION_SECRET` (long random), `NODE_ENV=production`.
3. HTTPS (host provides it, or reverse proxy with cert).
4. Backups for the SQLite file (or migrate to managed DB if you outgrow it).

## Free options (no card required — verify at setup time)
- **Render free tier:** Node web service, free tier sleeps when idle. Cost: $0. Limit: sleeps, ephemeral disk — SQLite file may reset on redeploy unless you attach a paid disk or use external DB. Good for demo.
- **Fly.io free allowance:** Node app, small VM. Cost: $0 within allowance, then usage. Requires account (Owner creates).
- **Railway trial / free tier:** Node + volume. Cost: varies, check current free tier before using.
- **Self-hosted VPS (you manage):** e.g. Hetzner / DigitalOcean droplet + Caddy + PM2. Cost: ~$4–$6/mo for smallest droplet. Most control, you manage updates/backups.

## Paid options (for scale, Owner approval required before spending)
- **Render Standard:** ~$7/mo + persistent disk ~$1–$5/mo. No sleep, persistent SQLite via disk.
- **Fly.io dedicated VM + volume:** ~$5–$15/mo depending on size.
- **Managed Postgres (if you outgrow SQLite):** e.g. Neon / Supabase free tier, then ~$5–$25/mo. Requires migration (schema is simple, see `src/db.js`).

## Steps (generic)
```bash
# On host:
git clone <repo-url>
cd quotepilot-web
npm install --omit=dev
cp .env.example .env  # then set SESSION_SECRET via host env vars, never commit .env
NODE_ENV=production npm start
# Put behind HTTPS (host TLS or Caddy/Nginx reverse proxy)
```

## Notes
- Do NOT use GitHub Pages for this app — it cannot run Node/SQLite.
- Keep `SESSION_SECRET` secret, rotate if leaked.
- Enable Dependabot / audit on GitHub after push.
- Back up `data/quotepilot.db` regularly.
