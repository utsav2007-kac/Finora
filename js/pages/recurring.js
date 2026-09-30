/* ── Recurring Page ── */
Pages.Recurring = (() => {
  const FREQ_LABELS = { daily:'Daily', weekly:'Weekly', monthly:'Monthly', yearly:'Yearly' };

  function render() {
    document.getElementById('page-content').innerHTML = `
<div class="page recurring-page">
  <div class="flex-between mb-16">
    <div class="flex-center gap-16">
      <div class="summary-card" style="padding:12px 16px">
        <div class="s-label">Monthly Expenses</div>
        <div class="s-value text-red" id="rec-exp-total">—</div>
      </div>
      <div class="summary-card" style="padding:12px 16px">
        <div class="s-label">Monthly Income</div>
        <div class="s-value text-green" id="rec-inc-total">—</div>
      </div>
    </div>
    <button class="btn btn-primary" id="add-rec-btn"><i data-lucide="plus"></i> Add Recurring</button>
  </div>

  <div class="card">
    <div class="card-hdr">
      <span class="card-title">Recurring Payments</span>
      <div class="flex-center gap-8">
        <select class="filter-input" id="rec-filter">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>
    </div>
    <div class="table-wrap" id="rec-table-wrap"></div>
  </div>
</div>`;

    if (window.lucide) lucide.createIcons();
    renderTable('');
    document.getElementById('add-rec-btn').addEventListener('click', () => openModal(null));
    document.getElementById('rec-filter').addEventListener('change', function() { renderTable(this.value); });
  }

  function renderTable(filter) {
    const wrap = document.getElementById('rec-table-wrap');
    if (!wrap) return;

    let items = DB.getRecurring();
    const cats = DB.getCategories();

    if (filter === 'active')  items = items.filter(r=>r.status==='active');
    if (filter === 'paused')  items = items.filter(r=>r.status==='paused');
    if (filter === 'income')  items = items.filter(r=>r.type==='income');
    if (filter === 'expense') items = items.filter(r=>r.type==='expense');

    // Update totals
    const all = DB.getRecurring();
    const expTotal = all.filter(r=>r.type==='expense'&&r.status==='active').reduce((s,r)=>s+r.amount,0);
    const incTotal = all.filter(r=>r.type==='income' &&r.status==='active').reduce((s,r)=>s+r.amount,0);
    const expEl = document.getElementById('rec-exp-total');
    const incEl = document.getElementById('rec-inc-total');
    if (expEl) expEl.textContent = Utils.fmt(expTotal);
    if (incEl) incEl.textContent = Utils.fmt(incTotal);

    if (!items.length) {
      wrap.innerHTML = `<div class="empty-state"><div class="empty-icon">🔄</div><h3>No recurring items</h3><p>Add recurring payments like rent, subscriptions, or salary.</p></div>`;
      return;
    }

    wrap.innerHTML = `<table>
      <thead><tr>
        <th>Merchant</th><th>Category</th><th>Account</th>
        <th>Amount</th><th>Frequency</th><th>Next Date</th><th>Status</th><th>Actions</th>
      </tr></thead>
      <tbody>
        ${items.map(r => {
          const cat = cats.find(c=>c.id===r.category) || { icon:'📦', color:'#94A3B8' };
          const isInc = r.type === 'income';
          const isPaused = r.status === 'paused';
          return `<tr style="opacity:${isPaused?0.6:1}">
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="rec-table-icon">${cat.icon}</div>
                <strong>${escHtml(r.merchant)}</strong>
              </div>
            </td>
            <td>${Utils.catBadge(r.category)}</td>
            <td class="text-muted text-sm">${Utils.accName(r.account)}</td>
            <td class="${isInc?'amount-pos':'amount-neg'}">${isInc?'+':'-'}${Utils.fmt(r.amount)}</td>
            <td>${FREQ_LABELS[r.frequency]||r.frequency}</td>
            <td>${Utils.fmtDate(r.nextDate)}</td>
            <td><span class="badge ${isPaused?'badge-yellow':'badge-green'}">${r.status}</span></td>
            <td>
              <div class="action-btns">
                <button class="action-btn toggle-btn" data-id="${r.id}" title="${isPaused?'Resume':'Pause'}">
                  ${isPaused?'▶':'⏸'}
                </button>
                <button class="action-btn edit-rec-btn" data-id="${r.id}" title="Edit">✏️</button>
                <button class="action-btn danger del-rec-btn" data-id="${r.id}" title="Delete">🗑️</button>
              </div>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;

    wrap.querySelectorAll('.toggle-btn').forEach(b => b.addEventListener('click', () => toggleStatus(b.dataset.id, filter)));
    wrap.querySelectorAll('.edit-rec-btn').forEach(b => b.addEventListener('click', () => openModal(b.dataset.id)));
    wrap.querySelectorAll('.del-rec-btn').forEach(b  => b.addEventListener('click', () => deleteRec(b.dataset.id, filter)));
  }

  function toggleStatus(id, filter) {
    const r = DB.getRecurring().find(x=>x.id===id);
    if (!r) return;
    const next = r.status === 'active' ? 'paused' : 'active';
    DB.updateRecurring(id, { status: next });
    Utils.toast(`Recurring ${next === 'active' ? 'resumed' : 'paused'}.`);
    renderTable(filter);
  }

  function openModal(id) {
    const r    = id ? DB.getRecurring().find(x=>x.id===id) : null;
    const cats = DB.getCategories();
    const accs = DB.getAccounts();

    Utils.openModal(r ? 'Edit Recurring' : 'Add Recurring', `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Merchant *</label>
          <input class="form-control" id="rm-merchant" value="${escHtml(r?.merchant||'')}" placeholder="e.g. Netflix" required />
        </div>
        <div class="form-group">
          <label class="form-label">Amount (₹) *</label>
          <input class="form-control" id="rm-amount" type="number" min="1" value="${r?.amount||''}" placeholder="0" required />
        </div>
        <div class="form-group">
          <label class="form-label">Type *</label>
          <select class="form-control" id="rm-type">
            <option value="expense" ${r?.type==='expense'?'selected':''}>Expense</option>
            <option value="income" ${r?.type==='income'?'selected':''}>Income</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Frequency *</label>
          <select class="form-control" id="rm-freq">
            ${Object.entries(FREQ_LABELS).map(([v,l])=>`<option value="${v}" ${r?.frequency===v?'selected':''}>${l}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-control" id="rm-cat">
            ${cats.map(c=>`<option value="${c.id}" ${r?.category===c.id?'selected':''}>${c.icon} ${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Account</label>
          <select class="form-control" id="rm-acc">
            ${accs.map(a=>`<option value="${a.id}" ${r?.account===a.id?'selected':''}>${a.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Next Date *</label>
        <input class="form-control" id="rm-date" type="date" value="${r?.nextDate||Utils.todayStr()}" required />
      </div>
      <div class="modal-footer" style="padding:0;border:none;margin-top:8px">
        <button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="rm-save">Save</button>
      </div>
    `);
    document.getElementById('rm-save').addEventListener('click', () => saveRec(id));
  }

  function saveRec(id) {
    const merchant = document.getElementById('rm-merchant').value.trim();
    const amount   = parseFloat(document.getElementById('rm-amount').value);
    const type     = document.getElementById('rm-type').value;
    const frequency= document.getElementById('rm-freq').value;
    const category = document.getElementById('rm-cat').value;
    const account  = document.getElementById('rm-acc').value;
    const nextDate = document.getElementById('rm-date').value;

    if (!merchant || !amount || !nextDate) { Utils.toast('Fill all required fields.', 'error'); return; }

    const data = { merchant, amount, type, frequency, category, account, nextDate, status: 'active' };
    if (id) { DB.updateRecurring(id, data); Utils.toast('Recurring updated.'); }
    else    { DB.addRecurring(data);        Utils.toast('Recurring added.'); }
    Utils.closeModal();
    renderTable(document.getElementById('rec-filter')?.value || '');
  }

  function deleteRec(id, filter) {
    const r = DB.getRecurring().find(x=>x.id===id);
    Utils.confirm('Delete Recurring', `Delete "${r?.merchant}"?`, () => {
      DB.deleteRecurring(id);
      Utils.toast('Recurring deleted.', 'warning');
      renderTable(filter);
    });
  }

  function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { render };
})();
