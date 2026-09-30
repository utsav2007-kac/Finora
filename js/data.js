/* =============================================
   FINORA — Data Management (data.js)
   All demo data, localStorage helpers, and
   computed-data functions live here.
   ============================================= */

const DB = (() => {
  'use strict';

  // ─── Storage Keys ───────────────────────────
  const K = {
    transactions : 'fnr_transactions',
    accounts     : 'fnr_accounts',
    categories   : 'fnr_categories',
    budgets      : 'fnr_budgets',
    goals        : 'fnr_goals',
    recurring    : 'fnr_recurring',
    assets       : 'fnr_assets',
    liabilities  : 'fnr_liabilities',
    settings     : 'fnr_settings',
    seeded       : 'fnr_seeded',
  };

  // ─── Unique ID ──────────────────────────────
  function uid() {
    return '_' + Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
  }

  // ─── localStorage helpers ───────────────────
  function load(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null; // handle corrupted JSON gracefully
    }
  }
  function save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('[Finora] localStorage write failed:', e);
    }
  }

  // ════════════════════════════════════════════
  //  DEMO DATA
  // ════════════════════════════════════════════

  var DEMO_CATEGORIES = [
    { id:'cat-food',      name:'Food & Dining',   color:'#F59E0B', icon:'🍔', type:'expense' },
    { id:'cat-house',     name:'Housing',          color:'#8B5CF6', icon:'🏠', type:'expense' },
    { id:'cat-trans',     name:'Transportation',   color:'#3B82F6', icon:'🚗', type:'expense' },
    { id:'cat-shop',      name:'Shopping',         color:'#EC4899', icon:'🛍️', type:'expense' },
    { id:'cat-entertain', name:'Entertainment',    color:'#14B8A6', icon:'🎬', type:'expense' },
    { id:'cat-util',      name:'Utilities',        color:'#6366F1', icon:'⚡', type:'expense' },
    { id:'cat-health',    name:'Health',           color:'#EF4444', icon:'❤️', type:'expense' },
    { id:'cat-edu',       name:'Education',        color:'#F97316', icon:'📚', type:'expense' },
    { id:'cat-salary',    name:'Salary',           color:'#10B981', icon:'💼', type:'income'  },
    { id:'cat-invest',    name:'Investment',       color:'#1E40AF', icon:'📈', type:'both'    },
    { id:'cat-other',     name:'Other',            color:'#94A3B8', icon:'📦', type:'expense' },
  ];

  var DEMO_ACCOUNTS = [
    { id:'acc-sbi-sav',  name:'SBI Savings',        institution:'State Bank of India', type:'savings',    balance:245000 },
    { id:'acc-hdfc-cur', name:'HDFC Current',        institution:'HDFC Bank',           type:'checking',   balance:85000  },
    { id:'acc-sbi-cc',   name:'SBI Credit Card',     institution:'State Bank of India', type:'credit',     balance:-32000 },
    { id:'acc-zerodha',  name:'Zerodha Portfolio',   institution:'Zerodha',             type:'investment', balance:450000 },
    { id:'acc-cash',     name:'Cash',                institution:'On Hand',             type:'cash',       balance:8500   },
    { id:'acc-hdfc-sal', name:'HDFC Salary Account', institution:'HDFC Bank',           type:'checking',   balance:125000 },
  ];

  // Generate realistic 80+ transactions for Apr–Sep 2026
  function generateTransactions() {
    var months = ['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'];
    var txns = [];

    months.forEach(function(m, mi) {
      // Salary income (1st of each month)
      txns.push({ id:uid(), date:m+'-01', merchant:'TCS India',          category:'cat-salary',
        account:'acc-hdfc-sal', amount:85000, type:'income',  notes:'Monthly Salary' });

      // Rent expense (2nd of each month)
      txns.push({ id:uid(), date:m+'-02', merchant:'Prestige Properties', category:'cat-house',
        account:'acc-sbi-sav',  amount:20000, type:'expense', notes:'Monthly Rent' });

      // SIP investment
      txns.push({ id:uid(), date:m+'-05', merchant:'Zerodha SIP',         category:'cat-invest',
        account:'acc-hdfc-sal', amount:10000, type:'expense', notes:'Monthly SIP – Mutual Fund' });

      // Food transactions
      var food = [
        ['Swiggy',            400+rnd(350), '03'],
        ['Zomato',            350+rnd(300), '09'],
        ['BigBasket',        1700+rnd(600), '14'],
        ['DMart',            2100+rnd(900), '20'],
        ['Café Coffee Day',   250+rnd(150), '24'],
        ['Swiggy Instamart',  600+rnd(200), '27'],
      ];
      food.forEach(function(row) {
        txns.push({ id:uid(), date:m+'-'+row[2], merchant:row[0], category:'cat-food',
          account: mi%2===0 ? 'acc-hdfc-cur' : 'acc-sbi-cc',
          amount:row[1], type:'expense', notes:'' });
      });

      // Transportation
      txns.push({ id:uid(), date:m+'-07', merchant:'Ola Cabs',        category:'cat-trans', account:'acc-hdfc-cur', amount:800+rnd(500),  type:'expense', notes:'' });
      txns.push({ id:uid(), date:m+'-13', merchant:'Petrol – IndianOil', category:'cat-trans', account:'acc-hdfc-cur', amount:2400+rnd(600), type:'expense', notes:'' });
      txns.push({ id:uid(), date:m+'-22', merchant:'Uber',            category:'cat-trans', account:'acc-hdfc-cur', amount:600+rnd(400),  type:'expense', notes:'' });

      // Shopping
      txns.push({ id:uid(), date:m+'-10', merchant:'Amazon India', category:'cat-shop', account:'acc-sbi-cc', amount:2000+rnd(3500), type:'expense', notes:'' });
      txns.push({ id:uid(), date:m+'-17', merchant:'Flipkart',      category:'cat-shop', account:'acc-sbi-cc', amount:1200+rnd(2500), type:'expense', notes:'' });
      if (mi%2===0) txns.push({ id:uid(), date:m+'-25', merchant:'Myntra', category:'cat-shop', account:'acc-sbi-cc', amount:1500+rnd(2000), type:'expense', notes:'' });

      // Entertainment
      txns.push({ id:uid(), date:m+'-03', merchant:'Netflix',     category:'cat-entertain', account:'acc-sbi-cc',   amount:649,          type:'expense', notes:'Streaming subscription' });
      txns.push({ id:uid(), date:m+'-16', merchant:'PVR Cinemas', category:'cat-entertain', account:'acc-hdfc-cur', amount:800+rnd(600),  type:'expense', notes:'' });
      if (mi===1||mi===4) txns.push({ id:uid(), date:m+'-28', merchant:'BookMyShow', category:'cat-entertain', account:'acc-hdfc-cur', amount:500+rnd(400), type:'expense', notes:'' });

      // Utilities
      txns.push({ id:uid(), date:m+'-05', merchant:'BESCOM Electricity', category:'cat-util', account:'acc-sbi-sav',  amount:1100+rnd(700), type:'expense', notes:'' });
      txns.push({ id:uid(), date:m+'-06', merchant:'Airtel Broadband',   category:'cat-util', account:'acc-sbi-sav',  amount:999,           type:'expense', notes:'Internet bill' });
      txns.push({ id:uid(), date:m+'-07', merchant:'Jio Mobile',         category:'cat-util', account:'acc-hdfc-cur', amount:299,           type:'expense', notes:'Mobile recharge' });

      // Health (selective months)
      if (mi===0||mi===2||mi===4) txns.push({ id:uid(), date:m+'-21', merchant:'Apollo Pharmacy', category:'cat-health', account:'acc-hdfc-cur', amount:1000+rnd(900), type:'expense', notes:'' });
      if (mi===2) txns.push({ id:uid(), date:m+'-23', merchant:'Dr. Reddy Clinic', category:'cat-health', account:'acc-hdfc-cur', amount:1500, type:'expense', notes:'Consultation' });
      if (mi===5) txns.push({ id:uid(), date:m+'-18', merchant:'Cult.fit Gym', category:'cat-health', account:'acc-hdfc-cur', amount:2499, type:'expense', notes:'Gym membership' });

      // Education (selective)
      if (mi===0||mi===3) txns.push({ id:uid(), date:m+'-19', merchant:'Udemy',    category:'cat-edu', account:'acc-sbi-cc', amount:599,  type:'expense', notes:'Online course' });
      if (mi===1)          txns.push({ id:uid(), date:m+'-26', merchant:'Coursera', category:'cat-edu', account:'acc-sbi-cc', amount:1899, type:'expense', notes:'Monthly subscription' });

      // Insurance
      txns.push({ id:uid(), date:m+'-10', merchant:'LIC Insurance', category:'cat-other', account:'acc-hdfc-cur', amount:5000, type:'expense', notes:'Monthly premium' });

      // Freelance income (some months)
      if (mi===1||mi===4) txns.push({ id:uid(), date:m+'-28', merchant:'Freelance – Web Design', category:'cat-salary', account:'acc-sbi-sav', amount:15000+rnd(10000), type:'income', notes:'Freelance project' });
    });

    // Sort newest-first
    txns.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });
    return txns;
  }

  function rnd(n) { return Math.floor(Math.random() * n); }

  var DEMO_GOALS = [
    { id:'goal-1', name:'Emergency Fund',    target:300000, current:95000, targetDate:'2027-03-31', icon:'🛡️', color:'#10B981' },
    { id:'goal-2', name:'Goa Vacation',      target:50000,  current:28000, targetDate:'2026-12-31', icon:'✈️', color:'#3B82F6' },
    { id:'goal-3', name:'MacBook Pro',       target:150000, current:45000, targetDate:'2027-06-30', icon:'💻', color:'#8B5CF6' },
    { id:'goal-4', name:'Car Down Payment',  target:200000, current:82000, targetDate:'2028-01-31', icon:'🚗', color:'#F59E0B' },
  ];

  var DEMO_RECURRING = [
    { id:'rec-1', merchant:'Prestige Properties', amount:20000, frequency:'monthly', nextDate:'2026-10-02', category:'cat-house',     account:'acc-sbi-sav',  status:'active', type:'expense' },
    { id:'rec-2', merchant:'Netflix',              amount:649,   frequency:'monthly', nextDate:'2026-10-03', category:'cat-entertain', account:'acc-sbi-cc',   status:'active', type:'expense' },
    { id:'rec-3', merchant:'Airtel Broadband',     amount:999,   frequency:'monthly', nextDate:'2026-10-06', category:'cat-util',      account:'acc-sbi-sav',  status:'active', type:'expense' },
    { id:'rec-4', merchant:'LIC Insurance',        amount:5000,  frequency:'monthly', nextDate:'2026-10-10', category:'cat-other',     account:'acc-hdfc-cur', status:'active', type:'expense' },
    { id:'rec-5', merchant:'BESCOM Electricity',   amount:1500,  frequency:'monthly', nextDate:'2026-10-05', category:'cat-util',      account:'acc-sbi-sav',  status:'active', type:'expense' },
    { id:'rec-6', merchant:'TCS India Salary',     amount:85000, frequency:'monthly', nextDate:'2026-10-01', category:'cat-salary',    account:'acc-hdfc-sal', status:'active', type:'income'  },
    { id:'rec-7', merchant:'Zerodha SIP',          amount:10000, frequency:'monthly', nextDate:'2026-10-05', category:'cat-invest',    account:'acc-hdfc-sal', status:'active', type:'expense' },
    { id:'rec-8', merchant:'Cult.fit Gym',         amount:2499,  frequency:'monthly', nextDate:'2026-10-15', category:'cat-health',    account:'acc-hdfc-cur', status:'paused', type:'expense' },
  ];

  // "Current" month is fixed to Sep 2026 to match the demo data window
  function curMonth() { return '2026-09'; }

  var DEMO_BUDGETS = [
    { id:'bud-1', category:'cat-food',      amount:12000, month:curMonth() },
    { id:'bud-2', category:'cat-house',     amount:22000, month:curMonth() },
    { id:'bud-3', category:'cat-trans',     amount:6000,  month:curMonth() },
    { id:'bud-4', category:'cat-shop',      amount:10000, month:curMonth() },
    { id:'bud-5', category:'cat-entertain', amount:5000,  month:curMonth() },
    { id:'bud-6', category:'cat-util',      amount:4000,  month:curMonth() },
  ];

  var DEMO_ASSETS = [
    { id:'as-1', name:'SBI Savings Account',  type:'cash',       value:245000 },
    { id:'as-2', name:'HDFC Current Account', type:'cash',       value:85000  },
    { id:'as-3', name:'HDFC Salary Account',  type:'cash',       value:125000 },
    { id:'as-4', name:'Cash on Hand',         type:'cash',       value:8500   },
    { id:'as-5', name:'Zerodha Portfolio',    type:'investment', value:450000 },
    { id:'as-6', name:'PPF Account',          type:'investment', value:85000  },
    { id:'as-7', name:'Gold (10g)',           type:'other',      value:75000  },
  ];

  var DEMO_LIABILITIES = [
    { id:'li-1', name:'SBI Credit Card',      type:'credit-card',  value:32000  },
    { id:'li-2', name:'Education Loan (HDFC)', type:'student-loan', value:120000 },
    { id:'li-3', name:'Personal Loan',         type:'other-loan',   value:50000  },
  ];

  var DEMO_SETTINGS = {
    name: 'Arjun Raj',
    email: 'arjun@example.com',
    currency: 'INR',
    dateFormat: 'DD/MM/YYYY',
    theme: 'light',
    notifications: { budgetAlerts:true, goalReminders:true, recurringAlerts:true },
  };

  // ─── Seed (first-run only) ──────────────────
  function seed() {
    if (load(K.seeded)) return; // already seeded
    _doSeed();
  }

  // Internal: write all demo data and mark as seeded
  function _doSeed() {
    save(K.categories,   DEMO_CATEGORIES);
    save(K.accounts,     DEMO_ACCOUNTS);
    save(K.transactions, generateTransactions());
    save(K.goals,        DEMO_GOALS);
    save(K.recurring,    DEMO_RECURRING);
    save(K.budgets,      DEMO_BUDGETS);
    save(K.assets,       DEMO_ASSETS);
    save(K.liabilities,  DEMO_LIABILITIES);
    save(K.settings,     DEMO_SETTINGS);
    save(K.seeded,       '1');
  }

  // Full reset: wipe everything and re-seed with original demo data
  function reseed() {
    Object.values(K).forEach(function(k) { localStorage.removeItem(k); });
    _doSeed();
  }

  // ════════════════════════════════════════════
  //  GENERIC CRUD HELPERS
  // ════════════════════════════════════════════

  function getAll(key)       { return load(key) || []; }
  function saveAll(key, arr) { save(key, arr); }

  function addItem(key, obj) {
    var list = getAll(key);
    obj.id = uid();
    list.push(obj);
    saveAll(key, list);
    return obj;
  }

  function updateItem(key, id, updates) {
    var list = getAll(key);
    var i    = list.findIndex(function(x) { return x.id === id; });
    if (i !== -1) list[i] = Object.assign({}, list[i], updates);
    saveAll(key, list);
  }

  function deleteItem(key, id) {
    saveAll(key, getAll(key).filter(function(x) { return x.id !== id; }));
  }

  // ════════════════════════════════════════════
  //  PUBLIC API — each entity
  // ════════════════════════════════════════════

  // Transactions (always kept sorted newest-first)
  function getTransactions() { return getAll(K.transactions); }
  function addTransaction(t) {
    var list = getAll(K.transactions);
    t.id = uid();
    list.unshift(t);
    list.sort(function(a,b) { return new Date(b.date) - new Date(a.date); });
    saveAll(K.transactions, list);
    return t;
  }
  function updateTransaction(id, updates) {
    var list = getAll(K.transactions);
    var i    = list.findIndex(function(x) { return x.id === id; });
    if (i !== -1) list[i] = Object.assign({}, list[i], updates);
    list.sort(function(a,b) { return new Date(b.date) - new Date(a.date); });
    saveAll(K.transactions, list);
  }
  function deleteTransaction(id) {
    saveAll(K.transactions, getAll(K.transactions).filter(function(x) { return x.id !== id; }));
  }

  // Accounts
  function getAccounts()           { return getAll(K.accounts); }
  function addAccount(a)           { return addItem(K.accounts, a); }
  function updateAccount(id, u)    { updateItem(K.accounts, id, u); }
  function deleteAccount(id)       { deleteItem(K.accounts, id); }

  // Categories
  function getCategories()         { return getAll(K.categories); }
  function addCategory(c)          { return addItem(K.categories, c); }
  function updateCategory(id, u)   { updateItem(K.categories, id, u); }
  function deleteCategory(id)      { deleteItem(K.categories, id); }

  // Budgets
  function getBudgets()            { return getAll(K.budgets); }
  function saveBudgets(arr)        { saveAll(K.budgets, arr); }
  function upsertBudget(category, amount, month) {
    var list = getBudgets();
    var i    = list.findIndex(function(b) { return b.category === category && b.month === month; });
    if (i !== -1) {
      list[i].amount = Number(amount);
    } else {
      list.push({ id:uid(), category:category, amount:Number(amount), month:month });
    }
    saveBudgets(list);
  }

  // Goals
  function getGoals()              { return getAll(K.goals); }
  function addGoal(g)              { return addItem(K.goals, g); }
  function updateGoal(id, u)       { updateItem(K.goals, id, u); }
  function deleteGoal(id)          { deleteItem(K.goals, id); }

  // Recurring
  function getRecurring()          { return getAll(K.recurring); }
  function addRecurring(r)         { return addItem(K.recurring, r); }
  function updateRecurring(id, u)  { updateItem(K.recurring, id, u); }
  function deleteRecurring(id)     { deleteItem(K.recurring, id); }

  // Assets / Liabilities
  function getAssets()             { return getAll(K.assets); }
  function saveAssets(arr)         { saveAll(K.assets, arr); }
  function getLiabilities()        { return getAll(K.liabilities); }
  function saveLiabilities(arr)    { saveAll(K.liabilities, arr); }

  // Settings — always returns a safe object even if corrupt
  function getSettings() {
    var s = load(K.settings);
    if (!s || typeof s !== 'object') return Object.assign({}, DEMO_SETTINGS);
    // Ensure notifications sub-object exists
    if (!s.notifications) s.notifications = DEMO_SETTINGS.notifications;
    return s;
  }
  function saveSettings(obj) { save(K.settings, obj); }

  // ════════════════════════════════════════════
  //  COMPUTED HELPERS
  //  These recalculate live from stored data —
  //  no stale caches.
  // ════════════════════════════════════════════

  // "Current" month (fixed to demo window)
  function currentMonth() { return curMonth(); }

  // Transactions filtered to a given YYYY-MM month
  function getMonthTransactions(month) {
    return getTransactions().filter(function(t) { return t.date.startsWith(month); });
  }

  // Sum all transactions of a given type ('income' | 'expense')
  function sumByType(txns, type) {
    return txns.filter(function(t) { return t.type === type; })
               .reduce(function(s, t) { return s + (Number(t.amount) || 0); }, 0);
  }

  // Spending grouped by category for a given month, sorted descending
  function getSpendingByCategory(month) {
    var txns = getMonthTransactions(month).filter(function(t) { return t.type === 'expense'; });
    var cats = getCategories();
    var map  = {};
    txns.forEach(function(t) { map[t.category] = (map[t.category] || 0) + (Number(t.amount) || 0); });
    return Object.entries(map).map(function(entry) {
      var catId  = entry[0];
      var amount = entry[1];
      var cat    = cats.find(function(c) { return c.id === catId; }) || { name:'Other', color:'#94A3B8', icon:'📦' };
      return { catId:catId, name:cat.name, color:cat.color, icon:cat.icon, amount:amount };
    }).sort(function(a, b) { return b.amount - a.amount; });
  }

  // Monthly income/expense data for the 6-month demo window
  function getMonthlyData() {
    var months = ['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'];
    var txns   = getTransactions();
    return months.map(function(m) {
      var mt      = txns.filter(function(t) { return t.date.startsWith(m); });
      var income  = sumByType(mt, 'income');
      var expense = sumByType(mt, 'expense');
      var label   = new Date(m + '-01').toLocaleDateString('en-IN', { month:'short', year:'2-digit' });
      return { month:m, label:label, income:income, expense:expense, net: income - expense };
    });
  }

  // Simulated net worth history (current NW trended back 5 months)
  function getNetWorthHistory() {
    var months  = ['2026-04','2026-05','2026-06','2026-07','2026-08','2026-09'];
    var currentNW = getNetWorth();
    return months.map(function(m, i) {
      return {
        month: m,
        label: new Date(m + '-01').toLocaleDateString('en-IN', { month:'short' }),
        // Simulate historical growth: each month was ~₹28K less + some variation
        value: Math.round(currentNW - (5 - i) * 28000 + (i * 3000))
      };
    });
  }

  // Net Worth = Total Assets − Total Liabilities
  function getTotalAssets()      { return getAssets().reduce(function(s,a) { return s + (Number(a.value)||0); }, 0); }
  function getTotalLiabilities() { return getLiabilities().reduce(function(s,l) { return s + (Number(l.value)||0); }, 0); }
  function getNetWorth()         { return getTotalAssets() - getTotalLiabilities(); }

  // Total cash across savings/checking/cash accounts (positive balances only)
  function getTotalCash() {
    return getAccounts()
      .filter(function(a) { return ['savings','checking','cash'].includes(a.type); })
      .reduce(function(s, a) { return s + Math.max(Number(a.balance) || 0, 0); }, 0);
  }

  // Total investment account balances
  function getTotalInvestments() {
    return getAccounts()
      .filter(function(a) { return a.type === 'investment'; })
      .reduce(function(s, a) { return s + (Number(a.balance) || 0); }, 0);
  }

  // ─── Expose public API ──────────────────────
  return {
    uid, seed, reseed,
    // Transactions
    getTransactions, addTransaction, updateTransaction, deleteTransaction,
    // Accounts
    getAccounts, addAccount, updateAccount, deleteAccount,
    // Categories
    getCategories, addCategory, updateCategory, deleteCategory,
    // Budgets
    getBudgets, saveBudgets, upsertBudget,
    // Goals
    getGoals, addGoal, updateGoal, deleteGoal,
    // Recurring
    getRecurring, addRecurring, updateRecurring, deleteRecurring,
    // Assets / Liabilities
    getAssets, saveAssets, getLiabilities, saveLiabilities,
    // Settings
    getSettings, saveSettings,
    // Computed
    currentMonth, getMonthTransactions, sumByType,
    getSpendingByCategory, getMonthlyData, getNetWorthHistory,
    getTotalAssets, getTotalLiabilities, getNetWorth,
    getTotalCash, getTotalInvestments,
  };
})();
