/* ── Cash Flow Page ── */
Pages.CashFlow = (() => {

  function render() {
    const monthly = DB.getMonthlyData();
    const month   = DB.currentMonth();
    const monthTxns = DB.getMonthTransactions(month);
    const income  = DB.sumByType(monthTxns, 'income');
    const expense = DB.sumByType(monthTxns, 'expense');
    const net     = income - expense;
    const spending = DB.getSpendingByCategory(month);

    // Income by category (for current month)
    const cats = DB.getCategories();
    const incTxns = monthTxns.filter(t=>t.type==='income');
    const incByCat = {};
    incTxns.forEach(t=>{ incByCat[t.category]=(incByCat[t.category]||0)+t.amount; });

    document.getElementById('page-content').innerHTML = `
<div class="page cf-page">

  <!-- Stats Row -->
  <div class="cf-stats">
    <div class="summary-card accent">
      <div class="s-label">Monthly Income</div>
      <div class="s-value">${Utils.fmt(income)}</div>
      <div class="s-change pos">Sep 2026</div>
    </div>
    <div class="summary-card danger">
      <div class="s-label">Monthly Expenses</div>
      <div class="s-value">${Utils.fmt(expense)}</div>
    </div>
    <div class="summary-card ${net>=0?'accent':'danger'}">
      <div class="s-label">Net Cash Flow</div>
      <div class="s-value" style="color:${net>=0?'var(--accent)':'var(--danger)'}">${Utils.fmt(net)}</div>
    </div>
    <div class="summary-card">
      <div class="s-label">Savings Rate</div>
      <div class="s-value">${income>0?Utils.pct(net,income):0}%</div>
    </div>
  </div>

  <!-- Monthly Cash Flow Chart -->
  <div class="card" style="margin-bottom:20px">
    <div class="card-hdr">
      <span class="card-title">Monthly Cash Flow</span>
      <span class="card-subtitle">Apr – Sep 2026</span>
    </div>
    <div class="chart-container"><canvas id="cf-monthly-chart"></canvas></div>
  </div>

  <!-- Income vs Expenses bar + Net line -->
  <div class="dash-charts-row" style="margin-bottom:20px">
    <!-- Expense breakdown -->
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Expense Breakdown</span>
        <span class="card-subtitle">${Utils.fmtDate(month+'-01','monthYear')}</span>
      </div>
      <div class="chart-container sm"><canvas id="cf-exp-chart"></canvas></div>
      <div style="margin-top:12px" id="cf-exp-list"></div>
    </div>

    <!-- Income breakdown -->
    <div class="card">
      <div class="card-hdr">
        <span class="card-title">Income Sources</span>
        <span class="card-subtitle">${Utils.fmtDate(month+'-01','monthYear')}</span>
      </div>
      <div class="chart-container sm"><canvas id="cf-inc-chart"></canvas></div>
      <div style="margin-top:12px" id="cf-inc-list"></div>
    </div>
  </div>

  <!-- Net cash flow line chart -->
  <div class="card">
    <div class="card-hdr">
      <span class="card-title">Cumulative Net Flow</span>
      <span class="card-subtitle">Running total Apr – Sep 2026</span>
    </div>
    <div class="chart-container"><canvas id="cf-net-chart"></canvas></div>
  </div>

</div>`;

    renderExpList(spending);
    renderIncList(incByCat, cats, income);
    buildMonthlyCFChart(monthly);
    buildExpChart(spending);
    buildIncChart(incByCat, cats);
    buildNetChart(monthly);
  }

  function renderExpList(spending) {
    const el = document.getElementById('cf-exp-list');
    if (!el) return;
    const top = spending.slice(0, 6);
    const total = top.reduce((s,x)=>s+x.amount,0);
    el.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">` +
      top.map(s=>`
        <div>
          <div style="display:flex;justify-content:space-between;margin-bottom:3px">
            <span style="font-size:12px;display:flex;align-items:center;gap:4px">
              <span style="width:8px;height:8px;border-radius:50%;background:${s.color};display:inline-block"></span>
              ${s.icon} ${s.name}
            </span>
            <span style="font-size:12px;font-weight:600">${Utils.fmt(s.amount)}</span>
          </div>
          ${Utils.progressHTML(s.amount, total)}
        </div>`).join('') + '</div>';
  }

  function renderIncList(incByCat, cats, total) {
    const el = document.getElementById('cf-inc-list');
    if (!el) return;
    const entries = Object.entries(incByCat);
    el.innerHTML = `<div style="display:flex;flex-direction:column;gap:8px">` +
      entries.map(([catId,amount])=>{
        const cat = cats.find(c=>c.id===catId)||{name:'Other',color:'#10B981',icon:'💼'};
        return `
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:3px">
              <span style="font-size:12px;display:flex;align-items:center;gap:4px">
                <span style="width:8px;height:8px;border-radius:50%;background:${cat.color};display:inline-block"></span>
                ${cat.icon} ${cat.name}
              </span>
              <span style="font-size:12px;font-weight:600;color:var(--accent)">${Utils.fmt(amount)}</span>
            </div>
            ${Utils.progressHTML(amount, total)}
          </div>`;
      }).join('') + '</div>';
  }

  function buildMonthlyCFChart(monthly) {
    const theme = Utils.chartTheme();
    Utils.createChart('cf-monthly-chart', {
      type:'bar',
      data:{
        labels: monthly.map(d=>d.label),
        datasets:[
          {label:'Income',   data:monthly.map(d=>d.income),  backgroundColor:'rgba(16,185,129,.8)',  borderRadius:6},
          {label:'Expenses', data:monthly.map(d=>d.expense), backgroundColor:'rgba(239,68,68,.7)',   borderRadius:6},
        ]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{labels:{color:theme.text}}, tooltip:{callbacks:{label:ctx=>` ${Utils.fmt(ctx.raw)}`}}},
        scales:{
          x:{grid:{color:theme.grid},ticks:{color:theme.text}},
          y:{grid:{color:theme.grid},ticks:{color:theme.text,callback:v=>'₹'+Math.round(v/1000)+'K'}}
        }
      }
    });
  }

  function buildExpChart(spending) {
    const top = spending.slice(0,6);
    Utils.createChart('cf-exp-chart', {
      type:'doughnut',
      data:{labels:top.map(s=>s.name),datasets:[{data:top.map(s=>s.amount),backgroundColor:top.map(s=>s.color),borderWidth:2,borderColor:Utils.chartTheme().bg}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'60%',
        plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${Utils.fmt(ctx.raw)}`}}}}
    });
  }

  function buildIncChart(incByCat, cats) {
    const entries = Object.entries(incByCat);
    const labels  = entries.map(([id])=>{const c=cats.find(x=>x.id===id);return c?c.name:'Other';});
    const data    = entries.map(([,v])=>v);
    const colors  = entries.map(([id])=>{const c=cats.find(x=>x.id===id);return c?c.color:'#10B981';});
    Utils.createChart('cf-inc-chart', {
      type:'doughnut',
      data:{labels,datasets:[{data,backgroundColor:colors,borderWidth:2,borderColor:Utils.chartTheme().bg}]},
      options:{responsive:true,maintainAspectRatio:false,cutout:'60%',
        plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>` ${Utils.fmt(ctx.raw)}`}}}}
    });
  }

  function buildNetChart(monthly) {
    let cum = 0;
    const cumData = monthly.map(d=>{ cum += (d.income - d.expense); return cum; });
    const theme = Utils.chartTheme();
    Utils.createChart('cf-net-chart', {
      type:'line',
      data:{
        labels:monthly.map(d=>d.label),
        datasets:[{
          label:'Cumulative Net Flow', data:cumData,
          borderColor:'#3B82F6', backgroundColor:'rgba(59,130,246,.1)',
          fill:true, tension:.4, pointRadius:4, pointBackgroundColor:'#3B82F6', borderWidth:2,
        }]
      },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{labels:{color:theme.text}},tooltip:{callbacks:{label:ctx=>` ${Utils.fmt(ctx.raw)}`}}},
        scales:{
          x:{grid:{color:theme.grid},ticks:{color:theme.text}},
          y:{grid:{color:theme.grid},ticks:{color:theme.text,callback:v=>'₹'+Math.round(v/1000)+'K'}}
        }
      }
    });
  }

  return { render };
})();
