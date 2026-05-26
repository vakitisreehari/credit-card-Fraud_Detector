/**
 * FraudShield AI — Modern Reactive State Manager
 * Centralized Publisher-Subscriber store synchronizing session states and UI views.
 */

class Store {
  constructor(initialState) {
    this.state = initialState;
    this.subscribers = [];
  }

  /**
   * Returns the current immutable state reference.
   * @returns {Object}
   */
  getState() {
    return this.state;
  }

  /**
   * Safely updates the state with shallow merge, persisting standard parameters
   * and notifying all subscribed observers.
   * @param {Object} partialState - Partials to update
   */
  setState(partialState) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...partialState };
    
    // Sync critical storage hooks automatically
    if (partialState.user !== undefined) {
      if (this.state.user) {
        sessionStorage.setItem('fs_session_user', JSON.stringify(this.state.user));
      } else {
        sessionStorage.removeItem('fs_session_user');
      }
    }
    if (partialState.theme !== undefined) {
      localStorage.setItem('theme', this.state.theme);
    }

    // Trigger registered subscribers
    this.subscribers.forEach(callback => callback(this.state, oldState));
  }

  /**
   * Subscribes a rendering component to state transitions.
   * Returns an unsubscribe helper callback.
   * @param {Function} callback - Execution callback (state, oldState) => {}
   * @returns {Function} Unsubscribe callback
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }
}

// Read storage defaults safely
const cachedUser = (() => {
  try {
    const data = sessionStorage.getItem('fs_session_user');
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
})();

const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const cachedTheme = localStorage.getItem('theme') || (systemPrefersDark ? 'dark' : 'light');

// Premium mock transaction dataset
const initialTransactions = [
  { id: 'TX-4091', cardholder: 'Diana Prince', card: '4111 •••• •••• 3861', bank: 'Chase Premium', amount: 158.75, country: 'USA', risk: 8.5, status: 'Approved', timestamp: Date.now() - 320000 },
  { id: 'TX-4092', cardholder: 'John Doe', card: '5500 •••• •••• 7129', bank: 'Citi Bank', amount: 890.00, country: 'Tehran', risk: 94.2, status: 'Blocked', timestamp: Date.now() - 280000, triggerRule: 'Sanctioned Country Blacklist' },
  { id: 'TX-4093', cardholder: 'Bruce Wayne', card: '3782 •••• •••• 1002', bank: 'HDFC Select', amount: 2450.50, country: 'Germany', risk: 14.8, status: 'Approved', timestamp: Date.now() - 220000 },
  { id: 'TX-4094', cardholder: 'Anya Petrova', card: '4000 •••• •••• 9924', bank: 'Sberbank Gold', amount: 50.00, country: 'Russia', risk: 68.1, status: 'Flagged', timestamp: Date.now() - 150000, triggerRule: 'High Risk VPN Routing Route' },
  { id: 'TX-4095', cardholder: 'Vikram Singh', card: '4532 •••• •••• 5530', bank: 'SBI Premium', amount: 125.00, country: 'India', risk: 11.2, status: 'Approved', timestamp: Date.now() - 90000 },
  { id: 'TX-4096', cardholder: 'Carlos Ortiz', card: '5105 •••• •••• 2100', bank: 'BBVA Bancomer', amount: 35.80, country: 'Mexico', risk: 5.6, status: 'Approved', timestamp: Date.now() - 30000 }
];

// Premium mock security rules
const initialRules = [
  { id: 'RULE-1', name: 'Sanctioned Country Blacklist', parameter: 'Location matches blacklist', action: 'BLOCK', active: true },
  { id: 'RULE-2', name: 'Card Velocity Threshold Exceeded', parameter: 'Velocity > 5 tx / minute', action: 'BLOCK', active: true },
  { id: 'RULE-3', name: 'High Risk VPN Routing Route', parameter: 'Network VPN threat score > 80%', action: 'FLAG', active: true },
  { id: 'RULE-4', name: 'Luhn Checksum Validation Failure', parameter: 'Luhn validity is False', action: 'BLOCK', active: true },
  { id: 'RULE-5', name: 'Transaction Outlier Upper Limit', parameter: 'Amount exceeds $5,000.00', action: 'FLAG', active: false }
];

// Initialize store with state boundaries
export const store = new Store({
  user: cachedUser,
  theme: cachedTheme,
  transactions: initialTransactions,
  rules: initialRules,
  filters: {
    search: '',
    status: 'All', // 'All', 'Approved', 'Flagged', 'Blocked'
    risk: 'All'    // 'All', 'Low' (risk < 20), 'Medium' (20 <= risk < 60), 'High' (risk >= 60)
  },
  pagination: {
    page: 1,
    limit: 5
  },
  sort: {
    column: 'timestamp',
    order: 'desc' // 'asc' or 'desc'
  },
  notifications: [], // array of toast elements { id, type, message, duration }
  ui: {
    activeTab: 'overview', // 'overview', 'ledger', 'firewall', 'digilocker', 'analytics'
    ruleModalOpen: false,
    ruleWizardStep: 1,
    mobileSidebarOpen: false
  }
});
