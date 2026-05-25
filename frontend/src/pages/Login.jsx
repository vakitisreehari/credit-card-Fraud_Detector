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
    <div style={{ minHeight: '100vh', background: '#f0f2f5', display: 'flex', flexDirection: 'column', fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fadeUp .35s ease both; }
        input:focus { outline: none; }
        .login-input {
          width: 100%; padding: 10px 14px 10px 40px; font-size: 14px;
          border: 1.5px solid #e2e8f0; border-radius: 8px;
          background: #fff; color: #1e293b; transition: all .15s;
          box-sizing: border-box;
        }
        .login-input:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
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
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 32px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Shield size={18} color="#2563EB" />
          <span style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>FraudShield</span>
        </div>
        <div style={{ display: 'flex', gap: '28px' }}>
          {['Home', 'About', 'Contact'].map(l => (
            <a key={l} href="#" style={{ fontSize: '14px', color: '#475569', textDecoration: 'none', fontWeight: 500 }}
              onMouseEnter={e => e.target.style.color = '#2563EB'}
              onMouseLeave={e => e.target.style.color = '#475569'}>{l}</a>
          ))}
        </div>
      </nav>

      {/* ── Card ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
        <div className="fade-up" style={{
          background: '#fff', borderRadius: '16px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '420px',
          overflow: 'hidden',
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
                <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0f172a', textAlign: 'center' }}>Welcome Back</h2>
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
                      <Mail size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input className="login-input" type="email" placeholder="Enter your email"
                        value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                        autoComplete="email" style={{ paddingLeft: '36px' }} />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input className="login-input" type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                        value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                        autoComplete="current-password" style={{ paddingLeft: '36px', paddingRight: '40px' }} />
                      <button type="button" onClick={() => setShowPass(p => !p)}
                        style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
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
                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? 'Signing in…' : 'Login'}
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
                    <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-in failed.')}
                      theme="outline" shape="rectangular" size="large"
                      text="continue_with" width="356" logo_alignment="left"
                      useOneTap={false} cancel_on_tap_outside={false} />
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

                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? 'Creating account…' : 'Create Account'}
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
                    <GoogleLogin onSuccess={handleGoogle} onError={() => setError('Google sign-in failed.')}
                      theme="outline" shape="rectangular" size="large"
                      text="continue_with" width="356" logo_alignment="left"
                      useOneTap={false} cancel_on_tap_outside={false} />
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
  );
}
