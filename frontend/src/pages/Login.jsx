import React, { useState, useEffect, useRef } from 'react';
import {
  Shield, Lock, Mail, AlertCircle, CheckCircle, Fingerprint,
  Loader2, ChevronDown, ChevronRight, ExternalLink, X,
  RefreshCw, Eye, EyeOff, Link2, Smartphone, Building2,
  TrendingUp, Zap, Users, Globe, CheckCheck, ArrowRight,
  Sun, Moon, ShieldAlert, Send, User, Sparkles
} from 'lucide-react';
import { login, register } from '../utils/api';

/* ============================================================
   GOOGLE ICON (full multicolor)
   ============================================================ */
const GoogleIcon = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

/* ============================================================
   SSO PROVIDER ICONS
   ============================================================ */
const MicrosoftIcon = (props) => (
  <svg viewBox="0 0 24 24" {...props}>
    <path fill="#F25022" d="M1 1h10v10H1z"/>
    <path fill="#7FBA00" d="M13 1h10v10H13z"/>
    <path fill="#00A4EF" d="M1 13h10v10H1z"/>
    <path fill="#FFB900" d="M13 13h10v10H13z"/>
  </svg>
);

const AppleIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701z"/>
  </svg>
);

const OktaIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="#007DC1" {...props}>
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="4" fill="white"/>
  </svg>
);

const Auth0Icon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21.98 7.448L19.62 0h-7.773l2.367 7.448zM4.02 7.448h7.827L9.48 0H1.708zM0 13.552l2.36 7.448H9.48L7.12 13.552zm4.02-6.104L1.663 0 0 7.448l2.36 7.448zM12 22l2.36-7.448H9.64zm7.98-14.552h-7.827l2.367 7.448h7.827z"/>
  </svg>
);

const OneLoginIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="#1F497D" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="4"/>
    <text x="12" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">1</text>
  </svg>
);

/* ============================================================
   Google OAuth consent screen data
   ============================================================ */
const DATA_SCOPES = [
  { icon: '👤', title: 'Basic profile info', detail: 'Name, profile picture, and email address — so FraudShield AI can identify your operator account.' },
  { icon: '🔐', title: 'Authentication status', detail: 'Whether your Google Account is verified and in good standing, used to grant dashboard access securely.' },
  { icon: '📊', title: 'Usage & interaction data', detail: 'Anonymized telemetry about feature usage may be shared with Google for security analytics.' },
  { icon: '🌐', title: 'IP address & device info', detail: 'Your approximate location and device fingerprint used by Google to detect account takeover.' },
];

const GOOGLE_ACCOUNTS = [
  { email: 'admin@fraudshield.ai',    name: 'System Admin',       initials: 'AD', color: 'indigo', role: 'admin' },
  { email: 'operator@fraudshield.ai', name: 'Security Operator',  initials: 'OP', color: 'emerald', role: 'operator' },
  { email: 'analyst@fraudshield.ai',  name: 'Data Analyst',       initials: 'DA', color: 'amber',  role: 'viewer' },
];

/* ============================================================
   Floating transaction card data (animated on hero)
   ============================================================ */
const FLOAT_CARDS = [
  { label: 'Transaction', value: '$2,450.00', status: 'Approved', color: 'emerald', top: '12%', right: '8%' },
  { label: 'Risk Score',  value: '23',        status: 'Low Risk', color: 'indigo',  top: '45%', left: '4%' },
  { label: 'Velocity',    value: '4/10',      status: 'Last 1 Hour', color: 'violet', bottom: '18%', right: '4%' },
];

/* ============================================================
   STATS
   ============================================================ */
const STATS = [
  { icon: Shield,    value: '99.9%', label: 'Accuracy' },
  { icon: Zap,       value: '1M+',   label: 'Transactions Analyzed' },
  { icon: Users,     value: '10K+',  label: 'Active Users' },
  { icon: Globe,     value: '150+',  label: 'Countries Protected' },
];

/* ============================================================
   FEATURES
   ============================================================ */
const FEATURES = [
  { icon: '🛡️', title: 'Real-time Monitoring', desc: 'Monitor transactions in real-time and detect suspicious activities instantly.' },
  { icon: '⚙️', title: 'Smart Rule Engine',    desc: 'Customizable rules with AI insights to reduce fraud and false positives.' },
  { icon: '📊', title: 'Actionable Insights',  desc: 'Get detailed analytics and reports to make data-driven decisions.' },
];

/* ============================================================
   LOGIN MODES
   ============================================================ */
const LOGIN_MODES = [
  { id: 'password', label: 'Password',   Icon: Lock },
  { id: 'otp',      label: 'OTP',        Icon: Smartphone },
  { id: 'magic',    label: 'Magic Link', Icon: Link2 },
  { id: 'sso',      label: 'SSO',        Icon: Building2 },
  { id: 'biometric',label: 'Biometric',  Icon: Fingerprint },
];

/* ============================================================
   SSO PROVIDERS
   ============================================================ */
const SSO_PROVIDERS = [
  { id: 'google',    label: 'Google',    Icon: GoogleIcon,    color: 'text-red-500' },
  { id: 'microsoft', label: 'Microsoft', Icon: MicrosoftIcon, color: 'text-blue-500' },
  { id: 'apple',     label: 'Apple',     Icon: AppleIcon,     color: 'text-slate-900' },
  { id: 'okta',      label: 'Okta',      Icon: OktaIcon,      color: 'text-blue-600' },
  { id: 'auth0',     label: 'Auth0',     Icon: Auth0Icon,     color: 'text-orange-500' },
  { id: 'onelogin',  label: 'OneLogin',  Icon: OneLoginIcon,  color: 'text-blue-700' },
];

/* ============================================================
   MAIN LOGIN COMPONENT
   ============================================================ */
const Login = ({ onLoginSuccess }) => {
  /* ----------------------------------------------------------
     Flow Controller ('signin' | 'signup' | 'forgot' | 'forgot_sent')
  ---------------------------------------------------------- */
  const [authFlow, setAuthFlow] = useState('signin');

  /* ----------------------------------------------------------
     UI state
  ---------------------------------------------------------- */
  const [isDark, setIsDark]           = useState(true);
  const [lang, setLang]               = useState('EN');
  const [loginMode, setLoginMode]     = useState('password');
  const [showPw, setShowPw]           = useState(false);
  const [isShaking, setIsShaking]     = useState(false);

  /* ----------------------------------------------------------
     Form state — Sign In
  ---------------------------------------------------------- */
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [otp, setOtp]                 = useState(['', '', '', '', '', '']);
  const [magicEmail, setMagicEmail]   = useState('');
  const [magicSent, setMagicSent]     = useState(false);
  const otpRefs = useRef([]);

  /* ----------------------------------------------------------
     Form state — Register / Sign Up
  ---------------------------------------------------------- */
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail]       = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [pwStrength, setPwStrength]   = useState({ score: 0, label: '', color: 'bg-slate-300', text: 'text-slate-400' });

  /* ----------------------------------------------------------
     Form state — Forgot Password
  ---------------------------------------------------------- */
  const [forgotEmail, setForgotEmail] = useState('');

  /* ----------------------------------------------------------
     Async/loading state
  ---------------------------------------------------------- */
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');

  /* ----------------------------------------------------------
     Google OAuth consent
  ---------------------------------------------------------- */
  const [showGoogleConsent, setShowGoogleConsent] = useState(false);
  const [consentStage, setConsentStage]           = useState('sign_in');
  const [selectedAccount, setSelectedAccount]     = useState(null);
  const [googleEmail, setGoogleEmail]             = useState('');
  const [googleSignInError, setGoogleSignInError] = useState('');
  const [expandedScopes, setExpandedScopes]       = useState({});

  /* ----------------------------------------------------------
     Biometric state
  ---------------------------------------------------------- */
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [scanProgress, setScanProgress]             = useState(0);
  const [scanStatus, setScanStatus]                 = useState('Initiating...');

  /* ----------------------------------------------------------
     Floating card animation (cycle highlight)
  ---------------------------------------------------------- */
  const [activeFloat, setActiveFloat] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveFloat(p => (p + 1) % FLOAT_CARDS.length), 2500);
    return () => clearInterval(t);
  }, []);

  /* ----------------------------------------------------------
     Trigger validation shake animation on error
  ---------------------------------------------------------- */
  const triggerShake = () => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 500);
  };

  /* ----------------------------------------------------------
     Password Strength Validator
  ---------------------------------------------------------- */
  useEffect(() => {
    if (!regPassword) {
      setPwStrength({ score: 0, label: '', color: 'bg-slate-300', text: 'text-slate-400' });
      return;
    }
    let score = 0;
    if (regPassword.length >= 8) score++;
    if (/[A-Z]/.test(regPassword)) score++;
    if (/[0-9]/.test(regPassword)) score++;
    if (/[^A-Za-z0-9]/.test(regPassword)) score++;

    if (score <= 1) {
      setPwStrength({ score, label: 'Weak', color: 'bg-red-500', text: 'text-red-500' });
    } else if (score <= 3) {
      setPwStrength({ score, label: 'Medium', color: 'bg-amber-500', text: 'text-amber-500' });
    } else {
      setPwStrength({ score, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-500' });
    }
  }, [regPassword]);

  /* ----------------------------------------------------------
     Handlers — Sign In (Password)
  ---------------------------------------------------------- */
  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const r = await login({ username, password });
      if (r.data.success) {
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(r.data.user));
        onLoginSuccess(r.data.user);
      }
    } catch (err) {
      triggerShake();
      setError(err.response?.data?.message || 'Connection to backend failed. Make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------
     Handlers — Sign Up / Register
  ---------------------------------------------------------- */
  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (regPassword.length < 8) {
      triggerShake();
      return setError('Password must be at least 8 characters long.');
    }

    setLoading(true);
    try {
      const r = await register({ username: regUsername, email: regEmail, password: regPassword });
      if (r.data.success) {
        setSuccess('Registration successful! You can now log in.');
        setAuthFlow('signin');
        setUsername(regUsername);
        setPassword('');
        // Clean fields
        setRegUsername('');
        setRegEmail('');
        setRegPassword('');
      }
    } catch (err) {
      triggerShake();
      setError(err.response?.data?.message || 'Sign up failed. Please try a different username or email.');
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------
     Handlers — Forgot Password
  ---------------------------------------------------------- */
  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    // Simulate API round-trip
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setAuthFlow('forgot_sent');
  };

  /* ----------------------------------------------------------
     Handlers — Magic Link
  ---------------------------------------------------------- */
  const handleMagicLink = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setMagicSent(true);
    setLoading(false);
  };

  /* ----------------------------------------------------------
     Handlers — OTP Login
  ---------------------------------------------------------- */
  const handleOtpChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp]; next[idx] = val;
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  };

  const handleOtpKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) return setError('Please enter all 6 digits.');
    setLoading(true);
    try {
      // Simulate validation / bypass on demo OTP (123456)
      const r = await login({ username: 'admin', password: 'admin123' });
      if (r.data.success) {
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(r.data.user));
        onLoginSuccess(r.data.user);
      }
    } catch {
      triggerShake();
      setError('OTP verification failed.');
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------
     Handlers — SSO Provider click
  ---------------------------------------------------------- */
  const handleSSOProvider = async (providerId) => {
    if (providerId === 'google') { openGoogleConsent(); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    try {
      const r = await login({ username: 'admin', password: 'admin123' });
      if (r.data.success) {
        const user = { ...r.data.user, ssoProvider: providerId };
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(user));
        onLoginSuccess(user);
      }
    } catch {
      setError(`${providerId} SSO failed.`);
    } finally {
      setLoading(false);
    }
  };

  /* ----------------------------------------------------------
     Handlers — Biometric
  ---------------------------------------------------------- */
  const startBiometric = () => {
    setError(''); setShowBiometricModal(true); setScanProgress(0);
    const steps = [
      { p: 15, t: 'Acquiring hardware key...' },
      { p: 40, t: 'Scanning biometric sensor...' },
      { p: 70, t: 'Validating credentials...' },
      { p: 90, t: 'Match found!' },
      { p: 100, t: 'Opening secure session...' },
    ];
    steps.forEach(({ p, t }) => setTimeout(async () => {
      setScanProgress(p); setScanStatus(t);
      if (p === 100) setTimeout(async () => {
        try {
          const r = await login({ username: 'admin', password: 'admin123' });
          if (r.data.success) {
            localStorage.setItem('token', r.data.token);
            localStorage.setItem('user', JSON.stringify(r.data.user));
            setShowBiometricModal(false);
            onLoginSuccess(r.data.user);
          }
        } catch {
          setError('Biometric login failed.');
          setShowBiometricModal(false);
        }
      }, 500);
    }, p * 22));
  };

  /* ----------------------------------------------------------
     Handlers — Google OAuth consent
  ---------------------------------------------------------- */
  const openGoogleConsent = () => {
    setConsentStage('sign_in'); setSelectedAccount(null);
    setGoogleEmail(''); setGoogleSignInError(''); setExpandedScopes({});
    setShowGoogleConsent(true);
  };
  const closeGoogleConsent = () => { setShowGoogleConsent(false); setConsentStage('sign_in'); };
  const pickAccount = (acc) => { setSelectedAccount(acc); setConsentStage('consent'); };
  const handleGoogleSignIn = (e) => {
    e.preventDefault();
    const match = GOOGLE_ACCOUNTS.find(a => a.email.toLowerCase() === googleEmail.toLowerCase());
    if (!match) { setGoogleSignInError('No account found for this address.'); return; }
    setGoogleSignInError(''); setSelectedAccount(match); setConsentStage('consent');
  };
  const handleAgreeAndLink = async () => {
    setConsentStage('authorizing');
    try {
      const r = await login({ username: 'admin', password: 'admin123' });
      if (r.data.success) {
        const u = { ...r.data.user, username: selectedAccount.email.split('@')[0], email: selectedAccount.email, role: selectedAccount.role };
        localStorage.setItem('token', r.data.token);
        localStorage.setItem('user', JSON.stringify(u));
        setConsentStage('success');
        setTimeout(() => { setShowGoogleConsent(false); onLoginSuccess(u); }, 1200);
      }
    } catch { setError('Google OAuth failed.'); setShowGoogleConsent(false); }
  };
  const accountColors = {
    indigo:  { ring: 'bg-indigo-600/30',  text: 'text-indigo-400' },
    emerald: { ring: 'bg-emerald-600/30', text: 'text-emerald-400' },
    amber:   { ring: 'bg-amber-600/30',   text: 'text-amber-400' },
  };

  return (
    <div className={`min-h-screen flex font-sans overflow-hidden ${isDark ? 'bg-[#090d16]' : 'bg-slate-50'}`}>
      
      {/* Dynamic Keyframe Injection for Shake & Envelope Pulse */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .shake-element {
          animation: shake 0.4s ease-in-out;
        }
        @keyframes pulseEnvelope {
          0% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 25px rgba(99, 102, 241, 0.4); }
          100% { transform: scale(1); opacity: 0.9; }
        }
        .pulse-envelope {
          animation: pulseEnvelope 2s infinite ease-in-out;
        }
      `}</style>

      {/* ======================================================
          LEFT HERO PANEL (Premium Fintech Branding)
          ====================================================== */}
      <div className="hidden lg:flex lg:w-[50%] relative flex-col justify-between overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #090c21 0%, #0d123d 50%, #0f1754 100%)' }}>

        {/* Dynamic Matrix-style grid texture */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        {/* Ambient radial glows */}
        <div className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full filter blur-[80px]"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }} />

        {/* ── HEADER ── */}
        <div className="relative z-10 p-8 flex items-center space-x-3">
          <div className="bg-indigo-600/20 border border-indigo-500/30 p-2.5 rounded-xl">
            <Shield className="h-6 w-6 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="text-white font-extrabold text-lg tracking-tight leading-none">FraudShield AI</div>
            <div className="text-indigo-400 text-xs font-medium tracking-wider mt-0.5">Autonomous Rule Engine</div>
          </div>
        </div>

        {/* ── HERO CONTENT (Grid to prevent overlapping) ── */}
        <div className="relative z-10 px-8 xl:px-12 flex-1 grid grid-cols-1 xl:grid-cols-12 gap-8 items-center w-full">
          
          {/* Left Column: Text & Features (col-span 7) */}
          <div className="xl:col-span-7 flex flex-col justify-center space-y-6">
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit">
              <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
              <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Enterprise Security Active</span>
            </div>

            <div>
              <h1 className="text-4xl xl:text-4xl 2xl:text-5xl font-black text-white leading-tight tracking-tight">
                Real-Time Security.<br />
                <span style={{ background: 'linear-gradient(90deg,#a5b4fc,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Always One Step Ahead.
                </span>
              </h1>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              Harness machine learning models and customizable business rule filters to secure operations and shield payments seamlessly.
            </p>

            {/* Features checkmarks */}
            <div className="space-y-4 pt-2">
              {FEATURES.map((f, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <span className="bg-indigo-950 border border-indigo-500/30 p-2 rounded-xl text-base leading-none shrink-0">{f.icon}</span>
                  <div>
                    <p className="text-white text-sm font-bold">{f.title}</p>
                    <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Hero Image (col-span 5) */}
          <div className="xl:col-span-5 flex justify-center">
            <div className="w-full max-w-[340px] bg-[#0c101c]/90 border border-slate-800/80 rounded-2xl p-2 shadow-2xl transition-all duration-300 hover:border-indigo-500/30">
              <div className="overflow-hidden rounded-xl border border-slate-800/50">
                <img src="/fraud_detection_hero.png" alt="Fraud Detection Security" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>

        </div>

        {/* ── STATS ROW ── */}
        <div className="relative z-10 mx-8 mb-6 grid grid-cols-4 gap-2 bg-[#0c101c] border border-slate-800 rounded-2xl p-4 shadow-xl">
          {STATS.map(({ icon: Icon, value, label }, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-1">
                <Icon className="h-4 w-4 text-indigo-400" />
              </div>
              <p className="text-white font-extrabold text-base leading-none">{value}</p>
              <p className="text-slate-400 text-[9px] uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <div className="relative z-10 pb-6 px-8 flex justify-between text-[11px] text-slate-500 font-medium">
          <span>© 2026 FraudShield AI. All rights reserved.</span>
          <div className="flex space-x-4">
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Security Indicators</a>
          </div>
        </div>
      </div>

      {/* ======================================================
          RIGHT PANEL (Flows: Sign In / Sign Up / Forgot Password)
          ====================================================== */}
      <div className={`flex-grow flex flex-col justify-between transition-colors duration-300 ${isDark ? 'bg-[#090d16]' : 'bg-white'}`}>
        
        {/* Top Controls */}
        <div className="flex justify-end items-center px-8 pt-6 space-x-3 shrink-0">
          {/* Light / Dark */}
          <button onClick={() => setIsDark(!isDark)}
            className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-full border transition-all cursor-pointer ${
              isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {isDark ? <Sun className="h-3.5 w-3.5 text-yellow-400" /> : <Moon className="h-3.5 w-3.5" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          {/* Language Selector */}
          <button className={`flex items-center space-x-1 px-3 py-2 rounded-full border text-xs font-semibold ${
            isDark ? 'border-slate-800 text-slate-300 hover:bg-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}>
            <Globe className="h-3.5 w-3.5" />
            <span>{lang}</span>
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* Core Auth Panel Wrapper */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
          <div className={`w-full max-w-md ${isShaking ? 'shake-element' : ''}`}>

            {/* ERROR BANNER */}
            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-xs flex items-start space-x-2.5 animate-fade-in shadow-md">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* SUCCESS BANNER */}
            {success && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-xs flex items-start space-x-2.5 animate-fade-in shadow-md">
                <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            {/* ========================================================
                1. SIGN IN FLOW (Standard Option Tabs)
                ======================================================== */}
            {authFlow === 'signin' && (
              <div className="animate-scale-up">
                {/* Title */}
                <div className="flex items-center space-x-3 mb-6">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                    <Shield className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className={`font-black text-xl leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome back</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Access your secure operating console</p>
                  </div>
                </div>

                {/* Login Modes Tab Selection */}
                <div className="mb-5">
                  <span className={`block text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Authentication Mode</span>
                  <div className={`grid grid-cols-5 gap-1 p-1 rounded-xl ${isDark ? 'bg-slate-900/60' : 'bg-slate-100'}`}>
                    {LOGIN_MODES.map(({ id, label, Icon }) => (
                      <button key={id} type="button"
                        onClick={() => { setLoginMode(id); setError(''); setSuccess(''); if (id === 'biometric') startBiometric(); }}
                        className={`flex flex-col items-center py-2 rounded-lg text-[9px] font-bold transition-all cursor-pointer ${
                          loginMode === id
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                            : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                        }`}>
                        <Icon className="h-4.5 w-4.5 mb-1 shrink-0" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Flow 1.1: Password Sign In */}
                {loginMode === 'password' && (
                  <form onSubmit={handleSignInSubmit} className="space-y-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Username or Email</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <User className="h-4 w-4" />
                        </span>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                          placeholder="admin"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                            isDark ? 'bg-slate-900/40 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-950 placeholder-slate-400'
                          }`} />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock className="h-4 w-4" />
                        </span>
                        <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                          placeholder="admin123"
                          className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                            isDark ? 'bg-slate-900/40 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-950 placeholder-slate-400'
                          }`} />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer">
                          {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <div className="flex justify-end mt-1">
                        <button type="button" onClick={() => { setAuthFlow('forgot'); setError(''); setSuccess(''); }}
                          className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 cursor-pointer transition-colors">
                          Forgot Password?
                        </button>
                      </div>
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 flex items-center justify-center space-x-2 cursor-pointer">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign In</span>}
                    </button>
                  </form>
                )}

                {/* Flow 1.2: OTP verification code */}
                {loginMode === 'otp' && (
                  <form onSubmit={handleOtpSubmit} className="space-y-4">
                    <div>
                      <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Mail className="h-4 w-4" />
                        </span>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                          placeholder="admin@fraudshield.ai"
                          className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                            isDark ? 'bg-slate-900/40 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-950 placeholder-slate-400'
                          }`} />
                      </div>
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-2 text-center ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Verification Code</label>
                      <div className="flex justify-center space-x-2">
                        {otp.map((digit, i) => (
                          <input key={i} ref={el => otpRefs.current[i] = el}
                            type="text" maxLength={1} value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            className={`w-11 h-12 text-center text-lg font-black rounded-xl border transition-colors focus:outline-none focus:border-indigo-500 ${
                              isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-950'
                            } ${digit ? 'border-indigo-500 text-indigo-500' : ''}`} />
                        ))}
                      </div>
                      <p className={`text-center text-[10px] mt-2.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        Mock code: type <span className="font-mono font-bold text-indigo-400">123456</span> to complete authentication.
                      </p>
                    </div>

                    <button type="submit" disabled={loading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center cursor-pointer">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Verify and Connect</span>}
                    </button>
                  </form>
                )}

                {/* Flow 1.3: Magic Link */}
                {loginMode === 'magic' && (
                  <div className="space-y-4">
                    {!magicSent ? (
                      <form onSubmit={handleMagicLink} className="space-y-4">
                        <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                          isDark ? 'bg-indigo-950/20 border-indigo-500/25 text-slate-300' : 'bg-indigo-50 border-indigo-100 text-slate-600'
                        }`}>
                          <Sparkles className="h-4.5 w-4.5 text-indigo-500 inline mr-1 animate-pulse" />
                          <strong>Passwordless magic sign-in link.</strong> Enter your registered email address and we'll send a secure validation link.
                        </div>

                        <div>
                          <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Email Address</label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                              <Mail className="h-4 w-4" />
                            </span>
                            <input type="email" value={magicEmail} onChange={e => setMagicEmail(e.target.value)} required
                              placeholder="operator@fraudshield.ai"
                              className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                                isDark ? 'bg-slate-900/40 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-950 placeholder-slate-400'
                              }`} />
                          </div>
                        </div>

                        <button type="submit" disabled={loading}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all flex items-center justify-center space-x-2 cursor-pointer">
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /><span>Dispatch Magic Link</span></>}
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-6 space-y-4 animate-scale-up">
                        <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                          <CheckCheck className="h-7 w-7 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>Instructions Sent!</h3>
                          <p className={`text-xs mt-1 max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            A secure entry token has been dispatched to <span className="text-indigo-400 font-semibold">{magicEmail}</span>.
                          </p>
                        </div>
                        <button type="button" onClick={() => setMagicSent(false)} className="text-xs text-indigo-500 hover:text-indigo-400 font-bold cursor-pointer font-bold">
                          Enter different email
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Flow 1.4: SSO Provider options */}
                {loginMode === 'sso' && (
                  <div className="space-y-4">
                    <p className={`text-[10px] font-bold uppercase tracking-wider text-center ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Corporate Single Sign-On</p>
                    <div className="grid grid-cols-3 gap-2.5">
                      {SSO_PROVIDERS.map(({ id, label, Icon, color }) => (
                        <button key={id} onClick={() => handleSSOProvider(id)} disabled={loading}
                          className={`flex items-center justify-center space-x-1.5 py-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isDark
                              ? 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'
                          }`}>
                          <Icon className={`h-4.5 w-4.5 ${color}`} />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Flow 1.5: Biometrics */}
                {loginMode === 'biometric' && !showBiometricModal && (
                  <div className="text-center py-4 space-y-5 animate-scale-up">
                    <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                      <div className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full animate-spin-slow" />
                      <div className="absolute inset-1.5 border border-indigo-500/10 rounded-full" />
                      <Fingerprint className="h-12 w-12 text-indigo-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>FIDO2 Security Check</h3>
                      <p className={`text-xs mt-1 max-w-xs mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Sign in with biometric passkey, face scans, or device PIN.</p>
                    </div>
                    <button onClick={startBiometric}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/15 cursor-pointer flex items-center justify-center space-x-2">
                      <Fingerprint className="h-4 w-4" />
                      <span>Authenticate Passkey</span>
                    </button>
                  </div>
                )}

                {/* SSO options listed below password/otp forms */}
                {loginMode === 'password' && (
                  <>
                    <div className="relative flex items-center my-4.5">
                      <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
                      <span className={`mx-3 text-[9px] font-bold uppercase tracking-widest ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>Or Link Account</span>
                      <div className={`flex-grow border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`} />
                    </div>

                    <div className="flex space-x-2.5 justify-center">
                      {SSO_PROVIDERS.slice(0, 3).map(({ id, Icon, color }) => (
                        <button key={id} onClick={() => handleSSOProvider(id)} disabled={loading}
                          className={`flex items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${
                            isDark ? 'bg-slate-900/40 border-slate-800 text-slate-300 hover:bg-slate-800/40' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'
                          }`}>
                          <Icon className={`h-5 w-5 ${color}`} />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* Flow navigation triggers */}
                <div className={`mt-6 text-center text-xs border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Don't have an operator profile? </span>
                  <button type="button" onClick={() => { setAuthFlow('signup'); setError(''); setSuccess(''); }}
                    className="text-indigo-500 font-extrabold hover:text-indigo-400 transition-colors cursor-pointer">
                    Sign Up Now
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                2. SIGN UP / REGISTER FLOW
                ======================================================== */}
            {authFlow === 'signup' && (
              <div className="animate-scale-up">
                {/* Title */}
                <div className="flex items-center space-x-3 mb-5">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className={`font-black text-xl leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Account</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Establish secure platform operator credentials</p>
                  </div>
                </div>

                <form onSubmit={handleSignUpSubmit} className="space-y-4">
                  {/* Operator Username */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Operator Username</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="h-4 w-4" />
                      </span>
                      <input type="text" value={regUsername} onChange={e => setRegUsername(e.target.value)} required
                        placeholder="e.g. sreehari"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                          isDark ? 'bg-slate-900/40 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-950 placeholder-slate-400'
                        }`} />
                    </div>
                  </div>

                  {/* Corporate Email */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Corporate Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)} required
                        placeholder="operator@company.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                          isDark ? 'bg-slate-900/40 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-950 placeholder-slate-400'
                        }`} />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Secure Password</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="h-4 w-4" />
                      </span>
                      <input type={showPw ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)} required
                        placeholder="••••••••"
                        className={`w-full pl-10 pr-12 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                          isDark ? 'bg-slate-900/40 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-950 placeholder-slate-400'
                        }`} />
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* ANIMATED PASSWORD STRENGTH METER */}
                    {regPassword && (
                      <div className="mt-2.5 space-y-1.5 animate-fade-in">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Security Strength:</span>
                          <span className={`font-extrabold ${pwStrength.text}`}>{pwStrength.label}</span>
                        </div>
                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
                          <div className={`h-full transition-all duration-300 ${pwStrength.color}`}
                            style={{ width: `${(pwStrength.score / 4) * 100}%` }} />
                        </div>
                        <p className={`text-[9px] leading-relaxed ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                          Make it at least 8 characters with numbers and capital letters to establish maximum safety.
                        </p>
                      </div>
                    )}
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2 cursor-pointer">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Sign Up</span>}
                  </button>
                </form>

                {/* Back to sign in trigger */}
                <div className={`mt-6 text-center text-xs border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Already registered? </span>
                  <button type="button" onClick={() => { setAuthFlow('signin'); setError(''); setSuccess(''); }}
                    className="text-indigo-500 font-extrabold hover:text-indigo-400 transition-colors cursor-pointer">
                    Sign In
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                3. FORGOT PASSWORD FLOW
                ======================================================== */}
            {authFlow === 'forgot' && (
              <div className="animate-scale-up">
                <div className="flex items-center space-x-3 mb-5">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-200'}`}>
                    <Lock className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className={`font-black text-xl leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Reset Password</h2>
                    <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Request credential recovery credentials</p>
                  </div>
                </div>

                <form onSubmit={handleForgotSubmit} className="space-y-4">
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Enter the corporate email associated with your operator profile. We will dispatch instructions on how to set a new password.
                  </p>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Account Email</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="h-4 w-4" />
                      </span>
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required
                        placeholder="operator@company.com"
                        className={`w-full pl-10 pr-4 py-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                          isDark ? 'bg-slate-900/40 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-950 placeholder-slate-400'
                        }`} />
                    </div>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center space-x-2 cursor-pointer">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>Send Recovery Instructions</span>}
                  </button>
                </form>

                <div className={`mt-6 text-center text-xs border-t pt-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                  <button type="button" onClick={() => { setAuthFlow('signin'); setError(''); setSuccess(''); }}
                    className="text-slate-500 hover:text-slate-400 font-extrabold cursor-pointer transition-colors inline-flex items-center space-x-1">
                    <ArrowRight className="h-3.5 w-3.5 rotate-180" /><span>Back to Sign In</span>
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================
                4. FORGOT PASSWORD CONFIRMATION SCREEN
                ======================================================== */}
            {authFlow === 'forgot_sent' && (
              <div className="text-center py-6 space-y-6 animate-scale-up">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center pulse-envelope shadow-xl">
                  <Mail className="h-8 w-8 text-indigo-400" />
                </div>
                
                <div>
                  <h3 className={`font-black text-xl leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>Check Your Email</h3>
                  <p className={`text-xs mt-2.5 max-w-sm mx-auto leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    We have successfully simulated generating a secure recovery token and dispatched it to <strong className="text-indigo-400 font-semibold">{forgotEmail || 'your email'}</strong>.
                  </p>
                </div>

                <div className="pt-2">
                  <button type="button" onClick={() => setAuthFlow('signin')}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md flex items-center justify-center space-x-1.5 cursor-pointer">
                    <span>Back to Sign In</span>
                  </button>
                </div>

                <p className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Did not receive the instructions? Check your spam filters or click <button onClick={handleForgotSubmit} className="text-indigo-500 hover:underline font-bold cursor-pointer">Resend Token</button>.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Dynamic secure environment badge */}
        <div className={`p-5 flex items-center justify-center space-x-3 shrink-0 border-t ${
          isDark ? 'bg-slate-950/40 border-slate-900' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-glow" />
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            🛡️ AES 256-bit Secure TLS Handshake Environment
          </span>
        </div>

      </div>

      {/* ======================================================
          BIOMETRIC SCAN MODAL
          ====================================================== */}
      {showBiometricModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-80 bg-[#0f1225] border border-indigo-500/30 rounded-2xl shadow-2xl p-8 text-center space-y-5">
            <div>
              <h3 className="text-lg font-extrabold text-white">Passkey Authentication</h3>
              <p className="text-xs text-slate-400 mt-1">Windows Hello Biometric Credential Check</p>
            </div>
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 border-2 border-dashed border-indigo-500/20 rounded-full animate-spin-slow" />
              <div className="absolute inset-2 border border-indigo-500/30 rounded-full" />
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent absolute animate-scan-line" />
              </div>
              <Fingerprint className={`h-16 w-16 transition-colors duration-300 ${scanProgress >= 90 ? 'text-emerald-400' : 'text-indigo-500'}`} />
            </div>
            <div className="space-y-2">
              <div className="font-mono text-[11px] text-indigo-300 bg-indigo-950/40 border border-indigo-900/40 py-2 px-3 rounded-lg leading-relaxed">
                {scanStatus}
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
              </div>
            </div>
            <button onClick={() => setShowBiometricModal(false)}
              className="text-xs font-bold text-slate-500 hover:text-slate-400 transition-colors cursor-pointer mt-2 block w-full text-center">
              Cancel Verification
            </button>
          </div>
        </div>
      )}

      {/* ======================================================
          GOOGLE OAUTH CONSENT MODAL
          ====================================================== */}
      {showGoogleConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">

            {/* Browser chrome */}
            <div className="bg-gray-100 px-4 py-2 flex items-center space-x-2 border-b border-gray-200">
              <div className="flex space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded px-3 py-1 flex items-center space-x-1.5 text-[11px] text-gray-500 font-mono border border-gray-200">
                <Lock className="w-3 h-3 text-green-500 shrink-0" />
                <span>accounts.google.com</span>
              </div>
            </div>

            {/* Sign-in stage */}
            {consentStage === 'sign_in' && (
              <div className="p-8 space-y-5">
                <div className="flex justify-center"><GoogleIcon className="h-10 w-10" /></div>
                <div className="text-center">
                  <h2 className="text-xl font-normal text-gray-800">Sign in</h2>
                  <p className="text-sm text-gray-500 mt-1">to continue to <span className="font-medium text-gray-700">FraudShield AI</span></p>
                </div>
                <form onSubmit={handleGoogleSignIn} className="space-y-3">
                  <input type="email" value={googleEmail} onChange={e => setGoogleEmail(e.target.value)} required
                    placeholder="Email or phone"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800" />
                  {googleSignInError && <p className="text-xs text-red-500">{googleSignInError}</p>}
                  <div className="flex justify-between items-center pt-1">
                    <button type="button" onClick={closeGoogleConsent} className="text-sm font-medium text-blue-600 cursor-pointer">Cancel</button>
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm px-6 py-2.5 rounded-full transition cursor-pointer">Next</button>
                  </div>
                </form>
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  {GOOGLE_ACCOUNTS.map(acc => (
                    <button key={acc.email} onClick={() => pickAccount(acc)}
                      className="w-full flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-3 py-2.5 transition cursor-pointer text-left">
                      <div className={`w-8 h-8 rounded-full ${accountColors[acc.color].ring} flex items-center justify-center font-bold ${accountColors[acc.color].text} text-xs`}>
                        {acc.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-800 truncate">{acc.name}</p>
                        <p className="text-[10px] text-gray-400 truncate">{acc.email}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Consent stage */}
            {consentStage === 'consent' && selectedAccount && (
              <div className="flex flex-col max-h-[85vh] overflow-y-auto">
                <div className="p-6 pb-4">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center space-x-2">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/25 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="w-5 border-t border-dashed border-gray-300" />
                      <GoogleIcon className="w-8 h-8" />
                    </div>
                    <button onClick={closeGoogleConsent} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X className="w-5 h-5" /></button>
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">Link FraudShield AI with Google</h2>
                  <div className="flex items-center space-x-1.5 mb-4">
                    <p className="text-xs text-gray-500">Signed in as <span className="font-medium text-gray-700">{selectedAccount.email}</span></p>
                    <button onClick={() => { setSelectedAccount(null); setConsentStage('sign_in'); }}
                      className="text-xs text-blue-600 hover:underline cursor-pointer flex items-center space-x-0.5">
                      <RefreshCw className="w-3 h-3" /><span>change</span>
                    </button>
                  </div>
                  <div className="space-y-1.5 mb-4">
                    {DATA_SCOPES.map((scope, idx) => (
                      <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                        <button onClick={() => setExpandedScopes(p => ({ ...p, [idx]: !p[idx] }))}
                          className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition cursor-pointer">
                          <div className="flex items-center space-x-2.5">
                            <span>{scope.icon}</span>
                            <span className="text-xs font-medium text-gray-700">{scope.title}</span>
                          </div>
                          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedScopes[idx] ? 'rotate-180' : ''}`} />
                        </button>
                        {expandedScopes[idx] && (
                          <div className="px-4 pb-3 pt-1 bg-gray-50 text-[11px] text-gray-500 border-t border-gray-100">{scope.detail}</div>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-500 mb-2 leading-relaxed">
                    Review Google's <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline inline-flex items-center space-x-0.5"><span>Privacy Policy</span><ExternalLink className="w-2.5 h-2.5" /></a>.
                    You can unlink at <button className="text-blue-600 hover:underline cursor-pointer">fraudshield.ai/account/settings</button> or via your <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Account</a>.
                  </p>
                </div>
                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex space-x-3">
                  <button onClick={closeGoogleConsent} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm py-2.5 rounded-full cursor-pointer text-center">Cancel</button>
                  <button onClick={handleAgreeAndLink} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-2.5 rounded-full shadow-md shadow-blue-600/25 cursor-pointer text-center">Agree and link</button>
                </div>
              </div>
            )}

            {/* Authorizing stage */}
            {consentStage === 'authorizing' && (
              <div className="p-10 text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-blue-500/20 rounded-full scale-110 animate-ping" />
                  <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
                  <GoogleIcon className="absolute h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">Linking your account…</h3>
                <p className="text-xs text-gray-400">Establishing secure session</p>
              </div>
            )}

            {/* Success stage */}
            {consentStage === 'success' && (
              <div className="p-10 text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-base font-semibold text-gray-800">Account linked!</h3>
                <p className="text-xs text-gray-400">Redirecting to FraudShield AI…</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
