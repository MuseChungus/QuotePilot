/**
 * Qualify scoring — pure logic, tested.
 * Budget (max 5) + Timeline (max 3) + Scope clarity (max 3), capped at 10.
 * Bands: 0-3 Red, 4-6 Yellow, 7-10 Green.
 */
function scoreQualification({ budget_range, timeline, scope_notes }) {
  let budgetPts = 0;
  let budgetReason = '';
  switch (budget_range) {
    case '<$1k': budgetPts = 0; budgetReason = 'Budget under $1k is below typical project minimums.'; break;
    case '$1-3k': budgetPts = 4; budgetReason = 'Budget $1-3k can work for a focused scope.'; break;
    case '$3-7k': budgetPts = 5; budgetReason = 'Budget $3-7k is a healthy range.'; break;
    case '$7k+': budgetPts = 5; budgetReason = 'Budget $7k+ is a strong fit.'; break;
    case 'Not sure': budgetPts = 1; budgetReason = 'Budget not shared yet — clarify on the call.'; break;
    default: budgetPts = 0; budgetReason = 'Budget not provided.'; break;
  }

  let timelinePts = 0;
  let timelineReason = '';
  switch (timeline) {
    case 'ASAP': timelinePts = 0; timelineReason = 'ASAP timeline often means rushed scope.'; break;
    case '2-4 weeks': timelinePts = 2; timelineReason = '2-4 week timeline is workable.'; break;
    case '1-3 months': timelinePts = 3; timelineReason = '1-3 month timeline allows proper scoping.'; break;
    case 'Flexible': timelinePts = 2; timelineReason = 'Flexible timeline is workable.'; break;
    case 'Not sure': timelinePts = 1; timelineReason = 'Timeline not shared yet.'; break;
    default: timelinePts = 0; timelineReason = 'Timeline not provided.'; break;
  }

  const notes = (scope_notes || '').trim();
  let scopePts = 0;
  let scopeReason = '';
  if (notes.length === 0) { scopePts = 0; scopeReason = 'No scope notes — ask what is included.'; }
  else if (notes.length < 20) { scopePts = 1; scopeReason = 'Scope is very brief — clarify deliverables.'; }
  else if (notes.length <= 100) { scopePts = 2; scopeReason = 'Scope has some detail.'; }
  else { scopePts = 3; scopeReason = 'Scope is clearly described.'; }

  const raw = budgetPts + timelinePts + scopePts;
  const score = Math.min(10, raw);
  const band = score <= 3 ? 'Red' : score <= 6 ? 'Yellow' : 'Green';
  const reasons = [budgetReason, timelineReason, scopeReason];
  return { score, band, reasons, breakdown: { budgetPts, timelinePts, scopePts } };
}

/** Proposal totals — pure logic, tested. */
function tierTotal(tier) {
  let subtotal = 0;
  for (const item of tier.items || []) {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    subtotal += qty * price;
  }
  return subtotal;
}

function proposalTotals(proposal) {
  const tiers = [];
  for (const tier of proposal.tiers || []) {
    const subtotal = tierTotal(tier);
    tiers.push({ name: tier.name, subtotal });
  }
  const discountPct = Number(proposal.discount_pct) || 0;
  const withDiscount = tiers.map(t => ({
    ...t,
    total: Math.round(t.subtotal * (1 - discountPct / 100) * 100) / 100,
  }));
  return { tiers: withDiscount, discount_pct: discountPct };
}

module.exports = { scoreQualification, tierTotal, proposalTotals };
