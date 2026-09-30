/* ── Budgets Page ── */
Pages.Budgets = (() => {
  let _month = DB.currentMonth();

  function render() {
    document.getElementById('page-content').innerHTML = `
<div class="page budgets-page">
  <div class="flex-between mb-16">
    <div class="flex-center gap-8">
      <input type="month" id="budget-month" class="filter-input" value="${_month}" />
      <span class="text-muted text-sm" id="bud-summary"></span>
    </div>
    <button class="btn btn-primary" id="add-bud-btn"><i data-lucide="plus"></i> Add Budget</button>
  </div>

  <!-- Budget overview chart -->
  <div class="card mb-16" style="margin-bottom:20px">
    <div class="card-hdr">
      <span class="card-title">Budget Overview</span>
      <span class="card-subtitle" id="bud-total-info"></span>
    </div>
    <div class="chart-container sm"><canvas id="bud-chart"></canvas></div>
  </div>

  <div class="budgets-grid" id="budgets-grid"></div>
</div>`;

    if (window.lucide) lucide.createIcons();
    renderPage();

    document.getElementById('budget-month').addEventListener('change', function() {
      _month = this.value;
      renderPage();
    });
    document.getElementById('add-bud-btn').addEventListener('click', () => openBudModal(null));
  }

  function renderPage() {
    const budgets  = DB.getBudgets().filter(b => b.month === _month);
    const monthTxns = DB.getMonthTransactions(_month);
    const cats = DB.getCategories();

    // Summary
    const totalBudget = budgets.reduce((s,b)=>s+b.amount,0);
    const totalSpent  = budgets.reduce((s,b) => {
      return s + monthTxns.filter(t=>t.category===b.category&&t.type==='expense').reduce((ss,t)=>ss+t.amount,0);
    }, 0);

    const sumEl = document.getElementById('bud-summary');
    if (sumEl) sumEl.textContent = `Total: ${Utils.fmt(totalSpent)} of ${Utils.fmt(totalBudget)} spent`;

    const infoEl = document.getElementById('bud-total-info');
    if (infoEl) infoEl.textContent = `${Utils.pct(totalSpent, totalBudget)}% of monthly budget used`;

    renderBudgetCards(budgets, monthTxns, cats);
    buildBudChart(budgets, monthTxns, cats);
  }

  function renderBudgetCards(budgets, monthTxns, cats) {
    const grid = document.getElementById('budgets-grid');
    if (!grid) return;

    if (!budgets.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div>
        <h3>No budgets for this month</h3>
        <p>Click "Add Budget" to set spending limits for your categories.</p>
        <button class="btn btn-primary mt-16" onclick="document.getElementById('add-bud-btn').click()">Add Budget</button>
      </div>`;
      return;
    }

    grid.innerHTML = budgets.map(b => {
      const cat   = cats.find(c=>c.id===b.category) || { name:'Other', color:'#94A3B8', icon:'📦' };
      const spent = monthTxns.filter(t=>t.category===b.category&&t.type==='expense').reduce((s,t)=>s+t.amount,0);
      const p     = Utils.pct(spent, b.amount);
      const rem   = b.amount - spent;
      const over  = rem < 0;
      return `<div class="budget-card">
        <div class="bud-header">
          <div class="bud-cat">
            <div class="bud-cat-icon" style="background:${cat.color}22">${cat.icon}</div>
            ${escHtml(cat.name)}
          </div>
          <div class="action-btns">
            <button class="action-btn edit-bud-btn" data-id="${b.id}" title="Edit">✏️</button>
            <button class="action-btn danger del-bud-btn" data-id="${b.id}" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="bud-spent" style="color:${over?'var(--danger)':'var(--text)'}">${Utils.fmt(spent)}</div>
        <div class="bud-amounts">
          <span>Budget: ${Utils.fmt(b.amount)}</span>
          <span class="${over?'text-red':'text-muted'}">${over?'Over by '+Utils.fmt(-rem):Utils.fmt(rem)+' left'}</span>
        </div>
        ${Utils.progressHTML(spent, b.amount)}
        <div style="text-align:right;font-size:11px;color:var(--text-3);margin-top:4px">${p}% used</div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.edit-bud-btn').forEach(b => b.addEventListener('click', () => openBudModal(b.dataset.id)));
    grid.querySelectorAll('.del-bud-btn').forEach(b => b.addEventListener('click', () => deleteBud(b.dataset.id)));
  }

  function buildBudChart(budgets, monthTxns, cats) {
    if (!budgets.length) return;
    const labels  = budgets.map(b => { const c=cats.find(x=>x.id===b.category); return c?c.icon+' '+c.name:'Other'; });
    const budAmt  = budgets.map(b => b.amount);
    const spent   = budgets.map(b => monthTxns.filter(t=>t.category===b.category&&t.type==='expense').reduce((s,t)=>s+t.amount,0));
    const colors  = budgets.map(b => { const c=cats.find(x=>x.id===b.category); return c?c.color:'#94A3B8'; });
    const theme   = Utils.chartTheme();

    Utils.createChart('bud-chart', {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label:'Budget', data: budAmt, backgroundColor: colors.map(c=>c+'44'), borderColor: colors, borderWidth:2, borderRadius:6 },
          { label:'Spent',  data: spent,  backgroundColor: colors.map(c=>c+'99'), borderRadius:6 },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: theme.text, font:{size:12} } },
          tooltip: { callbacks: { label: ctx => ` ${Utils.fmt(ctx.raw)}` } } },
        scales: {
          x: { grid:{color:theme.grid}, ticks:{color:theme.text} },
          y: { grid:{color:theme.grid}, ticks:{color:theme.text, callback:v=>'₹'+v.toLocaleString('en-IN')} }
        }
      }
    });
  }

  function openBudModal(id) {
    const b    = id ? DB.getBudgets().find(x=>x.id===id) : null;
    const cats = DB.getCategories().filter(c=>c.type==='expense'||c.type==='both');
    Utils.openModal(b ? 'Edit Budget' : 'Add Budget', `
      <div class="form-group">
        <label class="form-label">Category *</label>
        <select class="form-control" id="bm-cat" ${b?'disabled':''}>
          ${cats.map(c=>`<option value="${c.id}" ${b?.category===c.id?'selected':''}>${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Monthly Budget Amount (₹) *</label>
        <input class="form-control" id="bm-amount" type="number" min="1" value="${b?.amount||''}" placeholder="0" required />
      </div>
      <div class="modal-footer" style="padding:0;border:none;margin-top:8px">
        <button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="bm-save">Save Budget</button>
      </div>
    `);
    document.getElementById('bm-save').addEventListener('click', () => saveBud(id));
  }

  function saveBud(id) {
    const cat    = document.getElementById('bm-cat').value;
    const amount = parseFloat(document.getElementById('bm-amount').value);
    if (!cat || isNaN(amount) || amount <= 0) { Utils.toast('Please fill all fields.', 'error'); return; }

    DB.upsertBudget(cat, amount, _month);
    Utils.toast(id ? 'Budget updated.' : 'Budget added.', 'success');
    Utils.closeModal();
    renderPage();
  }

  function deleteBud(id) {
    Utils.confirm('Delete Budget', 'Remove this budget limit?', () => {
      const budgets = DB.getBudgets().filter(b=>b.id!==id);
      DB.saveBudgets(budgets);
      Utils.toast('Budget removed.', 'warning');
      renderPage();
    });
  }

  function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { render };
})();
