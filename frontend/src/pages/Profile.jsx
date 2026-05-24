import React, { useState } from 'react';
import { User, Mail, Shield, Calendar, Lock, CheckCircle2, Save, Terminal, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateUserProfile } from '../utils/api';

const Profile = ({ user, onProfileUpdate }) => {
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password && password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (username.length < 3) {
      toast.error('Username must be at least 3 characters long.');
      return;
    }

    setSaving(true);
    const updateData = { username, email };
    if (password) {
      updateData.password = password;
    }

    try {
      const response = await updateUserProfile(updateData);
      if (response.data.success) {
        toast.success(response.data.message || 'Profile updated successfully!');
        const updatedUser = response.data.user;
        
        // Pass the updated user back to App.jsx to synchronize credentials
        if (onProfileUpdate) {
          onProfileUpdate(updatedUser);
        }

        // Clear password fields on success
        setPassword('');
        setConfirmPassword('');
      } else {
        toast.error(response.data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Connection error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const formattedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown Date';

  return (
    <div className="container mx-auto px-6 py-8 font-sans max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-dark-text tracking-tight">Security Officer Profile</h1>
          <p className="text-sm text-dark-muted mt-1.5">
            Manage your credentials and view access privileges inside FraudShield AI.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-dark-muted font-mono uppercase bg-dark-card border border-dark-border px-3 py-1.5 rounded-lg">
          <Terminal className="h-3.5 w-3.5 text-indigo-400" />
          <span>Gateway Session Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Profile Meta Data Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass border border-dark-border rounded-2xl p-6 relative overflow-hidden glow-card">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="text-center pb-6 border-b border-dark-border/40">
              <div className="inline-flex bg-indigo-500/10 p-4 rounded-full border border-indigo-500/25 mb-3">
                <User className="h-10 w-10 text-indigo-400" />
              </div>
              <h2 className="text-lg font-bold text-dark-text leading-tight">{user?.username}</h2>
              <p className="text-xs text-dark-muted mt-1 font-mono uppercase tracking-wider">{user?.email}</p>
            </div>

            <div className="pt-6 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-muted flex items-center">
                  <Shield className="h-4 w-4 mr-2 text-indigo-400" /> System Role
                </span>
                <span className="font-mono bg-indigo-950/50 text-indigo-400 border border-indigo-900/50 px-2 py-0.5 rounded text-xs uppercase font-semibold">
                  {user?.role || 'operator'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-muted flex items-center">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-emerald-400" /> Access Status
                </span>
                <span className="font-mono bg-emerald-950/50 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded text-xs uppercase font-semibold">
                  {user?.status || 'active'}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-dark-muted flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-purple-400" /> Commissioned
                </span>
                <span className="text-dark-text text-xs font-semibold">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-4.5 text-xs text-indigo-300 flex items-start space-x-3">
            <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-indigo-400" />
            <div>
              <span className="font-bold block mb-1">Access Level Privilege</span>
              Operators can monitor transactions, review pending files, and execute simulation parameters. System rules can only be edited by administrative sessions.
            </div>
          </div>
        </div>

        {/* Right Side: Settings Forms */}
        <div className="lg:col-span-2">
          <div className="glass border border-dark-border rounded-2xl p-8">
            <h3 className="text-lg font-bold text-dark-text mb-6 flex items-center">
              <Save className="h-4.5 w-4.5 mr-2 text-indigo-400" /> Account Settings
            </h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-dark-muted tracking-wider uppercase mb-2">Username</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-muted">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-dark-bg/80 border border-dark-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                    placeholder="Enter username"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-xs font-semibold text-dark-muted tracking-wider uppercase mb-2">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-muted">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-dark-bg/80 border border-dark-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="border-t border-dark-border/40 my-6 pt-6" />

              <h4 className="text-sm font-bold text-dark-text mb-4 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-purple-400" /> Security Credentials (Leave blank if unchanged)
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-dark-muted tracking-wider uppercase mb-2">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-muted">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-dark-bg/80 border border-dark-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-xs font-semibold text-dark-muted tracking-wider uppercase mb-2">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-dark-muted">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-dark-bg/80 border border-dark-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-xl text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-lg shadow-indigo-600/20 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving Profile Changes...' : 'Save Settings Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
