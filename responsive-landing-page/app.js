/**
 * FraudShield AI — Modern Responsive Landing Page Script
 * Enables Theme Management, Hamburger Drawers, Vercel-like Card Glows, and a Live Interactive Simulator HUD.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Select active elements
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const menuBtn = document.getElementById('menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  /* ==========================================================================
     1. Theme Management (Dark / Light Mode)
     ========================================================================== */
  
  const isDarkTheme = () => document.documentElement.classList.contains('dark');

  const updateThemeIcon = () => {
    if (isDarkTheme()) {
      // Sun SVG icon for transitioning to light mode
      themeIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-amber-400 animate-spin-slow">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      `;
    } else {
      // Moon SVG icon for transitioning to dark mode
      themeIcon.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-4 h-4 text-indigo-600">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      `;
    }
  };

  // Sync preference with localStorage or system setting
  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  updateThemeIcon();

  // Click listener for toggling themes
  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    const isDarkNow = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDarkNow ? 'dark' : 'light');
    updateThemeIcon();
  });

  /* ==========================================================================
     2. Responsive Mobile Navigation Collapsible
     ========================================================================== */
  
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileMenu.classList.toggle('hidden');
  });

  // Close hamburger menu when a menu item is tapped
  const mobileLinks = mobileMenu.querySelectorAll('a');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  });

  // Close hamburger menu if clicking outside of it
  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
      mobileMenu.classList.add('hidden');
    }
  });

  /* ==========================================================================
     3. Card Hover Glowing Effects (Cursor Tracking)
     ========================================================================== */
  
  const cards = document.querySelectorAll('.glow-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });

  /* ==========================================================================
     4. High-Fidelity Terminal HUD Simulator
     ========================================================================== */
  
  // Find Terminal elements
  const terminalLogsContainer = document.querySelector('#dashboard .space-y-3.5');
  const processedMetric = document.querySelector('#dashboard .grid div:nth-child(1) span:nth-child(2)');
  const blockedMetric = document.querySelector('#dashboard .grid div:nth-child(2) span:nth-child(2)');
  const verificationMetric = document.querySelector('#dashboard .grid div:nth-child(3) span:nth-child(2)');

  // Initial dashboard metric states
  let totalProcessed = 4291;
  let totalBlocked = 82;
  let verificationRate = 99.85;

  // Realistic mock event triggers
  const mockNames = ['Jane Smith', 'David Miller', 'Vikram Singh', 'Anya Petrova', 'Carlos Ortiz', 'Akira Tanaka', 'Emma Watson'];
  const mockCountries = ['Germany', 'USA', 'India', 'Russia', 'Mexico', 'Japan', 'UK'];
  const mockBans = ['Card Velocity Threshold Exceeded', 'Suspicious Card-Not-Present Amount IP mismatch', 'High Risk VPN Routing Route', 'Luhn Checksum Validation Failure'];
  const mockBanks = ['HDFC Bank', 'Citi Premier', 'Chase Sapphire', 'HSBC Premium', 'SBI Corporate', 'Barclays Gold'];

  const getTimestamp = () => {
    const now = new Date();
    return now.toTimeString().split(' ')[0] + ' ' + (now.getMilliseconds() < 100 ? '0' : '') + now.getMilliseconds() + 'ms';
  };

  const appendTerminalLog = (logHtml) => {
    if (!terminalLogsContainer) return;
    
    // Create new line wrap
    const newLogLine = document.createElement('p');
    newLogLine.className = 'terminal-line';
    newLogLine.innerHTML = logHtml;
    
    terminalLogsContainer.appendChild(newLogLine);

    // Keep logs neat and bounded (max 10 rows)
    while (terminalLogsContainer.children.length > 8) {
      terminalLogsContainer.removeChild(terminalLogsContainer.firstChild);
    }
  };

  // Perform dynamic logs simulation
  const runConsoleSimulation = () => {
    const rand = Math.random();
    
    if (rand < 0.45) {
      // 1. Render normal approved check
      const name = mockNames[Math.floor(Math.random() * mockNames.length)];
      const bank = mockBanks[Math.floor(Math.random() * mockBanks.length)];
      const distance = (Math.random() * 15).toFixed(1);
      const score = (Math.random() * 15 + 1).toFixed(1);
      
      appendTerminalLog(`
        <span class="text-indigo-400 font-bold">[${getTimestamp()} SEC]</span>
        Querying transaction velocity for ${name} (${bank})... <span class="text-emerald-400">OK (${distance} km)</span>
      `);
      
      setTimeout(() => {
        appendTerminalLog(`
          <span class="text-indigo-400 font-bold">[${getTimestamp()} AI ]</span>
          Score: <span class="text-emerald-400 font-bold">${score}% Probability</span> override: <span class="text-emerald-400 font-bold">APPROVED</span>
        `);
        // Update metrics
        totalProcessed += 1;
        if (processedMetric) processedMetric.textContent = `${totalProcessed.toLocaleString()} tx`;
        
        // Randomly nudge verification rate
        verificationRate = +(99.8 + Math.random() * 0.15).toFixed(2);
        if (verificationMetric) verificationMetric.textContent = `${verificationRate}%`;
      }, 900);

    } else if (rand < 0.75) {
      // 2. Render high risk block trigger
      const country = mockCountries[Math.floor(Math.random() * mockCountries.length)];
      const banReason = mockBans[Math.floor(Math.random() * mockBans.length)];
      
      appendTerminalLog(`
        <span class="text-indigo-400 font-bold">[${getTimestamp()} SEC]</span>
        <span class="text-rose-400 font-bold">Warning!</span> Host location anomaly (${country} node) flagged.
      `);
      
      setTimeout(() => {
        appendTerminalLog(`
          <span class="text-indigo-400 font-bold">[${getTimestamp()} REG]</span>
          Target Rule: <span class="text-red-400 font-bold">"${banReason}"</span> triggered. Action: <span class="text-red-400 font-bold">BLOCKED</span>
        `);
        // Update blocked metric
        totalBlocked += 1;
        totalProcessed += 1;
        if (blockedMetric) blockedMetric.textContent = `${totalBlocked} nodes`;
        if (processedMetric) processedMetric.textContent = `${totalProcessed.toLocaleString()} tx`;
      }, 1000);

    } else {
      // 3. Render DigiLocker / Aadhaar Identity check
      const name = mockNames[Math.floor(Math.random() * mockNames.length)];
      const score = (Math.random() * 5 + 95).toFixed(1);
      
      appendTerminalLog(`
        <span class="text-indigo-400 font-bold">[${getTimestamp()} DIG]</span>
        Decrypting digital credentials for ${name} on secure DigiLocker ingress...
      `);
      
      setTimeout(() => {
        appendTerminalLog(`
          <span class="text-indigo-400 font-bold">[${getTimestamp()} GOV]</span>
          Government Gateway: Face match verified with <span class="text-emerald-400 font-bold">${score}% confidence.</span>
        `);
        totalProcessed += 1;
        if (processedMetric) processedMetric.textContent = `${totalProcessed.toLocaleString()} tx`;
      }, 1100);
    }
  };

  // Run the loop every 3 seconds to keep it interactive and natural
  setInterval(runConsoleSimulation, 3000);
});
