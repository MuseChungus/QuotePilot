const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const { scoreQualification, proposalTotals } = require('../src/scoring');
const { TEMPLATES } = require('../src/templates');

test('qualify scoring — 6 cases', () => {
  const cases = [
    [{ budget_range: '$3-7k', timeline: '1-3 months', scope_notes: 'Rebuild 8-page site with CMS, SEO, and online ordering page. Full detail here.' }, 'Green'],
    [{ budget_range: '<$1k', timeline: 'ASAP', scope_notes: '' }, 'Red'],
    [{ budget_range: 'Not sure', timeline: '2-4 weeks', scope_notes: 'Need a new site soon, about 5 pages.' }, 'Yellow'],
    [{ budget_range: '$1-3k', timeline: '2-4 weeks', scope_notes: 'One landing page with clear copy, form, and mobile layout, plus thank-you page.' }, 'Green'],
    [{ budget_range: '$1-3k', timeline: 'Not sure', scope_notes: 'Small fix' }, 'Yellow'],
    [{ budget_range: '$7k+', timeline: '1-3 months', scope_notes: 'Full HubSpot setup with pipelines, forms, automation, and training for the team.' }, 'Green'],
  ];
  for (const [input, band] of cases) {
    const r = scoreQualification(input);
    assert.equal(r.band, band, JSON.stringify(input) + ' got ' + r.band);
  }
});

test('template totals exact', () => {
  const expected = {
    'website-rebuild': [2500, 4800, 8500],
    'landing-page': [900, 1800, 3200],
    'seo-cro-fix': [1200, 2400, 4200],
    'hubspot-setup': [2000, 3800, 6500],
    'retainer': [800, 1500, 2800],
  };
  for (const t of TEMPLATES) {
    const totals = proposalTotals({ tiers: t.tiers, discount_pct: 0 });
    const vals = totals.tiers.map(x => x.total);
    assert.deepEqual(vals, expected[t.id], t.id);
  }
});

test('discount math', () => {
  const totals = proposalTotals({ tiers: [{ name: 'Standard', items: [{ qty: 2, price: 500 }, { qty: 1, price: 200 }] }], discount_pct: 10 });
  assert.equal(totals.tiers[0].total, 1080);
});

let server; let base; let tmpDir;
before(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'qp-test-'));
  process.env.DATABASE_PATH = path.join(tmpDir, 'test.db');
  process.env.PORT = '0';
  // fresh DB: need to clear cached db module
  delete require.cache[require.resolve('../src/db')];
  delete require.cache[require.resolve('../src/server')];
  const { start } = require('../src/server');
  server = start(0);
  await new Promise(r => server.on('listening', r));
  const addr = server.address();
  base = `http://127.0.0.1:${addr.port}`;
});

after(() => { if (server) server.close(); });

async function signup(email, pw) {
  const r = await fetch(base + '/api/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: pw }) });
  const cookie = r.headers.get('set-cookie');
  const j = await r.json();
  return { r, cookie, j };
}

test('auth + isolation: user B cannot access user A proposal', async () => {
  const a = await signup('a@test.local', 'Password123!');
  assert.equal(a.r.status, 200);
  const cookieA = a.cookie.split(';')[0];
  const b = await signup('b@test.local', 'Password123!');
  assert.equal(b.r.status, 200);
  const cookieB = b.cookie.split(';')[0];

  // A creates proposal
  const create = await fetch(base + '/api/proposals', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookieA },
    body: JSON.stringify({
      client_name: 'Acme', title: 'Website rebuild — Acme', project_type: 'Website rebuild',
      tiers: [
        { name: 'Essential', items: [{ description: 'X', qty: 1, price: 100 }] },
        { name: 'Standard', items: [{ description: 'Y', qty: 1, price: 200 }] },
        { name: 'Complete', items: [{ description: 'Z', qty: 1, price: 300 }] },
      ],
    }),
  });
  assert.equal(create.status, 200);
  const created = await create.json();
  const pid = created.proposal.id;
  const pub = created.proposal.public_id;

  // B tries to fetch A's proposal by id -> 404
  const bGet = await fetch(base + '/api/proposals/' + pid, { headers: { Cookie: cookieB } });
  assert.equal(bGet.status, 404);

  // Public view works without auth
  const pubGet = await fetch(base + '/api/public/proposals/' + pub);
  assert.equal(pubGet.status, 200);
  const pubJson = await pubGet.json();
  assert.equal(pubJson.proposal.title, 'Website rebuild — Acme');
  assert.ok(!('user_id' in pubJson.proposal));

  // Unauthenticated API -> 401
  const unauth = await fetch(base + '/api/proposals');
  assert.equal(unauth.status, 401);
});

test('qualify endpoint validates + scores', async () => {
  const a = await signup('q@test.local', 'Password123!');
  const cookie = a.cookie.split(';')[0];
  const r = await fetch(base + '/api/qualify', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ client_name: 'Test Co', project_type: 'Landing page', budget_range: '$3-7k', timeline: '1-3 months', scope_notes: 'Landing page with form, copy, mobile, and thank-you page. Full detail.' }),
  });
  assert.equal(r.status, 200);
  const j = await r.json();
  assert.equal(j.qualification.band, 'Green');
});
