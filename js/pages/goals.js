/* ── Goals Page ── */
Pages.Goals = (() => {

  function render() {
    document.getElementById('page-content').innerHTML = `
<div class="page goals-page">
  <div class="flex-between mb-16">
    <p class="text-muted text-sm">Track progress towards your financial goals.</p>
    <button class="btn btn-primary" id="add-goal-btn"><i data-lucide="plus"></i> Add Goal</button>
  </div>

  <!-- Goals summary -->
  <div class="summary-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px" id="goals-summary"></div>

  <div class="goals-grid" id="goals-grid"></div>
</div>`;

    if (window.lucide) lucide.createIcons();
    renderGoals();
    document.getElementById('add-goal-btn').addEventListener('click', () => openGoalModal(null));
  }

  function renderGoals() {
    const goals = DB.getGoals();
    renderSummary(goals);
    const grid = document.getElementById('goals-grid');
    if (!grid) return;

    if (!goals.length) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">🎯</div>
        <h3>No goals yet</h3><p>Set a financial goal to start tracking your progress.</p>
        <button class="btn btn-primary mt-16" onclick="document.getElementById('add-goal-btn').click()">Add Goal</button>
      </div>`;
      return;
    }

    grid.innerHTML = goals.map(g => {
      const p = Utils.pct(g.current, g.target);
      const rem = g.target - g.current;
      const daysLeft = Math.ceil((new Date(g.targetDate) - new Date(Utils.todayStr())) / 86400000);
      return `<div class="goal-card">
        <div class="goal-card-header">
          <div>
            <div class="goal-card-icon" style="background:${g.color}22">${g.icon}</div>
          </div>
          <div class="action-btns">
            <button class="action-btn add-money-btn" data-id="${g.id}" title="Add money">➕</button>
            <button class="action-btn edit-goal-btn" data-id="${g.id}" title="Edit">✏️</button>
            <button class="action-btn danger del-goal-btn" data-id="${g.id}" title="Delete">🗑️</button>
          </div>
        </div>
        <div class="goal-card-title">${escHtml(g.name)}</div>
        <div class="goal-card-date">Target: ${Utils.fmtDate(g.targetDate)} · ${daysLeft > 0 ? daysLeft + ' days left' : 'Past due'}</div>
        <div class="goal-amounts mt-8">
          <div class="goal-current" style="color:${g.color}">${Utils.fmt(g.current)}</div>
          <div class="goal-target">of ${Utils.fmt(g.target)}</div>
        </div>
        <div class="goal-pct">${p}% complete</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${p}%;background:${g.color}"></div>
        </div>
        <div style="font-size:12px;color:var(--text-3);margin-top:6px">
          ${p >= 100 ? '🎉 Goal achieved!' : Utils.fmt(rem) + ' remaining'}
        </div>
        <div class="goal-actions">
          <button class="btn btn-sm btn-primary add-money-btn" data-id="${g.id}">+ Add Money</button>
          <button class="btn btn-sm btn-ghost edit-goal-btn" data-id="${g.id}">Edit</button>
          <button class="btn btn-sm btn-ghost danger del-goal-btn" data-id="${g.id}" style="color:var(--danger)">Delete</button>
        </div>
      </div>`;
    }).join('');

    grid.querySelectorAll('.edit-goal-btn').forEach(b => b.addEventListener('click', () => openGoalModal(b.dataset.id)));
    grid.querySelectorAll('.del-goal-btn').forEach(b  => b.addEventListener('click', () => deleteGoal(b.dataset.id)));
    grid.querySelectorAll('.add-money-btn').forEach(b => b.addEventListener('click', () => openAddMoneyModal(b.dataset.id)));
  }

  function renderSummary(goals) {
    const el = document.getElementById('goals-summary');
    if (!el) return;
    const totalTarget  = goals.reduce((s,g)=>s+g.target,0);
    const totalSaved   = goals.reduce((s,g)=>s+g.current,0);
    const achieved     = goals.filter(g=>g.current>=g.target).length;
    el.innerHTML = `
      <div class="summary-card">
        <div class="s-label">Total Target</div>
        <div class="s-value">${Utils.fmt(totalTarget)}</div>
      </div>
      <div class="summary-card accent">
        <div class="s-label">Total Saved</div>
        <div class="s-value">${Utils.fmt(totalSaved)}</div>
        <div class="s-change pos">${Utils.pct(totalSaved,totalTarget)}% of all goals</div>
      </div>
      <div class="summary-card">
        <div class="s-label">Goals Achieved</div>
        <div class="s-value">${achieved} / ${goals.length}</div>
      </div>`;
  }

  function openGoalModal(id) {
    const g = id ? DB.getGoals().find(x=>x.id===id) : null;
    Utils.openModal(g ? 'Edit Goal' : 'Add Goal', `
      <div class="form-group">
        <label class="form-label">Goal Name *</label>
        <input class="form-control" id="gm-name" value="${escHtml(g?.name||'')}" placeholder="e.g. Emergency Fund" required />
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Target Amount (₹) *</label>
          <input class="form-control" id="gm-target" type="number" min="1" value="${g?.target||''}" placeholder="0" required />
        </div>
        <div class="form-group">
          <label class="form-label">Current Saved (₹)</label>
          <input class="form-control" id="gm-current" type="number" min="0" value="${g?.current||0}" placeholder="0" />
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Target Date *</label>
          <input class="form-control" id="gm-date" type="date" value="${g?.targetDate||''}" required />
        </div>
        <div class="form-group">
          <label class="form-label">Icon (emoji)</label>
          <input class="form-control" id="gm-icon" value="${g?.icon||'🎯'}" placeholder="🎯" maxlength="4" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Color</label>
        <input type="color" id="gm-color" value="${g?.color||'#10B981'}" style="width:60px;height:36px;border:none;cursor:pointer;border-radius:6px" />
      </div>
      <div class="modal-footer" style="padding:0;border:none;margin-top:8px">
        <button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="gm-save">Save Goal</button>
      </div>
    `);
    document.getElementById('gm-save').addEventListener('click', () => saveGoal(id));
  }

  function saveGoal(id) {
    const name    = document.getElementById('gm-name').value.trim();
    const target  = parseFloat(document.getElementById('gm-target').value);
    const current = parseFloat(document.getElementById('gm-current').value) || 0;
    const date    = document.getElementById('gm-date').value;
    const icon    = document.getElementById('gm-icon').value || '🎯';
    const color   = document.getElementById('gm-color').value;

    if (!name || !target || !date) { Utils.toast('Please fill all required fields.', 'error'); return; }

    const data = { name, target, current, targetDate: date, icon, color };
    if (id) { DB.updateGoal(id, data); Utils.toast('Goal updated.'); }
    else    { DB.addGoal(data);        Utils.toast('Goal added successfully.'); }
    Utils.closeModal(); renderGoals();
  }

  function openAddMoneyModal(id) {
    const g = DB.getGoals().find(x=>x.id===id);
    if (!g) return;
    Utils.openModal('Add Money to Goal', `
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-size:40px;margin-bottom:8px">${g.icon}</div>
        <strong style="font-size:16px">${escHtml(g.name)}</strong>
        <p class="text-muted text-sm mt-4">Current: ${Utils.fmt(g.current)} / ${Utils.fmt(g.target)}</p>
        <div class="progress-bar mt-8">
          <div class="progress-fill" style="width:${Utils.pct(g.current,g.target)}%;background:${g.color}"></div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Amount to Add (₹) *</label>
        <input class="form-control" id="am-amt" type="number" min="1" placeholder="0" style="font-size:18px;text-align:center" />
      </div>
      <div class="modal-footer" style="padding:0;border:none;margin-top:8px">
        <button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="am-save">Add Money</button>
      </div>
    `);
    document.getElementById('am-save').addEventListener('click', () => {
      const amt = parseFloat(document.getElementById('am-amt').value);
      if (!amt || amt <= 0) { Utils.toast('Enter a valid amount.', 'error'); return; }
      const newCurrent = Math.min(g.target, g.current + amt);
      DB.updateGoal(id, { current: newCurrent });
      Utils.toast(`₹${amt.toLocaleString('en-IN')} added to "${g.name}"!`);
      Utils.closeModal();
      renderGoals();
    });
  }

  function deleteGoal(id) {
    const g = DB.getGoals().find(x=>x.id===id);
    Utils.confirm('Delete Goal', `Delete goal "${g?.name}"?`, () => {
      DB.deleteGoal(id);
      Utils.toast('Goal deleted.', 'warning');
      renderGoals();
    });
  }

  function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { render };
})();
