// QuotePilot — Qualify-first proposals for freelancers. Static-only, localStorage, no backend.
(function(){
'use strict';

function fmt(n){ return '$' + Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0, maximumFractionDigits:0}); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function uid(){ return 'qp_' + Date.now().toString(36) + Math.random().toString(36).slice(2,7); }

// ---------- Templates ----------
var TEMPLATES = {
  'Website rebuild': {
    title: 'Website rebuild — proposal',
    tiers: [
      {name:'Essential', featured:false, items:[{desc:'5-page website (Home, About, Services, Contact + 1 extra)',qty:1,price:1800},{desc:'Mobile-responsive + SEO basics (title, meta, sitemap)',qty:1,price:500},{desc:'Launch + QA',qty:1,price:200}]},
      {name:'Standard', featured:true, items:[{desc:'8-page website + booking / quote form',qty:1,price:3000},{desc:'Booking / form + CRM integration',qty:1,price:1000},{desc:'Copy polish (up to 8 pages)',qty:1,price:500},{desc:'SEO setup + analytics',qty:1,price:300}]},
      {name:'Complete', featured:false, items:[{desc:'12-page website + booking / e-commerce',qty:1,price:5000},{desc:'Booking / e-commerce + integrations',qty:1,price:1800},{desc:'Copy + brand polish',qty:1,price:1000},{desc:'CRO + analytics + 30-day post-launch support',qty:1,price:700}]}
    ],
    addons: [{desc:'Logo refresh',price:600},{desc:'Blog setup (4 posts)',price:800}]
  },
  'Landing page': {
    title: 'Landing page — proposal',
    tiers: [
      {name:'Essential', featured:false, items:[{desc:'1 landing page (design + build)',qty:1,price:700},{desc:'Lead form + thank-you page',qty:1,price:200}]},
      {name:'Standard', featured:true, items:[{desc:'1 landing page (design + build)',qty:1,price:1100},{desc:'Copy polish',qty:1,price:400},{desc:'Analytics + conversion tracking',qty:1,price:300}]},
      {name:'Complete', featured:false, items:[{desc:'1 landing page (design + build)',qty:1,price:1600},{desc:'Copywriting (full page)',qty:1,price:700},{desc:'A/B test setup (2 variants)',qty:1,price:500},{desc:'Animation / video embed',qty:1,price:400}]}
    ],
    addons: [{desc:'Extra variant',price:400},{desc:'Email follow-up sequence (3 emails)',price:500}]
  },
  'SEO / CRO audit fix': {
    title: 'SEO / CRO audit fix — proposal',
    tiers: [
      {name:'Essential', featured:false, items:[{desc:'Full site audit (SEO + CRO + local)',qty:1,price:700},{desc:'Top 5 fixes implemented',qty:1,price:500}]},
      {name:'Standard', featured:true, items:[{desc:'Full site audit',qty:1,price:800},{desc:'Top 12 fixes implemented',qty:1,price:1100},{desc:'CRO: CTA + form improvements',qty:1,price:500}]},
      {name:'Complete', featured:false, items:[{desc:'Full site audit + competitor check',qty:1,price:1000},{desc:'Top 20 fixes implemented',qty:1,price:2000},{desc:'CRO test (1 A/B test)',qty:1,price:800},{desc:'30-day reporting',qty:1,price:400}]}
    ],
    addons: [{desc:'Google Business Profile cleanup',price:300},{desc:'Monthly check-in (1 month)',price:400}]
  },
  'HubSpot setup': {
    title: 'HubSpot setup — proposal',
    tiers: [
      {name:'Essential', featured:false, items:[{desc:'HubSpot CRM setup (contacts, companies, pipelines)',qty:1,price:1200},{desc:'Forms + lead capture (up to 3 forms)',qty:1,price:500},{desc:'Data import (up to 1,000 contacts)',qty:1,price:300}]},
      {name:'Standard', featured:true, items:[{desc:'HubSpot CRM setup',qty:1,price:1800},{desc:'Pipelines + deal stages',qty:1,price:800},{desc:'Automation (2 workflows)',qty:1,price:700},{desc:'Team training (90 min)',qty:1,price:500}]},
      {name:'Complete', featured:false, items:[{desc:'HubSpot CRM + Marketing Hub setup',qty:1,price:2500},{desc:'Pipelines + custom properties',qty:1,price:1200},{desc:'Automation (5 workflows)',qty:1,price:1500},{desc:'Training (2 sessions) + docs',qty:1,price:800},{desc:'Website / calendar integrations',qty:1,price:500}]}
    ],
    addons: [{desc:'Extra workflow',price:250},{desc:'Reporting dashboard',price:500}]
  },
  'Monthly retainer': {
    title: 'Monthly retainer — proposal',
    tiers: [
      {name:'Essential', featured:false, items:[{desc:'Website updates (up to 4 hrs / mo)',qty:1,price:500},{desc:'Monthly reporting',qty:1,price:300}]},
      {name:'Standard', featured:true, items:[{desc:'Website updates (up to 10 hrs / mo)',qty:1,price:1000},{desc:'CRO improvements',qty:1,price:300},{desc:'Monthly reporting + call',qty:1,price:200}]},
      {name:'Complete', featured:false, items:[{desc:'Website updates (up to 20 hrs / mo)',qty:1,price:1800},{desc:'CRO tests (1 / mo)',qty:1,price:600},{desc:'Reporting + strategy call',qty:1,price:400}]}
    ],
    addons: [{desc:'Extra 5 hrs',price:450},{desc:'Priority same-week turnaround',price:300}]
  }
};

// ---------- Pure logic (testable) ----------
function scoreLead(input){
  var budget = input.budget || 'Not sure';
  var type = input.type || 'Custom';
  var timeline = input.timeline || '2–4 weeks';
  var notes = (input.notes || '').trim();
  var reasons = [];
  var score = 0;
  var budgetPoints = {'<$1k':1,'$1-3k':4,'$3-7k':5,'$7k+':6,'Not sure':2}[budget];
  if(budgetPoints==null) budgetPoints=2;
  score += budgetPoints;
  reasons.push('Budget ' + budget + ': +' + budgetPoints + ' pts');
  var timelinePoints = 2;
  if(timeline.indexOf('ASAP')===0) timelinePoints = 0;
  if(timeline==='No rush') timelinePoints = 1;
  score += timelinePoints;
  reasons.push('Timeline ' + timeline + ': +' + timelinePoints + ' pts');
  if(notes.length > 80){ score += 1; reasons.push('Clear scope notes: +1 pt'); }
  else if(notes.length===0){ score -= 1; reasons.push('No scope notes: -1 pt — ask what they need before pricing'); }
  else { reasons.push('Some scope notes: +0 pts — confirm details on a call'); }
  // Budget / scope mismatch penalty
  var isLow = (budget==='< $1k');
  if(isLow && type!=='Landing page'){
    score -= 2; reasons.push('Budget under $1k for ' + type + ': -2 pts — likely too low for quality work');
  }
  if(budget==='$1-3k' && (type==='Website rebuild' || type==='HubSpot setup')){
    score -= 1; reasons.push('Budget $1–3k is tight for ' + type + ': -1 pt — clarify scope or recommend a smaller phase');
  }
  if(budget==='Not sure'){
    reasons.push('Budget not stated: clarify on a 10-min call before building a full proposal');
  }
  if(timeline.indexOf('ASAP')===0 && isLow){
    score -= 1; reasons.push('Rush + low budget: -1 pt — rush work should cost more, not less');
  }
  score = Math.max(0, Math.min(10, score));
  var band = score >= 7 ? 'Green' : (score >= 4 ? 'Yellow' : 'Red');
  return {score:score, band:band, reasons:reasons};
}
function calcTierTotal(tier){
  return (tier.items||[]).reduce(function(s,it){ return s + (Number(it.qty)||0)*(Number(it.price)||0); }, 0);
}
function calcProposalTotals(proposal){
  var addonsTotal = (proposal.addons||[]).reduce(function(s,a){ return s + (Number(a.price)||0); }, 0);
  var discountPct = Number(proposal.discount)||0;
  var tiers = (proposal.tiers||[]).map(function(t){
    var sub = calcTierTotal(t);
    var withAddons = sub + addonsTotal;
    var total = Math.round(withAddons * (1 - discountPct/100));
    return {name:t.name, subtotal:sub, addonsTotal:addonsTotal, total:total};
  });
  return {tiers:tiers, addonsTotal:addonsTotal, discountPct:discountPct};
}
function encodeProposal(obj){
  var json = JSON.stringify(obj);
  var b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, function(m,p){ return String.fromCharCode(parseInt(p,16)); }));
  return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeProposal(str){
  var b64 = str.replace(/-/g,'+').replace(/_/g,'/');
  while(b64.length % 4) b64 += '=';
  var bin = atob(b64);
  var pct = '';
  for(var i=0;i<bin.length;i++){ var h = bin.charCodeAt(i).toString(16); pct += '%' + ('00'+h).slice(-2); }
  return JSON.parse(decodeURIComponent(pct));
}
function buildDecline(client, budget, type){
  var name = client ? client.split(' ')[0] : 'there';
  return 'Hi ' + name + ' — Thanks for sharing details about your ' + type + '. Based on a budget around ' + budget + ', I don\'t think I\'m the right fit for this scope at a quality I\'d stand behind. If budget opens up, I\'m happy to revisit. Wishing you a great result with the project — Brandon';
}

// ---------- State ----------
var state = {
  qualify: null,
  proposal: null,
  pipeline: []
};
function defaultProposal(){
  return {
    client:'', email:'', title:'Website rebuild — proposal',
    expiry:'', deposit:50, discount:0,
    terms:'50% deposit to start, balance on launch. Price valid until expiry date above. One revision round included per tier. Extra revisions billed hourly.',
    templateName:'Website rebuild',
    tiers: JSON.parse(JSON.stringify(TEMPLATES['Website rebuild'].tiers)),
    addons: JSON.parse(JSON.stringify(TEMPLATES['Website rebuild'].addons))
  };
}
function loadTemplate(name){
  var t = TEMPLATES[name];
  if(!t) return;
  if(!state.proposal) state.proposal = defaultProposal();
  state.proposal.templateName = name;
  state.proposal.title = t.title;
  state.proposal.tiers = JSON.parse(JSON.stringify(t.tiers));
  state.proposal.addons = JSON.parse(JSON.stringify(t.addons));
  syncBuildInputs();
  renderTiers(); renderAddons(); renderTotals(); renderPreview();
}
function loadPipeline(){
  try{ state.pipeline = JSON.parse(localStorage.getItem('qp_pipeline')||'[]'); }catch(e){ state.pipeline=[]; }
}
function savePipeline(){ try{ localStorage.setItem('qp_pipeline', JSON.stringify(state.pipeline)); }catch(e){} }
function saveCurrentProposal(){
  try{ localStorage.setItem('qp_current', JSON.stringify(state.proposal)); }catch(e){}
}
function loadCurrentProposal(){
  try{ var raw = localStorage.getItem('qp_current'); if(raw) state.proposal = JSON.parse(raw); }catch(e){}
}

// ---------- Rendering ----------
function syncBuildInputs(){
  if(!state.proposal) return;
  var map = {pClient:'client', pEmail:'email', pTitle:'title', pExpiry:'expiry', pDeposit:'deposit', pDiscount:'discount', pTerms:'terms'};
  Object.keys(map).forEach(function(id){
    var el = document.getElementById(id);
    if(el) el.value = state.proposal[map[id]]==null?'':state.proposal[map[id]];
  });
}
function renderTiers(){
  var wrap = document.getElementById('tiersContainer');
  if(!wrap || !state.proposal) return;
  wrap.innerHTML = state.proposal.tiers.map(function(tier, ti){
    var itemsHtml = tier.items.map(function(it, ii){
      return '<div class="tier-item"><input data-tier="'+ti+'" data-item="'+ii+'" data-field="desc" value="'+esc(it.desc)+'"><input data-tier="'+ti+'" data-item="'+ii+'" data-field="qty" type="number" min="0" step="1" value="'+it.qty+'"><input data-tier="'+ti+'" data-item="'+ii+'" data-field="price" type="number" min="0" step="1" value="'+it.price+'"><button class="btn btn-ghost btn-sm" data-remove-item="'+ti+':'+ii+'" aria-label="Remove item">×</button></div>';
    }).join('');
    return '<div class="tier '+(tier.featured?'featured':'')+'"><h4>'+esc(tier.name)+(tier.featured?' ★ Best value':'')+'</h4>'+itemsHtml+'<button class="btn btn-secondary btn-sm" data-add-item="'+ti+'">+ Add line item</button><div class="tier-total"><span>Subtotal</span><span>'+fmt(calcTierTotal(tier))+'</span></div></div>';
  }).join('');
}
function renderAddons(){
  var wrap = document.getElementById('addonsContainer');
  if(!wrap || !state.proposal) return;
  wrap.innerHTML = state.proposal.addons.map(function(a, ai){
    return '<div class="addon-row"><input data-addon="'+ai+'" data-field="desc" value="'+esc(a.desc)+'"><input data-addon="'+ai+'" data-field="price" type="number" min="0" value="'+a.price+'"><button class="btn btn-ghost btn-sm" data-remove-addon="'+ai+'">×</button></div>';
  }).join('');
}
function renderTotals(){
  var box = document.getElementById('totalsBox');
  if(!box || !state.proposal) return;
  var totals = calcProposalTotals(state.proposal);
  var rows = totals.tiers.map(function(t){
    return '<div class="trow"><span>'+esc(t.name)+' — subtotal '+fmt(t.subtotal)+' + add-ons '+fmt(t.addonsTotal)+' − '+totals.discountPct+'% discount</span><strong>'+fmt(t.total)+'</strong></div>';
  }).join('');
  var standard = totals.tiers[1] || totals.tiers[0];
  var depositAmt = standard ? Math.round(standard.total * (Number(state.proposal.deposit)||0)/100) : 0;
  box.innerHTML = rows + '<div class="trow"><span>Add-ons total (applied to every tier)</span><strong>'+fmt(totals.addonsTotal)+'</strong></div><div class="trow total"><span>Standard total (most clients pick this)</span><span>'+fmt(standard?standard.total:0)+'</span></div><div class="trow"><span>Deposit due to start ('+(Number(state.proposal.deposit)||0)+'% of Standard)</span><span>'+fmt(depositAmt)+'</span></div>';
}
function renderPreview(){
  var el = document.getElementById('proposalPreview');
  var linkEl = document.getElementById('shareLink');
  if(!el || !state.proposal) return;
  var totals = calcProposalTotals(state.proposal);
  var rows = totals.tiers.map(function(t, i){
    var tier = state.proposal.tiers[i];
    var items = tier.items.map(function(it){ return '<li>'+esc(it.desc)+' — '+it.qty+' × '+fmt(it.price)+' = '+fmt((Number(it.qty)||0)*(Number(it.price)||0))+'</li>'; }).join('');
    return '<tr><td><strong>'+esc(t.name)+'</strong><ul style="margin:6px 0 0 16px;padding:0">'+items+'</ul></td><td>'+fmt(t.subtotal)+'</td><td><strong>'+fmt(t.total)+'</strong></td></tr>';
  }).join('');
  var addonsHtml = state.proposal.addons.length ? '<p><strong>Optional add-ons (included in totals above):</strong> '+ state.proposal.addons.map(function(a){ return esc(a.desc)+' '+fmt(a.price); }).join(' • ') +'</p>' : '<p class="muted">No add-ons.</p>';
  el.innerHTML = '<h3>'+esc(state.proposal.title)+'</h3><p><strong>Prepared for:</strong> '+esc(state.proposal.client||'—')+' &nbsp;•&nbsp; <strong>Expiry:</strong> '+esc(state.proposal.expiry||'—')+' &nbsp;•&nbsp; <strong>Deposit:</strong> '+(Number(state.proposal.deposit)||0)+'%</p><table><thead><tr><th>Tier</th><th>Subtotal</th><th>Total (with add-ons &amp; discount)</th></tr></thead><tbody>'+rows+'</tbody></table>'+addonsHtml+'<p><strong>Terms:</strong> '+esc(state.proposal.terms)+'</p>';
  if(linkEl){
    var payload = {v:1, client:state.proposal.client, title:state.proposal.title, expiry:state.proposal.expiry, deposit:state.proposal.deposit, discount:state.proposal.discount, terms:state.proposal.terms, tiers:state.proposal.tiers, addons:state.proposal.addons};
    var url = window.location.origin + window.location.pathname + '#p=' + encodeProposal(payload);
    // file:// has no origin — fall back to current href without hash
    if(window.location.protocol==='file:'){ url = window.location.href.split('#')[0] + '#p=' + encodeProposal(payload); }
    linkEl.value = url;
  }
}
function renderPipeline(){
  var wrap = document.getElementById('pipelineTableWrap');
  if(!wrap) return;
  var filter = document.getElementById('pipelineFilter');
  var f = filter ? filter.value : 'All';
  var rows = state.pipeline.filter(function(p){ return f==='All' || p.status===f; });
  if(!rows.length){ wrap.innerHTML = '<p class="muted">No proposals yet. Qualify a lead and save it to see it here.</p>'; }
  else {
    wrap.innerHTML = '<table><thead><tr><th>Client</th><th>Proposal</th><th>Budget</th><th>Score</th><th>Total (Standard)</th><th>Status</th><th>Follow-up</th><th></th></tr></thead><tbody>' + rows.map(function(p){
      return '<tr><td>'+esc(p.client)+'</td><td>'+esc(p.title)+'</td><td>'+esc(p.budget||'—')+'</td><td>'+esc(p.band||'—')+'</td><td>'+fmt(p.total||0)+'</td><td><select data-status="'+p.id+'"><option>Draft</option><option>Sent</option><option>Viewed</option><option>Accepted</option><option>Lost</option></select></td><td><input type="date" data-followup="'+p.id+'" value="'+esc(p.followUp||'')+'"></td><td><button class="btn btn-ghost btn-sm" data-load="'+p.id+'">Load</button> <button class="btn btn-ghost btn-sm" data-del="'+p.id+'">Delete</button></td></tr>';
    }).join('') + '</tbody></table>';
    // set select values
    rows.forEach(function(p){
      var sel = wrap.querySelector('select[data-status="'+p.id+'"]');
      if(sel) sel.value = p.status || 'Draft';
    });
  }
  updateDashboard();
}
function updateDashboard(){
  var total = state.pipeline.length;
  var accepted = state.pipeline.filter(function(p){ return p.status==='Accepted'; }).length;
  var decided = state.pipeline.filter(function(p){ return p.status==='Accepted' || p.status==='Lost'; }).length;
  var win = decided ? Math.round(accepted/decided*100) + '%' : '—';
  var avg = total ? Math.round(state.pipeline.reduce(function(s,p){ return s + (Number(p.total)||0); },0)/total) : 0;
  var saved = total * 3; // conservative: 3 hrs saved per proposal vs manual
  var els = {statTotal:'statTotal', statWin:'statWin', statAvg:'statAvg', statSaved:'statSaved'};
  if(document.getElementById('statTotal')) document.getElementById('statTotal').textContent = total;
  if(document.getElementById('statWin')) document.getElementById('statWin').textContent = win;
  if(document.getElementById('statAvg')) document.getElementById('statAvg').textContent = fmt(avg);
  if(document.getElementById('statSaved')) document.getElementById('statSaved').textContent = saved + 'h';
}
function showStep(name){
  document.querySelectorAll('.step-btn').forEach(function(b){ b.classList.toggle('active', b.getAttribute('data-step')===name); });
  ['qualify','build','send'].forEach(function(s){
    var panel = document.getElementById('panel-'+s);
    if(panel) panel.hidden = (s!==name);
  });
  if(name==='send'){ renderPreview(); renderPipeline(); }
  if(name==='build'){ renderTiers(); renderAddons(); renderTotals(); }
}
function copyText(text, btn, label){
  function done(){ if(btn){ var old = btn.textContent; btn.textContent = 'Copied ✓'; setTimeout(function(){ btn.textContent = old; }, 1500); } }
  if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(text).then(done).catch(function(){ fallback(); }); }
  else fallback();
  function fallback(){ var ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); done(); }catch(e){} document.body.removeChild(ta); }
}

// ---------- Share view ----------
function maybeShowShare(){
  var hash = window.location.hash || '';
  if(hash.indexOf('#p=')!==0) return false;
  var encoded = hash.slice(3);
  var data;
  try{ data = decodeProposal(encoded); }catch(e){ return false; }
  var shareView = document.getElementById('shareView');
  var shareProposal = document.getElementById('shareProposal');
  if(!shareView || !shareProposal) return false;
  document.querySelectorAll('header.topbar, main, footer.footer').forEach(function(el){ el.style.display='none'; });
  shareView.hidden = false;
  var totals = calcProposalTotals(data);
  var rows = totals.tiers.map(function(t,i){
    var tier = data.tiers[i];
    var items = tier.items.map(function(it){ return '<li>'+esc(it.desc)+' — '+it.qty+' × '+fmt(it.price)+'</li>'; }).join('');
    return '<div class="card" style="margin-bottom:10px"><h4>'+esc(t.name)+' — '+fmt(t.total)+'</h4><ul>'+items+'</ul></div>';
  }).join('');
  shareProposal.innerHTML = '<h1>'+esc(data.title||'Proposal')+'</h1><p><strong>Prepared for:</strong> '+esc(data.client||'—')+' • <strong>Valid until:</strong> '+esc(data.expiry||'—')+' • <strong>Deposit:</strong> '+(Number(data.deposit)||0)+'%</p>'+rows+'<p><strong>Terms:</strong> '+esc(data.terms||'')+'</p>';
  var acceptBtn = document.getElementById('shareAcceptBtn');
  if(acceptBtn){ acceptBtn.onclick = function(){ var subj = encodeURIComponent('Accepted: ' + (data.title||'Proposal')); window.location.href = 'mailto:?subject=' + subj + '&body=' + encodeURIComponent('Hi — I accept the proposal: ' + (data.title||'') + '. Please send next steps.'); }; }
  return true;
}

// ---------- Init ----------
function init(){
  if(maybeShowShare()) return;
  loadPipeline();
  loadCurrentProposal();
  if(!state.proposal) state.proposal = defaultProposal();
  // Default expiry: 14 days out
  if(!state.proposal.expiry){
    var d = new Date(); d.setDate(d.getDate()+14);
    state.proposal.expiry = d.toISOString().slice(0,10);
  }
  syncBuildInputs(); renderTiers(); renderAddons(); renderTotals(); renderPreview(); renderPipeline();

  // Stepper
  document.querySelectorAll('.step-btn').forEach(function(b){
    b.addEventListener('click', function(){ showStep(b.getAttribute('data-step')); });
  });
  // Template buttons (landing + build)
  document.querySelectorAll('[data-template]').forEach(function(btn){
    btn.addEventListener('click', function(){
      var name = btn.getAttribute('data-template');
      loadTemplate(name);
      showStep('build');
      document.getElementById('app').scrollIntoView({behavior:'smooth'});
    });
  });
  // Qualify form
  var qForm = document.getElementById('qualifyForm');
  if(qForm){
    qForm.addEventListener('submit', function(e){
      e.preventDefault();
      var input = {
        client: document.getElementById('qClient').value.trim(),
        email: document.getElementById('qEmail').value.trim(),
        type: document.getElementById('qType').value,
        budget: document.getElementById('qBudget').value,
        timeline: document.getElementById('qTimeline').value,
        notes: document.getElementById('qNotes').value
      };
      var res = scoreLead(input);
      state.qualify = {input:input, result:res};
      var box = document.getElementById('qualifyResult');
      box.hidden = false;
      box.className = 'qualify-result ' + res.band.toLowerCase();
      var bandLabel = res.band==='Green' ? 'Proceed — build a proposal' : res.band==='Yellow' ? 'Clarify budget on a 10-min call, then propose' : 'Decline politely — do not build a free proposal';
      box.innerHTML = '<h4>Score: '+res.score+'/10 — <span class="badge '+(res.band==='Green'?'green':'')+'">'+res.band+'</span> — '+bandLabel+'</h4><ul>' + res.reasons.map(function(r){ return '<li>'+esc(r)+'</li>'; }).join('') + '</ul>';
      var declineBox = document.getElementById('declineBox');
      var declineText = document.getElementById('declineText');
      if(res.band==='Red'){
        declineBox.hidden = false;
        declineText.textContent = buildDecline(input.client, input.budget, input.type);
      } else { declineBox.hidden = true; }
      // Prefill build
      if(!state.proposal) state.proposal = defaultProposal();
      state.proposal.client = input.client || state.proposal.client;
      state.proposal.email = input.email || state.proposal.email;
      loadTemplate(input.type==='Custom' ? 'Website rebuild' : input.type);
      state.proposal.client = input.client || state.proposal.client;
      state.proposal.email = input.email || state.proposal.email;
      syncBuildInputs(); renderPreview();
    });
  }
  var qClear = document.getElementById('qualifyClear');
  if(qClear) qClear.addEventListener('click', function(){
    document.getElementById('qualifyForm').reset();
    document.getElementById('qualifyResult').hidden = true;
    document.getElementById('declineBox').hidden = true;
    state.qualify = null;
  });
  var copyDecline = document.getElementById('copyDecline');
  if(copyDecline) copyDecline.addEventListener('click', function(){ copyText(document.getElementById('declineText').textContent, copyDecline); });
  var saveToPipeline = document.getElementById('saveToPipeline');
  if(saveToPipeline) saveToPipeline.addEventListener('click', function(){
    var q = state.qualify;
    var client = (q && q.input.client) || document.getElementById('qClient').value.trim() || state.proposal.client || 'Unnamed lead';
    var totals = calcProposalTotals(state.proposal);
    var standard = totals.tiers[1] || totals.tiers[0];
    state.pipeline.push({id:uid(), client:client, title:state.proposal.title, type:state.proposal.templateName, budget:q? q.input.budget : '', band:q? q.result.band : '', status:'Draft', followUp:'', created:new Date().toISOString().slice(0,10), total: standard ? standard.total : 0, email: state.proposal.email || ''});
    savePipeline(); renderPipeline(); saveCurrentProposal();
    showStep('build');
  });
  // Build inputs
  ['pClient','pEmail','pTitle','pExpiry','pDeposit','pDiscount','pTerms'].forEach(function(id){
    var el = document.getElementById(id);
    if(!el) return;
    el.addEventListener('input', function(){
      var key = {pClient:'client', pEmail:'email', pTitle:'title', pExpiry:'expiry', pDeposit:'deposit', pDiscount:'discount', pTerms:'terms'}[id];
      state.proposal[key] = (id==='pDeposit' || id==='pDiscount') ? Number(el.value)||0 : el.value;
      renderTotals(); renderPreview(); saveCurrentProposal();
    });
  });
  // Tier / addon delegation
  document.addEventListener('input', function(e){
    var t = e.target;
    if(t.hasAttribute('data-tier')){
      var ti = Number(t.getAttribute('data-tier')), ii = Number(t.getAttribute('data-item')), field = t.getAttribute('data-field');
      if(field==='desc') state.proposal.tiers[ti].items[ii].desc = t.value;
      if(field==='qty') state.proposal.tiers[ti].items[ii].qty = Number(t.value)||0;
      if(field==='price') state.proposal.tiers[ti].items[ii].price = Number(t.value)||0;
      renderTotals(); renderPreview(); saveCurrentProposal();
    }
    if(t.hasAttribute('data-addon')){
      var ai = Number(t.getAttribute('data-addon')), af = t.getAttribute('data-field');
      if(af==='desc') state.proposal.addons[ai].desc = t.value;
      if(af==='price') state.proposal.addons[ai].price = Number(t.value)||0;
      renderTotals(); renderPreview(); saveCurrentProposal();
    }
  });
  document.addEventListener('click', function(e){
    var addBtn = e.target.closest('[data-add-item]');
    if(addBtn){ var ti = Number(addBtn.getAttribute('data-add-item')); state.proposal.tiers[ti].items.push({desc:'New line item', qty:1, price:0}); renderTiers(); renderTotals(); renderPreview(); saveCurrentProposal(); return; }
    var remBtn = e.target.closest('[data-remove-item]');
    if(remBtn){ var parts = remBtn.getAttribute('data-remove-item').split(':'); state.proposal.tiers[Number(parts[0])].items.splice(Number(parts[1]),1); renderTiers(); renderTotals(); renderPreview(); saveCurrentProposal(); return; }
    var remAdd = e.target.closest('[data-remove-addon]');
    if(remAdd){ state.proposal.addons.splice(Number(remAdd.getAttribute('data-remove-addon')),1); renderAddons(); renderTotals(); renderPreview(); saveCurrentProposal(); return; }
    var copyTpl = e.target.closest('[data-copy-tpl]');
    if(copyTpl){ copyText(document.getElementById(copyTpl.getAttribute('data-copy-tpl')).textContent, copyTpl); return; }
    var checkout = e.target.closest('[data-checkout]');
    if(checkout){ alert('Checkout is not live in v1 — this button is a placeholder. No payment was collected. Pro / Agency checkout ships with the backend.'); return; }
  });
  var addAddon = document.getElementById('addAddon');
  if(addAddon) addAddon.addEventListener('click', function(){ state.proposal.addons.push({desc:'New add-on', price:0}); renderAddons(); renderTotals(); renderPreview(); saveCurrentProposal(); });
  var saveDraft = document.getElementById('saveDraft');
  if(saveDraft) saveDraft.addEventListener('click', function(){
    var totals = calcProposalTotals(state.proposal);
    var standard = totals.tiers[1] || totals.tiers[0];
    // Update existing draft for same client+title if present, else push
    var existing = state.pipeline.find(function(p){ return p.client===state.proposal.client && p.title===state.proposal.title && p.status==='Draft'; });
    if(existing){ existing.total = standard ? standard.total : 0; existing.email = state.proposal.email; }
    else { state.pipeline.push({id:uid(), client:state.proposal.client||'Unnamed', title:state.proposal.title, type:state.proposal.templateName, budget: state.qualify? state.qualify.input.budget : '', band: state.qualify? state.qualify.result.band : '', status:'Draft', followUp:'', created:new Date().toISOString().slice(0,10), total: standard? standard.total:0, email:state.proposal.email||''}); }
    savePipeline(); saveCurrentProposal(); renderPipeline(); alert('Draft saved to pipeline.');
  });
  var goToSend = document.getElementById('goToSend');
  if(goToSend) goToSend.addEventListener('click', function(){ renderPreview(); showStep('send'); });
  var copyShare = document.getElementById('copyShareLink');
  if(copyShare) copyShare.addEventListener('click', function(){ copyText(document.getElementById('shareLink').value, copyShare); });
  var copyIntro = document.getElementById('copyEmailIntro');
  if(copyIntro) copyIntro.addEventListener('click', function(){
    var totals = calcProposalTotals(state.proposal);
    var std = totals.tiers[1] || totals.tiers[0];
    var txt = 'Hi ' + (state.proposal.client ? state.proposal.client.split(' ')[0] : 'there') + ' —\n\nHere is the proposal for ' + state.proposal.title + '. I included 3 options so you can choose the fit:\n' +
      totals.tiers.map(function(t){ return '- ' + t.name + ': ' + fmt(t.total); }).join('\n') +
      '\n\nMost clients pick Standard (' + fmt(std?std.total:0) + ') because it is the best value. The price holds until ' + (state.proposal.expiry||'expiry date') + ', and we start with a ' + (Number(state.proposal.deposit)||0) + '% deposit.\n\nLink: ' + document.getElementById('shareLink').value + '\n\nHappy to walk through it in 10 minutes if helpful.\n\n— Brandon';
    copyText(txt, copyIntro);
  });
  var markSent = document.getElementById('markSent');
  if(markSent) markSent.addEventListener('click', function(){
    var entry = state.pipeline.find(function(p){ return p.client===state.proposal.client && p.title===state.proposal.title; });
    if(entry){ entry.status='Sent'; if(!entry.followUp){ var d=new Date(); d.setDate(d.getDate()+2); entry.followUp=d.toISOString().slice(0,10); } savePipeline(); renderPipeline(); alert('Marked as Sent. Follow-up set to ' + entry.followUp + '.'); }
    else { alert('Save a draft first, then mark as Sent.'); }
  });
  var filterEl = document.getElementById('pipelineFilter');
  if(filterEl) filterEl.addEventListener('change', renderPipeline);
  var exportBtn = document.getElementById('exportPipeline');
  if(exportBtn) exportBtn.addEventListener('click', function(){
    var csv = 'Client,Proposal,Type,Budget,Score,Total,Status,FollowUp,Created\n' + state.pipeline.map(function(p){ return [p.client,p.title,p.type,p.budget,p.band,p.total,p.status,p.followUp,p.created].map(function(v){ return '"' + String(v==null?'':v).replace(/"/g,'""') + '"'; }).join(','); }).join('\n');
    var blob = new Blob([csv], {type:'text/csv'});
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'quotepilot-pipeline.csv'; a.click(); URL.revokeObjectURL(a.href);
  });
  var clearBtn = document.getElementById('clearPipeline');
  if(clearBtn) clearBtn.addEventListener('click', function(){ if(confirm('Clear all pipeline entries?')){ state.pipeline=[]; savePipeline(); renderPipeline(); } });
  // Pipeline delegation (status / follow-up / load / delete)
  document.addEventListener('change', function(e){
    var t = e.target;
    if(t.hasAttribute('data-status')){
      var entry = state.pipeline.find(function(p){ return p.id===t.getAttribute('data-status'); });
      if(entry){ entry.status = t.value; savePipeline(); renderPipeline(); }
    }
    if(t.hasAttribute('data-followup')){
      var e2 = state.pipeline.find(function(p){ return p.id===t.getAttribute('data-followup'); });
      if(e2){ e2.followUp = t.value; savePipeline(); }
    }
  });
  document.addEventListener('click', function(e){
    var loadBtn = e.target.closest('[data-load]');
    if(loadBtn){
      var entry = state.pipeline.find(function(p){ return p.id===loadBtn.getAttribute('data-load'); });
      if(entry){ state.proposal.client = entry.client; state.proposal.title = entry.title; state.proposal.email = entry.email||''; syncBuildInputs(); renderPreview(); showStep('build'); }
      return;
    }
    var delBtn = e.target.closest('[data-del]');
    if(delBtn){
      state.pipeline = state.pipeline.filter(function(p){ return p.id!==delBtn.getAttribute('data-del'); });
      savePipeline(); renderPipeline();
    }
  });
}

if(typeof document !== 'undefined'){ document.addEventListener('DOMContentLoaded', init); }
if(typeof module !== 'undefined' && module.exports){ module.exports = {scoreLead:scoreLead, calcTierTotal:calcTierTotal, calcProposalTotals:calcProposalTotals, encodeProposal:encodeProposal, decodeProposal:decodeProposal, TEMPLATES:TEMPLATES, buildDecline:buildDecline}; }
})();
