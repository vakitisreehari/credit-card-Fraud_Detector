import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import {
  Shield, Mail, Lock, Eye, EyeOff, User, Phone, CheckCircle,
  AlertCircle, ArrowRight, Zap, Fingerprint, Cpu, Activity,
  RefreshCw, ChevronLeft, Sun, Moon, Wifi, Globe, Key
} from 'lucide-react';
import { login as apiLogin, register as apiRegister } from '../utils/api';

/* ═══════════════════════════════════════
   NEURAL NETWORK CANVAS
═══════════════════════════════════════ */
const NeuralCanvas = () => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext('2d');
    let id;
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; };
    resize(); window.addEventListener('resize', resize);
    const N = 55;
    const nodes = Array.from({ length: N }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35,
      r: Math.random() * 2 + 1, p: Math.random() * Math.PI * 2,
      color: Math.random() > .5 ? [37, 99, 235] : [6, 182, 212],
    }));
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      nodes.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.p += .018;
        if (n.x < 0 || n.x > c.width) n.vx *= -1;
        if (n.y < 0 || n.y > c.height) n.vy *= -1;
      });
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const d = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
          if (d < 150) {
            const a = (1 - d / 150) * .22;
            const [r, g, b] = nodes[i].color;
            ctx.beginPath(); ctx.moveTo(nodes[i].x, nodes[i].y); ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = `rgba(${r},${g},${b},${a})`; ctx.lineWidth = .7; ctx.stroke();
          }
        }
      }
      nodes.forEach(n => {
        const g2 = Math.sin(n.p) * .5 + .5;
        const [r, gb, b] = n.color;
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 5);
        grad.addColorStop(0, `rgba(${r},${gb},${b},${.8 * g2})`);
        grad.addColorStop(1, `rgba(${r},${gb},${b},0)`);
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 5, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
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

/* ═══════════════════════════════════════
   SCAN LINE EFFECT
═══════════════════════════════════════ */
const ScanLine = () => {
  const [y, setY] = useState(0);
  useEffect(() => {
    let dir = 1, val = 0, raf;
    const tick = () => {
      val += dir * .4; if (val >= 100 || val <= 0) dir *= -1;
      setY(val); raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
      <div className="absolute left-0 right-0 h-px transition-none"
        style={{ top: `${y}%`, background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.4), rgba(37,99,235,0.6), rgba(6,182,212,0.4), transparent)' }} />
    </div>
  );
};

/* ═══════════════════════════════════════
   FLOATING STAT CARD
═══════════════════════════════════════ */
const StatCard = ({ icon, label, value, color, delay, pos }) => (
  <div className="absolute backdrop-blur-xl rounded-2xl px-4 py-3 border shadow-2xl"
    style={{
      ...pos, animationDelay: delay,
      background: 'rgba(15,23,42,0.7)',
      border: '1px solid rgba(37,99,235,0.2)',
      boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${color}15`,
      animation: 'floatY 4s ease-in-out infinite',
    }}>
    <div className="flex items-center gap-2.5">
      <div className="p-1.5 rounded-lg" style={{ background: `${color}20` }}>
        {icon}
      </div>
      <div>
        <p className="text-[9px] uppercase tracking-widest font-bold" style={{ color }}>{label}</p>
        <p className="text-white font-black text-sm">{value}</p>
      </div>
    </div>
  </div>
);

/* ═══════════════════════════════════════
   GOOGLE / GITHUB / MICROSOFT SVG ICONS
═══════════════════════════════════════ */
const GIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);
const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="currentColor">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);
const MSIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0">
    <path fill="#F25022" d="M1 1h10v10H1z"/>
    <path fill="#7FBA00" d="M13 1h10v10H13z"/>
    <path fill="#00A4EF" d="M1 13h10v10H1z"/>
    <path fill="#FFB900" d="M13 13h10v10H13z"/>
  </svg>
);

/* ═══════════════════════════════════════
   STYLED INPUT COMPONENT
═══════════════════════════════════════ */
function StyledInput({ icon: Icon, type = 'text', placeholder, value, onChange, autoComplete, rightEl, error, dark = true }) {
  const [focused, setFocused] = useState(false);
  const bgIdle   = dark ? 'rgba(15,23,42,0.65)'  : '#f8fafc';
  const bgFocus  = dark ? 'rgba(37,99,235,0.06)' : '#eff6ff';
  const txtColor = dark ? '#e2e8f0' : '#1e293b';
  const border   = error ? '#EF4444' : focused ? '#2563EB' : (dark ? 'rgba(37,99,235,0.22)' : '#cbd5e1');
  const shadow   = focused ? '0 0 0 3px rgba(37,99,235,0.12)' : 'none';
  return (
    <div>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200"
          style={{ color: focused ? '#2563EB' : (dark ? '#475569' : '#94a3b8') }}>
          <Icon className="h-4 w-4" />
        </div>
        <input
          type={type} placeholder={placeholder} value={value} onChange={onChange}
          autoComplete={autoComplete}
          className="w-full pl-10 pr-10 py-3 text-sm outline-none transition-all duration-200 rounded-xl"
          style={{
            background: focused ? bgFocus : bgIdle,
            border: `1px solid ${border}`,
            color: txtColor,
            boxShadow: shadow,
            caretColor: '#2563EB',
          }}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        />
        {rightEl && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
      {error && <p className="text-red-400 text-[10px] mt-1 ml-1">{error}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════
   OTP INPUT
═══════════════════════════════════════ */
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.split('');
  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };
  const handleChange = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const arr = [...digits];
    arr[i] = v;
    onChange(arr.join('').slice(0, 6));
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };
  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''} onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKey(i, e)}
          className="w-11 h-12 text-center text-lg font-black outline-none rounded-xl transition-all duration-200"
          style={{
            background: digits[i] ? 'rgba(37,99,235,0.15)' : 'rgba(15,23,42,0.6)',
            border: `1.5px solid ${digits[i] ? '#2563EB' : 'rgba(37,99,235,0.2)'}`,
            color: '#e2e8f0', boxShadow: digits[i] ? '0 0 12px rgba(37,99,235,0.3)' : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════
   PRIMARY BUTTON
═══════════════════════════════════════ */
function PrimaryBtn({ onClick, type = 'button', loading, children, disabled, className = '' }) {
  return (
    <button type={type} onClick={onClick} disabled={loading || disabled}
      className={`w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        background: 'linear-gradient(135deg, #2563EB 0%, #06B6D4 100%)',
        boxShadow: '0 6px 20px rgba(37,99,235,0.3)',
      }}
      onMouseEnter={e => !loading && !disabled && (e.currentTarget.style.transform = 'translateY(-1px)')}
      onMouseLeave={e => e.currentTarget.style.transform = 'none'}
    >
      {loading ? (
        <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg> Processing…</>
      ) : children}
    </button>
  );
}

/* ═══════════════════════════════════════
   SOCIAL BUTTON
═══════════════════════════════════════ */
function SocialBtn({ icon, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-slate-300 transition-all duration-200"
      style={{
        background: hov ? 'rgba(37,99,235,0.12)' : 'rgba(15,23,42,0.6)',
        border: `1px solid ${hov ? 'rgba(37,99,235,0.4)' : 'rgba(37,99,235,0.15)'}`,
        boxShadow: hov ? '0 4px 16px rgba(37,99,235,0.15)' : 'none',
      }}>
      {icon}<span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function Login({ onLoginSuccess }) {
  const [tab, setTab]           = useState('signin');   // signin | signup | forgot | otp | reset | success | twofa
  const [dark, setDark]         = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [gLoading, setGLoading] = useState(false);
  const [error, setError]       = useState('');
  const [errors, setErrors]     = useState({});
  const [otp, setOtp]           = useState('');
  const [otpTimer, setOtpTimer] = useState(59);
  const [scanActive, setScanActive] = useState(true);

  // Form state
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '',
    resetEmail: '', newPass: '', twoFaCode: '',
  });
  const upd = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); setError(''); };

  // OTP countdown
  useEffect(() => {
    if (tab !== 'otp') return;
    setOtpTimer(59);
    const t = setInterval(() => setOtpTimer(p => p > 0 ? p - 1 : 0), 1000);
    return () => clearInterval(t);
  }, [tab]);

  // Scan pulse
  useEffect(() => {
    const t = setInterval(() => setScanActive(p => !p), 3000);
    return () => clearInterval(t);
  }, []);

  /* ── Validation ── */
  const validateSignIn = () => {
    const e = {};
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    setErrors(e); return !Object.keys(e).length;
  };
  const validateSignUp = () => {
    const e = {};
    if (!form.name) e.name = 'Full name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 8) e.password = 'Min 8 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e); return !Object.keys(e).length;
  };

  /* ── Sign In ── */
  const handleSignIn = async (e) => {
    e.preventDefault();
    if (!validateSignIn()) return;
    setLoading(true); setError('');
    try {
      const res = await apiLogin({ username: form.email, password: form.password });
      if (res.data.success) {
        if (rememberMe) localStorage.setItem('rememberedEmail', form.email);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('user', JSON.stringify(res.data.user));
        setTab('success');
        setTimeout(() => onLoginSuccess(res.data.user), 1400);
      } else { setError(res.data.message || 'Invalid credentials.'); }
    } catch (err) { setError(err.response?.data?.message || 'Sign-in failed. Please try again.'); }
    finally { setLoading(false); }
  };

  /* ── Sign Up ── */
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!validateSignUp()) return;
    setLoading(true); setError('');
    try {
      const res = await apiRegister({ username: form.name.replace(/\s+/g, '_').toLowerCase() + '_' + Date.now().toString(36), email: form.email, password: form.password, name: form.name });
      if (res.data.success) { setTab('otp'); }
      else { setError(res.data.message || 'Registration failed.'); }
    } catch (err) { setError(err.response?.data?.message || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  /* ── Google OAuth ── */
  const handleGoogle = async (credResp) => {
    setError(''); setGLoading(true);
    const { credential } = credResp;
    if (!credential) { setError('Google did not return a credential.'); setGLoading(false); return; }
    try {
      const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const res = await fetch(`${base}/auth/google`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credential }) });
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user));
        setTab('success'); setTimeout(() => onLoginSuccess(data.user), 1400);
      } else { setError(data.message || 'Google authentication failed.'); }
    } catch { setError('Server unreachable. Please try again.'); }
    finally { setGLoading(false); }
  };

  /* ── OTP verify (mock flow) ── */
  const handleOtp = (e) => {
    e.preventDefault();
    if (otp.length < 6) { setError('Enter the 6-digit OTP.'); return; }
    setTab('reset');
  };

  /* ── Reset Password (mock) ── */
  const handleReset = (e) => {
    e.preventDefault();
    if (!form.newPass || form.newPass.length < 8) { setErrors({ newPass: 'Min 8 characters' }); return; }
    setTab('success'); setTimeout(() => setTab('signin'), 2500);
  };

  /* ── Forgot submit ── */
  const handleForgot = (e) => {
    e.preventDefault();
    if (!form.resetEmail) { setErrors({ resetEmail: 'Email is required' }); return; }
    setTab('otp');
  };

  const go = (t) => { setTab(t); setError(''); setErrors({}); setOtp(''); };

  /* ══════════════════════════════════════
     RENDER PANEL CONTENT
  ══════════════════════════════════════ */
  const renderCard = () => {
    /* SUCCESS */
    if (tab === 'success') return (
      <div className="text-center py-10 space-y-5 fade-in">
        <div className="w-20 h-20 mx-auto relative">
          <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(16,185,129,0.15)' }} />
          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/40 rounded-full flex items-center justify-center">
            <CheckCircle className="h-9 w-9 text-emerald-400" />
          </div>
        </div>
        <div>
          <p className="text-white font-black text-2xl">Access Granted</p>
          <p className="text-slate-400 text-sm mt-2">Identity verified · Loading your dashboard…</p>
        </div>
        <div className="flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
          <div className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
          SECURE SESSION ESTABLISHED
        </div>
      </div>
    );

    /* FORGOT PASSWORD */
    if (tab === 'forgot') return (
      <div className="fade-in space-y-5">
        <button onClick={() => go('signin')} className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 text-xs font-medium transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" /> Back to Sign In
        </button>
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}>
            <Mail className="h-5 w-5 text-blue-400" />
          </div>
          <h3 className="text-xl font-black text-white">Reset Password</h3>
          <p className="text-slate-400 text-xs">We'll send a 6-digit OTP to your email</p>
        </div>
        {error && <ErrorBanner msg={error} />}
        <form onSubmit={handleForgot} className="space-y-4">
          <StyledInput icon={Mail} type="email" placeholder="Registered email address" value={form.resetEmail}
            onChange={e => upd('resetEmail', e.target.value)} error={errors.resetEmail} />
          <PrimaryBtn type="submit" loading={loading}>Send OTP <ArrowRight className="h-4 w-4" /></PrimaryBtn>
        </form>
      </div>
    );

    /* OTP */
    if (tab === 'otp') return (
      <div className="fade-in space-y-6">
        <button onClick={() => go('forgot')} className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 text-xs font-medium transition-colors">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </button>
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)' }}>
            <Key className="h-5 w-5 text-cyan-400" />
          </div>
          <h3 className="text-xl font-black text-white">Verify OTP</h3>
          <p className="text-slate-400 text-xs">Enter the 6-digit code sent to <strong className="text-cyan-400">{form.resetEmail || form.email}</strong></p>
        </div>
        {error && <ErrorBanner msg={error} />}
        <form onSubmit={handleOtp} className="space-y-5">
          <OtpInput value={otp} onChange={setOtp} />
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Expires in {String(otpTimer).padStart(2, '0')}s</span>
            <button type="button" onClick={() => setOtpTimer(59)} disabled={otpTimer > 0}
              className="text-blue-400 disabled:opacity-40 hover:text-cyan-400 transition-colors flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Resend
            </button>
          </div>
          <PrimaryBtn type="submit">Verify OTP <ArrowRight className="h-4 w-4" /></PrimaryBtn>
        </form>
      </div>
    );

    /* RESET PASSWORD */
    if (tab === 'reset') return (
      <div className="fade-in space-y-5">
        <div className="text-center space-y-1">
          <div className="w-12 h-12 mx-auto mb-3 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <Lock className="h-5 w-5 text-emerald-400" />
          </div>
          <h3 className="text-xl font-black text-white">New Password</h3>
          <p className="text-slate-400 text-xs">Choose a strong password for your account</p>
        </div>
        {error && <ErrorBanner msg={error} />}
        <form onSubmit={handleReset} className="space-y-4">
          <StyledInput icon={Lock} type={showPass ? 'text' : 'password'} placeholder="New password (min 8 chars)"
            value={form.newPass} onChange={e => upd('newPass', e.target.value)} error={errors.newPass}
            rightEl={<button type="button" onClick={() => setShowPass(p => !p)} className="text-slate-500 hover:text-slate-300">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
          <PasswordStrength pass={form.newPass} />
          <PrimaryBtn type="submit">Set New Password <CheckCircle className="h-4 w-4" /></PrimaryBtn>
        </form>
      </div>
    );

    /* SIGN UP */
    if (tab === 'signup') return (
      <div className="fade-in space-y-3">
        {error && <ErrorBanner msg={error} />}
        <form onSubmit={handleSignUp} className="space-y-2.5">
          <StyledInput dark={dark} icon={User} placeholder="Full Name" value={form.name} onChange={e => upd('name', e.target.value)} error={errors.name} autoComplete="name" />
          <StyledInput dark={dark} icon={Mail} type="email" placeholder="Email Address" value={form.email} onChange={e => upd('email', e.target.value)} error={errors.email} autoComplete="email" />
          <StyledInput dark={dark} icon={Phone} type="tel" placeholder="Phone (optional)" value={form.phone} onChange={e => upd('phone', e.target.value)} autoComplete="tel" />
          <StyledInput dark={dark} icon={Lock} type={showPass ? 'text' : 'password'} placeholder="Password (min 8 chars)"
            value={form.password} onChange={e => upd('password', e.target.value)} error={errors.password} autoComplete="new-password"
            rightEl={<button type="button" onClick={() => setShowPass(p => !p)} style={{ color: dark ? '#64748b' : '#94a3b8' }}>{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
          {form.password && <PasswordStrength pass={form.password} />}
          <StyledInput dark={dark} icon={Lock} type={showConf ? 'text' : 'password'} placeholder="Confirm Password"
            value={form.confirm} onChange={e => upd('confirm', e.target.value)} error={errors.confirm} autoComplete="new-password"
            rightEl={<button type="button" onClick={() => setShowConf(p => !p)} style={{ color: dark ? '#64748b' : '#94a3b8' }}>{showConf ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />
          <label className="flex items-start gap-2 cursor-pointer">
            <input type="checkbox" required className="mt-0.5 accent-blue-500 shrink-0" />
            <span className="text-[11px] leading-relaxed" style={{ color: dark ? '#94a3b8' : '#64748b' }}>I agree to the <span className="text-cyan-500 hover:underline cursor-pointer">Terms</span> and <span className="text-cyan-500 hover:underline cursor-pointer">Privacy Policy</span></span>
          </label>
          <PrimaryBtn type="submit" loading={loading}>Create Account <ArrowRight className="h-4 w-4" /></PrimaryBtn>
        </form>
        <Divider dark={dark} />
        <SocialRow onGoogle={handleGoogle} gLoading={gLoading} onGErr={() => setError('Google sign-in failed.')} dark={dark} />
      </div>
    );

    /* SIGN IN (default) */
    return (
      <div className="fade-in space-y-3">
        {error && <ErrorBanner msg={error} />}
        <form onSubmit={handleSignIn} className="space-y-2.5">
          <StyledInput dark={dark} icon={Mail} type="email" placeholder="Email address" value={form.email}
            onChange={e => upd('email', e.target.value)} error={errors.email} autoComplete="email" />
          <StyledInput dark={dark} icon={Lock} type={showPass ? 'text' : 'password'} placeholder="Password"
            value={form.password} onChange={e => upd('password', e.target.value)} error={errors.password} autoComplete="current-password"
            rightEl={<button type="button" onClick={() => setShowPass(p => !p)} style={{ color: dark ? '#64748b' : '#94a3b8' }} className="transition-colors hover:opacity-80">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>} />

          {/* Remember + Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="accent-blue-500 rounded" />
              <span className="text-[11px]" style={{ color: dark ? '#94a3b8' : '#64748b' }}>Remember me</span>
            </label>
            <button type="button" onClick={() => go('forgot')} className="text-cyan-500 text-[11px] hover:text-cyan-400 transition-colors font-semibold">Forgot password?</button>
          </div>

          <PrimaryBtn type="submit" loading={loading}>Sign In <ArrowRight className="h-4 w-4" /></PrimaryBtn>
        </form>

        {/* Biometric — coming soon */}
        <div className="flex gap-2">
          {[['Fingerprint', Fingerprint], ['Face ID', Activity]].map(([label, Ico], i) => (
            <div key={i} className="flex-1 relative">
              <button type="button" disabled
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] cursor-not-allowed transition-none"
                style={{
                  background: dark ? 'rgba(15,23,42,0.3)' : '#f1f5f9',
                  border: `1px solid ${dark ? 'rgba(37,99,235,0.08)' : '#e2e8f0'}`,
                  color: dark ? '#475569' : '#94a3b8',
                }}>
                <Ico className="h-3 w-3" /> {label}
              </button>
              <span className="absolute -top-1.5 -right-1 text-[6px] bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded px-1 font-black uppercase">Soon</span>
            </div>
          ))}
        </div>

        <Divider dark={dark} />
        <SocialRow onGoogle={handleGoogle} gLoading={gLoading} onGErr={() => setError('Google sign-in was cancelled.')} dark={dark} />
      </div>
    );
  };

  /* ══════════════════════════════════════
     MAIN RENDER
  ══════════════════════════════════════ */
  return (
    <div className="min-h-screen flex overflow-hidden font-sans relative" style={{ background: '#0F172A' }}>

      {/* ── Global Keyframes ── */}
      <style>{`
        @keyframes floatY    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes fadeIn    { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes spinSlow  { to{transform:rotate(360deg)} }
        @keyframes glowPulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        @keyframes slideIn   { from{opacity:0;transform:translateX(30px)} to{opacity:1;transform:translateX(0)} }
        .fade-in    { animation: fadeIn .45s ease both; }
        .float-y    { animation: floatY 4s ease-in-out infinite; }
        .spin-slow  { animation: spinSlow 10s linear infinite; }
        .glow-pulse { animation: glowPulse 2s ease-in-out infinite; }
        .coming-soon { position:relative; }
        .coming-soon::after { content:'Soon'; position:absolute; top:-6px; right:-4px; font-size:7px; background:#f59e0b; color:#000; border-radius:3px; padding:1px 4px; font-weight:900; }
        .shimmer-text {
          background: linear-gradient(90deg,#2563EB,#06B6D4,#10B981,#06B6D4,#2563EB);
          background-size:200% auto;
          -webkit-background-clip:text; -webkit-text-fill-color:transparent;
          animation: shimmer 5s linear infinite;
        }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px #0f172a inset!important; -webkit-text-fill-color:#e2e8f0!important; }
        .light-mode input:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px #f1f5f9 inset!important; -webkit-text-fill-color:#0f172a!important; }
        .tab-active { background:rgba(37,99,235,0.15); color:#60a5fa; border-bottom:2px solid #2563EB; }
        .tab-inactive { color:#64748b; border-bottom:2px solid transparent; }
        ::-webkit-scrollbar { width:4px; } ::-webkit-scrollbar-track { background:#0f172a; } ::-webkit-scrollbar-thumb { background:#1e3a5f; border-radius:4px; }
        .google-btn-wrap > div { width:100%!important; } .google-btn-wrap iframe { width:100%!important; }
        .coming-soon-badge { font-size:8px; background:rgba(250,204,21,0.12); color:#fbbf24; border:1px solid rgba(251,191,36,0.25); border-radius:4px; padding:1px 5px; font-weight:800; letter-spacing:.04em; text-transform:uppercase; }
      `}</style>

      {/* ═══════════════ LEFT HERO ═══════════════ */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden flex-col">
        {/* BG image */}
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage:"url('/auth-bg.png')", filter:'brightness(0.35) saturate(1.4)' }} />
        {/* Overlay */}
        <div className="absolute inset-0" style={{ background:'linear-gradient(135deg,rgba(15,23,42,0.55),rgba(37,99,235,0.08),rgba(15,23,42,0.7))' }} />
        {/* Cyber grid */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage:'linear-gradient(rgba(6,182,212,1) 1px,transparent 1px),linear-gradient(90deg,rgba(6,182,212,1) 1px,transparent 1px)', backgroundSize:'48px 48px' }} />
        <NeuralCanvas />
        <ScanLine />

        {/* Floating stat cards */}
        <StatCard icon={<Activity className="h-3.5 w-3.5" style={{ color:'#10B981' }}/>} label="Fraud Blocked" value="$4.2M" color="#10B981" delay="0s" pos={{ top:'20%', left:'6%', animationDelay:'0s' }} />
        <StatCard icon={<Zap className="h-3.5 w-3.5" style={{ color:'#06B6D4' }}/>} label="Transactions/s" value="12,400" color="#06B6D4" delay=".6s" pos={{ top:'35%', right:'8%', animationDelay:'0.6s' }} />
        <StatCard icon={<Shield className="h-3.5 w-3.5" style={{ color:'#2563EB' }}/>} label="Accuracy" value="99.97%" color="#2563EB" delay="1s" pos={{ bottom:'30%', left:'8%', animationDelay:'1s' }} />
        <StatCard icon={<Globe className="h-3.5 w-3.5" style={{ color:'#A855F7' }}/>} label="Countries" value="152" color="#A855F7" delay=".3s" pos={{ bottom:'18%', right:'6%', animationDelay:'0.3s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl backdrop-blur-sm" style={{ background:'rgba(37,99,235,0.15)', border:'1px solid rgba(37,99,235,0.3)' }}>
              <Shield className="h-6 w-6" style={{ color:'#60a5fa' }} />
            </div>
            <div>
              <div className="text-white font-black text-lg tracking-tight leading-none">FraudShield</div>
              <div className="text-xs font-bold tracking-widest uppercase mt-0.5" style={{ color:'#06B6D4' }}>AI Security Platform</div>
            </div>
          </div>

          {/* Hero text */}
          <div className="space-y-7 max-w-lg">
            {/* Live badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full backdrop-blur-sm" style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)' }}>
              <span className="relative flex h-2 w-2">
                <span className="glow-pulse absolute inset-0 rounded-full" style={{ background:'#10B981', opacity:.6 }} />
                <span className="relative h-2 w-2 rounded-full" style={{ background:'#10B981' }} />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color:'#34d399' }}>AI Monitoring Active · 24/7</span>
            </div>

            <div>
              <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
                Protect Every<br/>
                <span className="shimmer-text">Transaction</span><br/>
                <span className="text-white">with AI Power</span>
              </h1>
              <p className="text-slate-400 text-sm leading-relaxed mt-4 max-w-md">
                Military-grade machine learning models analyze thousands of signals in milliseconds — blocking fraud before it reaches your customers.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {['Real-time Scoring','Explainable AI','Zero False Alarms','GDPR Compliant'].map((f, i) => (
                <span key={i} className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{ background:'rgba(37,99,235,0.12)', border:'1px solid rgba(37,99,235,0.2)', color:'#93c5fd' }}>{f}</span>
              ))}
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { v:'99.9%', l:'Accuracy', c:'#10B981' },
                { v:'< 50ms', l:'Latency', c:'#06B6D4' },
                { v:'$8.7M', l:'Saved', c:'#A855F7' },
              ].map((m, i) => (
                <div key={i} className="rounded-xl p-3 text-center backdrop-blur-sm" style={{ background:'rgba(15,23,42,0.5)', border:'1px solid rgba(37,99,235,0.15)' }}>
                  <div className="font-black text-lg" style={{ color: m.c }}>{m.v}</div>
                  <div className="text-slate-500 text-[9px] uppercase tracking-wider mt-0.5">{m.l}</div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-slate-700 text-[10px]">© 2026 FraudShield AI · SOC 2 · ISO 27001 · GDPR</p>
        </div>
      </div>

      {/* ═══════════════ RIGHT AUTH PANEL ═══════════════ */}
      <div className="w-full lg:w-[420px] xl:w-[440px] flex flex-col overflow-y-auto relative"
        style={{ background: dark ? 'linear-gradient(180deg,#080d1f 0%,#0b1028 100%)' : 'linear-gradient(180deg,#f8fafc 0%,#f1f5f9 100%)' }}>

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <div className="lg:hidden flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            <span className={`font-black ${dark ? 'text-white' : 'text-slate-900'}`}>FraudShield</span>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            {/* Security status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)' }}>
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 glow-pulse" />
              <span className="text-emerald-400 text-[9px] font-bold uppercase tracking-wider">Secure</span>
            </div>
            {/* Dark/Light toggle */}
            <button onClick={() => setDark(p => !p)}
              className="p-2 rounded-lg transition-all duration-200"
              style={{ background: dark ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235,0.08)', border: dark ? '1px solid rgba(37,99,235,0.2)' : '1px solid rgba(37,99,235,0.15)' }}
              title={dark ? 'Switch to Light mode' : 'Switch to Dark mode'}>
              {dark
                ? <Sun className="h-3.5 w-3.5 text-amber-400" />
                : <Moon className="h-3.5 w-3.5 text-indigo-500" />}
            </button>
          </div>
        </div>

        {/* Main card area */}
        <div className="flex-1 flex items-center justify-center px-5 py-2">
          <div className="w-full max-w-[360px]">

            {/* Glass card */}
            <div className="rounded-2xl p-6 relative overflow-hidden"
              style={{
                background: dark
                  ? 'linear-gradient(145deg,rgba(13,21,56,0.95),rgba(8,13,32,0.98))'
                  : 'rgba(255,255,255,0.9)',
                border: dark ? '1px solid rgba(37,99,235,0.2)' : '1px solid rgba(37,99,235,0.15)',
                boxShadow: dark
                  ? '0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(37,99,235,0.05) inset'
                  : '0 20px 60px rgba(37,99,235,0.08), 0 2px 8px rgba(0,0,0,0.06)',
              }}>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
                style={{ background:'radial-gradient(circle at top right, rgba(6,182,212,0.06), transparent 70%)' }} />

              {/* AI scan indicator */}
              {tab === 'signin' && (
                <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-xl" style={{ background: dark ? 'rgba(37,99,235,0.06)' : 'rgba(37,99,235,0.05)', border:'1px solid rgba(37,99,235,0.12)' }}>
                  <Cpu className="h-3 w-3 text-blue-400" />
                  <span className="text-[10px] font-medium" style={{ color: dark ? '#94a3b8' : '#64748b' }}>AI fraud scan <strong className="text-blue-400">{scanActive ? 'active' : 'monitoring'}</strong></span>
                  <div className={`ml-auto h-1.5 w-1.5 rounded-full ${scanActive ? 'bg-blue-400' : 'bg-slate-600'} transition-colors duration-500`} />
                </div>
              )}

              {/* Tabs */}
              {(tab === 'signin' || tab === 'signup') && (
                <>
                  <div className="flex mb-5" style={{ borderBottom: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.08)' }}>
                    {[['signin','Sign In'],['signup','Sign Up']].map(([t, l]) => (
                      <button key={t} onClick={() => go(t)} className={`flex-1 pb-2 text-sm font-bold transition-all duration-200 ${tab === t ? 'tab-active' : 'tab-inactive hover:text-slate-300'}`}>
                        {l}
                      </button>
                    ))}
                  </div>
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 mx-auto mb-2.5 relative">
                      <div className="absolute inset-0 border-2 border-dashed border-blue-500/20 rounded-full spin-slow" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background:'rgba(37,99,235,0.12)', border:'1px solid rgba(37,99,235,0.25)' }}>
                          <Shield className="h-4 w-4 text-blue-400" />
                        </div>
                      </div>
                    </div>
                    <h2 className={`text-lg font-black ${dark ? 'text-white' : 'text-slate-900'}`}>
                      {tab === 'signin' ? 'Welcome back' : 'Join FraudShield'}
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5">
                      {tab === 'signin' ? 'Sign in to your secure operator console' : 'Create your security account'}
                    </p>
                  </div>
                </>
              )}

              {renderCard()}
            </div>

            {/* Trust badges */}
            {tab !== 'success' && (
              <div className="mt-4 flex items-center justify-center gap-4 flex-wrap">
                {[['🔐','AES-256'],['✅','SOC 2'],['🇪🇺','GDPR'],['🏦','PCI DSS']].map(([ic, l], i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-[10px]">{ic}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-700">{l}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-center gap-2 text-slate-700 text-[10px]">
              <Wifi className="h-2.5 w-2.5" />
              <span>TLS 1.3 · Session 24h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   SUB-COMPONENTS
═══════════════════════════════════════ */
function ErrorBanner({ msg }) {
  return (
    <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs text-red-400 fade-in"
      style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)' }}>
      <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />{msg}
    </div>
  );
}

function Divider({ dark = true }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px" style={{ background: dark ? 'rgba(37,99,235,0.15)' : '#e2e8f0' }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: dark ? '#475569' : '#94a3b8' }}>or</span>
      <div className="flex-1 h-px" style={{ background: dark ? 'rgba(37,99,235,0.15)' : '#e2e8f0' }} />
    </div>
  );
}

function SocialRow({ onGoogle, gLoading, onGErr, dark = true }) {
  const btnBg     = dark ? 'rgba(15,23,42,0.5)' : '#f1f5f9';
  const btnBorder = dark ? 'rgba(37,99,235,0.1)' : '#e2e8f0';
  const btnTxt    = dark ? '#475569' : '#94a3b8';
  return (
    <div className="space-y-2">
      {/* Google — official button */}
      <div className="google-btn-wrap flex justify-center min-h-[40px]">
        {gLoading ? (
          <div className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
            style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: btnTxt }}>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Verifying…
          </div>
        ) : (
          <GoogleLogin onSuccess={onGoogle} onError={onGErr}
            theme={dark ? 'filled_black' : 'outline'} shape="pill" size="large"
            text="continue_with" width="320" logo_alignment="left"
            useOneTap={false} cancel_on_tap_outside={false} />
        )}
      </div>
      {/* GitHub + Microsoft — coming soon */}
      <div className="flex gap-2">
        {[['GitHub', GitHubIcon], ['Microsoft', MSIcon]].map(([label, Ico], i) => (
          <div key={i} className="flex-1 relative">
            <button type="button" disabled
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-semibold cursor-not-allowed"
              style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: btnTxt }}>
              <Ico /><span>{label}</span>
            </button>
            <span className="absolute -top-1.5 -right-1 text-[6px] bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded px-1 font-black uppercase">Soon</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordStrength({ pass }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pass)).length;
  const labels = ['','Weak','Fair','Good','Strong'];
  const colors = ['','#EF4444','#F59E0B','#06B6D4','#10B981'];
  return (
    <div className="space-y-1.5 px-0.5">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
            style={{ background: i <= score ? colors[score] : 'rgba(37,99,235,0.1)' }} />
        ))}
      </div>
      {pass && <p className="text-[10px] font-bold" style={{ color: colors[score] }}>{labels[score]}</p>}
    </div>
  );
}
