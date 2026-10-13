const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const path = require('path');
const { getDb } = require('./db');
const { hashPassword, verifyPassword, newSessionToken, sha256Hex, newPublicId, isValidEmail, cleanStr } = require('./auth');
const { scoreQualification, proposalTotals } = require('./scoring');
const { TEMPLATES } = require('./templates');

const app = express();
const db = getDb();

// --- Security headers ---
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: process.env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
  crossOriginEmbedderPolicy: false,
}));
app.use(express.json({ limit: '200kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: process.env.NODE_ENV === 'production' ? '1d' : 0 }));

// --- Simple in-memory rate limiting for auth ---
const authAttempts = new Map(); // ip -> {count, resetAt}
function authRateLimit(req, res, next) {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const rec = authAttempts.get(ip);
  if (!rec || now > rec.resetAt) {
    authAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  rec.count += 1;
  if (rec.count > 20) return res.status(429).json({ error: 'Too many attempts. Try again in 15 minutes.' });
  next();
}
function clearAuthRateLimit() { authAttempts.clear(); }

// --- Auth helpers ---
const COOKIE_NAME = 'qp_session';
function setSessionCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}
function requireAuth(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  const tokenHash = sha256Hex(token);
  const sess = db.prepare('SELECT s.*, u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?').get(tokenHash);
  if (!sess) return res.status(401).json({ error: 'Invalid session' });
  if (new Date(sess.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(sess.id);
    return res.status(401).json({ error: 'Session expired' });
  }
  req.user = { id: sess.user_id, email: sess.email };
  next();
}

function createSession(userId) {
  const token = newSessionToken();
  const tokenHash = sha256Hex(token);
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (user_id, token_hash, expires_at) VALUES (?,?,?)').run(userId, tokenHash, expires);
  return token;
}

// --- Validation ---
const BUDGETS = ['<$1k', '$1-3k', '$3-7k', '$7k+', 'Not sure'];
const TIMELINES = ['ASAP', '2-4 weeks', '1-3 months', 'Flexible', 'Not sure'];
const STATUSES = ['draft', 'sent', 'viewed', 'accepted', 'lost'];

function validateProposalInput(body) {
  const errors = [];
  if (!body || typeof body !== 'object') return ['Invalid body'];
  if (!cleanStr(body.client_name, 200)) errors.push('client_name required');
  if (!cleanStr(body.title, 300)) errors.push('title required');
  if (!Array.isArray(body.tiers) || body.tiers.length !== 3) errors.push('tiers must be exactly 3');
  else {
    for (const t of body.tiers) {
      if (!cleanStr(t.name, 100)) errors.push('tier name required');
      if (!Array.isArray(t.items) || t.items.length === 0) errors.push('each tier needs at least 1 item');
      else for (const it of t.items) {
        if (!cleanStr(it.description, 500)) errors.push('item description required');
        if (!(Number(it.qty) > 0)) errors.push('item qty must be > 0');
        if (!(Number(it.price) >= 0)) errors.push('item price must be >= 0');
      }
    }
  }
  if (body.discount_pct != null && (Number(body.discount_pct) < 0 || Number(body.discount_pct) > 90)) errors.push('discount must be 0-90');
  if (body.deposit_pct != null && (Number(body.deposit_pct) < 0 || Number(body.deposit_pct) > 100)) errors.push('deposit must be 0-100');
  return errors;
}

// --- Auth routes ---
app.post('/api/auth/signup', authRateLimit, (req, res) => {
  const email = cleanStr(req.body && req.body.email, 200).toLowerCase();
  const password = (req.body && req.body.password) || '';
  if (!isValidEmail(email)) return res.status(400).json({ error: 'Valid email required' });
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return res.status(409).json({ error: 'Email already registered' });
  const hash = hashPassword(password);
  const info = db.prepare('INSERT INTO users (email, password_hash) VALUES (?,?)').run(email, hash);
  const token = createSession(info.lastInsertRowid);
  setSessionCookie(res, token);
  return res.json({ ok: true, user: { id: info.lastInsertRowid, email } });
});

app.post('/api/auth/login', authRateLimit, (req, res) => {
  const email = cleanStr(req.body && req.body.email, 200).toLowerCase();
  const password = (req.body && req.body.password) || '';
  if (!isValidEmail(email) || typeof password !== 'string') return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = createSession(user.id);
  setSessionCookie(res, token);
  return res.json({ ok: true, user: { id: user.id, email: user.email } });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  const token = req.cookies[COOKIE_NAME];
  db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(sha256Hex(token));
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

// --- Templates ---
app.get('/api/templates', (req, res) => res.json({ templates: TEMPLATES }));

// --- Qualify ---
app.post('/api/qualify', requireAuth, (req, res) => {
  const client_name = cleanStr(req.body && req.body.client_name, 200);
  const client_email = cleanStr(req.body && req.body.client_email, 200);
  const project_type = cleanStr(req.body && req.body.project_type, 200);
  const budget_range = cleanStr(req.body && req.body.budget_range, 50);
  const timeline = cleanStr(req.body && req.body.timeline, 50);
  const scope_notes = cleanStr(req.body && req.body.scope_notes, 2000);
  if (!client_name) return res.status(400).json({ error: 'client_name required' });
  if (!project_type) return res.status(400).json({ error: 'project_type required' });
  if (!BUDGETS.includes(budget_range)) return res.status(400).json({ error: 'Invalid budget_range' });
  if (!TIMELINES.includes(timeline)) return res.status(400).json({ error: 'Invalid timeline' });
  if (client_email && !isValidEmail(client_email)) return res.status(400).json({ error: 'Invalid client_email' });
  const { score, band, reasons } = scoreQualification({ budget_range, timeline, scope_notes });
  const info = db.prepare(`INSERT INTO qualifications
    (user_id, client_name, client_email, project_type, budget_range, timeline, scope_notes, score, band, reasons)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(req.user.id, client_name, client_email, project_type, budget_range, timeline, scope_notes, score, band, JSON.stringify(reasons));
  return res.json({ ok: true, qualification: { id: info.lastInsertRowid, client_name, client_email, project_type, budget_range, timeline, scope_notes, score, band, reasons } });
});

app.get('/api/qualify', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM qualifications WHERE user_id = ? ORDER BY id DESC LIMIT 100').all(req.user.id);
  const out = rows.map(r => ({ ...r, reasons: JSON.parse(r.reasons || '[]') }));
  return res.json({ qualifications: out });
});

// --- Proposals ---
function loadProposalFull(proposalId, userId) {
  const p = db.prepare('SELECT * FROM proposals WHERE id = ? AND user_id = ?').get(proposalId, userId);
  if (!p) return null;
  const tiers = db.prepare('SELECT * FROM proposal_tiers WHERE proposal_id = ? ORDER BY sort_order ASC').all(proposalId);
  const fullTiers = tiers.map(t => {
    const items = db.prepare('SELECT * FROM proposal_items WHERE tier_id = ? ORDER BY sort_order ASC').all(t.id);
    return { id: t.id, name: t.name, items: items.map(i => ({ id: i.id, description: i.description, qty: i.qty, price: i.price, is_addon: !!i.is_addon })) };
  });
  const totals = proposalTotals({ tiers: fullTiers, discount_pct: p.discount_pct });
  return { ...p, tiers: fullTiers, totals };
}

app.post('/api/proposals', requireAuth, (req, res) => {
  const errors = validateProposalInput(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join('; ') });
  const b = req.body;
  const public_id = newPublicId();
  const info = db.prepare(`INSERT INTO proposals
    (user_id, public_id, client_name, client_email, title, project_type, expiry, deposit_pct, discount_pct, terms, status, follow_up_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    req.user.id, public_id,
    cleanStr(b.client_name, 200), cleanStr(b.client_email || '', 200),
    cleanStr(b.title, 300), cleanStr(b.project_type || '', 200),
    cleanStr(b.expiry || '', 50), Number(b.deposit_pct ?? 50), Number(b.discount_pct ?? 0),
    cleanStr(b.terms || '', 2000), 'draft', cleanStr(b.follow_up_date || '', 50)
  );
  const pid = info.lastInsertRowid;
  insertProposalTiers(pid, b.tiers);
  const full = loadProposalFull(pid, req.user.id);
  return res.json({ ok: true, proposal: full });
});

function insertProposalTiers(proposalId, tiers) {
  tiers.forEach((t, ti) => {
    const tierInfo = db.prepare('INSERT INTO proposal_tiers (proposal_id, name, sort_order) VALUES (?,?,?)').run(proposalId, cleanStr(t.name, 100), ti);
    t.items.forEach((it, ii) => {
      db.prepare('INSERT INTO proposal_items (tier_id, description, qty, price, is_addon, sort_order) VALUES (?,?,?,?,?,?)').run(
        tierInfo.lastInsertRowid, cleanStr(it.description, 500), Number(it.qty), Number(it.price), it.is_addon ? 1 : 0, ii
      );
    });
  });
}

app.get('/api/proposals', requireAuth, (req, res) => {
  const status = typeof req.query.status === 'string' ? req.query.status : '';
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (status && status !== 'all' && !STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const rows = db.prepare('SELECT id FROM proposals WHERE user_id = ? ORDER BY id DESC').all(req.user.id);
  let out = rows.map(r => loadProposalFull(r.id, req.user.id));
  if (status && status !== 'all') out = out.filter(p => p.status === status);
  if (q) {
    const needle = q.toLowerCase();
    out = out.filter(p => p.client_name.toLowerCase().includes(needle) || p.title.toLowerCase().includes(needle));
  }
  return res.json({ proposals: out });
});

app.get('/api/proposals/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  const full = loadProposalFull(id, req.user.id);
  if (!full) return res.status(404).json({ error: 'Not found' });
  return res.json({ proposal: full });
});

app.put('/api/proposals/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  const existing = db.prepare('SELECT * FROM proposals WHERE id = ? AND user_id = ?').get(id, req.user.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const status = req.body && req.body.status;
  const follow_up_date = req.body && req.body.follow_up_date;
  if (status != null && !STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  if (status != null) db.prepare('UPDATE proposals SET status = ?, updated_at = datetime(\'now\') WHERE id = ?').run(status, id);
  if (typeof follow_up_date === 'string') db.prepare('UPDATE proposals SET follow_up_date = ? WHERE id = ?').run(cleanStr(follow_up_date, 50), id);
  const full = loadProposalFull(id, req.user.id);
  return res.json({ ok: true, proposal: full });
});

app.delete('/api/proposals/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  const info = db.prepare('DELETE FROM proposals WHERE id = ? AND user_id = ?').run(id, req.user.id);
  if (info.changes === 0) return res.status(404).json({ error: 'Not found' });
  return res.json({ ok: true });
});

// Duplicate: copy with "(Copy)" title, status reset to draft, new public_id.
app.post('/api/proposals/:id/duplicate', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });
  const orig = loadProposalFull(id, req.user.id);
  if (!orig) return res.status(404).json({ error: 'Not found' });
  const public_id = newPublicId();
  const info = db.prepare(`INSERT INTO proposals
    (user_id, public_id, client_name, client_email, title, project_type, expiry, deposit_pct, discount_pct, terms, status, follow_up_date)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    req.user.id, public_id,
    orig.client_name, orig.client_email,
    orig.title + ' (Copy)', orig.project_type,
    orig.expiry, orig.deposit_pct, orig.discount_pct,
    orig.terms, 'draft', orig.follow_up_date
  );
  const pid = info.lastInsertRowid;
  insertProposalTiers(pid, orig.tiers);
  const full = loadProposalFull(pid, req.user.id);
  return res.json({ ok: true, proposal: full });
});

// --- Public proposal view (no auth, public_id only, no user data leaked) ---
app.get('/api/public/proposals/:public_id', (req, res) => {
  const pub = cleanStr(req.params.public_id, 100);
  const p = db.prepare('SELECT * FROM proposals WHERE public_id = ?').get(pub);
  if (!p) return res.status(404).json({ error: 'Not found' });
  const tiers = db.prepare('SELECT * FROM proposal_tiers WHERE proposal_id = ? ORDER BY sort_order ASC').all(p.id);
  const fullTiers = tiers.map(t => {
    const items = db.prepare('SELECT description, qty, price, is_addon FROM proposal_items WHERE tier_id = ? ORDER BY sort_order ASC').all(t.id);
    return { name: t.name, items };
  });
  const totals = proposalTotals({ tiers: fullTiers, discount_pct: p.discount_pct });
  return res.json({
    proposal: {
      public_id: p.public_id,
      client_name: p.client_name,
      title: p.title,
      project_type: p.project_type,
      expiry: p.expiry,
      deposit_pct: p.deposit_pct,
      discount_pct: p.discount_pct,
      terms: p.terms,
      status: p.status,
      tiers: fullTiers,
      totals,
    },
  });
});

// --- Dashboard ---
app.get('/api/dashboard', requireAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM proposals WHERE user_id = ?').all(req.user.id);
  const byStatus = {};
  for (const s of STATUSES) byStatus[s] = 0;
  let acceptedTotal = 0;
  let acceptedCount = 0;
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
    if (r.status === 'accepted') {
      const full = loadProposalFull(r.id, req.user.id);
      const std = full.totals.tiers.find(t => t.name === 'Standard');
      if (std) { acceptedTotal += std.total; acceptedCount += 1; }
    }
  }
  const decided = (byStatus.accepted || 0) + (byStatus.lost || 0);
  const winRate = decided > 0 ? Math.round((byStatus.accepted / decided) * 100) : 0;
  const avgDeal = acceptedCount > 0 ? Math.round((acceptedTotal / acceptedCount) * 100) / 100 : 0;
  // Est. time saved: 5 hrs per proposal that went through qualify+build vs manual, illustrative.
  const estTimeSavedHrs = rows.length * 3;
  return res.json({ byStatus, total: rows.length, winRate, avgDeal, acceptedCount, estTimeSavedHrs });
});

// --- Public HTML page for /p/:public_id ---
app.get('/p/:public_id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'public.html'));
});

// --- Health ---
app.get('/api/health', (req, res) => res.json({ ok: true }));

// --- Error handler ---
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Server error:', err && err.message);
  res.status(500).json({ error: 'Server error' });
});

function start(port) {
  const p = port || process.env.PORT || 3000;
  const server = app.listen(p, () => {
    console.log(`QuotePilot listening on http://localhost:${p}`);
  });
  return server;
}

if (require.main === module) start();

module.exports = { app, start, clearAuthRateLimit, db };
