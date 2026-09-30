/* =============================================
   FINORA — Accounts Page (accounts.js)
   ============================================= */
Pages.Accounts = (() => {
  'use strict';

  var TYPE_LABELS = { savings:'Savings', checking:'Checking', credit:'Credit Card', investment:'Investment', cash:'Cash' };
  var TYPE_COLORS = { savings:'badge-green', checking:'badge-blue', credit:'badge-red', investment:'badge-blue', cash:'badge-gray' };
  var TYPE_ICONS  = { savings:'🏦', checking:'💳', credit:'💳', investment:'📈', cash:'💵' };

  function render() {
    var accounts   = DB.getAccounts();
    var totalPos   = accounts.filter(function(a) { return a.balance > 0; })
                             .reduce(function(s,a) { return s + a.balance; }, 0);
    var totalNeg   = accounts.filter(function(a) { return a.balance < 0; })
                             .reduce(function(s,a) { return s + Math.abs(a.balance); }, 0);

    document.getElementById('page-content').innerHTML = `
<div class="page accounts-page">
  <div class="flex-between mb-16">
    <div>
      <span class="text-muted text-sm">
        Total Assets: <strong class="text-green">${Utils.fmt(totalPos)}</strong>
        &nbsp; Total Liabilities: <strong class="text-red">${Utils.fmt(totalNeg)}</strong>
      </span>
    </div>
    <button class="btn btn-primary" id="add-acc-btn">
      <i data-lucide="plus"></i> Add Account
    </button>
  </div>
  <div class="accounts-grid" id="accounts-grid"></div>
</div>`;

    renderAccounts();
    if (window.lucide) lucide.createIcons();
    document.getElementById('add-acc-btn').addEventListener('click', function() { openAccModal(null); });
  }

  function renderAccounts() {
    var grid = document.getElementById('accounts-grid');
    if (!grid) return;
    var accounts = DB.getAccounts();

    if (!accounts.length) {
      grid.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon">💳</div>' +
        '<h3>No accounts yet</h3>' +
        '<p>Add your first account to start tracking your finances.</p>' +
        '</div>';
      return;
    }

    grid.innerHTML = accounts.map(function(a) {
      var isNeg = a.balance < 0;
      var badge = TYPE_COLORS[a.type] || 'badge-gray';
      return `<div class="account-card">
        <span class="acc-type-badge badge ${badge}">${TYPE_LABELS[a.type] || a.type}</span>
        <div style="font-size:28px;margin-bottom:8px">${TYPE_ICONS[a.type] || '🏦'}</div>
        <div class="acc-name">${escHtml(a.name)}</div>
        <div class="acc-institution">${escHtml(a.institution)}</div>
        <div class="acc-balance ${isNeg ? 'negative' : ''}">${Utils.fmt(a.balance)}</div>
        <div class="acc-footer">
          <button class="acc-sync-btn" data-id="${a.id}">
            <i data-lucide="refresh-cw" style="width:12px;height:12px"></i> Sync
          </button>
          <button class="action-btn edit-acc-btn" data-id="${a.id}" title="Edit">✏️</button>
          <button class="action-btn danger del-acc-btn" data-id="${a.id}" title="Delete">🗑️</button>
        </div>
      </div>`;
    }).join('');

    if (window.lucide) lucide.createIcons();

    // Edit
    grid.querySelectorAll('.edit-acc-btn').forEach(function(b) {
      b.addEventListener('click', function() { openAccModal(b.dataset.id); });
    });

    // Delete — check for linked transactions first
    grid.querySelectorAll('.del-acc-btn').forEach(function(b) {
      b.addEventListener('click', function() { deleteAcc(b.dataset.id); });
    });

    // Demo sync — shows a spinner-like animation
    grid.querySelectorAll('.acc-sync-btn').forEach(function(b) {
      b.addEventListener('click', function() {
        b.disabled = true;
        b.innerHTML = '<i data-lucide="loader"></i> Syncing…';
        if (window.lucide) lucide.createIcons();
        setTimeout(function() {
          b.innerHTML = '<i data-lucide="check"></i> Synced!';
          b.style.color = 'var(--accent)';
          b.style.borderColor = 'var(--accent)';
          if (window.lucide) lucide.createIcons();
          Utils.toast('Demo sync complete. (No real bank connection.)', 'success');
          setTimeout(function() {
            b.disabled = false;
            b.innerHTML = '<i data-lucide="refresh-cw" style="width:12px;height:12px"></i> Sync';
            b.style.color = ''; b.style.borderColor = '';
            if (window.lucide) lucide.createIcons();
          }, 2500);
        }, 1200);
      });
    });
  }

  function openAccModal(id) {
    var a = id ? DB.getAccounts().find(function(x) { return x.id === id; }) : null;
    Utils.openModal(a ? 'Edit Account' : 'Add Account', `
      <div class="form-group">
        <label class="form-label">Account Name *</label>
        <input class="form-control" id="am-name" value="${escHtml(a?.name||'')}" placeholder="e.g. SBI Savings" />
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Institution *</label>
          <input class="form-control" id="am-inst" value="${escHtml(a?.institution||'')}" placeholder="e.g. HDFC Bank" />
        </div>
        <div class="form-group">
          <label class="form-label">Account Type *</label>
          <select class="form-control" id="am-type">
            ${Object.entries(TYPE_LABELS).map(function(entry) {
              return '<option value="' + entry[0] + '" ' + (a?.type === entry[0] ? 'selected' : '') + '>' + entry[1] + '</option>';
            }).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Current Balance (₹) *</label>
        <p class="text-xs text-muted" style="margin-bottom:6px">Use a negative number for credit card debt (e.g. -32000)</p>
        <input class="form-control" id="am-balance" type="number" step="1" value="${a !== null && a !== undefined ? a.balance : ''}" placeholder="0" />
      </div>
      <div class="modal-footer" style="padding:0;border:none;margin-top:8px">
        <button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="am-save">Save Account</button>
      </div>
    `);
    document.getElementById('am-save').addEventListener('click', function() { saveAcc(id); });
  }

  function saveAcc(id) {
    var name    = (document.getElementById('am-name').value || '').trim();
    var inst    = (document.getElementById('am-inst').value || '').trim();
    var type    = document.getElementById('am-type').value;
    var balVal  = document.getElementById('am-balance').value;
    var balance = parseFloat(balVal);

    if (!name)        { Utils.toast('Account name is required.', 'error'); return; }
    if (!inst)        { Utils.toast('Institution name is required.', 'error'); return; }
    if (balVal === '' || isNaN(balance)) { Utils.toast('Enter a valid balance (use negative for debt).', 'error'); return; }

    if (id) {
      DB.updateAccount(id, { name:name, institution:inst, type:type, balance:balance });
      Utils.toast('Account updated.');
    } else {
      DB.addAccount({ name:name, institution:inst, type:type, balance:balance });
      Utils.toast('Account added successfully.');
    }
    Utils.closeModal();
    render();
  }

  function deleteAcc(id) {
    var a    = DB.getAccounts().find(function(x) { return x.id === id; });
    var name = a ? a.name : 'this account';

    // Check if transactions are linked to this account
    var linked = DB.getTransactions().filter(function(t) { return t.account === id; });
    var msg    = linked.length > 0
      ? 'Delete "' + escHtml(name) + '"? ' + linked.length + ' transaction(s) linked to this account will show "Unknown Account". This cannot be undone.'
      : 'Delete "' + escHtml(name) + '"? This cannot be undone.';

    Utils.confirm('Delete Account', msg, function() {
      DB.deleteAccount(id);
      Utils.toast('Account deleted.', 'warning');
      render();
    });
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  return { render };
})();
