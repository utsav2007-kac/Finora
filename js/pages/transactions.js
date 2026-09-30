/* =============================================
   FINORA — Transactions Page (transactions.js)
   Full CRUD with search, filter, sort, validation.
   ============================================= */
Pages.Transactions = (() => {
  'use strict';

  // Local filter and sort state (persists while on this page)
  var _filters = { search:'', category:'', account:'', type:'', dateFrom:'', dateTo:'' };
  var _sort    = { col:'date', dir:'desc' };

  function render() {
    // Restore global search if coming from topbar search
    var gs = sessionStorage.getItem('finora_search') || '';
    if (gs) { _filters.search = gs; sessionStorage.removeItem('finora_search'); }

    var cats = DB.getCategories();
    var accs = DB.getAccounts();

    document.getElementById('page-content').innerHTML = `
<div class="page txn-page">
  <div class="txn-actions">
    <div class="filters-bar" style="margin-bottom:0;border:none;padding:0;flex:1;flex-wrap:wrap;">
      <div class="filter-search-wrap">
        <i data-lucide="search"></i>
        <input type="text" id="txn-search" placeholder="Search merchant or category…" value="${escHtml(_filters.search)}" />
      </div>
      <select id="txn-cat" class="filter-input">
        <option value="">All Categories</option>
        ${cats.map(function(c) { return '<option value="' + c.id + '" ' + (_filters.category === c.id ? 'selected' : '') + '>' + c.icon + ' ' + escHtml(c.name) + '</option>'; }).join('')}
      </select>
      <select id="txn-acc" class="filter-input">
        <option value="">All Accounts</option>
        ${accs.map(function(a) { return '<option value="' + a.id + '" ' + (_filters.account === a.id ? 'selected' : '') + '>' + escHtml(a.name) + '</option>'; }).join('')}
      </select>
      <select id="txn-type" class="filter-input">
        <option value="">All Types</option>
        <option value="income"  ${_filters.type === 'income'  ? 'selected' : ''}>Income</option>
        <option value="expense" ${_filters.type === 'expense' ? 'selected' : ''}>Expense</option>
      </select>
      <input type="date" id="txn-from" class="filter-input" value="${_filters.dateFrom}" title="From date" />
      <input type="date" id="txn-to"   class="filter-input" value="${_filters.dateTo}"   title="To date"   />
      <button class="btn btn-ghost btn-sm" id="txn-clear">Clear Filters</button>
    </div>
    <button class="btn btn-primary" id="add-txn-btn">
      <i data-lucide="plus"></i> Add Transaction
    </button>
  </div>

  <div class="card">
    <div id="txn-table-wrap"></div>
  </div>
</div>`;

    renderTable();
    bindFilters();
    if (window.lucide) lucide.createIcons();
    document.getElementById('add-txn-btn').addEventListener('click', function() { openTxnModal(null); });
  }

  // ─── Filter bindings ─────────────────────────
  function bindFilters() {
    var fields = ['txn-search','txn-cat','txn-acc','txn-type','txn-from','txn-to'];
    fields.forEach(function(id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input',  readFiltersAndRender);
      el.addEventListener('change', readFiltersAndRender);
    });
    document.getElementById('txn-clear').addEventListener('click', function() {
      _filters = { search:'', category:'', account:'', type:'', dateFrom:'', dateTo:'' };
      _sort    = { col:'date', dir:'desc' };
      render();
    });
  }

  function readFiltersAndRender() {
    _filters.search   = (document.getElementById('txn-search')?.value || '').trim();
    _filters.category = document.getElementById('txn-cat')?.value   || '';
    _filters.account  = document.getElementById('txn-acc')?.value   || '';
    _filters.type     = document.getElementById('txn-type')?.value  || '';
    _filters.dateFrom = document.getElementById('txn-from')?.value  || '';
    _filters.dateTo   = document.getElementById('txn-to')?.value    || '';
    renderTable();
  }

  // ─── Apply filters + sort ─────────────────────
  function getFiltered() {
    var txns = DB.getTransactions();
    var s    = _filters.search.toLowerCase();

    if (s) txns = txns.filter(function(t) {
      return t.merchant.toLowerCase().includes(s) ||
             Utils.catName(t.category).toLowerCase().includes(s) ||
             (t.notes || '').toLowerCase().includes(s);
    });
    if (_filters.category) txns = txns.filter(function(t) { return t.category === _filters.category; });
    if (_filters.account)  txns = txns.filter(function(t) { return t.account  === _filters.account;  });
    if (_filters.type)     txns = txns.filter(function(t) { return t.type     === _filters.type;     });
    if (_filters.dateFrom) txns = txns.filter(function(t) { return t.date >= _filters.dateFrom; });
    if (_filters.dateTo)   txns = txns.filter(function(t) { return t.date <= _filters.dateTo;   });

    // Sort
    var col = _sort.col;
    var dir = _sort.dir;
    txns = txns.slice().sort(function(a, b) {
      var av = a[col], bv = b[col];
      if (col === 'amount') { av = Number(av); bv = Number(bv); }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ?  1 : -1;
      return 0;
    });
    return txns;
  }

  // ─── Render table ────────────────────────────
  function renderTable() {
    var wrap = document.getElementById('txn-table-wrap');
    if (!wrap) return;
    var txns = getFiltered();

    if (!txns.length) {
      wrap.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon">📂</div>' +
        '<h3>No transactions found</h3>' +
        '<p>Try clearing filters or add a new transaction.</p>' +
        '</div>';
      return;
    }

    var cols = [
      { key:'date',     label:'Date'     },
      { key:'merchant', label:'Merchant' },
      { key:'category', label:'Category' },
      { key:'account',  label:'Account'  },
      { key:'amount',   label:'Amount'   },
    ];

    wrap.innerHTML =
      '<div class="table-wrap">' +
      '<table>' +
      '<thead><tr>' +
      cols.map(function(c) {
        var sortCls = _sort.col === c.key ? 'sort-' + _sort.dir : '';
        return '<th class="' + sortCls + '" data-col="' + c.key + '">' + c.label + '</th>';
      }).join('') +
      '<th>Actions</th>' +
      '</tr></thead>' +
      '<tbody>' +
      txns.map(function(t) { return rowHTML(t); }).join('') +
      '</tbody></table></div>' +
      '<div style="padding:10px 12px;font-size:12px;color:var(--text-3);border-top:1px solid var(--border)">' +
      txns.length + ' transaction' + (txns.length !== 1 ? 's' : '') + ' found' +
      '</div>';

    // Sort header clicks
    wrap.querySelectorAll('thead th[data-col]').forEach(function(th) {
      th.addEventListener('click', function() {
        var c = th.dataset.col;
        if (_sort.col === c) _sort.dir = _sort.dir === 'asc' ? 'desc' : 'asc';
        else { _sort.col = c; _sort.dir = 'asc'; }
        renderTable();
      });
    });

    // Edit / Delete button listeners
    wrap.querySelectorAll('.edit-txn-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { openTxnModal(btn.dataset.id); });
    });
    wrap.querySelectorAll('.del-txn-btn').forEach(function(btn) {
      btn.addEventListener('click', function() { deleteTxn(btn.dataset.id); });
    });
  }

  function rowHTML(t) {
    var isInc = t.type === 'income';
    return '<tr>' +
      '<td>' + Utils.fmtDate(t.date) + '</td>' +
      '<td><strong>' + escHtml(t.merchant) + '</strong>' + (t.notes ? '<br><span class="text-xs text-muted">' + escHtml(t.notes) + '</span>' : '') + '</td>' +
      '<td>' + Utils.catBadge(t.category) + '</td>' +
      '<td class="text-muted text-sm">' + Utils.accName(t.account) + '</td>' +
      '<td class="' + (isInc ? 'amount-pos' : 'amount-neg') + '">' + (isInc ? '+' : '-') + Utils.fmt(t.amount) + '</td>' +
      '<td><div class="action-btns">' +
        '<button class="action-btn edit-txn-btn" data-id="' + t.id + '" title="Edit">✏️</button>' +
        '<button class="action-btn danger del-txn-btn" data-id="' + t.id + '" title="Delete">🗑️</button>' +
      '</div></td>' +
      '</tr>';
  }

  // ─── Add / Edit modal ────────────────────────
  function openTxnModal(id) {
    var t    = id ? DB.getTransactions().find(function(x) { return x.id === id; }) : null;
    var cats = DB.getCategories();
    var accs = DB.getAccounts();

    if (accs.length === 0) {
      Utils.toast('Please add an account first.', 'warning');
      return;
    }

    Utils.openModal(t ? 'Edit Transaction' : 'Add Transaction', `
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Merchant *</label>
          <input class="form-control" id="fm-merchant" value="${escHtml(t?.merchant||'')}" placeholder="e.g. Swiggy" />
        </div>
        <div class="form-group">
          <label class="form-label">Amount (₹) *</label>
          <input class="form-control" id="fm-amount" type="number" min="0.01" step="0.01" value="${t?.amount||''}" placeholder="0" />
        </div>
        <div class="form-group">
          <label class="form-label">Date *</label>
          <input class="form-control" id="fm-date" type="date" value="${t?.date || Utils.todayStr()}" />
        </div>
        <div class="form-group">
          <label class="form-label">Type *</label>
          <select class="form-control" id="fm-type">
            <option value="expense" ${!t || t.type==='expense' ? 'selected' : ''}>Expense</option>
            <option value="income"  ${t?.type==='income'  ? 'selected' : ''}>Income</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Category *</label>
          <select class="form-control" id="fm-cat">
            ${cats.map(function(c) { return '<option value="' + c.id + '" ' + (t?.category===c.id?'selected':'') + '>' + c.icon + ' ' + escHtml(c.name) + '</option>'; }).join('')}
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Account *</label>
          <select class="form-control" id="fm-acc">
            ${accs.map(function(a) { return '<option value="' + a.id + '" ' + (t?.account===a.id?'selected':'') + '>' + escHtml(a.name) + '</option>'; }).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <input class="form-control" id="fm-notes" value="${escHtml(t?.notes||'')}" placeholder="Optional" />
      </div>
      <div class="modal-footer" style="padding:0;border:none;margin-top:8px">
        <button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="fm-save">${t ? 'Update Transaction' : 'Save Transaction'}</button>
      </div>
    `);

    document.getElementById('fm-save').addEventListener('click', function() { saveTxn(id); });
  }

  // ─── Save (add or update) ────────────────────
  function saveTxn(id) {
    var merchant = (document.getElementById('fm-merchant').value || '').trim();
    var amount   = parseFloat(document.getElementById('fm-amount').value);
    var date     = document.getElementById('fm-date').value;
    var type     = document.getElementById('fm-type').value;
    var category = document.getElementById('fm-cat').value;
    var account  = document.getElementById('fm-acc').value;
    var notes    = (document.getElementById('fm-notes').value || '').trim();

    // Validation
    if (!merchant)              { Utils.toast('Merchant name is required.', 'error'); return; }
    if (isNaN(amount) || amount <= 0) { Utils.toast('Enter a valid amount greater than 0.', 'error'); return; }
    if (!date)                  { Utils.toast('Date is required.', 'error'); return; }
    if (!category)              { Utils.toast('Please select a category.', 'error'); return; }
    if (!account)               { Utils.toast('Please select an account.', 'error'); return; }

    var data = { merchant:merchant, amount:amount, date:date, type:type, category:category, account:account, notes:notes };

    if (id) {
      DB.updateTransaction(id, data);
      Utils.toast('Transaction updated successfully.');
    } else {
      DB.addTransaction(data);
      Utils.toast('Transaction added successfully.');
    }

    Utils.closeModal();
    renderTable();
  }

  // ─── Delete ──────────────────────────────────
  function deleteTxn(id) {
    var t = DB.getTransactions().find(function(x) { return x.id === id; });
    Utils.confirm(
      'Delete Transaction',
      'Delete "' + (t ? escHtml(t.merchant) : 'this transaction') + '"? This cannot be undone.',
      function() {
        DB.deleteTransaction(id);
        Utils.toast('Transaction deleted.', 'warning');
        renderTable();
      }
    );
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render };
})();
