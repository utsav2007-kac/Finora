/* ── Net Worth Page ── */
Pages.NetWorth = (() => {

  function render() {
    const assets  = DB.getAssets();
    const liabs   = DB.getLiabilities();
    const totalA  = DB.getTotalAssets();
    const totalL  = DB.getTotalLiabilities();
    const nw      = DB.getNetWorth();
    const nwHist  = DB.getNetWorthHistory();

    document.getElementById('page-content').innerHTML = `
<div class="page nw-page">

  <!-- Summary cards -->
  <div class="nw-summary">
    <div class="nw-card">
      <div class="nw-label">Total Assets</div>
      <div class="nw-val green">${Utils.fmt(totalA)}</div>
    </div>
    <div class="nw-card">
      <div class="nw-label">Total Liabilities</div>
      <div class="nw-val red">${Utils.fmt(totalL)}</div>
    </div>
    <div class="nw-card" style="border:2px solid var(--accent)">
      <div class="nw-label">Net Worth</div>
      <div class="nw-val ${nw>=0?'green':'red'}">${Utils.fmt(nw)}</div>
    </div>
  </div>

  <!-- Historical Chart -->
  <div class="card" style="margin-bottom:24px">
    <div class="card-hdr">
      <span class="card-title">Net Worth History</span>
      <span class="card-subtitle">Apr – Sep 2026</span>
    </div>
    <div class="chart-container"><canvas id="nw-hist-chart"></canvas></div>
  </div>

  <!-- Assets & Liabilities -->
  <div class="nw-grid">
    <!-- Assets -->
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Assets</span>
        <button class="btn btn-sm btn-primary" id="add-asset-btn"><i data-lucide="plus"></i> Add</button>
      </div>
      <div id="assets-list"></div>
      <div style="border-top:2px solid var(--border);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;font-weight:700">
        <span>Total Assets</span>
        <span class="text-green">${Utils.fmt(totalA)}</span>
      </div>
    </div>

    <!-- Liabilities -->
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Liabilities</span>
        <button class="btn btn-sm btn-primary" id="add-liab-btn"><i data-lucide="plus"></i> Add</button>
      </div>
      <div id="liabs-list"></div>
      <div style="border-top:2px solid var(--border);margin-top:12px;padding-top:12px;display:flex;justify-content:space-between;font-weight:700">
        <span>Total Liabilities</span>
        <span class="text-red">${Utils.fmt(totalL)}</span>
      </div>
    </div>
  </div>

  <!-- Breakdown chart -->
  <div class="card" style="margin-top:24px">
    <div class="card-hdr"><span class="card-title">Asset Breakdown</span></div>
    <div class="chart-container sm"><canvas id="asset-chart"></canvas></div>
  </div>
</div>`;

    if (window.lucide) lucide.createIcons();
    renderAssets(assets);
    renderLiabs(liabs);
    buildHistChart(nwHist);
    buildAssetChart(assets);

    document.getElementById('add-asset-btn').addEventListener('click', () => openItemModal('asset', null));
    document.getElementById('add-liab-btn').addEventListener('click',  () => openItemModal('liab',  null));
  }

  function renderAssets(assets) {
    const el = document.getElementById('assets-list');
    if (!el) return;
    const TYPE_ICONS = { cash:'💰', investment:'📈', property:'🏠', other:'📦' };
    el.innerHTML = `<div style="display:flex;flex-direction:column">` +
      assets.map(a => `
        <div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);gap:10px">
          <span style="font-size:20px">${TYPE_ICONS[a.type]||'💼'}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${escHtml(a.name)}</div>
            <div style="font-size:11px;color:var(--text-3);text-transform:capitalize">${a.type}</div>
          </div>
          <strong class="text-green" style="font-size:14px">${Utils.fmt(a.value)}</strong>
          <div class="action-btns">
            <button class="action-btn edit-asset-btn" data-id="${a.id}" data-kind="asset">✏️</button>
            <button class="action-btn danger del-asset-btn" data-id="${a.id}" data-kind="asset">🗑️</button>
          </div>
        </div>`).join('') + '</div>';

    el.querySelectorAll('.edit-asset-btn').forEach(b => b.addEventListener('click', () => openItemModal('asset', b.dataset.id)));
    el.querySelectorAll('.del-asset-btn').forEach(b  => b.addEventListener('click', () => deleteItem('asset', b.dataset.id)));
  }

  function renderLiabs(liabs) {
    const el = document.getElementById('liabs-list');
    if (!el) return;
    const TYPE_ICONS = { 'credit-card':'💳', 'student-loan':'🎓', 'other-loan':'💸', mortgage:'🏠', other:'📦' };
    el.innerHTML = `<div style="display:flex;flex-direction:column">` +
      liabs.map(l => `
        <div style="display:flex;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);gap:10px">
          <span style="font-size:20px">${TYPE_ICONS[l.type]||'💸'}</span>
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600">${escHtml(l.name)}</div>
            <div style="font-size:11px;color:var(--text-3)">${l.type.replace('-',' ')}</div>
          </div>
          <strong class="text-red" style="font-size:14px">${Utils.fmt(l.value)}</strong>
          <div class="action-btns">
            <button class="action-btn edit-asset-btn" data-id="${l.id}" data-kind="liab">✏️</button>
            <button class="action-btn danger del-asset-btn" data-id="${l.id}" data-kind="liab">🗑️</button>
          </div>
        </div>`).join('') + '</div>';

    el.querySelectorAll('.edit-asset-btn').forEach(b => b.addEventListener('click', () => openItemModal('liab', b.dataset.id)));
    el.querySelectorAll('.del-asset-btn').forEach(b  => b.addEventListener('click', () => deleteItem('liab', b.dataset.id)));
  }

  function openItemModal(kind, id) {
    const isAsset = kind === 'asset';
    const list    = isAsset ? DB.getAssets() : DB.getLiabilities();
    const item    = id ? list.find(x=>x.id===id) : null;
    const typeOpts = isAsset
      ? ['cash','investment','property','other']
      : ['credit-card','student-loan','mortgage','other-loan','other'];

    Utils.openModal(item ? `Edit ${isAsset?'Asset':'Liability'}` : `Add ${isAsset?'Asset':'Liability'}`, `
      <div class="form-group">
        <label class="form-label">Name *</label>
        <input class="form-control" id="nm-name" value="${escHtml(item?.name||'')}" placeholder="e.g. SBI Savings Account" required />
      </div>
      <div class="form-group">
        <label class="form-label">Type *</label>
        <select class="form-control" id="nm-type">
          ${typeOpts.map(t=>`<option value="${t}" ${item?.type===t?'selected':''}>${t.replace('-',' ')}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Value (₹) *</label>
        <input class="form-control" id="nm-value" type="number" min="0" step="1" value="${item?.value||''}" placeholder="0" required />
      </div>
      <div class="modal-footer" style="padding:0;border:none;margin-top:8px">
        <button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="nm-save">Save</button>
      </div>
    `);
    document.getElementById('nm-save').addEventListener('click', () => saveItem(kind, id));
  }

  function saveItem(kind, id) {
    const name  = document.getElementById('nm-name').value.trim();
    const type  = document.getElementById('nm-type').value;
    const value = parseFloat(document.getElementById('nm-value').value);
    if (!name || isNaN(value)) { Utils.toast('Please fill all fields.', 'error'); return; }

    const isAsset = kind === 'asset';
    if (id) {
      if (isAsset) DB.saveAssets(DB.getAssets().map(a=>a.id===id?{...a,name,type,value}:a));
      else         DB.saveLiabilities(DB.getLiabilities().map(l=>l.id===id?{...l,name,type,value}:l));
      Utils.toast(`${isAsset?'Asset':'Liability'} updated.`);
    } else {
      const newItem = { id: DB.uid(), name, type, value };
      if (isAsset) DB.saveAssets([...DB.getAssets(), newItem]);
      else         DB.saveLiabilities([...DB.getLiabilities(), newItem]);
      Utils.toast(`${isAsset?'Asset':'Liability'} added.`);
    }
    Utils.closeModal(); render();
  }

  function deleteItem(kind, id) {
    const isAsset = kind === 'asset';
    const list  = isAsset ? DB.getAssets() : DB.getLiabilities();
    const item  = list.find(x=>x.id===id);
    Utils.confirm(`Delete ${isAsset?'Asset':'Liability'}`, `Delete "${item?.name}"?`, () => {
      if (isAsset) DB.saveAssets(list.filter(x=>x.id!==id));
      else         DB.saveLiabilities(list.filter(x=>x.id!==id));
      Utils.toast('Item deleted.', 'warning'); render();
    });
  }

  function buildHistChart(nwHist) {
    const theme = Utils.chartTheme();
    Utils.createChart('nw-hist-chart', {
      type: 'line',
      data: {
        labels: nwHist.map(d=>d.label),
        datasets: [{
          label:'Net Worth', data: nwHist.map(d=>d.value),
          borderColor:'#10B981', backgroundColor:'rgba(16,185,129,.1)',
          fill:true, tension:.4, pointRadius:5,
          pointBackgroundColor:'#10B981', borderWidth:2,
        }]
      },
      options: {
        responsive:true, maintainAspectRatio:false,
        plugins: { legend:{display:false}, tooltip:{callbacks:{label:ctx=>` ${Utils.fmt(ctx.raw)}`}} },
        scales: {
          x:{grid:{color:theme.grid},ticks:{color:theme.text}},
          y:{grid:{color:theme.grid},ticks:{color:theme.text,callback:v=>'₹'+Math.round(v/1000)+'K'}}
        }
      }
    });
  }

  function buildAssetChart(assets) {
    const TYPE_COLORS = { cash:'#10B981', investment:'#3B82F6', property:'#8B5CF6', other:'#94A3B8' };
    const grouped = {};
    assets.forEach(a=>{ grouped[a.type]=(grouped[a.type]||0)+a.value; });
    Utils.createChart('asset-chart', {
      type:'doughnut',
      data:{
        labels: Object.keys(grouped).map(k=>k.charAt(0).toUpperCase()+k.slice(1)),
        datasets:[{data:Object.values(grouped), backgroundColor:Object.keys(grouped).map(k=>TYPE_COLORS[k]||'#94A3B8'), borderWidth:2, borderColor:Utils.chartTheme().bg}]
      },
      options:{
        responsive:true, maintainAspectRatio:false, cutout:'60%',
        plugins:{legend:{position:'right',labels:{color:Utils.chartTheme().text,font:{size:12}}},
          tooltip:{callbacks:{label:ctx=>` ${Utils.fmt(ctx.raw)}`}}}
      }
    });
  }

  function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { render };
})();
