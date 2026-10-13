const { getDb } = require('./db');
const { hashPassword, newPublicId } = require('./auth');
const { TEMPLATES } = require('./templates');

function seed() {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get('demo@quotepilot.local');
  if (existing) { console.log('Seed already present, skipping'); return; }
  const hash = hashPassword('DemoPass123!');
  const u = db.prepare('INSERT INTO users (email, password_hash) VALUES (?,?)').run('demo@quotepilot.local', hash);
  const uid = u.lastInsertRowid;
  const tpl = TEMPLATES[0];
  const pub = newPublicId();
  const p = db.prepare(`INSERT INTO proposals
    (user_id, public_id, client_name, client_email, title, project_type, expiry, deposit_pct, discount_pct, terms, status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(uid, pub, 'Demo Bakery', 'hello@demobakery.local', 'Website rebuild — Demo Bakery', 'Website rebuild', '2026-11-01', 50, 0, '50% deposit to start. Balance on launch.', 'sent');
  tpl.tiers.forEach((t, ti) => {
    const ti2 = db.prepare('INSERT INTO proposal_tiers (proposal_id, name, sort_order) VALUES (?,?,?)').run(p.lastInsertRowid, t.name, ti);
    t.items.forEach((it, ii) => {
      db.prepare('INSERT INTO proposal_items (tier_id, description, qty, price, sort_order) VALUES (?,?,?,?,?)').run(ti2.lastInsertRowid, it.description, it.qty, it.price, ii);
    });
  });
  db.prepare(`INSERT INTO qualifications (user_id, client_name, client_email, project_type, budget_range, timeline, scope_notes, score, band, reasons)
    VALUES (?,?,?,?,?,?,?,?,?,?)`).run(uid, 'Demo Bakery', 'hello@demobakery.local', 'Website rebuild', '$3-7k', '1-3 months', 'Rebuild 8-page site with CMS, SEO, and online ordering page.', 10, 'Green', JSON.stringify(['Budget $3-7k is a healthy range.', '1-3 month timeline allows proper scoping.', 'Scope is clearly described.']));
  console.log('Seeded demo@quotepilot.local / DemoPass123! — public_id', pub);
}
if (require.main === module) seed();
module.exports = { seed };
