/**
 * FraudShield AI — Modern Dashboard Reusable Utilities Library
 * Standard ES6 Module for optimized, secure helper operations.
 */

/**
 * Creates a debounced function that delays execution until after `delay` ms
 * have elapsed since the last time the debounced function was invoked.
 * Useful for high-frequency input searches or auto-validations.
 * @param {Function} fn - The callback to execute
 * @param {number} delay - Timeout in milliseconds
 * @returns {Function}
 */
export function debounce(fn, delay) {
  let timeoutId;
  return function (...args) {
    const context = this;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(context, args);
    }, delay);
  };
}

/**
 * Creates a throttled function that only invokes `fn` at most once per `limit` ms.
 * Critical for canvas resizing, scrolls, and drag-and-drop actions.
 * @param {Function} fn - The callback to execute
 * @param {number} limit - Throttle threshold in milliseconds
 * @returns {Function}
 */
export function throttle(fn, limit) {
  let lastFunc;
  let lastRan;
  return function (...args) {
    const context = this;
    if (!lastRan) {
      fn.apply(context, args);
      lastRan = Date.now();
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if (Date.now() - lastRan >= limit) {
          fn.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

/**
 * Escapes HTML characters to prevent Cross-Site Scripting (XSS) injections
 * when handling input strings dynamically in DOM elements.
 * @param {string} str - Unsanitized string
 * @returns {string} Sanitized safe string
 */
export function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Formats standard floating-point numbers into premium currency representations.
 * @param {number|string} value - Numerical amount
 * @returns {string} USD formatted currency
 */
export function formatCurrency(value) {
  const num = typeof value === 'number' ? value : parseFloat(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(num);
}

/**
 * Formats dates into concise, structured modern timestamp metrics.
 * @param {Date|string|number} date - Date object, ISO string, or timestamp
 * @returns {string} Date string e.g. "May 26, 10:50:35"
 */
export function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Fetch wrapper supporting automatic retry logic with exponential backoff
 * and clean fallback execution block for maximum network stability.
 * @param {string} url - Target URL API Ingress
 * @param {Object} options - Request options
 * @param {number} retries - Maximum retry count
 * @param {number} delay - Base delay in milliseconds
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(url, options = {}, retries = 3, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.warn(`Fetch failed. Retrying in ${delay}ms... (${retries} attempts left). Error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Animates numerical indicators from a start value to an end value using
 * high-performance requestAnimationFrame, preventing lag in dashboard metrics UI.
 * @param {HTMLElement} element - Target DOM text node
 * @param {number} start - Starting count value
 * @param {number} end - Targeted final number
 * @param {number} duration - Transition duration in milliseconds
 * @param {string} [suffix=""] - Appended suffix (e.g. "%", " ms")
 * @param {Function} [formatter] - Optional value mapping function
 */
export function animateValue(element, start, end, duration, suffix = '', formatter = null) {
  if (!element) return;
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    const currentValue = start + progress * (end - start);
    
    let renderedValue = Math.floor(currentValue);
    if (formatter) {
      element.innerHTML = formatter(renderedValue) + suffix;
    } else {
      element.innerHTML = renderedValue.toLocaleString() + suffix;
    }

    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      // Ensure absolute precision on completion
      if (formatter) {
        element.innerHTML = formatter(end) + suffix;
      } else {
        element.innerHTML = end.toLocaleString() + suffix;
      }
    }
  };
  window.requestAnimationFrame(step);
}
