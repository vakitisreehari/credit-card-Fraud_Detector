const crypto = require('crypto');

/**
 * JA3 Bot Shield Middleware
 * Analyzes headers, user-agents, and browser-handshake metadata.
 * Detects automated carding scripts, curl requests, and python scraper tools masking as browsers.
 */
function ja3FingerprintMiddleware(req, res, next) {
  const userAgent = req.headers['user-agent'] || '';
  const accept = req.headers['accept'] || '';
  const secChUa = req.headers['sec-ch-ua'] || '';
  
  let isBot = false;
  let ja3Hash = '';
  
  // Create a pseudo-handshake JA3 representation based on headers
  const headerFingerprintString = [
    req.headers['accept-encoding'] || '',
    req.headers['accept-language'] || '',
    req.headers['connection'] || '',
    userAgent
  ].join('|');
  
  ja3Hash = 'ja3_' + crypto.createHash('md5').update(headerFingerprintString).digest('hex').substring(0, 16);

  // Bot detection rules:
  // 1. Claims to be Chrome/Firefox desktop browser but lacks standard Client Hint headers ('sec-ch-ua')
  const claimsBrowser = userAgent.includes('Mozilla') && (userAgent.includes('Chrome') || userAgent.includes('Safari') || userAgent.includes('Firefox'));
  
  if (claimsBrowser) {
    // Standard browsers always send detailed window hints
    if (!secChUa && !req.headers['accept-language']) {
      isBot = true;
      ja3Hash = 'ja3_bot_mismatch_chrome_python';
    }
  }

  // 2. Identify common headless/library scrapers directly
  if (userAgent.includes('python-requests') || userAgent.includes('curl') || userAgent.includes('node-fetch') || userAgent.includes('Axios')) {
    isBot = true;
    ja3Hash = 'ja3_bot_direct_api_script';
  }

  // Attach variables to the request context
  req.ja3Fingerprint = ja3Hash;
  req.ja3BotDetected = isBot;

  next();
}

module.exports = ja3FingerprintMiddleware;
