/* ── Settings Page ── */
Pages.Settings = (() => {

  function render() {
    const s = DB.getSettings();
    document.getElementById('page-content').innerHTML = `
<div class="page settings-page">
  <div class="settings-grid">

    <!-- LEFT column -->
    <div>
      <!-- Profile -->
      <div class="card settings-section">
        <div class="settings-section-title">👤 Profile</div>
        <div class="form-group">
          <label class="form-label">Full Name</label>
          <input class="form-control" id="set-name"  value="${escHtml(s.name)}" />
        </div>
        <div class="form-group">
          <label class="form-label">Email Address</label>
          <input class="form-control" id="set-email" type="email" value="${escHtml(s.email)}" />
        </div>
        <button class="btn btn-primary" id="save-profile-btn">Save Profile</button>
      </div>

      <!-- Appearance -->
      <div class="card settings-section" style="margin-top:20px">
        <div class="settings-section-title">🎨 Appearance</div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Theme</div>
            <div class="setting-desc">Choose your preferred color scheme</div>
          </div>
          <div class="theme-options">
            <button class="theme-opt ${s.theme==='light'?'active':''}" data-theme="light">☀️ Light</button>
            <button class="theme-opt ${s.theme==='dark'?'active':''}"  data-theme="dark">🌙 Dark</button>
          </div>
        </div>
      </div>

      <!-- Preferences -->
      <div class="card settings-section" style="margin-top:20px">
        <div class="settings-section-title">⚙️ Preferences</div>
        <div class="form-group">
          <label class="form-label">Currency</label>
          <select class="form-control" id="set-currency">
            <option value="INR" ${s.currency==='INR'?'selected':''}>₹ INR – Indian Rupee</option>
            <option value="USD" ${s.currency==='USD'?'selected':''}>$ USD – US Dollar</option>
            <option value="EUR" ${s.currency==='EUR'?'selected':''}>€ EUR – Euro</option>
            <option value="GBP" ${s.currency==='GBP'?'selected':''}>£ GBP – British Pound</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date Format</label>
          <select class="form-control" id="set-dateformat">
            <option value="DD/MM/YYYY" ${s.dateFormat==='DD/MM/YYYY'?'selected':''}>DD/MM/YYYY</option>
            <option value="MM/DD/YYYY" ${s.dateFormat==='MM/DD/YYYY'?'selected':''}>MM/DD/YYYY</option>
            <option value="YYYY-MM-DD" ${s.dateFormat==='YYYY-MM-DD'?'selected':''}>YYYY-MM-DD</option>
          </select>
        </div>
        <button class="btn btn-primary" id="save-prefs-btn">Save Preferences</button>
      </div>
    </div>

    <!-- RIGHT column -->
    <div>
      <!-- Notifications -->
      <div class="card settings-section">
        <div class="settings-section-title">🔔 Notifications</div>
        ${notifRow('Budget Alerts', 'Get notified when spending approaches budget limit', 'notif-budget', s.notifications.budgetAlerts)}
        ${notifRow('Goal Reminders', 'Monthly reminders for your savings goals', 'notif-goal', s.notifications.goalReminders)}
        ${notifRow('Recurring Reminders', 'Alert for upcoming recurring payments', 'notif-rec', s.notifications.recurringAlerts)}
        <button class="btn btn-primary" style="margin-top:14px" id="save-notif-btn">Save Notifications</button>
      </div>

      <!-- Data Management -->
      <div class="card settings-section" style="margin-top:20px">
        <div class="settings-section-title">💾 Data Management</div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Export All Data</div>
            <div class="setting-desc">Download all your data as a JSON backup</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="export-all-btn">
            <i data-lucide="download"></i> Export
          </button>
        </div>
        <div class="setting-row">
          <div class="setting-info">
            <div class="setting-label">Reset Demo Data</div>
            <div class="setting-desc">Restore all original demo data (cannot be undone)</div>
          </div>
          <button class="btn btn-danger btn-sm" id="reset-data-btn">
            <i data-lucide="refresh-cw"></i> Reset
          </button>
        </div>
      </div>

      <!-- App Info -->
      <div class="card settings-section" style="margin-top:20px">
        <div class="settings-section-title">ℹ️ About Finora</div>
        <div style="font-size:13px;color:var(--text-2);line-height:1.7">
          <p><strong>Finora</strong> — Personal Finance Manager</p>
          <p class="text-muted mt-4">Version: 1.0.0 · College Project Demo</p>
          <p class="text-muted">All data is stored locally in your browser.</p>
          <p class="text-muted">No data is sent to any server.</p>
          <p style="margin-top:12px;padding:10px;background:var(--accent-bg);border-radius:8px;font-size:12px;color:var(--accent-d)">
            💡 This is a simulated personal finance system for educational purposes.
            No real banking APIs or payment processing is involved.
          </p>
        </div>
      </div>
    </div>

  </div>
</div>`;

    if (window.lucide) lucide.createIcons();
    bindEvents();
  }

  function notifRow(label, desc, id, checked) {
    return `<div class="setting-row">
      <div class="setting-info">
        <div class="setting-label">${label}</div>
        <div class="setting-desc">${desc}</div>
      </div>
      <label class="toggle">
        <input type="checkbox" id="${id}" ${checked?'checked':''} />
        <span class="toggle-slider"></span>
      </label>
    </div>`;
  }

  function bindEvents() {
    // Profile save
    document.getElementById('save-profile-btn')?.addEventListener('click', () => {
      const s = DB.getSettings();
      s.name  = document.getElementById('set-name').value.trim();
      s.email = document.getElementById('set-email').value.trim();
      if (!s.name || !s.email) { Utils.toast('Please fill name and email.', 'error'); return; }
      DB.saveSettings(s);
      App.updateUserInfo();
      Utils.toast('Profile saved successfully.');
    });

    // Theme selector
    document.querySelectorAll('.theme-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-opt').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        const s = DB.getSettings(); s.theme = theme; DB.saveSettings(s);
        // update icon
        const icon = document.getElementById('theme-toggle');
        if (icon) icon.innerHTML = theme==='dark'?'<i data-lucide="sun"></i>':'<i data-lucide="moon"></i>';
        if (window.lucide) lucide.createIcons();
        Utils.toast(`${theme==='dark'?'Dark':'Light'} mode enabled.`);
      });
    });

    // Preferences save
    document.getElementById('save-prefs-btn')?.addEventListener('click', () => {
      const s = DB.getSettings();
      s.currency   = document.getElementById('set-currency').value;
      s.dateFormat = document.getElementById('set-dateformat').value;
      DB.saveSettings(s);
      Utils.toast('Preferences saved.');
    });

    // Notifications save
    document.getElementById('save-notif-btn')?.addEventListener('click', () => {
      const s = DB.getSettings();
      s.notifications.budgetAlerts   = document.getElementById('notif-budget').checked;
      s.notifications.goalReminders  = document.getElementById('notif-goal').checked;
      s.notifications.recurringAlerts= document.getElementById('notif-rec').checked;
      DB.saveSettings(s);
      Utils.toast('Notification preferences saved.');
    });

    // Export all data
    document.getElementById('export-all-btn')?.addEventListener('click', () => {
      const data = {
        transactions : DB.getTransactions(),
        accounts     : DB.getAccounts(),
        categories   : DB.getCategories(),
        budgets      : DB.getBudgets(),
        goals        : DB.getGoals(),
        recurring    : DB.getRecurring(),
        assets       : DB.getAssets(),
        liabilities  : DB.getLiabilities(),
        settings     : DB.getSettings(),
        exportedAt   : new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = 'finora_backup.json';
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      Utils.toast('Data exported successfully!');
    });

    // Reset data
    document.getElementById('reset-data-btn')?.addEventListener('click', () => {
      Utils.confirm(
        'Reset Demo Data',
        'This will delete all your data and restore the original demo. This cannot be undone!',
        () => {
          DB.reseed();
          Utils.toast('Demo data restored!', 'success');
          App.updateUserInfo();
          window.location.hash = '#/dashboard';
        },
        'Reset Everything',
        'btn-danger'
      );
    });

    // Sign out (just show a demo message)
    document.getElementById('sign-out-btn')?.addEventListener('click', e => {
      e.preventDefault();
      Utils.toast('Sign out is disabled in demo mode.', 'info');
    });
  }

  function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { render };
})();
