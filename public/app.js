let templates = [];
let tiersState = [
  { name: 'Essential', items: [{ description: '', qty: 1, price: 0 }] },
  { name: 'Standard', items: [{ description: '', qty: 1, price: 0 }] },
  { name: 'Complete', items: [{ description: '', qty: 1, price: 0 }] },
];

function showMsg(html, cls='success'){ const m=document.getElementById('msg'); m.innerHTML=`<div class="${cls}">${html}</div>`; }
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

document.querySelectorAll('[data-tab]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('[data-tab]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    for(const id of ['auth','qualify','build','pipeline','dashboard']){
      document.getElementById('tab-'+id).classList.toggle('hidden', id!==btn.dataset.tab);
    }
    if(btn.dataset.tab==='pipeline') loadPipeline();
    if(btn.dataset.tab==='dashboard') loadDashboard();
    if(btn.dataset.tab==='qualify') loadQual();
  });
});
document.querySelectorAll('[data-copy]').forEach(b=>{
  b.addEventListener('click', async ()=>{
    const txt=document.getElementById(b.dataset.copy).textContent;
    try{ await navigator.clipboard.writeText(txt); showMsg('Copied.'); }catch{ showMsg('Copy failed — select the text manually.', 'error'); }
  });
});

async function refreshMe(){
  const r=await fetch('/api/auth/me'); const meEl=document.getElementById('meLine');
  const links=document.getElementById('authLinks');
  if(r.ok){ const {user}=await r.json(); meEl.textContent=`Signed in as ${user.email}`; links.textContent=user.email; }
  else { meEl.textContent='Not signed in.'; links.textContent=''; }
}
async function postJSON(url, body){
  const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(j.error||'Request failed');
  return j;
}
document.getElementById('signupBtn').onclick=async()=>{
  try{ await postJSON('/api/auth/signup',{email:document.getElementById('email').value,password:document.getElementById('password').value}); showMsg('Account created.'); await refreshMe(); }
  catch(e){ showMsg(esc(e.message),'error'); }
};
document.getElementById('loginBtn').onclick=async()=>{
  try{ await postJSON('/api/auth/login',{email:document.getElementById('email').value,password:document.getElementById('password').value}); showMsg('Logged in.'); await refreshMe(); }
  catch(e){ showMsg(esc(e.message),'error'); }
};
document.getElementById('logoutBtn').onclick=async()=>{
  await fetch('/api/auth/logout',{method:'POST'}); showMsg('Logged out.'); await refreshMe();
};

document.getElementById('qualifyBtn').onclick=async()=>{
  try{
    const body={client_name:document.getElementById('qClient').value,client_email:document.getElementById('qEmail').value,project_type:document.getElementById('qType').value,budget_range:document.getElementById('qBudget').value,timeline:document.getElementById('qTimeline').value,scope_notes:document.getElementById('qScope').value};
    const {qualification:q}=await postJSON('/api/qualify',body);
    document.getElementById('qualResult').innerHTML=`<div class="card"><span class="badge ${q.band}">${q.band} — ${q.score}/10</span><ul>${q.reasons.map(r=>`<li>${esc(r)}</li>`).join('')}</ul>${q.band==='Red'?`<div class="notice">Polite decline: Thanks for sharing your budget and timeline. This looks like a smaller scope than I can take on well right now.</div>`:''}</div>`;
    loadQual();
  }catch(e){ showMsg(esc(e.message),'error'); }
};
async function loadQual(){
  const r=await fetch('/api/qualify'); if(!r.ok) return;
  const {qualifications}=await r.json();
  document.getElementById('qualList').innerHTML=qualifications.length?qualifications.slice(0,10).map(q=>`<div class="card"><strong>${esc(q.client_name)}</strong> — <span class="badge ${q.band}">${q.band} ${q.score}/10</span><div class="muted small">${esc(q.project_type)} • ${esc(q.budget_range)} • ${esc(q.timeline)}</div></div>`).join(''):'No qualifications yet.';
}

function renderTiers(){
  const wrap=document.getElementById('tiers'); wrap.innerHTML='';
  const discount=Number(document.getElementById('pDiscount').value||0);
  tiersState.forEach((tier,ti)=>{
    let sub=0; tier.items.forEach(it=>sub+=(Number(it.qty)||0)*(Number(it.price)||0));
    const total=sub*(1-discount/100);
    const div=document.createElement('div'); div.className='tier';
    div.innerHTML=`<h3>${esc(tier.name)} — $${total.toFixed(2)}</h3>`;
    tier.items.forEach((it,ii)=>{
      const row=document.createElement('div'); row.className='row';
      row.innerHTML=`<input aria-label="Item description" value="${esc(it.description)}" placeholder="Line item"><input class="narrow" aria-label="Qty" type="number" value="${it.qty}" min="0" step="0.5"><input class="narrow" aria-label="Price" type="number" value="${it.price}" min="0" step="1"><button class="btn small secondary" type="button">Remove</button>`;
      const [desc,qty,price,rm]=row.children;
      desc.oninput=()=>tiersState[ti].items[ii].description=desc.value;
      qty.oninput=()=>{tiersState[ti].items[ii].qty=Number(qty.value); renderTiers();};
      price.oninput=()=>{tiersState[ti].items[ii].price=Number(price.value); renderTiers();};
      rm.onclick=()=>{tiersState[ti].items.splice(ii,1); if(!tiersState[ti].items.length) tiersState[ti].items.push({description:'',qty:1,price:0}); renderTiers();};
      div.appendChild(row);
    });
    const add=document.createElement('button'); add.className='btn small secondary'; add.textContent='+ Add item'; add.onclick=()=>{tiersState[ti].items.push({description:'',qty:1,price:0}); renderTiers();};
    div.appendChild(add); wrap.appendChild(div);
  });
}
document.getElementById('pDiscount').addEventListener('input', renderTiers);

async function loadTemplates(){
  const r=await fetch('/api/templates'); if(!r.ok) return;
  const {templates:t}=await r.json(); templates=t;
  const wrap=document.getElementById('templateBtns'); wrap.innerHTML='';
  t.forEach(tpl=>{
    const b=document.createElement('button'); b.textContent=tpl.name;
    b.onclick=()=>{
      tiersState=JSON.parse(JSON.stringify(tpl.tiers));
      document.getElementById('pType').value=tpl.project_type;
      document.getElementById('pTitle').value=tpl.name+' — Client';
      renderTiers(); showMsg(`Loaded template: ${esc(tpl.name)}`);
    };
    wrap.appendChild(b);
  });
}

document.getElementById('saveProposalBtn').onclick=async()=>{
  try{
    const body={client_name:document.getElementById('pClient').value,client_email:document.getElementById('pEmail').value,title:document.getElementById('pTitle').value,project_type:document.getElementById('pType').value,expiry:document.getElementById('pExpiry').value,deposit_pct:Number(document.getElementById('pDeposit').value),discount_pct:Number(document.getElementById('pDiscount').value),terms:document.getElementById('pTerms').value,tiers:tiersState};
    const {proposal:p}=await postJSON('/api/proposals',body);
    const link=`${location.origin}/p/${p.public_id}`;
    document.getElementById('proposalResult').innerHTML=`<div class="card"><strong>Saved.</strong> Share link: <a href="${link}">${link}</a><div style="margin-top:8px"><button class="btn small" onclick="navigator.clipboard.writeText('${link}')">Copy link</button> <button class="btn small secondary" onclick="window.print()">Print / PDF</button></div><div class="muted small">Totals: ${p.totals.tiers.map(t=>`${esc(t.name)} $${t.total}`).join(' • ')}</div></div>`;
    loadPipeline();
  }catch(e){ showMsg(esc(e.message),'error'); }
};

async function loadPipeline(){
  const status = (document.getElementById('pipelineStatus') || {}).value || 'all';
  const q = (document.getElementById('pipelineSearch') || {}).value || '';
  const qs = new URLSearchParams();
  if (status && status !== 'all') qs.set('status', status);
  if (q.trim()) qs.set('q', q.trim());
  const query = qs.toString() ? ('?' + qs.toString()) : '';
  const r=await fetch('/api/proposals' + query); if(!r.ok){document.getElementById('pipelineList').textContent='Sign in to see yours.'; return;}
  const {proposals}=await r.json();
  if(!proposals.length){document.getElementById('pipelineList').textContent='No proposals match.'; return;}
  document.getElementById('pipelineList').innerHTML=proposals.map(p=>`<div class="card"><strong>${esc(p.title)}</strong> — ${esc(p.client_name)}<div class="muted small">Status: ${esc(p.status)} • <a href="/p/${p.public_id}" target="_blank" rel="noopener">Public link</a></div><div>Totals: ${p.totals.tiers.map(t=>`${esc(t.name)} $${t.total}`).join(' • ')}</div><label>Status</label><select data-status="${p.id}"><option value="draft">draft</option><option value="sent">sent</option><option value="viewed">viewed</option><option value="accepted">accepted</option><option value="lost">lost</option></select> <button class="btn small secondary" data-duplicate="${p.id}">Duplicate</button></div>`).join('');
  document.querySelectorAll('[data-status]').forEach(sel=>{
    const card=sel.closest('.card'); const pid=sel.dataset.status;
    // set current
    const cur=proposals.find(x=>String(x.id)===String(pid));
    if(cur) sel.value=cur.status;
    sel.onchange=async()=>{
      await fetch('/api/proposals/'+pid,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:sel.value})});
      showMsg('Status updated.'); loadDashboard();
    };
  });
  document.querySelectorAll('[data-duplicate]').forEach(btn=>{
    btn.onclick=async()=>{
      const r=await fetch('/api/proposals/'+btn.dataset.duplicate+'/duplicate',{method:'POST'});
      if(r.ok){ showMsg('Proposal duplicated as Draft.'); loadPipeline(); loadDashboard(); }
      else showMsg('Duplicate failed.', 'error');
    };
  });
}
document.getElementById('pipelineFilterBtn').onclick=()=>loadPipeline();
document.getElementById('pipelineSearch').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); loadPipeline(); } });
async function loadDashboard(){
  const r=await fetch('/api/dashboard'); if(!r.ok) return;
  const d=await r.json();
  document.getElementById('dash').innerHTML=`<div>Total: <strong>${d.total}</strong> • Win rate: <strong>${d.winRate}%</strong> • Avg deal (Standard, accepted): <strong>$${d.avgDeal}</strong></div><div>By status: ${Object.entries(d.byStatus).map(([k,v])=>`${k} ${v}`).join(' • ')}</div><div>Est. time saved: <strong>${d.estTimeSavedHrs} hrs</strong> (illustrative, 3 hrs per proposal vs manual)</div>`;
}

refreshMe(); loadTemplates(); renderTiers(); loadQual();
