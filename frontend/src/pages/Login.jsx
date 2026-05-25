import React, { useState, useEffect } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { Shield, Zap, Users, Globe, CheckCircle, AlertCircle } from 'lucide-react';

const STATS = [
  { icon: Shield, value: '99.9%', label: 'Accuracy' },
  { icon: Zap,    value: '1M+',   label: 'Transactions' },
  { icon: Users,  value: '10K+',  label: 'Active Users' },
  { icon: Globe,  value: '150+',  label: 'Countries' },
];

const FEATURES = [
  { icon: '🛡️', title: 'Real-time Monitoring',  desc: 'Detect suspicious transactions the moment they happen.' },
  { icon: '⚙️', title: 'Smart Rule Engine',     desc: 'AI-powered rules to slash fraud and false positives.' },
  { icon: '📊', title: 'Actionable Insights',   desc: 'Deep analytics and reports for data-driven decisions.' },
];

const Login = ({ onLoginSuccess }) => {
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [activeFloat, setActiveFloat] = useState(0);

  /* Floating card cycle */
  useEffect(() => {
    const t = setInterval(() => setActiveFloat(p => (p + 1) % 3), 2500);
    return () => clearInterval(t);
  }, []);

  /* Called by GoogleLogin when Google returns an id_token credential */
  const handleGoogleSuccess = async (credentialResponse) => {
    setError('');
    setLoading(true);

    const { credential } = credentialResponse; // id_token JWT from Google

    if (!credential) {
      setError('Google did not return a credential. Please try again.');
      setLoading(false);
      return;
    }

    try {
      const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error('Invalid response from server. Is the backend running?');
      }

      if (res.ok && data.success) {
        setSuccess(true);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setTimeout(() => onLoginSuccess(data.user), 800);
      } else {
        setError(data.message || `Authentication failed (${res.status}). Please try again.`);
      }
    } catch (err) {
      setError(err.message || 'Server unreachable. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setError('Google sign-in failed. Make sure pop-ups are not blocked and try again.');
  };

  return (
    <div className="min-h-screen flex font-sans overflow-hidden bg-[#080c18]">

      {/* ─── Keyframes ─── */}
      <style>{`
        @keyframes floatUp   { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-10px)} }
        @keyframes glowPulse { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin-slow  { to{transform:rotate(360deg)} }
        .float-card  { animation: floatUp   3s ease-in-out infinite; }
        .glow-ring   { animation: glowPulse 2s ease-in-out infinite; }
        .fade-slide  { animation: fadeSlide .5s ease forwards; }
        .spin-slow   { animation: spin-slow 8s linear infinite; }

        /* Override Google button to blend with our dark card */
        .google-btn-wrap > div {
          width: 100% !important;
        }
        .google-btn-wrap iframe {
          width: 100% !important;
        }
      `}</style>

      {/* ═══════════════════════════════════════════════
          LEFT — HERO BRANDING PANEL
      ═══════════════════════════════════════════════ */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between overflow-hidden"
        style={{ background: 'linear-gradient(145deg,#070b1e 0%,#0d1340 55%,#111a60 100%)' }}>

        {/* Grid texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage:'linear-gradient(#6366f1 1px,transparent 1px),linear-gradient(90deg,#6366f1 1px,transparent 1px)', backgroundSize:'44px 44px' }} />

        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
          style={{ background:'radial-gradient(circle,rgba(99,102,241,.12) 0%,transparent 68%)' }} />

        {/* Header logo */}
        <div className="relative z-10 p-8 flex items-center space-x-3">
          <div className="bg-indigo-600/20 border border-indigo-500/30 p-2.5 rounded-xl">
            <Shield className="h-6 w-6 text-indigo-400" />
          </div>
          <div>
            <div className="text-white font-extrabold text-lg tracking-tight leading-none">FraudShield AI</div>
            <div className="text-indigo-400 text-xs font-medium tracking-wider mt-0.5">Autonomous Rule Engine</div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 px-10 xl:px-14 flex-1 flex flex-col justify-center space-y-8">

          {/* Live badge */}
          <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full w-fit">
            <span className="h-2 w-2 bg-emerald-400 rounded-full animate-ping" />
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">Enterprise Security Active</span>
          </div>

          {/* Headline */}
          <div>
            <h1 className="text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
              Real-Time Security.<br />
              <span style={{ background:'linear-gradient(90deg,#a5b4fc,#818cf8)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                Always One Step Ahead.
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mt-4">
              Harness machine learning and customizable business rule filters to secure operations and shield every payment.
            </p>
          </div>

          {/* Features */}
          <div className="space-y-4">
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

          {/* Floating status cards */}
          <div className="flex space-x-3 pt-2">
            {[
              { label:'Fraud Blocked', value:'$2.4M', color:'emerald' },
              { label:'Risk Score',    value:'23/100', color:'indigo' },
              { label:'Uptime',        value:'99.99%', color:'violet' },
            ].map((card, i) => (
              <div key={i}
                className={`flex-1 border rounded-xl p-3 transition-all duration-500 ${
                  activeFloat === i
                    ? 'border-indigo-500/40 bg-indigo-600/10 shadow-lg shadow-indigo-500/10 scale-105'
                    : 'border-slate-800/50 bg-[#0c101c]/60'
                }`}>
                <p className="text-slate-400 text-[9px] uppercase tracking-wider font-bold">{card.label}</p>
                <p className="text-white font-extrabold text-sm mt-1">{card.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative z-10 mx-8 mb-6 grid grid-cols-4 gap-2 bg-[#0c101c] border border-slate-800 rounded-2xl p-4">
          {STATS.map(({ icon: Icon, value, label }, i) => (
            <div key={i} className="text-center">
              <div className="flex justify-center mb-1"><Icon className="h-4 w-4 text-indigo-400" /></div>
              <p className="text-white font-extrabold text-base leading-none">{value}</p>
              <p className="text-slate-400 text-[9px] uppercase tracking-wider mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="relative z-10 pb-6 px-8 flex justify-between text-[11px] text-slate-500 font-medium">
          <span>© 2026 FraudShield AI. All rights reserved.</span>
          <div className="flex space-x-4">
            <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT — SIGN IN PANEL
      ═══════════════════════════════════════════════ */}
      <div className="flex-grow flex flex-col items-center justify-center p-6 md:p-12 bg-[#080c18] relative">

        {/* Subtle background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
            style={{ background:'radial-gradient(circle,rgba(99,102,241,.06) 0%,transparent 70%)' }} />
        </div>

        <div className="relative w-full max-w-sm fade-slide">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center space-x-2.5 mb-8 justify-center">
            <div className="bg-indigo-600/20 border border-indigo-500/30 p-2 rounded-xl">
              <Shield className="h-5 w-5 text-indigo-400" />
            </div>
            <span className="text-white font-extrabold text-lg">FraudShield AI</span>
          </div>

          {/* Card */}
          <div className="bg-[#0d1128]/80 border border-slate-800/80 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">

            {/* Title */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-4 relative">
                <div className="absolute inset-0 border-2 border-dashed border-indigo-500/25 rounded-full spin-slow" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-indigo-600/20 border border-indigo-500/30 w-11 h-11 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">Welcome back</h2>
              <p className="text-slate-400 text-sm mt-1">Sign in to your secure operator console</p>
            </div>

            {/* Error banner */}
            {error && (
              <div className="mb-5 bg-red-500/10 border border-red-500/25 text-red-400 px-4 py-3 rounded-xl text-xs flex items-start space-x-2.5">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Success state */}
            {success ? (
              <div className="text-center py-4 space-y-3">
                <div className="w-14 h-14 mx-auto bg-emerald-500/10 border border-emerald-500/25 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-emerald-400" />
                </div>
                <p className="text-white font-bold">Authenticated!</p>
                <p className="text-slate-400 text-xs">Redirecting to dashboard…</p>
              </div>
            ) : (
              <>
                {/* ── Google Sign-In Button ── */}
                <div className="google-btn-wrap flex flex-col items-center gap-3">
                  {loading ? (
                    <div className="w-full flex items-center justify-center gap-3 bg-white/5 border border-slate-700 rounded-full py-3.5 px-6">
                      <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      <span className="text-slate-300 text-sm font-medium">Verifying with Google…</span>
                    </div>
                  ) : (
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={handleGoogleError}
                      theme="filled_black"
                      shape="pill"
                      size="large"
                      text="continue_with"
                      width="320"
                      logo_alignment="left"
                      useOneTap={false}
                      cancel_on_tap_outside={false}
                    />
                  )}
                </div>

                {/* Divider with security note */}
                <div className="mt-6 text-center">
                  <p className="text-slate-500 text-[11px] leading-relaxed">
                    By signing in you agree to FraudShield AI's{' '}
                    <a href="#" className="text-indigo-400 hover:text-indigo-300 transition-colors">Terms of Service</a>
                    {' '}and{' '}
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 transition-colors">Privacy Policy</a>.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center space-x-5 text-slate-600">
            {['AES-256 Encrypted', 'SOC 2 Compliant', 'GDPR Ready'].map((badge, i) => (
              <div key={i} className="flex items-center space-x-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500/60 glow-ring" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
