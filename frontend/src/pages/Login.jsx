import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Mail, Lock, Eye, EyeOff, User, AlertCircle, Shield } from 'lucide-react';
import { login as apiLogin, register as apiRegister } from '../utils/api';

/* ─────────────────────────────────────────
   MAIN LOGIN COMPONENT
───────────────────────────────────────── */
export default function Login({ onLoginSuccess }) {
  const [tab, setTab]           = useState('login');   // 'login' | 'register'
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [remember, setRemember] = useState(false);
  const [success, setSuccess]   = useState(false);

  // Login fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [rName, setRName]       = useState('');
  const [rEmail, setREmail]     = useState('');
  const [rPass, setRPass]       = useState('');
  const [rConf, setRConf]       = useState('');

  const switchTab = (t) => { setTab(t); setError(''); };

  // ─────────────────────────────────────────
  // AI Fraud Card States & Refs
  // ─────────────────────────────────────────
  const [accuracy, setAccuracy]   = useState(0);
  const [scanRate, setScanRate]   = useState(45);
  const [logs, setLogs]           = useState([]);
  const [activeModal, setActiveModal] = useState(null); // null | 'about' | 'contact'
  const cardRef                   = React.useRef(null);
  const logsContainerRef          = React.useRef(null);
  const strokeRef                 = React.useRef(null);
  const fillRef                   = React.useRef(null);

  // 1. Accuracy metrics count up
  useEffect(() => {
    let start = 0;
    const end = 99.85;
    const duration = 1400;
    let startTimestamp = null;
    
    let active = true;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const current = start + progress * (end - start);
      if (active) setAccuracy(current);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
    return () => { active = false; };
  }, []);

  // 2. Cursor glow event listener
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    
    const handleMouseMove = (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    };

    card.addEventListener('mousemove', handleMouseMove);
    return () => { card.removeEventListener('mousemove', handleMouseMove); };
  }, []);

  // 3. Live scrolling console feed logs simulation
  useEffect(() => {
    const templates = [
      'Querying geo-velocity coordinates...',
      'Luhn checksum formula: VALIDATED.',
      'Analysing device user-agent hash signature...',
      'Face validation match: 99.82% UIDAI secure key.',
      'Analyzing screen-size ratio anomalies... OK',
      'Validating Aadhaar digital cryptographic signature...',
      'Gateway TLS handshake fingerprint matches operator.',
      'Evaluating behavioral velocities: normal tier.',
      'Risk validation model: XGBoost returns 0.04% probability.',
      'API gateway ping: response completed in 12ms.'
    ];

    const getTimestamp = () => {
      const now = new Date();
      return now.toTimeString().split(' ')[0];
    };

    // Helper to append a single log line
    const appendLog = (msg, type = 'info') => {
      const timeStr = getTimestamp();
      const prefix = type === 'success' ? '[OK ]' : '[SCAN]';
      const logLine = `${timeStr} ${prefix} ${msg}`;
      
      setLogs(prev => {
        const next = [...prev, logLine];
        return next.slice(-20); // Keep last 20 logs
      });
    };

    // Initial seed logs
    appendLog('Initializing security node ingress...', 'info');
    setTimeout(() => appendLog('Establishing SSL secure tunnel to UIDAI gateway...', 'info'), 400);
    setTimeout(() => appendLog('Explainable AI node engaged (Model V3.4)...', 'success'), 900);

    const timer = setInterval(() => {
      const msg = templates[Math.floor(Math.random() * templates.length)];
      const isSuccess = Math.random() > 0.3;
      appendLog(msg, isSuccess ? 'success' : 'info');
      setScanRate(Math.floor(Math.random() * 15 + 38));
    }, 3200);

    return () => clearInterval(timer);
  }, []);

  // Scroll logs terminal automatically
  useEffect(() => {
    const el = logsContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [logs]);

  // 4. Animated vector graph wave
  useEffect(() => {
    let phase = 0;
    let frameId;
    
    const animateWave = () => {
      phase += 0.05;
      const peaks = [];
      for (let x = 0; x <= 300; x += 10) {
        const y = 35 + Math.sin(x * 0.03 + phase) * 8 + Math.cos(x * 0.01 + phase * 0.5) * 5;
        peaks.push({ x, y });
      }
      
      let pathStroke = `M 0 60`;
      peaks.forEach(p => {
        pathStroke += ` L ${p.x} ${p.y}`;
      });
      
      let pathFill = pathStroke + ` L 300 60 L 0 60 Z`;
      
      if (strokeRef.current) strokeRef.current.setAttribute('d', pathStroke);
      if (fillRef.current) fillRef.current.setAttribute('d', pathFill);
      
      frameId = requestAnimationFrame(animateWave);
    };
    
    frameId = requestAnimationFrame(animateWave);
    return () => cancelAnimationFrame(frameId);
  }, []);

  /* ── Login ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiLogin({ username: email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setSuccess(true);
        setTimeout(() => onLoginSuccess(res.data.user), 900);
      } else { setError(res.data.message || 'Invalid email or password.'); }
    } catch (err) { setError(err.response?.data?.message || 'Sign-in failed. Please try again.'); }
    finally { setLoading(false); }
  };

  /* ── Register ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!rName || !rEmail || !rPass || !rConf) { setError('Please fill in all fields.'); return; }
    if (!/\S+@\S+\.\S+/.test(rEmail)) { setError('Enter a valid email address.'); return; }
    if (rPass.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (rPass !== rConf) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const username = rName.trim().replace(/\s+/g, '_').toLowerCase() + '_' + Date.now().toString(36);
      const res = await apiRegister({ username, email: rEmail, password: rPass, name: rName.trim() });
      if (res.data.success) {
        // Auto login after registration
        const lr = await apiLogin({ username: rEmail, password: rPass });
        if (lr.data.success) {
          localStorage.setItem('token', lr.data.token);
          localStorage.setItem('user', JSON.stringify(lr.data.user));
          setSuccess(true);
          setTimeout(() => onLoginSuccess(lr.data.user), 900);
        } else { switchTab('login'); }
      } else { setError(res.data.message || 'Registration failed.'); }
    } catch (err) { setError(err.response?.data?.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  /* ── Google ── */
  const handleGoogle = async (credResp) => {
    setError(''); setGLoading(true);
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const res  = await fetch(`${base}/auth/google`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credResp.credential }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setSuccess(true);
        setTimeout(() => onLoginSuccess(data.user), 900);
      } else { setError(data.message || 'Google authentication failed.'); }
    } catch { setError('Server unreachable. Please try again.'); }
    finally { setGLoading(false); }
  };

  /* ── Password strength ── */
  const passScore = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(rPass)).length;
  const passColors = ['', '#EF4444', '#F59E0B', '#2563EB', '#10B981'];
  const passLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  /* ─────────────── RENDER ─────────────── */
  return (
    <div className="login-page-bg">
      <style>{`
        .login-page-bg {
          min-height: 100vh;
          width: 100%;
          background: #f1f5f9;
          background-image: 
            radial-gradient(circle at 15% 25%, rgba(99, 102, 241, 0.06) 0%, transparent 45%),
            radial-gradient(circle at 85% 75%, rgba(6, 182, 212, 0.05) 0%, transparent 45%),
            linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          font-family: 'Segoe UI', system-ui, sans-serif;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleUp {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.85; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(1.3); }
        }
        .fade-up { animation: fadeUp .35s ease both; }
        input:focus { outline: none; }
        .login-input {
          width: 100%; padding: 12px 14px 12px 42px; font-size: 14px;
          border: 1.5px solid #e2e8f0; border-radius: 12px;
          background: #fff; color: #1e293b; transition: all .15s;
          box-sizing: border-box;
        }
        .login-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.08); }
        .login-input::placeholder { color: #94a3b8; }
        .login-btn {
          width: 100%; padding: 11px; font-size: 15px; font-weight: 700;
          color: #fff; background: #2563EB; border: none; border-radius: 8px;
          cursor: pointer; transition: background .15s, transform .1s;
        }
        .login-btn:hover:not(:disabled) { background: #1d4ed8; }
        .login-btn:active { transform: scale(.99); }
        .login-btn:disabled { opacity: .6; cursor: not-allowed; }
        .google-btn-wrap > div { width: 100% !important; }
        .google-btn-wrap iframe { width: 100% !important; }

        .cyber-grid {
          background-size: 24px 24px;
          background-image: linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        }
        @keyframes sweep {
          0% { transform: translateY(-100%); opacity: 0; }
          15% { opacity: 0.35; }
          85% { opacity: 0.35; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        .radar-sweep {
          position: absolute; inset: 0; width: 100%; height: 100%;
          background: linear-gradient(to bottom, transparent, rgba(99, 102, 241, 0.05), rgba(99, 102, 241, 0.08), rgba(99, 102, 241, 0.05), transparent);
          animation: sweep 6s linear infinite; pointer-events: none;
        }
        #fraud-card-wrapper {
          position: relative; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;
          background: #060913; border: 1px solid #1e293b; border-radius: 16px;
          padding: 28px; width: 100%; max-width: 440px; margin: 0 auto;
          box-shadow: 0 10px 30px rgba(0,0,0,0.25);
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        #fraud-card-wrapper::before {
          content: ''; position: absolute; inset: 0; border-radius: 16px; padding: 1.5px;
          background: radial-gradient(350px circle at var(--mouse-x, 0) var(--mouse-y, 0), rgba(99, 102, 241, 0.35), transparent 80%);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          pointer-events: none; z-index: 1; opacity: 0; transition: opacity 0.5s ease;
        }
        #fraud-card-wrapper:hover::before { opacity: 1; }
        #fraud-card-wrapper:hover {
          border-color: rgba(99, 102, 241, 0.4);
          box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.15);
          transform: translateY(-2px);
        }
        .console-logs-container {
          height: 120px; background: rgba(2, 6, 23, 0.7); border: 1px solid #1e293b;
          border-radius: 8px; padding: 10px; font-family: monospace; font-size: 9px;
          color: #94a3b8; overflow-y: auto; box-sizing: border-box; text-align: left;
        }
        .console-logs-container::-webkit-scrollbar { width: 4px; }
        .console-logs-container::-webkit-scrollbar-track { background: rgba(255,255,255,0.01); }
        .console-logs-container::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 999px; }

        .fraud-card-split {
          display: flex;
          flex-direction: column;
          gap: 24px;
          width: 100%;
        }
        @media (min-width: 768px) {
          .fraud-card-split {
            flex-direction: row !important;
          }
        }

        @media (min-width: 992px) {
          .login-grid-container {
            grid-template-columns: 1.45fr 1fr !important;
            align-items: stretch !important;
            max-width: 1100px !important;
          }
          #fraud-card-wrapper {
            max-width: 680px !important;
          }
        }
      `}</style>

      {/* ── Fixed Cyber Backdrop Mesh ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {/* Soft glowing spheres */}
        <div style={{ position: 'absolute', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)', borderRadius: '50%', top: '-10%', left: '-10%' }} />
        <div style={{ position: 'absolute', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(6,182,212,0.04) 0%, transparent 70%)', borderRadius: '50%', bottom: '5%', right: '-5%' }} />
        
        {/* Dotted cyber grid overlay */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.2, backgroundImage: 'radial-gradient(rgba(99, 102, 241, 0.12) 1.5px, transparent 1.5px)', backgroundSize: '32px 32px' }} />

        {/* Left Side: Glowing cyber rings */}
        <svg viewBox="0 0 100 100" style={{ position: 'absolute', left: '-50px', top: '25%', width: '400px', height: '400px', opacity: 0.4, overflow: 'visible', filter: 'blur(1px)' }}>
          <circle cx="20" cy="50" r="45" fill="none" stroke="url(#bg-grad-1)" strokeWidth="0.5" strokeDasharray="3 2" />
          <circle cx="20" cy="50" r="38" fill="none" stroke="url(#bg-grad-2)" strokeWidth="0.8" />
          <circle cx="20" cy="50" r="30" fill="none" stroke="url(#bg-grad-1)" strokeWidth="0.4" strokeDasharray="10 5" />
          <defs>
            <linearGradient id="bg-grad-1" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
            </linearGradient>
            <linearGradient id="bg-grad-2" x1="0" y1="1" x2="1" y2="0">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Right Side: Dotted digital networks */}
        <svg viewBox="0 0 100 100" style={{ position: 'absolute', right: '-100px', bottom: '15%', width: '450px', height: '450px', opacity: 0.35, overflow: 'visible' }}>
          <path d="M 80 20 Q 50 40, 20 60 T -10 90" fill="none" stroke="#6366f1" strokeWidth="0.15" strokeDasharray="1 1.5" />
          <path d="M 90 40 Q 60 55, 30 70" fill="none" stroke="#3b82f6" strokeWidth="0.1" strokeDasharray="2 2" />
          {/* Grid nodes */}
          <circle cx="80" cy="20" r="1.5" fill="rgba(99, 102, 241, 0.4)" />
          <circle cx="50" cy="40" r="1.2" fill="rgba(59, 130, 246, 0.3)" />
          <circle cx="20" cy="60" r="1.5" fill="rgba(168, 85, 247, 0.4)" />
          <circle cx="60" cy="55" r="1" fill="rgba(6, 182, 212, 0.3)" />
        </svg>
      </div>

      {/* ── Navbar ── */}
      <nav style={{ position: 'relative', zIndex: 1, background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="#2563EB" />
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>FraudShield</span>
        </div>
        <div style={{ display: 'flex', gap: '28px', height: '100%', alignItems: 'center' }}>
          {['Home', 'About', 'Contact'].map(l => {
            const isActive = activeModal === l.toLowerCase() || (l === 'Home' && !activeModal);
            return (
              <button key={l} onClick={() => {
                if (l === 'Home') setActiveModal(null);
                else setActiveModal(l.toLowerCase());
              }} style={{
                position: 'relative', height: '100%', background: 'none', border: 'none',
                fontSize: '14px', color: isActive ? '#0f172a' : '#475569', fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0 4px',
                transition: 'color 0.2s'
              }}>
                {l}
                {isActive && (
                  <span style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
                    background: '#2563EB', borderRadius: '999px'
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Card ── */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div className="login-grid-container" style={{
          display: 'grid', gridTemplateColumns: '1fr', gap: '32px',
          width: '100%', maxWidth: '440px', margin: '0 auto'
        }}>

          {/* LEFT COLUMN: PREMIUM DARK FINTECH FRAUD CARD */}
          <div id="fraud-card-wrapper" ref={cardRef} className="fade-up">
            <div className="radar-sweep"></div>
            <div className="cyber-grid" style={{ position: 'absolute', inset: 0, opacity: 0.25, pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius: '50%', top: '-60px', left: '-60px', pointerEvents: 'none' }}></div>
            <div style={{ position: 'absolute', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)', borderRadius: '50%', bottom: '-60px', right: '-60px', pointerEvents: 'none' }}></div>

            <div className="fraud-card-split" style={{ position: 'relative', zIndex: 5 }}>
              
              {/* Left Column: Metrics & Logs */}
              <div style={{ flex: 1.1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ position: 'relative', display: 'flex', height: '8px', width: '8px' }}>
                      <span style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', background: '#10B981', opacity: 0.75 }}></span>
                      <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '8px', width: '8px', background: '#10B981' }}></span>
                    </span>
                    <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'monospace', tracking: '0.15em', color: '#10B981', textTransform: 'uppercase' }}>Gatekeeper AI Active</span>
                  </div>
                  <span style={{ padding: '2px 8px', border: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.1)', color: '#818CF8', borderRadius: '6px', fontSize: '8px', fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase' }}>🛡️ Protected by AI</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'monospace', color: '#64748b', textTransform: 'uppercase', tracking: '0.15em' }}>Scanning Accuracy</span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{accuracy.toFixed(2)}%</span>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#10B981', fontFamily: 'monospace' }}>Real-time</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '9px', fontWeight: 700, fontFamily: 'monospace', color: '#475569' }}>
                    <span>Transaction Scanning velocity</span>
                    <span style={{ color: '#818CF8', fontWeight: 700 }}>{scanRate} tx/sec</span>
                  </div>
                  <div style={{ height: '56px', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'end' }}>
                    <svg viewBox="0 0 300 60" style={{ width: '100%', height: '100%', color: '#6366f1', overflow: 'visible' }}>
                      <defs>
                        <linearGradient id="wave-grad-react" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.25"/>
                          <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0"/>
                        </linearGradient>
                      </defs>
                      <path ref={fillRef} d="M 0 60 Q 25 35, 50 45 T 100 25 T 150 40 T 200 20 T 250 35 T 300 60 L 300 60 L 0 60 Z" fill="url(#wave-grad-react)"></path>
                      <path ref={strokeRef} d="M 0 60 Q 25 35, 50 45 T 100 25 T 150 40 T 200 20 T 250 35 T 300 60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></path>
                    </svg>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, fontFamily: 'monospace', color: '#475569', textTransform: 'uppercase', tracking: '0.15em', textAlign: 'left' }}>Real-time Security Ingress Feed</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '9px', fontWeight: 700, fontFamily: 'monospace', color: '#10B981' }}>
                      <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#10B981', animation: 'pulse 1.5s infinite' }}></span>
                      LIVE
                    </span>
                  </div>
                  <div ref={logsContainerRef} className="console-logs-container" style={{ height: '90px' }}>
                    {logs.map((log, index) => {
                      const parts = log.split(' ');
                      const time = parts[0];
                      const type = parts[1];
                      const rest = parts.slice(2).join(' ');
                      const isOk = type === '[OK]';
                      return (
                        <div key={index} style={{ display: 'flex', gap: '6px', marginBottom: '4px', lineHeight: 1.4 }}>
                          <span style={{ color: '#475569', userSelect: 'none' }}>{time}</span>
                          <span style={{ color: isOk ? '#10B981' : '#818CF8', fontWeight: 700 }}>{type}</span>
                          <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rest}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Hologram Credit Card & Shield Pedestal */}
              <div className="card-illustration-container" style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                position: 'relative', minHeight: '240px', overflow: 'visible', pointerEvents: 'none', userSelect: 'none'
              }}>
                {/* Hologram Rings */}
                <div className="hologram-circle-1" style={{
                  position: 'absolute', width: '220px', height: '220px',
                  border: '1.5px dashed rgba(99, 102, 241, 0.22)', borderRadius: '50%',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)'
                }} />
                <div className="hologram-circle-2" style={{
                  position: 'absolute', width: '170px', height: '170px',
                  border: '1px solid rgba(16, 185, 129, 0.18)', borderRadius: '50%',
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)'
                }} />
                
                {/* Hologram digital pedestal */}
                <div className="digital-pedestal" style={{
                  position: 'absolute', bottom: '15px', width: '150px', height: '20px',
                  background: 'radial-gradient(ellipse, rgba(59, 130, 246, 0.25) 0%, transparent 70%)',
                  border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '50%',
                  transform: 'rotateX(65deg)', zIndex: 1,
                  boxShadow: '0 0 15px rgba(59, 130, 246, 0.35)'
                }} />

                {/* Floating Credit Card */}
                <div className="floating-credit-card" style={{
                  position: 'relative', width: '224px', height: '140px',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.85) 0%, rgba(30, 41, 59, 0.55) 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px',
                  padding: '14px', boxSizing: 'border-box',
                  boxShadow: '0 15px 35px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.08)',
                  transform: 'perspective(800px) rotateY(-18deg) rotateX(12deg) rotateZ(-6deg)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  overflow: 'hidden', zIndex: 3, backdropFilter: 'blur(8px)'
                }}>
                  {/* Watermark global connections vector background */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none', background: 'radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 80%)' }}>
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                      <circle cx="20" cy="30" r="1.2" fill="#fff" />
                      <circle cx="50" cy="20" r="1.5" fill="#fff" />
                      <circle cx="80" cy="40" r="1.2" fill="#fff" />
                      <circle cx="40" cy="70" r="1.2" fill="#fff" />
                      <circle cx="70" cy="80" r="1.2" fill="#fff" />
                      <line x1="20" y1="30" x2="50" y2="20" stroke="#fff" strokeWidth="0.25" />
                      <line x1="50" y1="20" x2="80" y2="40" stroke="#fff" strokeWidth="0.25" />
                      <line x1="80" y1="40" x2="70" y2="80" stroke="#fff" strokeWidth="0.25" />
                      <line x1="70" y1="80" x2="40" y2="70" stroke="#fff" strokeWidth="0.25" />
                      <line x1="40" y1="70" x2="20" y2="30" stroke="#fff" strokeWidth="0.25" />
                      <line x1="50" y1="20" x2="40" y2="70" stroke="#fff" strokeWidth="0.25" />
                    </svg>
                  </div>

                  {/* Top Row: Brand & Contactless */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', position: 'relative', zIndex: 4 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: '#fff', letterSpacing: '0.05em', fontFamily: 'sans-serif' }}>FraudShield AI</span>
                      <span style={{ fontSize: '4.5px', fontWeight: 600, color: '#94a3b8', letterSpacing: '0.1em', marginTop: '0.5px' }}>SECURE PAYMENTS</span>
                    </div>
                    {/* Contactless Wifi Icon */}
                    <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M5 12a10 10 0 0 1 14 0" />
                      <path d="M8.5 15.5a5 5 0 0 1 7 0" />
                      <path d="M12 18a1 1 0 1 1 0-.01" />
                    </svg>
                  </div>

                  {/* Chip Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 4, margin: '4px 0' }}>
                    {/* Metallic Gold Chip */}
                    <div style={{
                      width: '24px', height: '18px',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                      borderRadius: '3px', position: 'relative', overflow: 'hidden',
                      border: '0.5px solid rgba(255,255,255,0.15)',
                      boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)'
                    }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33%', width: '1px', background: 'rgba(0,0,0,0.2)' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66%', width: '1px', background: 'rgba(0,0,0,0.2)' }} />
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '40%', height: '1px', background: 'rgba(0,0,0,0.2)' }} />
                      <div style={{ position: 'absolute', left: 0, right: 0, top: '70%', height: '1px', background: 'rgba(0,0,0,0.2)' }} />
                      <div style={{ position: 'absolute', top: '15%', bottom: '15%', left: '15%', right: '15%', borderRadius: '1.5px', border: '0.5px solid rgba(0,0,0,0.15)' }} />
                    </div>
                  </div>

                  {/* Card Number */}
                  <div style={{
                    fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#fff',
                    letterSpacing: '1.5px', textAlign: 'left', textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                    position: 'relative', zIndex: 4, marginBottom: '4px'
                  }}>
                    4587 2345 9876 5432
                  </div>

                  {/* Bottom Row: Name & Date */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', position: 'relative', zIndex: 4 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start' }}>
                      <span style={{ fontSize: '4.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cardholder Name</span>
                      <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#fff', fontFamily: 'monospace', textTransform: 'uppercase', marginTop: '1px' }}>VAKITI SREEHARI</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end' }}>
                      <span style={{ fontSize: '4.5px', color: '#94a3b8', textTransform: 'uppercase' }}>Valid Thru</span>
                      <span style={{ fontSize: '7.5px', fontWeight: 700, color: '#fff', fontFamily: 'monospace', marginTop: '1px' }}>12/26</span>
                    </div>
                  </div>
                </div>

                {/* Floating Glowing Shield Overlay */}
                <div className="neon-security-shield" style={{
                  position: 'absolute', bottom: '20px', right: '35px', zIndex: 5,
                  width: '64px', height: '76px',
                  background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(99, 102, 241, 0.22) 100%)',
                  border: '1.5px solid #3b82f6', borderRadius: '10px 10px 24px 24px',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.5), inset 0 0 8px rgba(59, 130, 246, 0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  backdropFilter: 'blur(4px)'
                }}>
                  {/* Shield Grid */}
                  <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundSize: '6px 6px', backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)' }} />
                  {/* Shield Lock SVG */}
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>

            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', paddingTop: '16px', marginTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 5 }}>
              {[
                ['Device Key', '✓ Secure HASH', '#10B981'],
                ['Behavior', '✓ Validated', '#818CF8'],
                ['Sync Rate', '99.8% AI', '#fff']
              ].map(([lbl, val, col]) => (
                <div key={lbl} style={{ padding: '8px', background: 'rgba(2, 6, 23, 0.4)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: '10px', textAlign: 'center' }}>
                  <span style={{ color: '#475569', fontSize: '7px', fontWeight: 700, fontFamily: 'monospace', textTransform: 'uppercase', display: 'block' }}>{lbl}</span>
                  <span style={{ color: col, fontSize: '8px', fontWeight: 700, fontFamily: 'monospace', marginTop: '2px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT COLUMN: EXISTING WHITE LOGIN PANEL */}
          <div className="fade-up" style={{
            background: '#fff', borderRadius: '16px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '420px',
            overflow: 'hidden', margin: '0 auto'
          }}>

          {/* ── Tabs ── */}
          <div style={{ display: 'flex', borderBottom: '1.5px solid #e2e8f0' }}>
            {[['login', 'Login'], ['register', 'Create Account']].map(([t, l]) => (
              <button key={t} onClick={() => switchTab(t)} style={{
                flex: 1, padding: '16px 0', fontSize: '14px', fontWeight: 600,
                background: 'none', border: 'none', cursor: 'pointer',
                color: tab === t ? '#2563EB' : '#94a3b8',
                borderBottom: tab === t ? '2.5px solid #2563EB' : '2.5px solid transparent',
                marginBottom: '-1.5px', transition: 'all .15s',
              }}>{l}</button>
            ))}
          </div>

          {/* ── Card Body ── */}
          <div style={{ padding: '28px 32px 32px' }}>

            {/* Success state */}
            {success ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
                <p style={{ fontWeight: 800, fontSize: '18px', color: '#0f172a' }}>You're in!</p>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Redirecting to dashboard…</p>
              </div>
            ) : tab === 'login' ? (
              /* ── LOGIN FORM ── */
              <div className="fade-up">
                <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  Welcome Back
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="#2563EB" style={{ display: 'inline-block', flexShrink: 0 }}>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="#fff" />
                  </svg>
                </h2>
                <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>Please login to your account</p>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
                    <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#ef4444' }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input className="login-input" type="email" placeholder="Enter your email"
                        value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                        autoComplete="email" style={{ paddingLeft: '42px' }} />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input className="login-input" type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                        value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                        autoComplete="current-password" style={{ paddingLeft: '42px', paddingRight: '44px' }} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Remember + Forgot */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '7px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                      <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
                        style={{ accentColor: '#2563EB', width: '14px', height: '14px' }} />
                      Remember me
                    </label>
                    <button type="button"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#2563EB', fontWeight: 600, padding: 0 }}>
                      Forgot Password?
                    </button>
                  </div>

                  {/* Login button */}
                  <button type="submit" className="login-btn" disabled={loading} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px', background: '#0047FF', borderRadius: '12px',
                    color: '#fff', fontSize: '15px', fontWeight: 700, width: '100%',
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0, 71, 255, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={15} />
                      <span>{loading ? 'Signing in…' : 'Login'}</span>
                    </div>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                  </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>

                {/* Google */}
                <div className="google-btn-wrap" style={{ display: 'flex', justifyContent: 'center' }}>
                  {gLoading ? (
                    <div style={{ width: '100%', padding: '10px', textAlign: 'center', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}>
                      Verifying with Google…
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 16px', background: '#fff', border: '1.5px solid #e2e8f0',
                      borderRadius: '12px', width: '100%', boxSizing: 'border-box',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Avatar */}
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=vakiti" alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Continue as VAKITI SREEHARI</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>vakitisrihari90108@gmail.com</span>
                        </div>
                      </div>
                      {/* Google 'G' icon */}
                      <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
                        <path fill="#EA4335" d="M12 5.04c1.67 0 3.2.58 4.38 1.69l3.27-3.27C17.67 1.47 14.97 1 12 1 7.24 1 3.2 3.65 1.13 7.55l3.8 2.95C5.87 7.2 8.69 5.04 12 5.04z" />
                        <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.01 3.67-8.64z" />
                        <path fill="#FBBC05" d="M5.87 13.51A7.17 7.17 0 0 1 5.5 12c0-.52.07-1.03.18-1.53l-3.8-2.95A11.95 11.95 0 0 0 1 12c0 1.63.32 3.19.92 4.62l3.95-3.11z" />
                        <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.52 1.18-4.2 1.18-3.31 0-6.13-2.16-7.07-5.06l-3.95 3.11C3.2 20.35 7.24 23 12 23z" />
                      </svg>
                      
                      {/* Invisible GoogleLogin overlay strictly capturing the click */}
                      <div style={{
                        position: 'absolute', inset: 0, opacity: 0.01, zIndex: 10,
                        overflow: 'hidden', cursor: 'pointer', display: 'flex', justifyContent: 'center'
                      }}>
                        <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-in failed.')}
                          theme="outline" shape="rectangular" size="large" width="380"
                          useOneTap={false} cancel_on_tap_outside={false} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Switch to register */}
                <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#64748b' }}>
                  Don't have an account?{' '}
                  <button onClick={() => switchTab('register')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontWeight: 700, fontSize: '13px', padding: 0 }}>
                    Create Account
                  </button>
                </p>
              </div>
            ) : (
              /* ── REGISTER FORM ── */
              <div className="fade-up">
                <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>Create Account</h2>
                <p style={{ margin: '0 0 24px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>Join FraudShield today</p>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px' }}>
                    <AlertCircle size={14} color="#ef4444" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '13px', color: '#ef4444' }}>{error}</span>
                  </div>
                )}

                <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Full Name */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Full Name</label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input className="login-input" type="text" placeholder="Enter your full name"
                        value={rName} onChange={e => { setRName(e.target.value); setError(''); }}
                        autoComplete="name" style={{ paddingLeft: '36px' }} />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input className="login-input" type="email" placeholder="Enter your email"
                        value={rEmail} onChange={e => { setREmail(e.target.value); setError(''); }}
                        autoComplete="email" style={{ paddingLeft: '36px' }} />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input className="login-input" type={showPass ? 'text' : 'password'} placeholder="Min 8 characters"
                        value={rPass} onChange={e => { setRPass(e.target.value); setError(''); }}
                        autoComplete="new-password" style={{ paddingLeft: '36px', paddingRight: '40px' }} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                        {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {rPass && (
                      <div style={{ marginTop: '6px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {[1,2,3,4].map(i => (
                            <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= passScore ? passColors[passScore] : '#e2e8f0', transition: 'background .2s' }} />
                          ))}
                        </div>
                        <p style={{ fontSize: '10px', fontWeight: 700, marginTop: '4px', color: passColors[passScore] }}>{passLabels[passScore]}</p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Confirm Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input className="login-input" type={showConf ? 'text' : 'password'} placeholder="Re-enter password"
                        value={rConf} onChange={e => { setRConf(e.target.value); setError(''); }}
                        autoComplete="new-password" style={{ paddingLeft: '36px', paddingRight: '40px', borderColor: rConf && rConf !== rPass ? '#ef4444' : undefined }} />
                      <button type="button" onClick={() => setShowConf(p => !p)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                        {showConf ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Terms */}
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', fontSize: '12px', color: '#64748b' }}>
                    <input type="checkbox" required style={{ accentColor: '#2563EB', marginTop: '2px', flexShrink: 0 }} />
                    I agree to the <span style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>Terms of Service</span> and <span style={{ color: '#2563EB', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>
                  </label>

                  <button type="submit" className="login-btn" disabled={loading} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 20px', background: '#0047FF', borderRadius: '12px',
                    color: '#fff', fontSize: '15px', fontWeight: 700, width: '100%',
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                    boxShadow: '0 4px 12px rgba(0, 71, 255, 0.2)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Lock size={15} />
                      <span>{loading ? 'Creating account…' : 'Create Account'}</span>
                    </div>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                        <polyline points="12 5 19 12 12 19"></polyline>
                      </svg>
                    </div>
                  </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '18px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }} />
                </div>

                {/* Google */}
                <div className="google-btn-wrap" style={{ display: 'flex', justifyContent: 'center' }}>
                  {gLoading ? (
                    <div style={{ width: '100%', padding: '10px', textAlign: 'center', border: '1.5px solid #e2e8f0', borderRadius: '8px', fontSize: '13px', color: '#64748b' }}>
                      Verifying with Google…
                    </div>
                  ) : (
                    <div style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 16px', background: '#fff', border: '1.5px solid #e2e8f0',
                      borderRadius: '12px', width: '100%', boxSizing: 'border-box',
                      position: 'relative'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Avatar */}
                        <img src="https://api.dicebear.com/7.x/bottts/svg?seed=vakiti" alt="Avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>Continue as VAKITI SREEHARI</span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>vakitisrihari90108@gmail.com</span>
                        </div>
                      </div>
                      {/* Google 'G' icon */}
                      <svg viewBox="0 0 24 24" width="20" height="20" style={{ flexShrink: 0 }}>
                        <path fill="#EA4335" d="M12 5.04c1.67 0 3.2.58 4.38 1.69l3.27-3.27C17.67 1.47 14.97 1 12 1 7.24 1 3.2 3.65 1.13 7.55l3.8 2.95C5.87 7.2 8.69 5.04 12 5.04z" />
                        <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.67-5.01 3.67-8.64z" />
                        <path fill="#FBBC05" d="M5.87 13.51A7.17 7.17 0 0 1 5.5 12c0-.52.07-1.03.18-1.53l-3.8-2.95A11.95 11.95 0 0 0 1 12c0 1.63.32 3.19.92 4.62l3.95-3.11z" />
                        <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.76-2.91c-1.1.74-2.52 1.18-4.2 1.18-3.31 0-6.13-2.16-7.07-5.06l-3.95 3.11C3.2 20.35 7.24 23 12 23z" />
                      </svg>
                      
                      {/* Invisible GoogleLogin overlay strictly capturing the click */}
                      <div style={{
                        position: 'absolute', inset: 0, opacity: 0.01, zIndex: 10,
                        overflow: 'hidden', cursor: 'pointer', display: 'flex', justifyContent: 'center'
                      }}>
                        <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-in failed.')}
                          theme="outline" shape="rectangular" size="large" width="380"
                          useOneTap={false} cancel_on_tap_outside={false} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Switch to login */}
                <p style={{ textAlign: 'center', marginTop: '18px', fontSize: '13px', color: '#64748b' }}>
                  Already have an account?{' '}
                  <button onClick={() => switchTab('login')}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2563EB', fontWeight: 700, fontSize: '13px', padding: 0 }}>
                    Login
                  </button>
                </p>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* ── Active Information Modal Overlays ── */}
      {activeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(2, 6, 23, 0.65)', backdropFilter: 'blur(10px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          animation: 'fadeUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
          padding: '16px'
        }}
        onClick={() => setActiveModal(null)}
        >
          <div style={{
            background: '#060913', border: '1px solid #1e293b', borderRadius: '16px',
            padding: '28px', width: '100%', maxWidth: '460px', position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5)', textAlign: 'left',
            color: '#fff', animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
          }}
          onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setActiveModal(null)} style={{
              position: 'absolute', right: '16px', top: '16px', background: 'none',
              border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px'
            }}>✕</button>

            {activeModal === 'about' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ padding: '8px', background: 'rgba(99,102,241,0.15)', borderRadius: '8px', color: '#818CF8' }}>
                    <Shield size={20} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fff' }}>About FraudShield AI</h3>
                </div>
                
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                  FraudShield AI is an enterprise-grade cyber-telemetry authentication portal powered by advanced machine learning.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    ['XGBoost Risk Classifier', 'Analyzes active transactions with 0.04% false positive margin.'],
                    ['Biometric Fingerprinting', 'Validates screen dynamics, mouse velocities, and device keys.'],
                    ['Cryptographic Ingress', 'Ensures instant identity synchronization with zero packet loss.'],
                    ['Explainable Decision Nodes', 'Translates neural evaluations into readable security logs.']
                  ].map(([title, desc]) => (
                    <div key={title} style={{ padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#818CF8', fontFamily: 'monospace', textTransform: 'uppercase' }}>{title}</span>
                      <span style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ padding: '8px', background: 'rgba(16,185,129,0.15)', borderRadius: '8px', color: '#10B981' }}>
                    <Mail size={20} />
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#fff' }}>Support Ingress Contact</h3>
                </div>
                
                <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.5, marginBottom: '16px' }}>
                  Submit an encrypted ticket directly to the Gatekeeper Security Operation Center (SOC).
                </p>

                <form onSubmit={e => { e.preventDefault(); alert('Message dispatched to Gatekeeper AI Secure Ingress.'); setActiveModal(null); }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'monospace' }}>Encrypted Sender</label>
                    <input type="email" required placeholder="your.email@domain.com" style={{
                      width: '100%', padding: '8px 12px', background: 'rgba(2, 6, 23, 0.6)',
                      border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '13px'
                    }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px', fontFamily: 'monospace' }}>Ingress Message</label>
                    <textarea required rows="3" placeholder="Describe the anomaly or query..." style={{
                      width: '100%', padding: '8px 12px', background: 'rgba(2, 6, 23, 0.6)',
                      border: '1px solid #1e293b', borderRadius: '8px', color: '#fff', fontSize: '13px',
                      resize: 'none'
                    }} />
                  </div>
                  <button type="submit" style={{
                    width: '100%', padding: '10px', background: '#10B981', color: '#fff',
                    border: 'none', borderRadius: '8px', fontWeight: 700, fontSize: '13px',
                    cursor: 'pointer', transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.target.style.background = '#059669'}
                  onMouseLeave={e => e.target.style.background = '#10B981'}
                  >
                    Dispatch Ingress Signal
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
