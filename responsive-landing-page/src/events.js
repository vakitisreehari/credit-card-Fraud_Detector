/**
 * FraudShield AI — Comprehensive Event Delegator
 * Optimized global event management using event-delegation and keyboard accessibilities.
 */

import { store } from './state.js';
import { login, logout, getPasswordStrength } from './auth.js';
import { triggerToast } from './components.js';

/**
 * Initializes all event bindings on application launch.
 */
export function initializeEventBindings() {
  
  /* ==========================================================================
     1. Global Click Delegation (Handles dynamic buttons, dropdowns, tables)
     ========================================================================== */
  document.body.addEventListener('click', (e) => {
    
    // Sidebar Navigation tab click
    const tabBtn = e.target.closest('[data-tab]');
    if (tabBtn) {
      const activeTab = tabBtn.dataset.tab;
      const { user } = store.getState();
      
      // Auth Guard check: redirect to Login modal if not authenticated
      if (!user) {
        triggerToast('warning', 'Ingress credentials required to access system features.');
        store.setState({ ui: { ...store.getState().ui, mobileSidebarOpen: false } });
        return;
      }
      
      store.setState({ 
        ui: { ...store.getState().ui, activeTab, mobileSidebarOpen: false } 
      });
      return;
    }

    // Dynamic sorting clicks on Table headers
    const sortTh = e.target.closest('thead th[data-sort]');
    if (sortTh) {
      const column = sortTh.dataset.sort;
      const currentSort = store.getState().sort;
      let order = 'asc';
      
      if (currentSort.column === column) {
        order = currentSort.order === 'asc' ? 'desc' : 'asc';
      }
      
      store.setState({ sort: { column, order }, pagination: { ...store.getState().pagination, page: 1 } });
      return;
    }

    // Pagination: Previous Page Action
    if (e.target.closest('#btn-prev-page')) {
      const currentPaging = store.getState().pagination;
      if (currentPaging.page > 1) {
        store.setState({ pagination: { ...currentPaging, page: currentPaging.page - 1 } });
      }
      return;
    }

    // Pagination: Next Page Action
    if (e.target.closest('#btn-next-page')) {
      const currentPaging = store.getState().pagination;
      store.setState({ pagination: { ...currentPaging, page: currentPaging.page + 1 } });
      return;
    }

    // Inline Table Action: Approve Vector
    const approveBtn = e.target.closest('[data-action="approve"]');
    if (approveBtn) {
      const txId = approveBtn.dataset.txId;
      const { transactions } = store.getState();
      const updated = transactions.map(t => {
        if (t.id === txId) {
          return { ...t, status: 'Approved', risk: Math.min(t.risk, 10), triggerRule: undefined };
        }
        return t;
      });
      store.setState({ transactions: updated });
      triggerToast('success', `Security override engaged. ${txId} has been Approved.`);
      return;
    }

    // Inline Table Action: Flag Audit
    const flagBtn = e.target.closest('[data-action="flag"]');
    if (flagBtn) {
      const txId = flagBtn.dataset.txId;
      const { transactions } = store.getState();
      const updated = transactions.map(t => {
        if (t.id === txId) {
          return { ...t, status: 'Flagged', risk: Math.max(t.risk, 45) };
        }
        return t;
      });
      store.setState({ transactions: updated });
      triggerToast('warning', `${txId} marked as high-risk, queued for DigiLocker Aadhaar audit.`);
      return;
    }

    // Dynamic Rule Creator: Rule toggle active state
    const toggleRuleBtn = e.target.closest('[data-rule-toggle]');
    if (toggleRuleBtn) {
      const ruleId = toggleRuleBtn.dataset.ruleToggle;
      const { rules } = store.getState();
      const updated = rules.map(r => {
        if (r.id === ruleId) {
          const nextActiveState = !r.active;
          triggerToast(nextActiveState ? 'success' : 'warning', `Firewall rule "${r.name}" ${nextActiveState ? 'engaged' : 'paused'}.`);
          return { ...r, active: nextActiveState };
        }
        return r;
      });
      store.setState({ rules: updated });
      return;
    }

    // Mobile Navigation burger menu toggle
    if (e.target.closest('#mobile-sidebar-toggle')) {
      const ui = store.getState().ui;
      store.setState({ ui: { ...ui, mobileSidebarOpen: !ui.mobileSidebarOpen } });
      return;
    }

    // Close Mobile Navigation sidebar if click is on overlay mask
    if (e.target.id === 'mobile-sidebar-overlay') {
      const ui = store.getState().ui;
      store.setState({ ui: { ...ui, mobileSidebarOpen: false } });
      return;
    }

    // Auth Actions: Trigger Logout
    if (e.target.closest('#btn-logout')) {
      logout();
      triggerToast('info', 'Ingress session cleared. System locked.');
      return;
    }

    // Auth Actions: Show login form modal
    if (e.target.closest('#btn-show-login')) {
      // Toggle display of lock overlay
      store.setState({ user: null });
      return;
    }

    // Firewall Stepper Modal: open form
    if (e.target.closest('#btn-add-rule')) {
      store.setState({ ui: { ...store.getState().ui, ruleModalOpen: true, ruleWizardStep: 1 } });
      return;
    }

    // Firewall Stepper Modal: close form
    if (e.target.closest('#rule-wizard-cancel') || e.target.closest('#btn-close-rule-modal')) {
      store.setState({ ui: { ...store.getState().ui, ruleModalOpen: false } });
      return;
    }
  });

  /* ==========================================================================
     2. Centralized Input listeners (Handles real-time search & passwords strength)
     ========================================================================== */
  
  // Debounced live datagrid search input
  const searchInput = document.getElementById('search-transactions');
  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const search = e.target.value;
        store.setState({ 
          filters: { ...store.getState().filters, search },
          pagination: { ...store.getState().pagination, page: 1 }
        });
      }, 350); // 350ms debounce time
    });
  }

  // Dynamic filter status tabs
  const statusFilterSelect = document.getElementById('filter-status');
  if (statusFilterSelect) {
    statusFilterSelect.addEventListener('change', (e) => {
      const status = e.target.value;
      store.setState({ 
        filters: { ...store.getState().filters, status },
        pagination: { ...store.getState().pagination, page: 1 }
      });
    });
  }

  // Dynamic risk categories tabs
  const riskFilterSelect = document.getElementById('filter-risk');
  if (riskFilterSelect) {
    riskFilterSelect.addEventListener('change', (e) => {
      const risk = e.target.value;
      store.setState({ 
        filters: { ...store.getState().filters, risk },
        pagination: { ...store.getState().pagination, page: 1 }
      });
    });
  }

  // Live password auditor monitoring in the modal
  document.body.addEventListener('input', (e) => {
    if (e.target.id === 'auth-password') {
      const password = e.target.value;
      const strengthContainer = document.getElementById('password-strength-container');
      const strengthText = document.getElementById('strength-text');
      const strengthBar = document.getElementById('strength-bar');
      
      if (!strengthContainer || !strengthText || !strengthBar) return;

      if (!password) {
        strengthContainer.classList.add('hidden');
        return;
      }

      strengthContainer.classList.remove('hidden');
      const strength = getPasswordStrength(password);
      
      strengthText.innerHTML = strength.text;
      strengthText.className = strength.score <= 1 ? 'text-rose-500 font-bold' : strength.score === 2 ? 'text-amber-500 font-bold' : strength.score === 3 ? 'text-indigo-500 font-bold' : 'text-emerald-500 font-black';
      
      // Update bar width & coloration
      strengthBar.className = `h-full rounded-full transition-all duration-300 ${strength.color}`;
      strengthBar.style.width = `${(strength.score / 4) * 100}%`;
    }
  });

  /* ==========================================================================
     3. Active Form Submissions
     ========================================================================== */
  
  // Locks auth submission modal
  document.body.addEventListener('submit', async (e) => {
    if (e.target.id === 'auth-form') {
      e.preventDefault();
      
      const email = document.getElementById('auth-email').value;
      const password = document.getElementById('auth-password').value;
      const errorMsg = document.getElementById('auth-error-msg');
      const submitBtn = document.getElementById('auth-submit-btn');

      if (!submitBtn) return;

      const originalBtnHtml = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Verifying Security Keys...</span>
      `;

      if (errorMsg) errorMsg.classList.add('hidden');

      try {
        const user = await login(email, password);
        triggerToast('success', `Welcome back, ${user.name}. Ingress authorized.`);
        store.setState({ ui: { ...store.getState().ui, activeTab: 'overview' } });
      } catch (err) {
        if (errorMsg) {
          errorMsg.innerHTML = err.message;
          errorMsg.classList.remove('hidden');
        }
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHtml;
      }
    }

    // Interactive Multi-step Rule Form Steppers
    if (e.target.id === 'rule-wizard-form') {
      e.preventDefault();
      const currentUi = store.getState().ui;
      const step = currentUi.ruleWizardStep;
      
      if (step === 1) {
        const name = document.getElementById('rule-name-input').value.trim();
        const param = document.getElementById('rule-param-input').value.trim();
        
        if (!name || !param) {
          triggerToast('danger', 'Please define policy title and parameters.');
          return;
        }

        store.setState({ ui: { ...currentUi, ruleWizardStep: 2 } });
      } else if (step === 2) {
        store.setState({ ui: { ...currentUi, ruleWizardStep: 3 } });
        
        // Dynamic filled content updates on final step
        setTimeout(() => {
          const nameVal = document.getElementById('rule-name-input').value;
          const paramVal = document.getElementById('rule-param-input').value;
          const actionVal = document.querySelector('input[name="rule-action"]:checked').value;
          
          const elName = document.getElementById('review-name');
          const elParam = document.getElementById('review-param');
          const elAction = document.getElementById('review-action');

          if (elName) elName.innerHTML = nameVal;
          if (elParam) elParam.innerHTML = paramVal;
          if (elAction) {
            elAction.innerHTML = actionVal;
            elAction.className = actionVal === 'BLOCK' ? 'text-rose-500 font-extrabold text-xs' : 'text-amber-500 font-extrabold text-xs';
          }
        }, 50);
      } else if (step === 3) {
        // Submit final rule definitions into central state rules list
        const name = document.getElementById('rule-name-input').value;
        const param = document.getElementById('rule-param-input').value;
        const action = document.querySelector('input[name="rule-action"]:checked').value;

        const { rules } = store.getState();
        const newRule = {
          id: 'RULE-' + (rules.length + 1),
          name,
          parameter: param,
          action,
          active: true
        };

        store.setState({
          rules: [newRule, ...rules],
          ui: { ...currentUi, ruleModalOpen: false, ruleWizardStep: 1 }
        });

        triggerToast('success', `Security firewall rule "${name}" engaged successfully!`);
      }
    }
  });

  // Handle Multi-step back action
  document.body.addEventListener('click', (e) => {
    if (e.target.id === 'rule-wizard-back') {
      const currentUi = store.getState().ui;
      if (currentUi.ruleWizardStep > 1) {
        store.setState({ ui: { ...currentUi, ruleWizardStep: currentUi.ruleWizardStep - 1 } });
      }
    }
  });

  /* ==========================================================================
     4. Theme Toggle Synchronizations
     ========================================================================== */
  const themeToggle = document.getElementById('dashboard-theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = store.getState().theme;
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      
      document.documentElement.classList.toggle('dark', nextTheme === 'dark');
      store.setState({ theme: nextTheme });
      triggerToast('info', `Swapped system display to ${nextTheme === 'dark' ? 'Dark theme' : 'Light theme'}.`);
    });
  }

  /* ==========================================================================
     5. Accessibility Keyboard Navigation handlers
     ========================================================================== */
  document.addEventListener('keydown', (e) => {
    // 1. Esc Key closes modals
    if (e.key === 'Escape') {
      const { ui } = store.getState();
      if (ui.ruleModalOpen) {
        store.setState({ ui: { ...ui, ruleModalOpen: false } });
        triggerToast('info', 'Rule Wizard dismissed.');
      }
    }

    // 2. Keyboard Focus search input shortcut (Alt + S)
    if (e.altKey && e.key === 's') {
      const search = document.getElementById('search-transactions');
      if (search) {
        e.preventDefault();
        search.focus();
      }
    }
  });
}
