import React, { useState, useEffect, useRef } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import {
  Shield, Mail, Lock, Eye, EyeOff, User, CheckCircle,
  AlertCircle, ArrowRight, ChevronLeft, Cpu, Wifi, Sun, Moon, Zap
} from 'lucide-react';
import { login as apiLogin, register as apiRegister } from '../utils/api';

/* ─────────────────────────────────────────
   NEURAL CANVAS
───────────────────────────────────────── */
const NeuralCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d'); let id;
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize(); window.addEventListener('resize', resize);
    const nodes = Array.from({ length: 48 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
      r: Math.random() * 2 + 1, p: Math.random() * Math.PI * 2,
      col: Math.random() > .5 ? [37, 99, 235] : [6, 182, 212],
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      nodes.forEach(n => { n.x += n.vx; n.y += n.vy; n.p += .016;
        if (n.x < 0 || n.x > c.width) n.vx *= -1;
        if (n.y < 0 || n.y > c.height) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
        if (d < 140) {
          const [r, g, b] = nodes[i].col;
          ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - d / 140) * .2})`; ctx.lineWidth = .6; ctx.stroke();
        }
      }
      nodes.forEach(n => {
        const g2 = Math.sin(n.p) * .5 + .5; const [r, gb, b] = n.col;
        const gr = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
        gr.addColorStop(0, `rgba(${r},${gb},${b},${.7 * g2})`); gr.addColorStop(1, `rgba(${r},${gb},${b},0)`);
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2); ctx.fillStyle = gr; ctx.fill();
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${gb},${b},${.7 + .3 * g2})`; ctx.fill();
      });
      id = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 w-full h-full pointer-events-none z-[1]" />;
};

/* ─────────────────────────────────────────
   STYLED INPUT
───────────────────────────────────────── */
function Input({ icon: Icon, type = 'text', placeholder, value, onChange, autoComplete, right, error, dark }) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <div className="relative">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
          style={{ color: focused ? '#2563EB' : (dark ? '#475569' : '#94a3b8') }}>
          <Icon className="h-4 w-4" />
        </span>
        <input type={type} placeholder={placeholder} value={value} onChange={onChange}
          autoComplete={autoComplete}
          className="w-full pl-10 pr-10 py-3 text-sm outline-none rounded-xl transition-all duration-200"
          style={{
            background: focused ? (dark ? 'rgba(37,99,235,0.07)' : '#eff6ff') : (dark ? 'rgba(15,23,42,0.65)' : '#f8fafc'),
            border: `1px solid ${error ? '#EF4444' : focused ? '#2563EB' : (dark ? 'rgba(37,99,235,0.22)' : '#cbd5e1')}`,
            color: dark ? '#e2e8f0' : '#1e293b',
            boxShadow: focused ? '0 0 0 3px rgba(37,99,235,0.1)' : 'none',
            caretColor: '#2563EB',
          }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
        {right && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{right}</span>}
      </div>
      {error && <p className="text-red-400 text-[10px] mt-1 ml-1">{error}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────
   PRIMARY BUTTON
───────────────────────────────────────── */
function Btn({ type = 'button', onClick, loading, children, disabled }) {
  return (
    <button type={type} onClick={onClick} disabled={loading || disabled}
      className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ background: 'linear-gradient(135deg,#2563EB,#06B6D4)', boxShadow: '0 6px 20px rgba(37,99,235,0.28)' }}
      onMouseEnter={e => { if (!loading && !disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
      {loading
        ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Please wait…</>
        : children}
    </button>
  );
}

/* ─────────────────────────────────────────
   PASSWORD STRENGTH
───────────────────────────────────────── */
function PassStrength({ pass }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pass)).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#EF4444', '#F59E0B', '#06B6D4', '#10B981'];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : 'rgba(37,99,235,0.1)' }} />
        ))}
      </div>
      {pass && <p className="text-[10px] font-bold" style={{ color: colors[score] }}>{labels[score]}</p>}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN LOGIN COMPONENT
───────────────────────────────────────── */
export default function Login({ onLoginSuccess }) {
  /* steps: 'email' → 'password' (existing) | 'register' (new) | 'forgot' | 'otp' | 'success' */
  const [step, setStep]         = useState('email');
  const [dark, setDark]         = useState(true);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [scanActive, setScanActive] = useState(true);

  // Known user info from check-email
  const [foundUser, setFoundUser] = useState(null); // { exists, name }

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [confirm, setConfirm]   = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [otp, setOtp]           = useState('');

  useEffect(() => {
    const t = setInterval(() => setScanActive(p => !p), 3000);
    return () => clearInterval(t);
  }, []);

  const reset = (s) => { setStep(s); setError(''); setShowPass(false); };

  /* ── STEP 1: Check Email ── */
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Enter a valid email address.'); return; }
    setLoading(true); setError('');
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const res  = await fetch(`${base}/auth/check-email`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setFoundUser(data);
        setStep(data.exists ? 'password' : 'register');
      } else {
        setError(data.message || 'Could not verify email. Please try again.');
      }
    } catch {
      setError('Server unreachable. Please try again.');
    } finally { setLoading(false); }
  };

  /* ── STEP 2a: Sign In ── */
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!password) { setError('Password is required.'); return; }
    setLoading(true); setError('');
    try {
      const res = await apiLogin({ username: email, password });
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setStep('success');
        setTimeout(() => onLoginSuccess(res.data.user), 1200);
      } else { setError(res.data.message || 'Incorrect password. Please try again.'); }
    } catch (err) { setError(err.response?.data?.message || 'Sign-in failed. Please try again.'); }
    finally { setLoading(false); }
  };

  /* ── STEP 2b: Register ── */
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name)             { setError('Full name is required.'); return; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const username = name.trim().replace(/\s+/g, '_').toLowerCase() + '_' + Date.now().toString(36);
      const res = await apiRegister({ username, email, password, name: name.trim() });
      if (res.data.success) {
        // Auto sign in after registration
        const loginRes = await apiLogin({ username: email, password });
        if (loginRes.data.success) {
          localStorage.setItem('token', loginRes.data.token);
          localStorage.setItem('user', JSON.stringify(loginRes.data.user));
          setStep('success');
          setTimeout(() => onLoginSuccess(loginRes.data.user), 1200);
        } else { reset('password'); }
      } else { setError(res.data.message || 'Registration failed. Please try again.'); }
    } catch (err) { setError(err.response?.data?.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  /* ── Google OAuth ── */
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
        setStep('success');
        setTimeout(() => onLoginSuccess(data.user), 1200);
      } else { setError(data.message || 'Google authentication failed.'); }
    } catch { setError('Server unreachable. Please try again.'); }
    finally { setGLoading(false); }
  };

  /* ─────────────────── RENDER CARD ─────────────────── */
  const txtPrimary   = dark ? '#f1f5f9' : '#1e293b';
  const txtSecondary = dark ? '#94a3b8' : '#64748b';
  const divLine      = dark ? 'rgba(37,99,235,0.15)' : '#e2e8f0';

  const renderStep = () => {
    /* SUCCESS */
    if (step === 'success') return (
      <div className="text-center py-8 space-y-4 fade-in">
        <div className="w-16 h-16 mx-auto relative">
          <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(16,185,129,0.15)' }} />
          <div className="w-16 h-16 rounded-full border-2 border-emerald-500/40 flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.08)' }}>
            <CheckCircle className="h-7 w-7 text-emerald-400" />
          </div>
        </div>
        <div>
          <p className="font-black text-lg" style={{ color: txtPrimary }}>Access Granted</p>
          <p className="text-xs mt-1" style={{ color: txtSecondary }}>Redirecting to dashboard…</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-bold">
          <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
          SECURE SESSION ESTABLISHED
        </div>
      </div>
    );

    /* FORGOT → OTP screens */
    if (step === 'forgot') return (
      <div className="space-y-4 fade-in">
        <button onClick={() => reset('email')} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: txtSecondary }}>
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="text-center">
          <p className="font-black text-base" style={{ color: txtPrimary }}>Reset Password</p>
          <p className="text-xs mt-0.5" style={{ color: txtSecondary }}>Enter your email to receive a reset link</p>
        </div>
        {error && <ErrBox msg={error} />}
        <form onSubmit={e => { e.preventDefault(); setStep('otp'); }} className="space-y-3">
          <Input dark={dark} icon={Mail} type="email" placeholder="Your email address"
            value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setError(''); }} />
          <Btn type="submit" loading={loading}>Send Reset Link <ArrowRight className="h-4 w-4" /></Btn>
        </form>
      </div>
    );

    if (step === 'otp') return (
      <div className="space-y-4 fade-in text-center">
        <div>
          <p className="font-black text-base" style={{ color: txtPrimary }}>Check your email</p>
          <p className="text-xs mt-1" style={{ color: txtSecondary }}>
            A reset link was sent to <strong className="text-blue-400">{forgotEmail}</strong>
          </p>
        </div>
        <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto" />
        <button onClick={() => reset('email')} className="text-xs font-semibold text-cyan-500 hover:text-cyan-400">
          ← Back to Sign In
        </button>
      </div>
    );

    /* STEP 1 — EMAIL */
    if (step === 'email') return (
      <div className="space-y-4 fade-in">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 relative">
            <div className="absolute inset-0 border-2 border-dashed border-blue-500/20 rounded-full spin-slow" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(37,99,235,0.12)', border: '1px solid rgba(37,99,235,0.25)' }}>
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </div>
          <p className="font-black text-lg" style={{ color: txtPrimary }}>Welcome to FraudShield</p>
          <p className="text-xs mt-0.5" style={{ color: txtSecondary }}>Enter your email to continue</p>
        </div>
        {error && <ErrBox msg={error} />}
        <form onSubmit={handleCheckEmail} className="space-y-3">
          <Input dark={dark} icon={Mail} type="email" placeholder="Email address"
            value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
            autoComplete="email" />
          <Btn type="submit" loading={loading}>Continue <ArrowRight className="h-4 w-4" /></Btn>
        </form>
        <Divider dark={dark} />
        <GoogleRow dark={dark} onSuccess={handleGoogle} onError={() => setError('Google sign-in failed.')} loading={gLoading} />
      </div>
    );

    /* STEP 2a — SIGN IN (existing user) */
    if (step === 'password') return (
      <div className="space-y-4 fade-in">
        <button onClick={() => reset('email')} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: txtSecondary }}>
          <ChevronLeft className="h-3.5 w-3.5" /> Use a different email
        </button>
        {/* User greeting */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl" style={{ background: dark ? 'rgba(37,99,235,0.07)' : '#eff6ff', border: `1px solid ${dark ? 'rgba(37,99,235,0.18)' : '#bfdbfe'}` }}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0">
            <span className="text-white font-black text-xs">{email[0]?.toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            {foundUser?.name && <p className="font-bold text-xs truncate" style={{ color: txtPrimary }}>{foundUser.name}</p>}
            <p className="text-[11px] truncate" style={{ color: txtSecondary }}>{email}</p>
          </div>
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0 ml-auto" />
        </div>
        {error && <ErrBox msg={error} />}
        <form onSubmit={handleSignIn} className="space-y-3">
          <Input dark={dark} icon={Lock} type={showPass ? 'text' : 'password'} placeholder="Password"
            value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
            autoComplete="current-password"
            right={
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ color: dark ? '#64748b' : '#94a3b8' }}>
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            } />
          <Btn type="submit" loading={loading}>Sign In <ArrowRight className="h-4 w-4" /></Btn>
        </form>
        <div className="text-center">
          <button onClick={() => { setForgotEmail(email); reset('forgot'); }}
            className="text-[11px] font-semibold text-cyan-500 hover:text-cyan-400 transition-colors">
            Forgot your password?
          </button>
        </div>
      </div>
    );

    /* STEP 2b — REGISTER (new user) */
    if (step === 'register') return (
      <div className="space-y-3 fade-in">
        <button onClick={() => reset('email')} className="flex items-center gap-1.5 text-xs font-medium transition-colors" style={{ color: txtSecondary }}>
          <ChevronLeft className="h-3.5 w-3.5" /> Use a different email
        </button>
        {/* New user badge */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: dark ? 'rgba(16,185,129,0.07)' : '#f0fdf4', border: `1px solid ${dark ? 'rgba(16,185,129,0.2)' : '#bbf7d0'}` }}>
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <p className="text-[11px] font-semibold text-emerald-500">New account for <span className="font-black">{email}</span></p>
        </div>
        {error && <ErrBox msg={error} />}
        <form onSubmit={handleRegister} className="space-y-2.5">
          <Input dark={dark} icon={User} placeholder="Full Name"
            value={name} onChange={e => { setName(e.target.value); setError(''); }}
            autoComplete="name" />
          <Input dark={dark} icon={Lock} type={showPass ? 'text' : 'password'} placeholder="Create password (min 8 chars)"
            value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
            autoComplete="new-password"
            right={
              <button type="button" onClick={() => setShowPass(p => !p)} style={{ color: dark ? '#64748b' : '#94a3b8' }}>
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            } />
          {password && <PassStrength pass={password} />}
          <Input dark={dark} icon={Lock} type={showConf ? 'text' : 'password'} placeholder="Confirm password"
            value={confirm} onChange={e => { setConfirm(e.target.value); setError(''); }}
            autoComplete="new-password"
            right={
              <button type="button" onClick={() => setShowConf(p => !p)} style={{ color: dark ? '#64748b' : '#94a3b8' }}>
                {showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            } />
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" required className="mt-0.5 accent-blue-500 shrink-0" />
            <span className="text-[11px]" style={{ color: txtSecondary }}>
              I agree to the <span className="text-cyan-500 hover:underline cursor-pointer">Terms</span> and <span className="text-cyan-500 hover:underline cursor-pointer">Privacy Policy</span>
            </span>
          </label>
          <Btn type="submit" loading={loading}>Create Account <ArrowRight className="h-4 w-4" /></Btn>
        </form>
      </div>
    );
  };

  /* ─────────────────── LAYOUT ─────────────────── */
  return (
    <div className="min-h-screen flex overflow-hidden font-sans" style={{ background: '#0F172A' }}>
      <style>{`
        @keyframes floatY   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeIn   { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer  { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spinSlow { to{transform:rotate(360deg)} }
        @keyframes glowPls  { 0%,100%{opacity:.4} 50%{opacity:1} }
        .fade-in    { animation: fadeIn .4s ease both; }
        .float-y    { animation: floatY 4s ease-in-out infinite; }
        .spin-slow  { animation: spinSlow 10s linear infinite; }
        .glow-pulse { animation: glowPls 2s ease-in-out infinite; }
        .shimmer-txt {
          background: linear-gradient(90deg,#2563EB,#06B6D4,#10B981,#06B6D4,#2563EB);
          background-size:200% auto; -webkit-background-clip:text;
          -webkit-text-fill-color:transparent; animation: shimmer 5s linear infinite;
        }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px #0f172a inset!important; -webkit-text-fill-color:#e2e8f0!important; }
        .google-wrap > div { width:100%!important; } .google-wrap iframe { width:100%!important; }
      `}</style>

      {/* ── LEFT HERO ── */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden flex-col">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/auth-bg.png')", filter: 'brightness(0.35) saturate(1.3)' }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg,rgba(15,23,42,0.55),rgba(37,99,235,0.06),rgba(15,23,42,0.7))' }} />
        <div className="absolute inset-0 opacity-[0.035]"
          style={{ backgroundImage: 'linear-gradient(rgba(6,182,212,1) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,1) 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <NeuralCanvas />

        {/* Floating stat badges */}
        {[
          { label: 'Fraud Blocked', value: '$4.2M',  color: '#10B981', top: '22%', left: '6%',   delay: '0s' },
          { label: 'Accuracy',      value: '99.97%', color: '#2563EB', top: '38%', right: '7%',  delay: '0.7s' },
          { label: 'Response',      value: '< 50ms', color: '#06B6D4', bottom: '30%', left: '7%', delay: '1.1s' },
          { label: 'Countries',     value: '152+',   color: '#A855F7', bottom: '18%', right: '6%', delay: '0.4s' },
        ].map((b, i) => (
          <div key={i} className="absolute backdrop-blur-xl rounded-2xl px-3.5 py-2.5 shadow-xl float-y"
            style={{ ...b, animationDelay: b.delay, background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(37,99,235,0.18)' }}>
            <p className="text-[8px] uppercase tracking-widest font-bold" style={{ color: b.color }}>{b.label}</p>
            <p className="text-white font-black text-sm">{b.value}</p>
          </div>
        ))}

        {/* Hero content */}
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl backdrop-blur-sm" style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}>
              <Shield className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="text-white font-black text-base leading-none">FraudShield</div>
              <div className="text-[10px] font-bold tracking-widest uppercase mt-0.5 text-cyan-400">AI Security Platform</div>
            </div>
          </div>

          {/* Headline */}
          <div className="space-y-6 max-w-md">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.22)' }}>
              <span className="relative flex h-2 w-2">
                <span className="glow-pulse absolute inset-0 rounded-full bg-emerald-400" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">AI Monitoring Active · 24/7</span>
            </div>
            <div>
              <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight">
                Protect Every<br />
                <span className="shimmer-txt">Transaction</span><br />
                <span className="text-white">with AI Power</span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed mt-4 max-w-sm">
                Military-grade ML models analyze thousands of signals in milliseconds — blocking fraud before it reaches your customers.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {['Real-time Scoring', 'Explainable AI', 'Zero False Alarms', 'GDPR'].map((f, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.18)', color: '#93c5fd' }}>{f}</span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {[{ v: '99.9%', l: 'Accuracy', c: '#10B981' }, { v: '< 50ms', l: 'Latency', c: '#06B6D4' }, { v: '$8.7M', l: 'Saved', c: '#A855F7' }].map((m, i) => (
                <div key={i} className="rounded-xl p-2.5 text-center backdrop-blur-sm"
                  style={{ background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(37,99,235,0.12)' }}>
                  <div className="font-black text-base" style={{ color: m.c }}>{m.v}</div>
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider mt-0.5">{m.l}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-slate-700 text-[10px]">© 2026 FraudShield AI · SOC 2 · ISO 27001 · GDPR</p>
        </div>
      </div>

      {/* ── RIGHT AUTH PANEL ── */}
      <div className="w-full lg:w-[400px] xl:w-[420px] flex flex-col overflow-y-auto relative transition-colors duration-300"
        style={{ background: dark ? 'linear-gradient(180deg,#080d1f,#0b1028)' : 'linear-gradient(180deg,#f8fafc,#f1f5f9)' }}>

        {/* Topbar */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="lg:hidden flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span className="font-black text-sm" style={{ color: dark ? '#f1f5f9' : '#1e293b' }}>FraudShield</span>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 glow-pulse" />
              <span className="text-emerald-400 text-[9px] font-bold uppercase tracking-wide">Secure</span>
            </div>
            <button onClick={() => setDark(p => !p)}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ background: dark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.07)', border: dark ? '1px solid rgba(37,99,235,0.2)' : '1px solid rgba(37,99,235,0.15)' }}>
              {dark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-500" />}
            </button>
          </div>
        </div>

        {/* Card */}
        <div className="flex-1 flex items-center justify-center px-5 py-3">
          <div className="w-full max-w-[340px]">
            <div className="rounded-2xl p-5 relative overflow-hidden"
              style={{
                background: dark ? 'linear-gradient(145deg,rgba(13,21,56,0.96),rgba(8,13,32,0.98))' : 'rgba(255,255,255,0.92)',
                border: dark ? '1px solid rgba(37,99,235,0.2)' : '1px solid rgba(37,99,235,0.14)',
                boxShadow: dark ? '0 20px 60px rgba(0,0,0,0.6)' : '0 20px 60px rgba(37,99,235,0.07)',
              }}>
              {/* Corner glow */}
              <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"
                style={{ background: 'radial-gradient(circle at top right, rgba(6,182,212,0.06), transparent 70%)' }} />

              {/* AI scan strip (only on email step) */}
              {step === 'email' && (
                <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-xl"
                  style={{ background: dark ? 'rgba(37,99,235,0.06)' : 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.1)' }}>
                  <Cpu className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] font-medium" style={{ color: dark ? '#94a3b8' : '#64748b' }}>
                    AI fraud scan <strong className="text-blue-400">{scanActive ? 'active' : 'monitoring'}</strong>
                  </span>
                  <div className={`ml-auto h-1.5 w-1.5 rounded-full transition-colors duration-500 ${scanActive ? 'bg-blue-400' : 'bg-slate-600'}`} />
                </div>
              )}

              {renderStep()}
            </div>

            {/* Trust badges */}
            {step !== 'success' && (
              <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                {[['🔐', 'AES-256'], ['✅', 'SOC 2'], ['🇪🇺', 'GDPR'], ['🏦', 'PCI DSS']].map(([ic, l], i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="text-[9px]">{ic}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: dark ? '#334155' : '#94a3b8' }}>{l}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-2.5 flex items-center justify-center gap-2 text-[10px]" style={{ color: dark ? '#334155' : '#94a3b8' }}>
              <Wifi className="h-2.5 w-2.5" /><span>TLS 1.3 · 256-bit Encryption</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SUB-COMPONENTS
───────────────────────────────────────── */
function ErrBox({ msg }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs text-red-400 fade-in"
      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{msg}
    </div>
  );
}

function Divider({ dark }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: dark ? 'rgba(37,99,235,0.14)' : '#e2e8f0' }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dark ? '#475569' : '#94a3b8' }}>or</span>
      <div className="flex-1 h-px" style={{ background: dark ? 'rgba(37,99,235,0.14)' : '#e2e8f0' }} />
    </div>
  );
}

function GoogleRow({ dark, onSuccess, onError, loading }) {
  return (
    <div className="google-wrap flex justify-center min-h-[38px]">
      {loading ? (
        <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
          style={{ background: dark ? 'rgba(15,23,42,0.5)' : '#f1f5f9', border: `1px solid ${dark ? 'rgba(37,99,235,0.1)' : '#e2e8f0'}`, color: dark ? '#475569' : '#94a3b8' }}>
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>Verifying…
        </div>
      ) : (
        <GoogleLogin onSuccess={onSuccess} onError={onError}
          theme={dark ? 'filled_black' : 'outline'} shape="pill" size="large"
          text="continue_with" width="300" logo_alignment="left"
          useOneTap={false} cancel_on_tap_outside={false} />
      )}
    </div>
  );
}
