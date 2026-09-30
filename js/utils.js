/* =============================================
   FINORA — Utilities (utils.js)
   ============================================= */

const Utils = (() => {
  'use strict';

  // ─── Currency ───────────────────────────────
  function fmt(amount) {
    const n = Number(amount) || 0;
    const abs = Math.abs(n);
    const str = abs.toLocaleString('en-IN', { maximumFractionDigits: 0 });
    return (n < 0 ? '-' : '') + '₹' + str;
  }

  // ─── Date ───────────────────────────────────
  function fmtDate(dateStr, style = 'short') {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    if (style === 'short')     return d.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    if (style === 'monthYear') return d.toLocaleDateString('en-IN', { month:'long', year:'numeric' });
    if (style === 'ms')        return d.toLocaleDateString('en-IN', { month:'short', year:'2-digit' });
    if (style === 'input')     return dateStr; // yyyy-mm-dd
    return dateStr;
  }

  function todayStr() {
    return '2026-09-30'; // fixed to demo date
  }

  // ─── Percentage ─────────────────────────────
  function pct(part, total) {
    if (!total) return 0;
    return Math.min(100, Math.round((part / total) * 100));
  }

  // ─── Toast ──────────────────────────────────
  let toastId = 0;
  function toast(message, type = 'success', ms = 3200) {
    const wrap = document.getElementById('toast-wrap');
    if (!wrap) return;
    const icons = { success:'✓', error:'✕', warning:'⚠', info:'ℹ' };
    const id = 'toast-' + (++toastId);
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.id = id;
    el.innerHTML =
      `<span class="toast-icon">${icons[type]||icons.info}</span>` +
      `<span class="toast-msg">${message}</span>` +
      `<button class="toast-close" onclick="document.getElementById('${id}').remove()">✕</button>`;
    wrap.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 350);
    }, ms);
  }

  // ─── Confirm Dialog ─────────────────────────
  function confirm(title, message, onOk, okLabel = 'Delete', okClass = 'btn-danger') {
    const wrap = document.getElementById('confirm-wrap');
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-msg').textContent = message;
    wrap.classList.remove('hidden');

    const okEl  = document.getElementById('confirm-ok');
    const canEl = document.getElementById('confirm-cancel');

    // Clone to remove old listeners
    const newOk  = okEl.cloneNode(true);
    const newCan = canEl.cloneNode(true);
    okEl.replaceWith(newOk);
    canEl.replaceWith(newCan);

    newOk.textContent = okLabel;
    newOk.className   = `btn ${okClass}`;

    newOk.addEventListener('click', () => {
      wrap.classList.add('hidden');
      onOk();
    });
    newCan.addEventListener('click', () => wrap.classList.add('hidden'));
  }

  // ─── Modal ──────────────────────────────────
  function openModal(title, html, opts = {}) {
    const wrap = document.getElementById('modal-wrap');
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = html;
    wrap.classList.remove('hidden');

    const closeAll = () => closeModal();
    document.getElementById('modal-x').onclick = closeAll;
    document.getElementById('modal-backdrop').onclick = closeAll;

    if (opts.onOpen) opts.onOpen();
  }

  function closeModal() {
    const wrap = document.getElementById('modal-wrap');
    wrap.classList.add('hidden');
    document.getElementById('modal-body').innerHTML = '';
  }

  // ─── Chart Helpers ──────────────────────────
  const _charts = {};

  function createChart(canvasId, config) {
    if (_charts[canvasId]) { _charts[canvasId].destroy(); delete _charts[canvasId]; }
    const el = document.getElementById(canvasId);
    if (!el) return null;
    _charts[canvasId] = new Chart(el, config);
    return _charts[canvasId];
  }

  function destroyCharts() {
    Object.keys(_charts).forEach(k => { _charts[k] && _charts[k].destroy(); delete _charts[k]; });
  }

  function chartTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return {
      text  : dark ? '#94A3B8' : '#718096',
      grid  : dark ? '#334155' : '#E2E8F0',
      bg    : dark ? '#1E293B' : '#FFFFFF',
    };
  }

  const PALETTE = ['#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6',
                   '#EC4899','#14B8A6','#6366F1','#F97316','#94A3B8'];

  // ─── Progress bar HTML ───────────────────────
  function progressHTML(value, max, colorClass = '') {
    const p = pct(value, max);
    const cls = p >= 100 ? 'over' : p >= 80 ? 'warn' : '';
    return `<div class="progress-bar">
      <div class="progress-fill ${cls || colorClass}" style="width:${p}%"></div>
    </div>`;
  }

  // ─── Category badge ──────────────────────────
  function catBadge(catId) {
    const cats = DB.getCategories();
    const cat = cats.find(c => c.id === catId) || { name:'Other', color:'#94A3B8', icon:'📦' };
    return `<span style="display:inline-flex;align-items:center;gap:4px;background:${cat.color}22;color:${cat.color};
      padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">
      ${cat.icon} ${cat.name}
    </span>`;
  }

  // ─── Account name ───────────────────────────
  function accName(accId) {
    const acc = DB.getAccounts().find(a => a.id === accId);
    return acc ? acc.name : accId;
  }

  // ─── Category name ──────────────────────────
  function catName(catId) {
    const cat = DB.getCategories().find(c => c.id === catId);
    return cat ? cat.name : catId;
  }

  // ─── Expose ─────────────────────────────────
  return {
    fmt, fmtDate, todayStr, pct,
    toast, confirm, openModal, closeModal,
    createChart, destroyCharts, chartTheme, PALETTE,
    progressHTML, catBadge, accName, catName,
  };
})();
