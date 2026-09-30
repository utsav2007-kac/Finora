/* ── Reports Page ── */
Pages.Reports = (() => {
  let _from = '2026-04-01';
  let _to   = '2026-09-30';

  function render() {
    document.getElementById('page-content').innerHTML = `
<div class="page reports-page">
  <div class="filters-bar">
    <label class="form-label" style="margin:0">Date Range:</label>
    <input type="date" class="filter-input" id="rpt-from" value="${_from}" />
    <span class="text-muted">to</span>
    <input type="date" class="filter-input" id="rpt-to" value="${_to}" />
    <button class="btn btn-ghost btn-sm" id="rpt-apply">Apply</button>
    <button class="btn btn-secondary btn-sm" id="rpt-export">
      <i data-lucide="download"></i> Export CSV
    </button>
  </div>

  <!-- Summary cards -->
  <div class="cf-stats" id="rpt-summary"></div>

  <!-- Charts -->
  <div class="dash-charts-row" style="margin-top:20px;margin-bottom:20px">
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Monthly Income vs Expenses</span>
      </div>
      <div class="chart-container"><canvas id="rpt-ie-chart"></canvas></div>
    </div>
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Spending by Category</span>
      </div>
      <div class="chart-container"><canvas id="rpt-cat-chart"></canvas></div>
    </div>
  </div>

  <!-- Category breakdown table -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-hdr"><span class="card-title">Category Breakdown</span></div>
    <div class="table-wrap" id="rpt-cat-table"></div>
  </div>

  <!-- Transaction list -->
  <div class="card">
    <div class="card-hdr">
      <span class="card-title">All Transactions</span>
      <span class="card-subtitle" id="rpt-count"></span>
    </div>
    <div class="table-wrap" id="rpt-txn-table"></div>
  </div>
</div>`;

    if (window.lucide) lucide.createIcons();
    renderReport();

    document.getElementById('rpt-apply').addEventListener('click', () => {
      _from = document.getElementById('rpt-from').value;
      _to   = document.getElementById('rpt-to').value;
      renderReport();
    });

    document.getElementById('rpt-from').addEventListener('change', function() { _from = this.value; renderReport(); });
    document.getElementById('rpt-to').addEventListener('change',   function() { _to   = this.value; renderReport(); });

    document.getElementById('rpt-export').addEventListener('click', exportCSV);
  }

  function getFilteredTxns() {
    return DB.getTransactions().filter(t => t.date >= _from && t.date <= _to);
  }

  function renderReport() {
    const txns   = getFilteredTxns();
    const income = DB.sumByType(txns, 'income');
    const expense= DB.sumByType(txns, 'expense');
    const net    = income - expense;
    const cats   = DB.getCategories();

    // Summary
    const sumEl = document.getElementById('rpt-summary');
    if (sumEl) sumEl.innerHTML = `
      <div class="summary-card accent"><div class="s-label">Total Income</div><div class="s-value">${Utils.fmt(income)}</div></div>
      <div class="summary-card danger"><div class="s-label">Total Expenses</div><div class="s-value">${Utils.fmt(expense)}</div></div>
      <div class="summary-card ${net>=0?'accent':'danger'}"><div class="s-label">Net Savings</div><div class="s-value">${Utils.fmt(net)}</div></div>
      <div class="summary-card"><div class="s-label">Transactions</div><div class="s-value">${txns.length}</div></div>`;

    const countEl = document.getElementById('rpt-count');
    if (countEl) countEl.textContent = `${txns.length} transactions`;

    // Monthly breakdown for chart
    const months = getMonthsInRange(_from, _to);
    const monthlyData = months.map(m=>{
      const mt = txns.filter(t=>t.date.startsWith(m));
      return { label:new Date(m+'-01').toLocaleDateString('en-IN',{month:'short',year:'2-digit'}),
        income:DB.sumByType(mt,'income'), expense:DB.sumByType(mt,'expense') };
    });

    // Category breakdown
    const catMap = {};
    txns.filter(t=>t.type==='expense').forEach(t=>{ catMap[t.category]=(catMap[t.category]||0)+t.amount; });
    const catData = Object.entries(catMap).map(([id,amt])=>{
      const cat = cats.find(c=>c.id===id)||{name:'Other',color:'#94A3B8',icon:'📦'};
      return { ...cat, amount:amt };
    }).sort((a,b)=>b.amount-a.amount);

    buildIEChart(monthlyData);
    buildCatChart(catData);
    renderCatTable(catData, expense);
    renderTxnTable(txns, cats);
  }

  function getMonthsInRange(from, to) {
    const result = [];
    const start = new Date(from.slice(0,7)+'-01');
    const end   = new Date(to.slice(0,7)+'-01');
    const cur   = new Date(start);
    while (cur <= end) {
      result.push(cur.toISOString().slice(0,7));
      cur.setMonth(cur.getMonth()+1);
    }
    return result;
  }

  function buildIEChart(monthlyData) {
    const theme = Utils.chartTheme();
    Utils.createChart('rpt-ie-chart', {
      type:'bar',
      data:{labels:monthlyData.map(d=>d.label),datasets:[
        {label:'Income',   data:monthlyData.map(d=>d.income),  backgroundColor:'rgba(16,185,129,.8)', borderRadius:5},
        {label:'Expenses', data:monthlyData.map(d=>d.expense), backgroundColor:'rgba(239,68,68,.75)', borderRadius:5},
      ]},
      options:{responsive:true,maintainAspectRatio:false,
        plugins:{legend:{labels:{color:theme.text}},tooltip:{callbacks:{label:ctx=>` ${Utils.fmt(ctx.raw)}`}}},
        scales:{x:{grid:{color:theme.grid},ticks:{color:theme.text}},y:{grid:{color:theme.grid},ticks:{color:theme.text,callback:v=>'₹'+Math.round(v/1000)+'K'}}}}
    });
  }

  function buildCatChart(catData) {
    const top = catData.slice(0,7);
    Utils.createChart('rpt-cat-chart', {
      type:'doughnut',
      data:{labels:top.map(c=>c.icon+' '+c.name),datasets:[{data:top.map(c=>c.amount),backgroundColor:top.map(c=>c.color),borderWidth:2,borderColor:Utils.chartTheme().bg}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'55%',
        plugins:{legend:{position:'bottom',labels:{color:Utils.chartTheme().text,boxWidth:10,font:{size:11}}},tooltip:{callbacks:{label:ctx=>` ${Utils.fmt(ctx.raw)}`}}}}
    });
  }

  function renderCatTable(catData, totalExpense) {
    const el = document.getElementById('rpt-cat-table');
    if (!el||!catData.length) { if(el) el.innerHTML='<div class="empty-state" style="padding:30px 0"><p>No expense data in range.</p></div>'; return; }
    el.innerHTML = `<table>
      <thead><tr><th>Category</th><th>Amount</th><th>% of Expenses</th><th>Transactions</th></tr></thead>
      <tbody>
        ${catData.map(c=>`<tr>
          <td><span style="margin-right:6px">${c.icon}</span><strong>${escHtml(c.name)}</strong></td>
          <td class="text-red font-semibold">${Utils.fmt(c.amount)}</td>
          <td>
            <div style="display:flex;align-items:center;gap:8px">
              <div class="progress-bar" style="width:100px">
                <div class="progress-fill" style="width:${Utils.pct(c.amount,totalExpense)}%;background:${c.color}"></div>
              </div>
              <span class="text-sm">${Utils.pct(c.amount,totalExpense)}%</span>
            </div>
          </td>
          <td class="text-muted">${getFilteredTxns().filter(t=>t.category===c.id&&t.type==='expense').length}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  }

  function renderTxnTable(txns, cats) {
    const el = document.getElementById('rpt-txn-table');
    if (!el) return;
    if (!txns.length) { el.innerHTML='<div class="empty-state" style="padding:30px 0"><p>No transactions in this range.</p></div>'; return; }
    el.innerHTML = `<table>
      <thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Account</th><th>Amount</th></tr></thead>
      <tbody>
        ${txns.slice(0, 100).map(t=>{
          const isInc = t.type==='income';
          return `<tr>
            <td>${Utils.fmtDate(t.date)}</td>
            <td><strong>${escHtml(t.merchant)}</strong></td>
            <td>${Utils.catBadge(t.category)}</td>
            <td class="text-muted text-sm">${Utils.accName(t.account)}</td>
            <td class="${isInc?'amount-pos':'amount-neg'}">${isInc?'+':'-'}${Utils.fmt(t.amount)}</td>
          </tr>`;
        }).join('')}
        ${txns.length>100?`<tr><td colspan="5" style="text-align:center;padding:12px;color:var(--text-3);font-size:12px">Showing first 100 of ${txns.length} transactions. Export CSV to get all.</td></tr>`:''}
      </tbody>
    </table>`;
  }

  function exportCSV() {
    const txns = getFilteredTxns();
    if (!txns.length) { Utils.toast('No transactions to export.', 'warning'); return; }

    const rows = [
      ['Date','Merchant','Category','Account','Type','Amount (INR)','Notes'],
      ...txns.map(t=>[
        t.date,
        `"${t.merchant}"`,
        `"${Utils.catName(t.category)}"`,
        `"${Utils.accName(t.account)}"`,
        t.type,
        t.amount,
        `"${t.notes||''}"`
      ])
    ];

    const csv = rows.map(r=>r.join(',')).join('\n');
    const blob = new Blob(['\ufeff'+csv], {type:'text/csv;charset=utf-8'});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `finora_report_${_from}_to_${_to}.csv`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    Utils.toast('CSV exported successfully!', 'success');
  }

  function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { render };
})();
