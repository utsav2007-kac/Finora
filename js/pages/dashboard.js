/* =============================================
   FINORA — Dashboard Page (dashboard.js)
   All values are computed live from stored data.
   ============================================= */
Pages.Dashboard = (() => {
  'use strict';

  function render() {
    var month     = DB.currentMonth();
    var monthTxns = DB.getMonthTransactions(month);
    var income    = DB.sumByType(monthTxns, 'income');
    var expense   = DB.sumByType(monthTxns, 'expense');
    var netFlow   = income - expense;

    var nw       = DB.getNetWorth();
    var cash     = DB.getTotalCash();
    var invest   = DB.getTotalInvestments();
    var monthly  = DB.getMonthlyData();
    var nwHist   = DB.getNetWorthHistory();
    var spending = DB.getSpendingByCategory(month);
    var budgets  = DB.getBudgets().filter(function(b) { return b.month === month; });
    var cats     = DB.getCategories();
    var goals    = DB.getGoals().slice(0, 4);
    var recentTxns = DB.getTransactions().slice(0, 8);
    // Only show active expense recurring items in "upcoming"
    var upcoming = DB.getRecurring()
      .filter(function(r) { return r.status === 'active' && r.type === 'expense'; })
      .slice(0, 5);

    // Calculate previous month for comparison
    var prevMonth = '2026-08';
    var prevTxns  = DB.getMonthTransactions(prevMonth);
    var prevIncome  = DB.sumByType(prevTxns, 'income');
    var prevExpense = DB.sumByType(prevTxns, 'expense');

    // Compute % changes (avoid division by zero)
    var incomeChange  = prevIncome  > 0 ? Math.round(((income  - prevIncome)  / prevIncome)  * 100) : 0;
    var expenseChange = prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : 0;
    var netFlowSign   = netFlow >= 0 ? 'pos' : 'neg';
    var netFlowDir    = netFlow >= 0 ? '↑' : '↓';

    document.getElementById('page-content').innerHTML = `
<div class="page dash-page">

  <!-- Summary Cards -->
  <div class="summary-grid">
    ${summaryCard('Net Worth',        nw,      nw >= 0 ? 'accent' : 'danger', 'Assets minus Liabilities', nw >= 0 ? 'pos' : 'neg')}
    ${summaryCard('Total Cash',       cash,    '',       'Savings + Checking + Cash', '')}
    ${summaryCard('Investments',      invest,  '',       'Investment accounts', '')}
    ${summaryCard('Monthly Income',   income,  'accent', (incomeChange >= 0 ? '+' : '') + incomeChange + '% vs last month',  incomeChange >= 0 ? 'pos' : 'neg')}
    ${summaryCard('Monthly Expenses', expense, 'danger', (expenseChange >= 0 ? '+' : '') + expenseChange + '% vs last month', expenseChange >= 0 ? 'neg' : 'pos')}
  </div>

  <!-- Charts Row: Net Worth + Spending Doughnut -->
  <div class="dash-charts-row">
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Net Worth Over Time</span>
        <span class="card-subtitle">Last 6 months</span>
      </div>
      <div class="chart-container"><canvas id="nw-chart"></canvas></div>
    </div>
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Spending by Category</span>
        <span class="card-subtitle">${Utils.fmtDate(month + '-01', 'monthYear')}</span>
      </div>
      <div class="chart-container sm"><canvas id="spend-chart"></canvas></div>
      <div class="cat-spend-list mt-16" id="cat-spend-list"></div>
    </div>
  </div>

  <!-- Income vs Expenses Bar Chart -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-hdr">
      <span class="card-title">Income vs Expenses</span>
      <span class="card-subtitle">Apr – Sep 2026</span>
    </div>
    <div class="chart-container"><canvas id="ie-chart"></canvas></div>
  </div>

  <!-- Bottom: Recent Transactions + Budget Progress -->
  <div class="dash-bottom">
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Recent Transactions</span>
        <a href="#/transactions" class="btn btn-ghost btn-sm">View All</a>
      </div>
      <div class="txn-list" id="dash-txns"></div>
    </div>
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Budget Progress</span>
        <a href="#/budgets" class="btn btn-ghost btn-sm">Manage</a>
      </div>
      <div id="dash-budgets"></div>
    </div>
  </div>

  <!-- Bottom: Upcoming Payments + Goals -->
  <div class="dash-bottom" style="margin-top:20px">
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Upcoming Payments</span>
        <a href="#/recurring" class="btn btn-ghost btn-sm">View All</a>
      </div>
      <div class="rec-list" id="dash-upcoming"></div>
    </div>
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Financial Goals</span>
        <a href="#/goals" class="btn btn-ghost btn-sm">View All</a>
      </div>
      <div class="goal-list" id="dash-goals"></div>
    </div>
  </div>

</div>`;

    // Populate dynamic sections (after HTML is in the DOM)
    renderCatSpend(spending);
    renderRecentTxns(recentTxns, cats);
    renderBudgets(budgets, monthTxns, cats);
    renderUpcoming(upcoming, cats);
    renderGoals(goals);

    // Build Chart.js charts
    buildNWChart(nwHist);
    buildSpendChart(spending);
    buildIEChart(monthly);
  }

  // ─── Summary card HTML helper ────────────────
  function summaryCard(label, amount, extraClass, changeText, changeDir) {
    var isNeg    = amount < 0;
    var valColor = isNeg ? 'color:var(--danger)' : '';
    return `<div class="summary-card ${extraClass}">
      <div class="s-label">${label}</div>
      <div class="s-value" style="${valColor}">${Utils.fmt(amount)}</div>
      <div class="s-change ${changeDir}">${changeText || ''}</div>
    </div>`;
  }

  // ─── Spending by category mini-list ──────────
  function renderCatSpend(spending) {
    var el = document.getElementById('cat-spend-list');
    if (!el) return;
    var top5   = spending.slice(0, 5);
    var maxAmt = top5.length ? top5[0].amount : 1;
    if (!top5.length) {
      el.innerHTML = '<div class="text-muted text-sm" style="padding:10px 0">No spending data for this month.</div>';
      return;
    }
    el.innerHTML = top5.map(function(s) {
      return `<div class="cat-spend-row">
        <div class="cat-spend-info">
          <span><span class="cat-dot" style="background:${s.color}"></span>${s.icon} ${s.name}</span>
          <strong style="font-size:13px">${Utils.fmt(s.amount)}</strong>
        </div>
        ${Utils.progressHTML(s.amount, maxAmt)}
      </div>`;
    }).join('');
  }

  // ─── Recent transactions mini-list ───────────
  function renderRecentTxns(txns, cats) {
    var el = document.getElementById('dash-txns');
    if (!el) return;
    if (!txns.length) {
      el.innerHTML = '<div class="text-muted text-sm" style="padding:20px 0">No transactions yet.</div>';
      return;
    }
    el.innerHTML = txns.map(function(t) {
      var cat  = cats.find(function(c) { return c.id === t.category; }) || { icon:'📦', color:'#94A3B8' };
      var sign = t.type === 'income' ? '+' : '-';
      var cls  = t.type === 'income' ? 'text-green' : 'text-red';
      return `<div class="txn-row">
        <div class="txn-icon" style="background:${cat.color}22">${cat.icon}</div>
        <div class="txn-info">
          <div class="txn-merchant">${escHtml(t.merchant)}</div>
          <div class="txn-meta">${Utils.fmtDate(t.date)} · ${Utils.catName(t.category)}</div>
        </div>
        <div class="txn-amount ${cls}">${sign}${Utils.fmt(t.amount)}</div>
      </div>`;
    }).join('');
  }

  // ─── Budget progress mini-list ───────────────
  function renderBudgets(budgets, monthTxns, cats) {
    var el = document.getElementById('dash-budgets');
    if (!el) return;
    if (!budgets.length) {
      el.innerHTML = '<div class="text-muted text-sm" style="padding:20px 0">No budgets set for this month. <a href="#/budgets" style="color:var(--accent)">Set budgets →</a></div>';
      return;
    }
    el.innerHTML = '<div style="display:flex;flex-direction:column;gap:14px">' +
      budgets.map(function(b) {
        var cat   = cats.find(function(c) { return c.id === b.category; }) || { name:'Other', color:'#94A3B8', icon:'📦' };
        var spent = monthTxns.filter(function(t) { return t.category === b.category && t.type === 'expense'; })
                             .reduce(function(s,t) { return s + (Number(t.amount)||0); }, 0);
        var p     = Utils.pct(spent, b.amount);
        return `<div>
          <div class="flex-between mb-4">
            <span style="font-size:13px;font-weight:600">${cat.icon} ${escHtml(cat.name)}</span>
            <span class="text-sm text-muted">${Utils.fmt(spent)} / ${Utils.fmt(b.amount)}</span>
          </div>
          ${Utils.progressHTML(spent, b.amount)}
          <div class="flex-between mt-4">
            <span class="text-xs text-muted">${p}% used</span>
            <span class="text-xs ${p >= 100 ? 'text-red' : p >= 80 ? 'text-red' : 'text-muted'}">
              ${p >= 100 ? 'Over budget!' : Utils.fmt(b.amount - spent) + ' left'}
            </span>
          </div>
        </div>`;
      }).join('') + '</div>';
  }

  // ─── Upcoming recurring payments mini-list ───
  function renderUpcoming(upcoming, cats) {
    var el = document.getElementById('dash-upcoming');
    if (!el) return;
    if (!upcoming.length) {
      el.innerHTML = '<div class="text-muted text-sm" style="padding:20px 0">No upcoming payments.</div>';
      return;
    }
    el.innerHTML = upcoming.map(function(r) {
      var cat = cats.find(function(c) { return c.id === r.category; }) || { icon:'📦' };
      return `<div class="rec-row">
        <div class="rec-left">
          <div class="rec-icon">${cat.icon}</div>
          <div>
            <div class="rec-name">${escHtml(r.merchant)}</div>
            <div class="rec-date">${Utils.fmtDate(r.nextDate)}</div>
          </div>
        </div>
        <div class="rec-amount text-red">-${Utils.fmt(r.amount)}</div>
      </div>`;
    }).join('');
  }

  // ─── Financial goals mini-list ───────────────
  function renderGoals(goals) {
    var el = document.getElementById('dash-goals');
    if (!el) return;
    if (!goals.length) {
      el.innerHTML = '<div class="text-muted text-sm" style="padding:20px 0">No goals yet. <a href="#/goals" style="color:var(--accent)">Add a goal →</a></div>';
      return;
    }
    el.innerHTML = goals.map(function(g) {
      var p = Utils.pct(g.current, g.target);
      return `<div class="goal-row">
        <div class="goal-icon" style="background:${g.color}22">${g.icon}</div>
        <div class="goal-info">
          <div class="goal-name">${escHtml(g.name)}</div>
          <div class="goal-meta">${Utils.fmt(g.current)} of ${Utils.fmt(g.target)} · ${p}%</div>
          ${Utils.progressHTML(g.current, g.target)}
        </div>
      </div>`;
    }).join('');
  }

  // ─── Chart builders ──────────────────────────

  function buildNWChart(nwHist) {
    var theme = Utils.chartTheme();
    Utils.createChart('nw-chart', {
      type: 'line',
      data: {
        labels: nwHist.map(function(d) { return d.label; }),
        datasets: [{
          label: 'Net Worth',
          data:  nwHist.map(function(d) { return d.value; }),
          borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,.1)',
          fill: true, tension: .4, pointRadius: 4,
          pointBackgroundColor: '#10B981', borderWidth: 2,
        }]
      },
      options: chartOpts(theme, { yCallback: function(v) { return '₹' + Math.round(v/1000) + 'K'; } })
    });
  }

  function buildSpendChart(spending) {
    var top6 = spending.slice(0, 6);
    if (!top6.length) { return; } // nothing to chart
    Utils.createChart('spend-chart', {
      type: 'doughnut',
      data: {
        labels: top6.map(function(s) { return s.name; }),
        datasets: [{
          data:            top6.map(function(s) { return s.amount; }),
          backgroundColor: top6.map(function(s) { return s.color; }),
          borderWidth: 2, borderColor: Utils.chartTheme().bg,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position:'bottom', labels: { color: Utils.chartTheme().text, boxWidth:12, font:{size:11} } },
          tooltip: { callbacks: { label: function(ctx) { return ' ' + Utils.fmt(ctx.raw); } } }
        },
        cutout: '65%',
      }
    });
  }

  function buildIEChart(monthly) {
    var theme = Utils.chartTheme();
    Utils.createChart('ie-chart', {
      type: 'bar',
      data: {
        labels: monthly.map(function(d) { return d.label; }),
        datasets: [
          { label:'Income',   data: monthly.map(function(d) { return d.income; }),  backgroundColor:'rgba(16,185,129,.85)', borderRadius:6 },
          { label:'Expenses', data: monthly.map(function(d) { return d.expense; }), backgroundColor:'rgba(239,68,68,.75)',  borderRadius:6 },
        ]
      },
      options: chartOpts(theme, { yCallback: function(v) { return '₹' + Math.round(v/1000) + 'K'; } })
    });
  }

  // Shared chart options factory
  function chartOpts(theme, opts) {
    opts = opts || {};
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: theme.text, font: { size:12 } } },
        tooltip: {
          callbacks: opts.yCallback
            ? { label: function(ctx) { return ' ' + Utils.fmt(ctx.raw); } }
            : {}
        }
      },
      scales: {
        x: { grid: { color: theme.grid }, ticks: { color: theme.text } },
        y: {
          grid: { color: theme.grid },
          ticks: { color: theme.text, callback: opts.yCallback || function(v) { return v; } }
        }
      }
    };
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render };
})();
