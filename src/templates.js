/**
 * 5 proposal templates. Totals are verified in tests.
 * Website rebuild: 2500 / 4800 / 8500
 * Landing page: 900 / 1800 / 3200
 * SEO/CRO fix: 1200 / 2400 / 4200
 * HubSpot setup: 2000 / 3800 / 6500
 * Retainer: 800 / 1500 / 2800 / mo
 */
const TEMPLATES = [
  {
    id: 'website-rebuild',
    name: 'Website rebuild',
    project_type: 'Website rebuild',
    tiers: [
      { name: 'Essential', items: [{ description: 'Homepage + 3 pages, mobile-responsive', qty: 1, price: 2500 }] },
      { name: 'Standard', items: [{ description: 'Homepage + 8 pages, CMS, basic SEO', qty: 1, price: 4800 }] },
      { name: 'Complete', items: [{ description: 'Homepage + 15 pages, CMS, SEO, CRO, analytics', qty: 1, price: 8500 }] },
    ],
  },
  {
    id: 'landing-page',
    name: 'Landing page',
    project_type: 'Landing page',
    tiers: [
      { name: 'Essential', items: [{ description: '1 landing page, copy polish, mobile', qty: 1, price: 900 }] },
      { name: 'Standard', items: [{ description: '1 landing page + A/B variant + forms', qty: 1, price: 1800 }] },
      { name: 'Complete', items: [{ description: '2 landing pages + CRO + analytics + follow-up', qty: 1, price: 3200 }] },
    ],
  },
  {
    id: 'seo-cro-fix',
    name: 'SEO / CRO audit fix',
    project_type: 'SEO/CRO audit fix',
    tiers: [
      { name: 'Essential', items: [{ description: 'Audit + top 10 fixes', qty: 1, price: 1200 }] },
      { name: 'Standard', items: [{ description: 'Audit + fixes + landing page tweaks', qty: 1, price: 2400 }] },
      { name: 'Complete', items: [{ description: 'Audit + full implementation + 30-day CRO', qty: 1, price: 4200 }] },
    ],
  },
  {
    id: 'hubspot-setup',
    name: 'HubSpot setup',
    project_type: 'HubSpot setup',
    tiers: [
      { name: 'Essential', items: [{ description: 'HubSpot CRM setup + 2 pipelines', qty: 1, price: 2000 }] },
      { name: 'Standard', items: [{ description: 'CRM + forms + email + reporting', qty: 1, price: 3800 }] },
      { name: 'Complete', items: [{ description: 'CRM + automation + integrations + training', qty: 1, price: 6500 }] },
    ],
  },
  {
    id: 'retainer',
    name: 'Monthly retainer',
    project_type: 'Retainer',
    tiers: [
      { name: 'Essential', items: [{ description: '8 hrs/mo, updates + fixes', qty: 1, price: 800 }] },
      { name: 'Standard', items: [{ description: '16 hrs/mo, updates + CRO + reporting', qty: 1, price: 1500 }] },
      { name: 'Complete', items: [{ description: '30 hrs/mo, dedicated support + strategy', qty: 1, price: 2800 }] },
    ],
  },
];

module.exports = { TEMPLATES };
