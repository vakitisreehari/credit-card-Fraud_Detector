/**
 * FraudShield AI — SaaS Dashboard Console Core Bootstrapper
 * Coordinates store state subscriptions, responsive resizing, and live telemetry simulation.
 */

import { store } from './state.js';
import { 
  renderAuthOverlay, 
  renderHeader, 
  renderSidebar, 
  renderMetricCards, 
  renderTransactionTable, 
  renderCustomCanvasChart, 
  renderRulesConfig, 
  renderRuleCreatorStepper,
  triggerToast
} from './components.js';
import { initializeEventBindings } from './events.js';

/**
 * Global reactive render router. Coordinates DOM updates selectively
 * when watched state variables undergo transitions.
 * @param {Object} state - Latest State
 * @param {Object} oldState - Previous State
 */
function appRender(state, oldState = {}) {
  
  // 1. Operator Auth State Changes
  const authChanged = !oldState || oldState.user !== state.user;
  if (authChanged) {
    renderAuthOverlay(!state.user);
    renderHeader(state.user);
    
    // Auto-load base layouts when entering dashboard
    if (state.user) {
      document.documentElement.classList.add('logged-in');
    } else {
      document.documentElement.classList.remove('logged-in');
      return; // Stop rendering dashboard components if console is locked
    }
  }

  if (!state.user) return;

  // 2. Sidebar Active Navigation changes
  const activeTabChanged = !oldState || oldState.ui?.activeTab !== state.ui.activeTab;
  if (activeTabChanged || authChanged) {
    renderSidebar(state.ui.activeTab);
  }

  // 3. Transactions dataset or filter/sort changes
  const txChanged = !oldState || 
                    oldState.transactions !== state.transactions ||
                    oldState.filters !== state.filters ||
                    oldState.pagination !== state.pagination ||
                    oldState.sort !== state.sort ||
                    authChanged;
  if (txChanged) {
    renderMetricCards(state.transactions);
    renderTransactionTable(state.transactions, state.filters, state.pagination, state.sort);
    
    // Keep canvas analytics chart updated on updates
    if (state.ui.activeTab === 'analytics' || state.ui.activeTab === 'overview') {
      renderCustomCanvasChart(state.transactions);
    }
  }

  // 4. Firewall Rule dataset changes
  const rulesChanged = !oldState || oldState.rules !== state.rules || authChanged;
  if (rulesChanged) {
    renderRulesConfig(state.rules);
  }

  // 5. Multi-step Rule Creator Modal toggle or wizard slide changes
  const stepperChanged = !oldState || 
                         oldState.ui?.ruleModalOpen !== state.ui.ruleModalOpen ||
                         oldState.ui?.ruleWizardStep !== state.ui.ruleWizardStep;
  if (stepperChanged) {
    const modal = document.getElementById('rule-wizard-modal');
    if (modal) {
      if (state.ui.ruleModalOpen) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        renderRuleCreatorStepper(state.ui.ruleWizardStep);
      } else {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
      }
    }
  }

  // 6. Mobile Collapsible Navigation drawer sliding
  const mobileSidebarChanged = !oldState || oldState.ui?.mobileSidebarOpen !== state.ui.mobileSidebarOpen;
  if (mobileSidebarChanged) {
    const drawer = document.getElementById('sidebar-container');
    const mask = document.getElementById('mobile-sidebar-overlay');
    if (drawer && mask) {
      if (state.ui.mobileSidebarOpen) {
        drawer.classList.remove('-translate-x-full');
        mask.classList.remove('hidden');
      } else {
        drawer.classList.add('-translate-x-full');
        mask.classList.add('hidden');
      }
    }
  }
}

/**
 * Initiates the real-time background threat vectors stream simulation.
 * Regularly inserts payment telemetry, auditing it against active firewall rules.
 */
function startTelemetrySimulation() {
  const mockNames = ['Emma Watson', 'Anya Petrova', 'Carlos Ortiz', 'Akira Tanaka', 'Arthur Dent', 'James Bond', 'Selina Kyle', 'Diana Prince'];
  const mockBanks = ['SBI Corporate', 'HDFC Select', 'Citi Bank', 'Chase Premium', 'Barclays Gold', 'HSBC Premium'];
  const mockCountries = ['India', 'Russia', 'Mexico', 'Japan', 'USA', 'UK', 'Tehran', 'Germany'];

  setInterval(() => {
    const { user, transactions, rules } = store.getState();
    if (!user) return; // Pause live threats if console is locked

    const rand = Math.random();
    
    // Choose profile randomly
    const name = mockNames[Math.floor(Math.random() * mockNames.length)];
    const bank = mockBanks[Math.floor(Math.random() * mockBanks.length)];
    const country = mockCountries[Math.floor(Math.random() * mockCountries.length)];
    
    // Standard mock charge telemetry
    let amount = parseFloat((Math.random() * 200 + 10).toFixed(2));
    let risk = parseFloat((Math.random() * 15 + 2).toFixed(1));
    let status = 'Approved';
    let triggeredRuleName = undefined;

    // Evaluate telemetry against ACTIVE custom firewall rules!
    const activeRules = rules.filter(r => r.active);
    
    // Rule 1: Country Origin Blacklist (e.g. Tehran)
    const geoRule = activeRules.find(r => r.id === 'RULE-1');
    if (geoRule && country === 'Tehran') {
      status = geoRule.action === 'BLOCK' ? 'Blocked' : 'Flagged';
      risk = parseFloat((Math.random() * 10 + 88).toFixed(1)); // Skyrocket risk
      triggeredRuleName = geoRule.name;
    }

    // Rule 3: High Risk VPN Threat scoring (e.g. Russia routing)
    const vpnRule = activeRules.find(r => r.id === 'RULE-3');
    if (vpnRule && country === 'Russia' && !triggeredRuleName) {
      status = vpnRule.action === 'BLOCK' ? 'Blocked' : 'Flagged';
      risk = parseFloat((Math.random() * 20 + 65).toFixed(1));
      triggeredRuleName = vpnRule.name;
    }

    // Rule 5: Large Transaction Upper Threshold
    const limitRule = activeRules.find(r => r.id === 'RULE-5');
    if (limitRule && rand > 0.8 && !triggeredRuleName) {
      amount = parseFloat((Math.random() * 3000 + 5100).toFixed(2));
      status = limitRule.action === 'BLOCK' ? 'Blocked' : 'Flagged';
      risk = parseFloat((Math.random() * 15 + 50).toFixed(1));
      triggeredRuleName = limitRule.name;
    }

    // Generate simulated card masking
    const cardNum = Math.floor(Math.random() * 8999 + 1000) + ' •••• •••• ' + Math.floor(Math.random() * 8999 + 1000);
    const newTxId = 'TX-' + Math.floor(Math.random() * 8999 + 1000);
    
    const newTx = {
      id: newTxId,
      cardholder: name,
      card: cardNum,
      bank,
      amount,
      country,
      risk,
      status,
      triggerRule: triggeredRuleName,
      timestamp: Date.now()
    };

    // Prepend to top of central transaction state
    const updatedTransactions = [newTx, ...transactions];
    store.setState({ transactions: updatedTransactions });

    // Issue interactive Toast Notifications for flagged or blocked threat waves
    if (status === 'Blocked') {
      triggerToast('danger', `ALERT: Cyber-Intrusion blocked. ${newTxId} originating from ${country} triggered rule: "${triggeredRuleName}".`);
    } else if (status === 'Flagged') {
      triggerToast('warning', `Compliance audit queued for ${newTxId} (${name}). Secondary identification keys required.`);
    } else {
      // Normal transaction
      if (Math.random() > 0.6) {
        triggerToast('success', `Transaction ${newTxId} parsed and cleared by ML security gateway.`);
      }
    }

  }, 10000); // Trigger every 10 seconds to keep dashboard alive and natural
}

// Initial Bootstrapping sequences
document.addEventListener('DOMContentLoaded', () => {
  
  // 1. Set display visual theme configurations on launch
  const initialTheme = store.getState().theme;
  document.documentElement.classList.toggle('dark', initialTheme === 'dark');

  // 2. Register global state subscriber to routing actions
  store.subscribe(appRender);

  // 3. Execute first render block
  appRender(store.getState());

  // 4. Initialize click delegations and observers
  initializeEventBindings();

  // 5. Fire background simulator engines
  startTelemetrySimulation();

  // 6. Bind Throttled Window resizing events for Canvas grids refreshing
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const state = store.getState();
      if (state.user && (state.ui.activeTab === 'analytics' || state.ui.activeTab === 'overview')) {
        renderCustomCanvasChart(state.transactions);
      }
    }, 150); // 150ms throttle limit
  });
});
