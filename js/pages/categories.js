/* ── Categories Page ── */
Pages.Categories = (() => {
  const DEFAULT_ICONS = ['🍔','🏠','🚗','🛍️','🎬','⚡','❤️','📚','💼','📈','📦','✈️','💰','🎮','🏋️','🎵','🍕','☕','🎁','🏥'];

  function render() {
    document.getElementById('page-content').innerHTML = `
<div class="page categories-page">
  <div class="flex-between mb-16">
    <div class="flex-center gap-8">
      <span class="badge badge-green" id="cat-expense-count"></span>
      <span class="badge badge-blue"  id="cat-income-count"></span>
    </div>
    <button class="btn btn-primary" id="add-cat-btn"><i data-lucide="plus"></i> Add Category</button>
  </div>

  <div style="margin-bottom:12px">
    <strong style="font-size:15px;color:var(--text)">Expense Categories</strong>
  </div>
  <div class="cats-grid" id="expense-cats-grid" style="margin-bottom:28px"></div>

  <div style="margin-bottom:12px">
    <strong style="font-size:15px;color:var(--text)">Income Categories</strong>
  </div>
  <div class="cats-grid" id="income-cats-grid" style="margin-bottom:28px"></div>

  <div style="margin-bottom:12px">
    <strong style="font-size:15px;color:var(--text)">Other</strong>
  </div>
  <div class="cats-grid" id="other-cats-grid"></div>
</div>`;

    if (window.lucide) lucide.createIcons();
    renderCategories();
    document.getElementById('add-cat-btn').addEventListener('click', () => openCatModal(null));
  }

  function renderCategories() {
    const cats = DB.getCategories();
    const txns = DB.getTransactions();

    const expCats  = cats.filter(c=>c.type==='expense');
    const incCats  = cats.filter(c=>c.type==='income');
    const bothCats = cats.filter(c=>c.type==='both'||!['expense','income'].includes(c.type));

    const expEl = document.getElementById('cat-expense-count');
    const incEl = document.getElementById('cat-income-count');
    if (expEl) expEl.textContent = expCats.length + ' Expense';
    if (incEl) incEl.textContent = incCats.length + ' Income';

    renderGrid('expense-cats-grid', expCats, txns);
    renderGrid('income-cats-grid',  incCats, txns);
    renderGrid('other-cats-grid',   bothCats, txns);
  }

  function renderGrid(gridId, cats, txns) {
    const el = document.getElementById(gridId);
    if (!el) return;
    if (!cats.length) { el.innerHTML = '<p class="text-muted text-sm">None</p>'; return; }

    el.innerHTML = cats.map(c => {
      const usage = txns.filter(t=>t.category===c.id).length;
      return `<div class="cat-card">
        <div class="cat-card-top">
          <div class="cat-card-icon" style="background:${c.color}22;font-size:22px">${c.icon}</div>
          <div>
            <div class="cat-card-name">${escHtml(c.name)}</div>
            <div class="cat-card-type">${c.type} · ${usage} txns</div>
          </div>
        </div>
        <div class="cat-card-actions">
          <button class="btn btn-sm btn-ghost edit-cat-btn" data-id="${c.id}" style="flex:1">Edit</button>
          <button class="btn btn-sm btn-ghost danger del-cat-btn" data-id="${c.id}" style="color:var(--danger)"${usage>0?` title="Has ${usage} transactions"`:''}>Del</button>
        </div>
      </div>`;
    }).join('');

    el.querySelectorAll('.edit-cat-btn').forEach(b => b.addEventListener('click', () => openCatModal(b.dataset.id)));
    el.querySelectorAll('.del-cat-btn').forEach(b  => b.addEventListener('click', () => deleteCat(b.dataset.id)));
  }

  function openCatModal(id) {
    const c = id ? DB.getCategories().find(x=>x.id===id) : null;
    Utils.openModal(c ? 'Edit Category' : 'Add Category', `
      <div class="form-group">
        <label class="form-label">Name *</label>
        <input class="form-control" id="cm-name" value="${escHtml(c?.name||'')}" placeholder="e.g. Dining Out" required />
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label class="form-label">Type *</label>
          <select class="form-control" id="cm-type">
            <option value="expense" ${c?.type==='expense'?'selected':''}>Expense</option>
            <option value="income"  ${c?.type==='income'?'selected':''}>Income</option>
            <option value="both"    ${c?.type==='both'?'selected':''}>Both</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Color</label>
          <input type="color" id="cm-color" value="${c?.color||'#10B981'}" style="width:100%;height:40px;border:none;cursor:pointer;border-radius:8px" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Icon (pick or type an emoji)</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px">
          ${DEFAULT_ICONS.map(ico=>`
            <button type="button" class="icon-pick-btn" data-icon="${ico}"
              style="width:36px;height:36px;border-radius:8px;border:2px solid ${(c?.icon===ico)?'var(--accent)':'var(--border)'};
              font-size:18px;cursor:pointer;background:var(--bg);transition:all .15s">${ico}</button>
          `).join('')}
        </div>
        <input class="form-control" id="cm-icon" value="${c?.icon||'📦'}" placeholder="Or type emoji" maxlength="4" />
      </div>
      <div class="modal-footer" style="padding:0;border:none;margin-top:8px">
        <button class="btn btn-ghost" onclick="Utils.closeModal()">Cancel</button>
        <button class="btn btn-primary" id="cm-save">Save Category</button>
      </div>
    `);

    // Icon picker
    document.querySelectorAll('.icon-pick-btn').forEach(b => {
      b.addEventListener('click', () => {
        document.getElementById('cm-icon').value = b.dataset.icon;
        document.querySelectorAll('.icon-pick-btn').forEach(x=>x.style.borderColor='var(--border)');
        b.style.borderColor = 'var(--accent)';
      });
    });

    document.getElementById('cm-save').addEventListener('click', () => saveCat(id));
  }

  function saveCat(id) {
    const name  = document.getElementById('cm-name').value.trim();
    const type  = document.getElementById('cm-type').value;
    const color = document.getElementById('cm-color').value;
    const icon  = document.getElementById('cm-icon').value || '📦';

    if (!name) { Utils.toast('Please enter a category name.', 'error'); return; }

    if (id) {
      DB.updateCategory(id, { name, type, color, icon });
      Utils.toast('Category updated.');
    } else {
      // Check for duplicate name
      if (DB.getCategories().some(c=>c.name.toLowerCase()===name.toLowerCase())) {
        Utils.toast('A category with this name already exists.', 'error'); return;
      }
      DB.addCategory({ name, type, color, icon });
      Utils.toast('Category added.');
    }
    Utils.closeModal();
    renderCategories();
  }

  function deleteCat(id) {
    const cat  = DB.getCategories().find(c=>c.id===id);
    const txns = DB.getTransactions().filter(t=>t.category===id);
    if (txns.length) {
      Utils.confirm(
        'Delete Category',
        `"${cat?.name}" is used in ${txns.length} transaction(s). They will be reassigned to "Other". Continue?`,
        () => {
          // Reassign transactions to 'cat-other'
          txns.forEach(t => DB.updateTransaction(t.id, { category:'cat-other' }));
          DB.deleteCategory(id);
          Utils.toast('Category deleted. Transactions reassigned to Other.', 'warning');
          renderCategories();
        }, 'Delete & Reassign', 'btn-danger'
      );
    } else {
      Utils.confirm('Delete Category', `Delete "${cat?.name}"?`, () => {
        DB.deleteCategory(id);
        Utils.toast('Category deleted.', 'warning');
        renderCategories();
      });
    }
  }

  function escHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

  return { render };
})();
