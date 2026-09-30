/* =============================================
   FINORA — Main Application (app.js)
   Router · Sidebar · Theme · Initialization
   ============================================= */

const App = (() => {
  'use strict';

  // ─── Route → Page title ─────────────────────
  const TITLES = {
    'dashboard'   : 'Dashboard',
    'transactions': 'Transactions',
    'accounts'    : 'Accounts',
    'net-worth'   : 'Net Worth',
    'budgets'     : 'Budgets',
    'goals'       : 'Goals',
    'recurring'   : 'Recurring',
    'cash-flow'   : 'Cash Flow',
    'reports'     : 'Reports',
    'categories'  : 'Categories',
    'settings'    : 'Settings',
  };

  // ─── Route → Page module ────────────────────
  function getRenderer(page) {
    const map = {
      'dashboard'   : Pages.Dashboard,
      'transactions': Pages.Transactions,
      'accounts'    : Pages.Accounts,
      'net-worth'   : Pages.NetWorth,
      'budgets'     : Pages.Budgets,
      'goals'       : Pages.Goals,
      'recurring'   : Pages.Recurring,
      'cash-flow'   : Pages.CashFlow,
      'reports'     : Pages.Reports,
      'categories'  : Pages.Categories,
      'settings'    : Pages.Settings,
    };
    return map[page] || Pages.Dashboard;
  }

  // ─── Navigate to a page ─────────────────────
  function navigate(page) {
    // Default to dashboard for unknown routes
    if (!(page in TITLES)) page = 'dashboard';

    // Destroy old Chart.js instances so they don't ghost
    Utils.destroyCharts();

    // Update page heading
    const titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = TITLES[page];

    // Highlight active nav link
    document.querySelectorAll('.nav-item').forEach(function(el) {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Clear page content and render new page
    const content = document.getElementById('page-content');
    if (content) content.innerHTML = '';

    try {
      const renderer = getRenderer(page);
      if (renderer && typeof renderer.render === 'function') {
        renderer.render();
      }
    } catch (err) {
      console.error('[Finora] Page render error on "' + page + '":', err);
      const content = document.getElementById('page-content');
      if (content) {
        content.innerHTML =
          '<div class="empty-state">' +
          '<div class="empty-icon">⚠️</div>' +
          '<h3>Something went wrong</h3>' +
          '<p>' + (err.message || 'Unknown error') + '</p>' +
          '<button class="btn btn-primary" onclick="window.location.hash=\'#/dashboard\'">Go to Dashboard</button>' +
          '</div>';
      }
    }

    // Re-initialize Lucide icons after DOM is updated
    if (window.lucide) lucide.createIcons();

    // Close mobile drawer on navigation
    closeSidebar();
  }

  // ─── Router ─────────────────────────────────
  function initRouter() {
    function handleHash() {
      // '#/dashboard' → 'dashboard', '' → 'dashboard'
      var hash = window.location.hash.slice(1); // remove '#'
      var page = hash.startsWith('/') ? hash.slice(1) : 'dashboard';
      navigate(page || 'dashboard');
    }
    window.addEventListener('hashchange', handleHash);
    handleHash(); // handle the initial URL on load
  }

  // ─── Sidebar ────────────────────────────────
  function initSidebar() {
    var sidebar   = document.getElementById('sidebar');
    var overlay   = document.getElementById('sidebar-overlay');
    var toggleBtn = document.getElementById('sidebar-toggle');
    var closeBtn  = document.getElementById('sidebar-close');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
    if (overlay)  overlay.addEventListener('click', closeSidebar);
  }

  function closeSidebar() {
    if (window.innerWidth < 768) {
      var sidebar = document.getElementById('sidebar');
      var overlay = document.getElementById('sidebar-overlay');
      if (sidebar) sidebar.classList.remove('open');
      if (overlay) overlay.classList.remove('active');
    }
  }

  // ─── Theme ──────────────────────────────────
  function initTheme() {
    // Apply saved theme on startup
    var s = DB.getSettings();
    applyTheme(s.theme || 'light');

    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', function() {
        var current = document.documentElement.getAttribute('data-theme');
        var next    = current === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        // Persist theme choice
        var settings = DB.getSettings();
        settings.theme = next;
        DB.saveSettings(settings);
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    var btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'dark'
        ? '<i data-lucide="sun"></i>'
        : '<i data-lucide="moon"></i>';
      if (window.lucide) lucide.createIcons();
    }
  }

  // ─── Profile Dropdown ───────────────────────
  function initProfileMenu() {
    var btn      = document.getElementById('profile-btn');
    var dropdown = document.getElementById('profile-dropdown');
    if (!btn || !dropdown) return;

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
      dropdown.classList.remove('show');
    });

    // Sign-out is disabled in demo
    var signOutBtn = document.getElementById('sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        dropdown.classList.remove('show');
        Utils.toast('Sign out is disabled in this demo.', 'info');
      });
    }
  }

  // ─── Global Search ──────────────────────────
  function initGlobalSearch() {
    var input = document.getElementById('global-search');
    if (!input) return;
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && input.value.trim()) {
        // Pass search term to Transactions page via sessionStorage
        sessionStorage.setItem('finora_search', input.value.trim());
        input.value = '';
        window.location.hash = '#/transactions';
      }
    });
  }

  // ─── Notification button ────────────────────
  function initNotifications() {
    var btn   = document.getElementById('notif-btn');
    var badge = document.getElementById('notif-badge');
    if (!btn) return;
    btn.addEventListener('click', function() {
      Utils.toast(
        '3 alerts: Food budget at 85%, Rent due Oct 2, Goal 40% complete!',
        'info', 4000
      );
      if (badge) badge.style.display = 'none';
    });
  }

  // ─── Help link ──────────────────────────────
  function initHelp() {
    var link = document.getElementById('help-link');
    if (!link) return;
    link.addEventListener('click', function(e) {
      e.preventDefault();
      Utils.toast('For help: arjun@example.com | College Project Demo v1.0', 'info', 4000);
    });
  }

  // ─── Update user profile display ────────────
  // Called on init and after profile save
  function updateUserInfo() {
    var s = DB.getSettings();
    // Build initials from name
    var parts    = (s.name || 'AR').split(' ').filter(Boolean);
    var initials = parts.map(function(n) { return n[0]; }).join('').toUpperCase().slice(0, 2) || 'AR';

    // Helper to safely set textContent
    function setText(id, val) {
      var el = document.getElementById(id);
      if (el) el.textContent = val;
    }

    setText('sidebar-name',  s.name);
    setText('sidebar-email', s.email);
    setText('dd-name',  s.name);
    setText('dd-email', s.email);

    // Set avatar initials in sidebar and topbar
    document.querySelectorAll('#sidebar-avatar, #topbar-avatar').forEach(function(el) {
      el.textContent = initials;
    });
  }

  // ─── Initialization ─────────────────────────
  function init() {
    // Load demo data into localStorage (skipped if already seeded)
    DB.seed();

    // Set up all UI systems
    initSidebar();
    initTheme();
    initProfileMenu();
    initGlobalSearch();
    initNotifications();
    initHelp();

    // Display user info from settings
    updateUserInfo();

    // Start the router (renders the initial page)
    initRouter();

    if (window.lucide) lucide.createIcons();

    console.log(
      '%c Finora v1.0 Ready! ',
      'background:#10B981;color:#fff;font-size:14px;padding:4px 8px;border-radius:4px'
    );
  }

  return { init, navigate, closeSidebar, updateUserInfo, applyTheme };
})();

// ─── Bootstrap on DOM ready ─────────────────
document.addEventListener('DOMContentLoaded', App.init);
