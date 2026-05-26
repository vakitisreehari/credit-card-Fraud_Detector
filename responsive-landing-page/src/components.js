/**
 * FraudShield AI — Dynamic UI Components Engine
 * Production-grade vanilla DOM rendering components matching Stripe/Vercel fidelity.
 */

import { store } from './state.js';
import { sanitizeInput, formatCurrency, formatDate, animateValue } from './utils.js';

/* ==========================================================================
   1. Dynamic Toast Notification System
   ========================================================================== */

/**
 * Pushes a toast notification into the global state and renders it.
 * @param {string} type - 'success' | 'warning' | 'danger' | 'info'
 * @param {string} message - Notification text
 * @param {number} [duration=4000] - Duration in ms
 */
export function triggerToast(type, message, duration = 4000) {
  const id = 'toast_' + Math.random().toString(36).substring(2, 9);
  const container = document.getElementById('toasts-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.id = id;
  toast.setAttribute('role', 'alert');
  toast.className = `flex items-center justify-between p-4 rounded-xl border shadow-lg transition-all duration-300 transform translate-x-12 opacity-0 pointer-events-auto max-w-sm w-full`;
  
  // Theme & severity custom colors
  let visualClasses = '';
  let iconSvg = '';
  switch (type) {
    case 'success':
      visualClasses = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500';
      iconSvg = '<svg class="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"></path></svg>';
      break;
    case 'warning':
      visualClasses = 'bg-amber-500/10 border-amber-500/30 text-amber-500';
      iconSvg = '<svg class="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
      break;
    case 'danger':
      visualClasses = 'bg-rose-500/10 border-rose-500/30 text-rose-500';
      iconSvg = '<svg class="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
      break;
    default:
      visualClasses = 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500';
      iconSvg = '<svg class="w-5 h-5 mr-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"></path></svg>';
  }
  
  toast.className += ` ${visualClasses}`;
  toast.innerHTML = `
    <div class="flex items-center">
      ${iconSvg}
      <span class="text-xs font-semibold leading-relaxed">${sanitizeInput(message)}</span>
    </div>
    <button class="ml-4 p-1 rounded-lg hover:bg-slate-200/20 text-current transition-colors cursor-pointer" aria-label="Dismiss Alert">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  container.appendChild(toast);

  // Trigger reflow to animate slide-in
  setTimeout(() => {
    toast.classList.remove('translate-x-12', 'opacity-0');
  }, 10);

  // Dismiss handlers
  const dismiss = () => {
    toast.classList.add('translate-x-12', 'opacity-0');
    setTimeout(() => {
      if (toast.parentNode === container) {
        container.removeChild(toast);
      }
    }, 300);
  };

  // Close key bindings
  const closeBtn = toast.querySelector('button');
  closeBtn.addEventListener('click', dismiss);

  // Pause on hover
  let autoDismissTimer = setTimeout(dismiss, duration);
  toast.addEventListener('mouseenter', () => clearTimeout(autoDismissTimer));
  toast.addEventListener('mouseleave', () => {
    autoDismissTimer = setTimeout(dismiss, 2000); // 2 more seconds on exit
  });
}

/* ==========================================================================
   2. Metric Indicators Cards (with requestAnimationFrame counters)
   ========================================================================== */

let firstMetricsRender = true;
let previousMetrics = { processed: 0, blocked: 0, flagged: 0 };

/**
 * Renders the top performance dashboard cards with count animators.
 * @param {Array} transactions - All transaction entries
 */
export function renderMetricCards(transactions) {
  const container = document.getElementById('metric-cards-container');
  if (!container) return;

  const processed = transactions.length;
  const blocked = transactions.filter(t => t.status === 'Blocked').length;
  const flagged = transactions.filter(t => t.status === 'Flagged').length;

  const threatRate = processed > 0 ? ((blocked / processed) * 100).toFixed(1) : '0.0';
  
  container.innerHTML = `
    <!-- Card 1 -->
    <div class="glass p-5 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group">
      <div class="flex justify-between items-start">
        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Telemetry Logs</span>
        <div class="bg-indigo-600/10 p-2 rounded-xl border border-indigo-500/20 text-indigo-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.656 48.656 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l-3 3m3-3l3 3m1.5-6h1.5m2.25 0h1.5m2.25 0h1.5M7.5 15h1.5m2.25 0h1.5m2.25 0h1.5"></path></svg>
        </div>
      </div>
      <div>
        <h4 id="metric-processed" class="text-3xl font-black text-slate-800 dark:text-slate-100 tracking-tight">0</h4>
        <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Simulated raw payment ingress queries</p>
      </div>
      <div class="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
    </div>

    <!-- Card 2 -->
    <div class="glass p-5 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group">
      <div class="flex justify-between items-start">
        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Blocked Attacks</span>
        <div class="bg-rose-600/10 p-2 rounded-xl border border-rose-500/20 text-rose-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
        </div>
      </div>
      <div>
        <h4 id="metric-blocked" class="text-3xl font-black text-rose-500 dark:text-rose-400 tracking-tight">0</h4>
        <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Automatic high-threat closures</p>
      </div>
      <div class="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-rose-500 to-red-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
    </div>

    <!-- Card 3 -->
    <div class="glass p-5 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group">
      <div class="flex justify-between items-start">
        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Audit Indicators</span>
        <div class="bg-amber-600/10 p-2 rounded-xl border border-amber-500/20 text-amber-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1.5m0 15V21m-9-9h1.5m15 0H21m-1.5-6.364l-1.06 1.06m-10.607 10.607l-1.06 1.06m0-11.88l1.06 1.06m10.606 10.607l1.06 1.06M12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z"></path></svg>
        </div>
      </div>
      <div>
        <h4 id="metric-flagged" class="text-3xl font-black text-amber-500 dark:text-amber-400 tracking-tight">0</h4>
        <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Flagged for manual compliance audit</p>
      </div>
      <div class="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-yellow-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
    </div>

    <!-- Card 4 -->
    <div class="glass p-5 rounded-2xl flex flex-col justify-between space-y-4 relative overflow-hidden group">
      <div class="flex justify-between items-start">
        <span class="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono">Latency Gateway</span>
        <div class="bg-emerald-600/10 p-2 rounded-xl border border-emerald-500/20 text-emerald-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"></path></svg>
        </div>
      </div>
      <div>
        <h4 id="metric-threat-rate" class="text-3xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight">0.0%</h4>
        <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Evaluated threat blocking accuracy</p>
      </div>
      <div class="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500 to-teal-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
    </div>
  `;

  // Animate from previous levels or from zero on initialization
  const elProcessed = document.getElementById('metric-processed');
  const elBlocked = document.getElementById('metric-blocked');
  const elFlagged = document.getElementById('metric-flagged');
  const elRate = document.getElementById('metric-threat-rate');

  if (firstMetricsRender) {
    animateValue(elProcessed, 0, processed, 1000);
    animateValue(elBlocked, 0, blocked, 1000);
    animateValue(elFlagged, 0, flagged, 1000);
    animateValue(elRate, 0, parseFloat(threatRate), 1000, '%', (val) => val.toFixed(1));
    firstMetricsRender = false;
  } else {
    animateValue(elProcessed, previousMetrics.processed, processed, 600);
    animateValue(elBlocked, previousMetrics.blocked, blocked, 600);
    animateValue(elFlagged, previousMetrics.flagged, flagged, 600);
    animateValue(elRate, parseFloat(previousMetrics.threatRate || 0), parseFloat(threatRate), 600, '%', (val) => val.toFixed(1));
  }

  // Update memory state
  previousMetrics = { processed, blocked, flagged, threatRate };
}

/* ==========================================================================
   3. Highly Interactive Dynamic Table System
   ========================================================================== */

/**
 * Renders the primary transaction datatable, handles highlighting, actions, sorting keys, and pages.
 * @param {Array} transactions - All transaction data
 * @param {Object} filters - Active stores filter options
 * @param {Object} pagination - Page count settings
 * @param {Object} sort - Grid sort columns
 */
export function renderTransactionTable(transactions, filters, pagination, sort) {
  const container = document.getElementById('transactions-table-container');
  if (!container) return;

  // 1. Filter dataset client-side
  let filtered = [...transactions];
  
  if (filters.search) {
    const q = filters.search.toLowerCase();
    filtered = filtered.filter(t => 
      t.id.toLowerCase().includes(q) ||
      t.cardholder.toLowerCase().includes(q) ||
      t.card.toLowerCase().includes(q) ||
      t.bank.toLowerCase().includes(q) ||
      t.country.toLowerCase().includes(q)
    );
  }

  if (filters.status !== 'All') {
    filtered = filtered.filter(t => t.status === filters.status);
  }

  if (filters.risk !== 'All') {
    filtered = filtered.filter(t => {
      if (filters.risk === 'Low') return t.risk < 20;
      if (filters.risk === 'Medium') return t.risk >= 20 && t.risk < 60;
      if (filters.risk === 'High') return t.risk >= 60;
      return true;
    });
  }

  // 2. Sort dataset client-side
  const col = sort.column;
  const isAsc = sort.order === 'asc';
  filtered.sort((a, b) => {
    let valA = a[col];
    let valB = b[col];
    if (typeof valA === 'string') valA = valA.toLowerCase();
    if (typeof valB === 'string') valB = valB.toLowerCase();
    
    if (valA < valB) return isAsc ? -1 : 1;
    if (valA > valB) return isAsc ? 1 : -1;
    return 0;
  });

  // 3. Paginate dataset client-side
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.limit));
  const currentPage = Math.min(pagination.page, totalPages);
  
  const startIndex = (currentPage - 1) * pagination.limit;
  const endIndex = Math.min(startIndex + pagination.limit, totalItems);
  const paginated = filtered.slice(startIndex, endIndex);

  // Helper for sorting indicator arrow icons
  const sortIndicator = (colName) => {
    if (sort.column !== colName) return '<span class="ml-1 opacity-20 group-hover:opacity-60 transition-opacity">↕</span>';
    return sort.order === 'asc' 
      ? '<span class="ml-1 text-indigo-500 font-bold">↑</span>' 
      : '<span class="ml-1 text-indigo-500 font-bold">↓</span>';
  };

  // Helper for highlighting text matches inside tables
  const highlightMatch = (text) => {
    if (!filters.search) return sanitizeInput(text);
    const q = filters.search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); // escape regex
    const regex = new RegExp(`(${q})`, 'gi');
    return sanitizeInput(text).replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-800/60 dark:text-yellow-100 rounded px-0.5">$1</mark>');
  };

  if (paginated.length === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div class="bg-slate-200/40 dark:bg-slate-800/40 p-4 rounded-full border border-slate-300/20 mb-4 text-slate-400">
          <svg class="w-8 h-8" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"></path></svg>
        </div>
        <h3 class="font-extrabold text-sm text-slate-800 dark:text-slate-100">No Transaction Vectors Match</h3>
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs leading-relaxed">Adjust your active filter categories or search strings to explore alternative transaction segments.</p>
      </div>
    `;
    return;
  }

  // Create Table Structure
  let html = `
    <div class="overflow-x-auto w-full rounded-xl border border-slate-200/50 dark:border-slate-800/50">
      <table class="w-full text-left text-xs border-collapse">
        <thead class="bg-slate-100/50 dark:bg-slate-900/50 border-b border-slate-200/50 dark:border-slate-800/50 select-none text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono">
          <tr>
            <th class="px-6 py-4 cursor-pointer group" data-sort="id">ID ${sortIndicator('id')}</th>
            <th class="px-6 py-4 cursor-pointer group" data-sort="cardholder">Cardholder ${sortIndicator('cardholder')}</th>
            <th class="px-6 py-4 cursor-pointer group" data-sort="amount">Amount ${sortIndicator('amount')}</th>
            <th class="px-6 py-4 cursor-pointer group" data-sort="risk">Risk Score ${sortIndicator('risk')}</th>
            <th class="px-6 py-4 cursor-pointer group" data-sort="status">Status ${sortIndicator('status')}</th>
            <th class="px-6 py-4 cursor-pointer group" data-sort="timestamp">Date ${sortIndicator('timestamp')}</th>
            <th class="px-6 py-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200/40 dark:divide-slate-800/40">
  `;

  paginated.forEach(t => {
    // Determine risk styling badges
    let riskBadgeColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500';
    if (t.risk >= 20 && t.risk < 60) riskBadgeColor = 'bg-amber-500/10 border-amber-500/20 text-amber-500';
    if (t.risk >= 60) riskBadgeColor = 'bg-rose-500/10 border-rose-500/20 text-rose-500';

    // Determine status badges
    let statusBadgeHtml = '';
    if (t.status === 'Approved') {
      statusBadgeHtml = `<span class="flex items-center text-emerald-500"><span class="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>Approved</span>`;
    } else if (t.status === 'Flagged') {
      statusBadgeHtml = `<span class="flex items-center text-amber-500"><span class="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></span>Flagged</span>`;
    } else {
      statusBadgeHtml = `<span class="flex items-center text-rose-500"><span class="h-1.5 w-1.5 rounded-full bg-rose-500 mr-2"></span>Blocked</span>`;
    }

    // Determine inline context links & actions
    let actionButtons = '';
    if (t.status === 'Flagged') {
      // Direct integration link to digilocker.html
      const digiLink = `digilocker.html?cardholderName=${encodeURIComponent(t.cardholder)}&cardNumber=${encodeURIComponent(t.card)}&amount=${t.amount}&merchant=${encodeURIComponent(t.bank)}`;
      actionButtons = `
        <a href="${digiLink}" target="_blank" rel="noopener noreferrer" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] px-3 py-1.5 rounded-lg mr-2 inline-flex items-center transition shadow shadow-indigo-600/10">
          🔑 Verify
        </a>
        <button data-action="approve" data-tx-id="${t.id}" class="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-emerald-500/20 transition cursor-pointer">
          Approve
        </button>
      `;
    } else if (t.status === 'Approved') {
      actionButtons = `
        <button data-action="flag" data-tx-id="${t.id}" class="bg-amber-500/10 hover:bg-amber-500 text-amber-500 hover:text-white font-bold text-[10px] px-2.5 py-1.5 rounded-lg border border-amber-500/20 transition cursor-pointer">
          Flag Audit
        </button>
      `;
    } else {
      actionButtons = `
        <button data-action="approve" data-tx-id="${t.id}" class="text-slate-400 hover:text-emerald-500 font-bold text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1.5 rounded-lg transition cursor-pointer">
          Force Override
        </button>
      `;
    }

    html += `
      <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group/row">
        <!-- Transaction ID -->
        <td class="px-6 py-4 font-mono font-bold text-slate-800 dark:text-slate-200">
          ${highlightMatch(t.id)}
        </td>
        <!-- Cardholder details -->
        <td class="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
          <div class="flex flex-col">
            <span class="font-bold">${highlightMatch(t.cardholder)}</span>
            <span class="text-[10px] text-slate-400 mt-0.5">${highlightMatch(t.card)} · <span class="font-semibold">${highlightMatch(t.bank)}</span></span>
          </div>
        </td>
        <!-- Amount -->
        <td class="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
          ${formatCurrency(t.amount)}
        </td>
        <!-- Risk score indicator -->
        <td class="px-6 py-4">
          <div class="flex items-center space-x-3 max-w-[120px]">
            <span class="px-2 py-0.5 border rounded-full text-[9px] font-bold font-mono ${riskBadgeColor}">${t.risk.toFixed(1)}%</span>
            <div class="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shrink-0 hidden sm:block">
              <div class="h-full rounded-full bg-current ${t.risk >= 60 ? 'text-rose-500' : t.risk >= 20 ? 'text-amber-500' : 'text-emerald-500'}" style="width: ${t.risk}%"></div>
            </div>
          </div>
        </td>
        <!-- Status badge -->
        <td class="px-6 py-4 font-bold font-sans">
          ${statusBadgeHtml}
          ${t.triggerRule ? `<span class="block text-[8px] font-bold font-mono text-rose-400 mt-1 uppercase tracking-wider">${t.triggerRule}</span>` : ''}
        </td>
        <!-- Date -->
        <td class="px-6 py-4 text-slate-400 dark:text-slate-500 font-mono text-[10px] font-bold">
          ${formatDate(t.timestamp)}
        </td>
        <!-- Action actions -->
        <td class="px-6 py-4 text-right">
          <div class="inline-flex items-center opacity-80 group-hover/row:opacity-100 transition-opacity">
            ${actionButtons}
          </div>
        </td>
      </tr>
    `;
  });

  html += `
        </tbody>
      </table>
    </div>

    <!-- PAGING CONTROLS FOOTER -->
    <div class="flex flex-col sm:flex-row items-center justify-between mt-5 gap-4">
      <div class="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wide">
        Showing <span class="text-slate-700 dark:text-slate-200">${startIndex + 1}</span> to 
        <span class="text-slate-700 dark:text-slate-200">${endIndex}</span> of 
        <span class="text-slate-700 dark:text-slate-200">${totalItems}</span> payment vectors
      </div>

      <div class="flex items-center space-x-2 select-none">
        <button id="btn-prev-page" ${currentPage === 1 ? 'disabled' : ''} class="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          ← Previous
        </button>
        <span class="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 px-3">
          Page ${currentPage} / ${totalPages}
        </span>
        <button id="btn-next-page" ${currentPage === totalPages ? 'disabled' : ''} class="px-3.5 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-xs font-bold text-slate-600 dark:text-slate-300 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition">
          Next →
        </button>
      </div>
    </div>
  `;

  container.innerHTML = html;
}

/* ==========================================================================
   4. Custom Interactive HTML5 Canvas Analytics Engine
   ========================================================================== */

let activeCanvasHoverIndex = -1;
let hoverMouseX = 0;
let hoverMouseY = 0;

/**
 * Custom Canvas line & area visualization, complete with retina adjustments, gradient fills, and hover crosshair tools.
 * @param {Array} transactions - Dataset of ledger items
 */
export function renderCustomCanvasChart(transactions) {
  const canvasIds = ['analytics-canvas', 'large-analytics-canvas'];
  
  canvasIds.forEach(canvasId => {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    // Responsive dynamic bounds
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Scale Canvas for Retina displays to keep borders razor sharp
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Group transactions by days for last 7 days safely
    const chartDays = 7;
    const dailyMetrics = [];
    const now = Date.now();
    
    for (let i = chartDays - 1; i >= 0; i--) {
      const dayStart = now - (i + 1) * 86400000;
      const dayEnd = now - i * 86400000;
      const dayLabel = new Date(dayEnd).toLocaleDateString('en-US', { weekday: 'short' });
      
      const dayTx = transactions.filter(t => t.timestamp >= dayStart && t.timestamp < dayEnd);
      const count = dayTx.length;
      const averageRisk = count > 0 ? dayTx.reduce((sum, t) => sum + t.risk, 0) / count : 0;
      const blockedCount = dayTx.filter(t => t.status === 'Blocked').length;
      
      dailyMetrics.push({ label: dayLabel, count, averageRisk, blocked: blockedCount });
    }

    // Define drawing padding parameters
    const paddingLeft = 45;
    const paddingRight = 20;
    const paddingTop = 30;
    const paddingBottom = 40;

    const graphWidth = width - paddingLeft - paddingRight;
    const graphHeight = height - paddingTop - paddingBottom;

    // Determine scale metrics boundaries
    const counts = dailyMetrics.map(d => d.count);
    const maxCount = Math.max(5, ...counts) + 2;

    // Draw background grids & guides
    const isDark = document.documentElement.classList.contains('dark');
    const colorGrid = isDark ? '#1b243c' : '#e2e8f0';
    const colorText = isDark ? '#8e9bb4' : '#64748b';

    ctx.clearRect(0, 0, width, height);

    // Draw Horizontal lines
    ctx.strokeStyle = colorGrid;
    ctx.lineWidth = 1;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = colorText;
    ctx.font = 'bold 9px monospace';

    const gridCount = 4;
    for (let i = 0; i <= gridCount; i++) {
      const yVal = Math.round((maxCount / gridCount) * i);
      const y = paddingTop + graphHeight - (yVal / maxCount) * graphHeight;
      
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(width - paddingRight, y);
      ctx.stroke();

      ctx.fillText(yVal.toString(), paddingLeft - 10, y);
    }

    // Map Data coordinates
    const dataPoints = dailyMetrics.map((d, index) => {
      const x = paddingLeft + (index / (chartDays - 1)) * graphWidth;
      const y = paddingTop + graphHeight - (d.count / maxCount) * graphHeight;
      return { x, y, label: d.label, count: d.count, risk: d.averageRisk, blocked: d.blocked };
    });

    // Render Area Gradients
    if (dataPoints.length > 0) {
      // Generate linear gradients
      const gradient = ctx.createLinearGradient(0, paddingTop, 0, paddingTop + graphHeight);
      gradient.addColorStop(0, isDark ? 'rgba(99, 102, 241, 0.28)' : 'rgba(99, 102, 241, 0.20)');
      gradient.addColorStop(1, 'rgba(99, 102, 241, 0.00)');

      ctx.beginPath();
      ctx.moveTo(dataPoints[0].x, paddingTop + graphHeight);
      
      // Draw Bezier smooth transitions
      for (let i = 0; i < dataPoints.length - 1; i++) {
        const xc = (dataPoints[i].x + dataPoints[i+1].x) / 2;
        const yc = (dataPoints[i].y + dataPoints[i+1].y) / 2;
        ctx.quadraticCurveTo(dataPoints[i].x, dataPoints[i].y, xc, yc);
      }
      ctx.quadraticCurveTo(
        dataPoints[dataPoints.length - 2].x, 
        dataPoints[dataPoints.length - 2].y, 
        dataPoints[dataPoints.length - 1].x, 
        dataPoints[dataPoints.length - 1].y
      );
      ctx.lineTo(dataPoints[dataPoints.length - 1].x, paddingTop + graphHeight);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Renders primary curve stroke
      ctx.beginPath();
      ctx.moveTo(dataPoints[0].x, dataPoints[0].y);
      for (let i = 0; i < dataPoints.length - 1; i++) {
        const xc = (dataPoints[i].x + dataPoints[i+1].x) / 2;
        const yc = (dataPoints[i].y + dataPoints[i+1].y) / 2;
        ctx.quadraticCurveTo(dataPoints[i].x, dataPoints[i].y, xc, yc);
      }
      ctx.quadraticCurveTo(
        dataPoints[dataPoints.length - 2].x, 
        dataPoints[dataPoints.length - 2].y, 
        dataPoints[dataPoints.length - 1].x, 
        dataPoints[dataPoints.length - 1].y
      );
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Draw X-axis label columns
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = colorText;
    dataPoints.forEach(p => {
      ctx.fillText(p.label, p.x, paddingTop + graphHeight + 10);
    });

    // DRAW INTERACTIVE HOVER VECTOR OVERLAY
    if (activeCanvasHoverIndex >= 0 && activeCanvasHoverIndex < dataPoints.length) {
      const hoverPoint = dataPoints[activeCanvasHoverIndex];

      // 1. Draw Vertical Crosshair vector line
      ctx.beginPath();
      ctx.setLineDash([4, 4]);
      ctx.moveTo(hoverPoint.x, paddingTop);
      ctx.lineTo(hoverPoint.x, paddingTop + graphHeight);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.setLineDash([]); // clear dash

      // 2. Draw glowing focal point ring
      ctx.beginPath();
      ctx.arc(hoverPoint.x, hoverPoint.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.25)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(hoverPoint.x, hoverPoint.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#6366f1';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      // 3. Compute and render high fidelity HTML Tooltip
      const tooltip = document.getElementById('analytics-tooltip');
      if (tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = `${rect.left + hoverPoint.x - 65}px`;
        tooltip.style.top = `${rect.top + hoverPoint.y - 100}px`;
        
        tooltip.innerHTML = `
          <div class="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono border-b border-slate-700/10 dark:border-slate-200/10 pb-1.5 mb-1.5 flex justify-between">
            <span>${hoverPoint.label} Telemetry</span>
            <span class="text-indigo-400 font-black">● ACTIVE</span>
          </div>
          <div class="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-700 dark:text-slate-300 font-sans text-[10px] font-semibold">
            <div>Scans:</div><div class="text-slate-800 dark:text-white font-extrabold font-mono text-right">${hoverPoint.count} tx</div>
            <div>Blocked:</div><div class="text-rose-500 font-extrabold font-mono text-right">${hoverPoint.blocked} nodes</div>
            <div>Avg Risk:</div><div class="text-amber-500 font-extrabold font-mono text-right">${hoverPoint.risk.toFixed(1)}%</div>
          </div>
        `;
      }
    } else {
      const tooltip = document.getElementById('analytics-tooltip');
      if (tooltip) tooltip.style.display = 'none';
    }

    // Setup Dynamic Hover Event Bindings once
    if (!canvas.dataset.eventBound) {
      canvas.dataset.eventBound = 'true';

      canvas.addEventListener('mousemove', (e) => {
        const parentRect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - parentRect.left;
        
        // Map to nearest transaction day point index
        let closestIdx = -1;
        let minDistance = Infinity;

        // Re-map theoretical coordinates locally
        for (let i = 0; i < chartDays; i++) {
          const xCoord = paddingLeft + (i / (chartDays - 1)) * (parentRect.width - paddingLeft - paddingRight);
          const dist = Math.abs(xCoord - mouseX);
          if (dist < minDistance) {
            minDistance = dist;
            closestIdx = i;
          }
        }

        // Check boundary bounds to keep index valid
        if (closestIdx >= 0 && closestIdx < chartDays && minDistance < 40) {
          if (activeCanvasHoverIndex !== closestIdx) {
            activeCanvasHoverIndex = closestIdx;
            renderCustomCanvasChart(transactions);
          }
        } else {
          if (activeCanvasHoverIndex !== -1) {
            activeCanvasHoverIndex = -1;
            renderCustomCanvasChart(transactions);
          }
        }
      });

      canvas.addEventListener('mouseleave', () => {
        activeCanvasHoverIndex = -1;
        renderCustomCanvasChart(transactions);
      });
    }
  });
}

/* ==========================================================================
   5. Dynamic Rule Creator Stepper Components
   ========================================================================== */

/**
 * Controls the multi-step firewall policy rules wizard state rendering.
 * @param {number} step - Current step pointer (1, 2, or 3)
 */
export function renderRuleCreatorStepper(step) {
  const container = document.getElementById('rule-stepper-container');
  if (!container) return;

  const isDark = document.documentElement.classList.contains('dark');
  
  // Renders stepper top circle headers
  const stepsHeaderHtml = `
    <div class="flex items-center justify-between pb-8 select-none">
      <div class="flex flex-col items-center flex-1">
        <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs ${step >= 1 ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'border-slate-300 dark:border-slate-700 text-slate-400'}" aria-hidden="true">1</div>
        <span class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-2 font-mono">Parameters</span>
      </div>
      <div class="h-0.5 bg-slate-200 dark:bg-slate-800 flex-1 relative top-[-10px]">
        <div class="h-full bg-indigo-500 transition-all duration-300" style="width: ${step > 1 ? '100%' : '0%'}"></div>
      </div>
      <div class="flex flex-col items-center flex-1">
        <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs ${step >= 2 ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'border-slate-300 dark:border-slate-700 text-slate-400'}" aria-hidden="true">2</div>
        <span class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-2 font-mono">Actions</span>
      </div>
      <div class="h-0.5 bg-slate-200 dark:bg-slate-800 flex-1 relative top-[-10px]">
        <div class="h-full bg-indigo-500 transition-all duration-300" style="width: ${step > 2 ? '100%' : '0%'}"></div>
      </div>
      <div class="flex flex-col items-center flex-1">
        <div class="w-8 h-8 rounded-full border-2 flex items-center justify-center font-mono font-bold text-xs ${step >= 3 ? 'border-indigo-500 bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'border-slate-300 dark:border-slate-700 text-slate-400'}" aria-hidden="true">3</div>
        <span class="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-2 font-mono">Confirm</span>
      </div>
    </div>
  `;

  let innerStepHtml = '';
  switch (step) {
    case 1:
      innerStepHtml = `
        <div class="space-y-4 animate-fade-in">
          <div>
            <label for="rule-name-input" class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono mb-1.5">Rule Policy Title</label>
            <input type="text" id="rule-name-input" placeholder="e.g. Card-Not-Present Risk Outlier Limit" required
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-xs px-4 py-3 rounded-xl focus:border-indigo-500 focus:outline-none transition">
          </div>
          <div>
            <label for="rule-param-input" class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono mb-1.5">Trigger Condition Formula</label>
            <input type="text" id="rule-param-input" placeholder="e.g. Velocity limit exceeds $500/min" required
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-xs px-4 py-3 rounded-xl focus:border-indigo-500 focus:outline-none transition">
          </div>
        </div>
      `;
      break;
    case 2:
      innerStepHtml = `
        <div class="space-y-4 animate-fade-in select-none">
          <span class="block text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono mb-1.5">Security Ingress Resolution Action</span>
          <div class="grid grid-cols-2 gap-4">
            <label class="flex flex-col p-4 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl cursor-pointer bg-slate-50/30 dark:bg-slate-950/30 hover:bg-slate-50/55 transition text-left">
              <input type="radio" name="rule-action" value="BLOCK" checked class="accent-indigo-500 mb-3 self-start">
              <span class="font-black text-xs text-rose-500 flex items-center mb-1">
                🛡️ BLOCK TRANSACTION
              </span>
              <span class="text-[10px] text-slate-400">Instantly shut down transaction gateway checks, issuing automatic deny alerts to cardholders.</span>
            </label>
            <label class="flex flex-col p-4 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl cursor-pointer bg-slate-50/30 dark:bg-slate-950/30 hover:bg-slate-50/55 transition text-left">
              <input type="radio" name="rule-action" value="FLAG" class="accent-indigo-500 mb-3 self-start">
              <span class="font-black text-xs text-amber-500 flex items-center mb-1">
                ⚠️ FLAG FOR COMPLIANCE
              </span>
              <span class="text-[10px] text-slate-400">Permit charge but flag as high risk, initiating secondary Aadhaar OTP checks via DigiLocker.</span>
            </label>
          </div>
        </div>
      `;
      break;
    case 3:
      innerStepHtml = `
        <div class="space-y-4 animate-fade-in text-left">
          <div class="bg-indigo-600/5 dark:bg-indigo-500/5 border border-indigo-500/15 rounded-2xl p-5 space-y-3.5">
            <span class="inline-block bg-indigo-500/10 text-indigo-500 border border-indigo-500/25 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest font-mono">Review Details</span>
            <div class="space-y-2">
              <div class="text-[10px] font-bold font-mono text-slate-400 uppercase">Policy Name</div>
              <div class="text-xs font-extrabold text-slate-800 dark:text-slate-100" id="review-name">Rule name</div>
            </div>
            <div class="space-y-2">
              <div class="text-[10px] font-bold font-mono text-slate-400 uppercase">Condition Parameters</div>
              <div class="text-xs font-bold text-slate-600 dark:text-slate-300 font-mono" id="review-param">Rule parameter</div>
            </div>
            <div class="space-y-2">
              <div class="text-[10px] font-bold font-mono text-slate-400 uppercase">Resolution Action</div>
              <div class="text-xs font-black" id="review-action">ACTION</div>
            </div>
          </div>
        </div>
      `;
      break;
  }

  container.innerHTML = `
    <div class="w-full">
      ${stepsHeaderHtml}
      <div class="py-4">
        ${innerStepHtml}
      </div>
    </div>
  `;
}

/* ==========================================================================
   6. Custom Authentication Overlay Modal
   ========================================================================== */

/**
 * Handles toggling the authentication shield overlay modal.
 * @param {boolean} isOpen - Target visual state
 */
export function renderAuthOverlay(isOpen) {
  const overlay = document.getElementById('auth-overlay-container');
  if (!overlay) return;

  if (isOpen) {
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
    overlay.innerHTML = `
      <div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-8 max-w-sm w-full animate-fade-in relative text-center">
        <!-- Vercel logo style floating element -->
        <div class="mx-auto bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-3 flex items-center justify-center w-12 h-12 mb-6">
          <svg class="w-6 h-6 text-indigo-500 animate-pulse" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        </div>

        <h2 class="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mb-1">Operator Ingress</h2>
        <p class="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-6 font-medium">Verify credentials to unlock the FraudShield AI cybersecurity cockpit.</p>

        <form id="auth-form" class="space-y-4 text-left">
          <div>
            <label for="auth-email" class="block text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono mb-1.5">Console Operator Email</label>
            <input type="email" id="auth-email" placeholder="admin@fraudshield.ai" required
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-xs px-4 py-3 rounded-xl focus:border-indigo-500 focus:outline-none transition">
          </div>
          
          <div>
            <label for="auth-password" class="block text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 font-mono mb-1.5">Console Password</label>
            <input type="password" id="auth-password" placeholder="••••••••" required
              class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 font-semibold text-xs px-4 py-3 rounded-xl focus:border-indigo-500 focus:outline-none transition">
          </div>

          <!-- Dynamic Strength Audit Bar -->
          <div id="password-strength-container" class="hidden space-y-1.5">
            <div class="flex justify-between items-center text-[9px] font-bold uppercase font-mono tracking-widest text-slate-400">
              <span>Entropy Audit:</span>
              <span id="strength-text" class="text-rose-500">Weak</span>
            </div>
            <div class="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
              <div id="strength-bar" class="h-full bg-rose-500 rounded-full transition-all duration-300" style="width: 25%"></div>
            </div>
          </div>

          <p id="auth-error-msg" class="text-[10px] font-bold text-rose-500 hidden"></p>

          <button type="submit" id="auth-submit-btn" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center space-x-2">
            <span>Unlock Dashboard Console</span>
          </button>
        </form>

        <div class="mt-6 border-t border-slate-200/40 dark:border-slate-800/40 pt-4 flex flex-col items-center">
          <span class="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">Engaged Access Keys:</span>
          <div class="flex space-x-3 text-[9px] font-bold text-indigo-400/80 uppercase font-mono hover:text-indigo-400 transition cursor-pointer">
            <span class="border border-indigo-500/20 px-2 py-0.5 rounded" onclick="document.getElementById('auth-email').value='admin@fraudshield.ai'; document.getElementById('auth-password').value='admin123'; document.getElementById('auth-password').dispatchEvent(new Event('input'))">admin demo</span>
            <span class="border border-indigo-500/20 px-2 py-0.5 rounded" onclick="document.getElementById('auth-email').value='auditor@fraudshield.ai'; document.getElementById('auth-password').value='secure123'; document.getElementById('auth-password').dispatchEvent(new Event('input'))">auditor demo</span>
          </div>
        </div>
      </div>
    `;
  } else {
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    overlay.innerHTML = '';
  }
}

/* ==========================================================================
   7. Sidebar, Header, and Tab Panels
   ========================================================================== */

/**
 * Handles updating active sidebar tab links styles.
 * @param {string} activeTab - Target tab identifier
 */
export function renderSidebar(activeTab) {
  const sidebar = document.getElementById('sidebar-menu');
  if (!sidebar) return;

  sidebar.querySelectorAll('[data-tab]').forEach(btn => {
    const tabName = btn.dataset.tab;
    const isActive = tabName === activeTab;
    
    if (isActive) {
      btn.className = `w-full flex items-center space-x-3 text-indigo-500 dark:text-indigo-400 font-bold bg-indigo-500/10 border-l-4 border-indigo-500 px-4 py-3 rounded-r-xl transition text-xs font-mono uppercase tracking-wider select-none cursor-default`;
    } else {
      btn.className = `w-full flex items-center space-x-3 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/40 border-l-4 border-transparent px-4 py-3 rounded-r-xl transition text-xs font-mono uppercase tracking-wider select-none cursor-pointer`;
    }
  });

  // Switch primary panels visibility
  document.querySelectorAll('[data-panel]').forEach(panel => {
    const panelName = panel.dataset.panel;
    if (panelName === activeTab) {
      panel.classList.remove('hidden');
      panel.classList.add('block');
      
      // If switching to analytics panel, trigger canvas redraw throttled
      if (panelName === 'analytics') {
        setTimeout(() => renderCustomCanvasChart(store.getState().transactions), 100);
      }
    } else {
      panel.classList.add('hidden');
      panel.classList.remove('block');
    }
  });
}

/**
 * Renders the top header bar with active operator details.
 * @param {Object} user - Authorized user object
 */
export function renderHeader(user) {
  const profileContainer = document.getElementById('header-profile-container');
  if (!profileContainer) return;

  if (user) {
    profileContainer.innerHTML = `
      <div class="flex items-center space-x-3.5 select-none">
        <div class="text-right hidden sm:block">
          <span class="font-extrabold text-xs text-slate-800 dark:text-slate-100 block leading-tight">${sanitizeInput(user.name)}</span>
          <span class="text-[9px] font-bold text-indigo-500 uppercase tracking-widest font-mono block leading-none mt-1">${sanitizeInput(user.role)}</span>
        </div>
        <div class="relative group">
          <img src="${user.avatar}" alt="${sanitizeInput(user.name)}"
            class="h-9 w-9 rounded-full ring-2 ring-indigo-500/35 object-cover cursor-pointer hover:ring-indigo-500 transition shadow">
          <div class="absolute right-0 top-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-1.5 rounded-xl shadow-xl w-36 hidden group-hover:block hover:block text-left animate-fade-in z-50">
            <button id="btn-logout" class="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-[10px] font-bold text-rose-500 font-mono uppercase tracking-wider cursor-pointer">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    profileContainer.innerHTML = `
      <button id="btn-show-login" class="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/15 transition cursor-pointer">
        Lock Console
      </button>
    `;
  }
}

/**
 * Render the rules configurations list.
 * @param {Array} rules - All active rules
 */
export function renderRulesConfig(rules) {
  const container = document.getElementById('rules-list-container');
  const gridContainer = document.getElementById('rules-list-container-grid');
  
  if (container) {
    let html = '<div class="space-y-3">';
    rules.forEach(rule => {
      html += `
        <div class="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200/40 dark:border-slate-800/40 rounded-xl flex items-center justify-between">
          <div class="min-w-0 flex-1 pr-3">
            <h5 class="font-bold text-[11px] text-slate-800 dark:text-slate-200 truncate">${sanitizeInput(rule.name)}</h5>
            <span class="text-[9px] font-mono text-slate-400 dark:text-slate-500 truncate block mt-0.5">${sanitizeInput(rule.parameter)}</span>
          </div>
          <span class="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold shrink-0 ${rule.active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-300 dark:bg-slate-800 text-slate-400'}">
            ${rule.active ? 'ON' : 'OFF'}
          </span>
        </div>
      `;
    });
    html += '</div>';
    container.innerHTML = html;
  }

  if (gridContainer) {
    let html = '<div class="grid grid-cols-1 md:grid-cols-2 gap-4">';
    rules.forEach(rule => {
      html += `
        <div class="glass p-5 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition">
          <div>
            <div class="flex justify-between items-center mb-1">
              <h4 class="font-extrabold text-xs text-slate-800 dark:text-slate-100">${sanitizeInput(rule.name)}</h4>
              <span class="px-2 py-0.5 border text-[8px] font-mono font-bold uppercase rounded ${rule.action === 'BLOCK' ? 'bg-rose-500/10 border-rose-500/25 text-rose-500' : 'bg-amber-500/10 border-amber-500/25 text-amber-500'}">
                ${rule.action}
              </span>
            </div>
            <p class="text-[10px] font-mono text-slate-400 dark:text-slate-500">${sanitizeInput(rule.parameter)}</p>
          </div>
          
          <div class="flex justify-between items-center pt-2 select-none border-t border-slate-200/40 dark:border-slate-800/40">
            <span class="text-[9px] font-mono font-bold ${rule.active ? 'text-emerald-500' : 'text-slate-400'}">
              ● ${rule.active ? 'ENGAGED' : 'PAUSED'}
            </span>
            <button data-rule-toggle="${rule.id}" class="text-[9px] font-bold font-mono text-indigo-500 hover:text-indigo-400 transition cursor-pointer uppercase">
              ${rule.active ? 'Pause Rule' : 'Engage Rule'}
            </button>
          </div>
        </div>
      `;
    });
    html += '</div>';
    gridContainer.innerHTML = html;
  }
}
