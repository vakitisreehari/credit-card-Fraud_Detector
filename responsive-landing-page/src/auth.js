/**
 * FraudShield AI — Modern Authentication Manager
 * Simulates enterprise JWT token workflows, secure credentials audit, and route protection.
 */

import { store } from './state.js';

/**
 * Validates the syntax of email addresses securely.
 * @param {string} email - Evaluated email address
 * @returns {boolean}
 */
export function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Calculates a password's strength rating dynamically.
 * @param {string} password - Password string to check
 * @returns {Object} Strength score details (0 to 4), labels, and UI color tags
 */
export function getPasswordStrength(password) {
  let score = 0;
  if (!password) return { score: 0, text: 'Too short', color: 'bg-slate-300 dark:bg-slate-700' };

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  switch (score) {
    case 0:
    case 1:
      return { score, text: 'Weak', color: 'bg-rose-500' };
    case 2:
      return { score, text: 'Fair', color: 'bg-amber-500' };
    case 3:
      return { score, text: 'Good', color: 'bg-indigo-500' };
    case 4:
      return { score, text: 'Excellent', color: 'bg-emerald-500' };
    default:
      return { score: 0, text: 'Too short', color: 'bg-slate-300' };
  }
}

/**
 * Simulates a secure authentication request against security gateway records.
 * @param {string} email - Input email
 * @param {string} password - Input password
 * @returns {Promise<Object>} Authorized operator session details
 */
export async function login(email, password) {
  // Simulate network latency for high fidelity UX
  await new Promise(resolve => setTimeout(resolve, 800));

  const trimmedEmail = email.trim().toLowerCase();

  // Valid credentials mapping
  const mockDatabase = {
    'admin@fraudshield.ai': {
      name: 'Diana Prince',
      role: 'System Administrator',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&fit=crop&q=80',
      token: 'jwt_mock_token_admin_2026_fs'
    },
    'auditor@fraudshield.ai': {
      name: 'Bruce Wayne',
      role: 'Securities Inspector',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&fit=crop&q=80',
      token: 'jwt_mock_token_auditor_2026_fs'
    }
  };

  if (trimmedEmail in mockDatabase) {
    const record = mockDatabase[trimmedEmail];
    
    // Check simulated credentials
    if (trimmedEmail === 'admin@fraudshield.ai' && password === 'admin123') {
      const user = { ...record };
      store.setState({ user });
      return user;
    } else if (trimmedEmail === 'auditor@fraudshield.ai' && password === 'secure123') {
      const user = { ...record };
      store.setState({ user });
      return user;
    }
  }

  throw new Error('Invalid authentication credentials. Access Denied.');
}

/**
 * Destroys the local operator session, clearing the JWT token safely.
 */
export function logout() {
  store.setState({ user: null });
}

/**
 * Protection guard ensuring that requests to secure tabs are blocked if the user is unauthenticated.
 * @returns {boolean} Whether access is permitted
 */
export function checkAuthGuard() {
  const { user } = store.getState();
  return !!user;
}
