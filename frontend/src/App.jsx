import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import RulesConfig from './pages/RulesConfig';
import Simulator from './pages/Simulator';
import ReviewQueue from './pages/ReviewQueue';
import ModelAnalytics from './pages/ModelAnalytics';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import { getMe } from './utils/api';

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [initializing, setInitializing] = useState(true);

  // Update document title on tab change
  useEffect(() => {
    const titles = {
      dashboard: 'Dashboard | FraudShield AI',
      transactions: 'Transactions | FraudShield AI',
      reviews: 'Manual Review Queue | FraudShield AI',
      rules: 'Rules Config | FraudShield AI',
      analytics: 'ML Performance & Drift | FraudShield AI',
      simulator: 'Transaction Simulator | FraudShield AI',
      profile: 'Security Profile Settings | FraudShield AI',
    };
    document.title = titles[activeTab] || 'FraudShield AI';
  }, [activeTab]);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setInitializing(false);
        return;
      }

      try {
        const response = await getMe();
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (err) {
        console.error('Failed to validate session token.');
        const cachedUser = localStorage.getItem('user');
        if (cachedUser) {
          try {
            setUser(JSON.parse(cachedUser));
          } catch (e) {}
        }
      } finally {
        setInitializing(false);
      }
    };

    checkAuth();
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const handleProfileUpdate = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center space-y-4">
        <div className="h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-dark-muted font-medium text-xs">Initializing dashboard security gateway...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1a2235', color: '#fff', border: '1px solid #1f293d' } }} />
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  const validTabs = ['dashboard', 'transactions', 'rules', 'simulator', 'reviews', 'analytics', 'profile'];
  const is404 = !validTabs.includes(activeTab);

  return (
    <div className="min-h-screen bg-dark-bg text-dark-text relative pb-16 dark-input-scope">
      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1a2235', color: '#fff', border: '1px solid #1f293d', borderRadius: '12px', fontSize: '13px' },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {/* Background gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-900/5 rounded-full blur-[100px] pointer-events-none z-0" />

      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        onLogout={handleLogout}
      />

      <main className="relative z-10">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'transactions' && <Transactions />}
        {activeTab === 'reviews' && <ReviewQueue />}
        {activeTab === 'rules' && <RulesConfig user={user} />}
        {activeTab === 'analytics' && <ModelAnalytics />}
        {activeTab === 'simulator' && <Simulator />}
        {activeTab === 'profile' && <Profile user={user} onProfileUpdate={handleProfileUpdate} />}
        {is404 && <NotFound onGoHome={() => setActiveTab('dashboard')} />}
      </main>
    </div>
  );
}

export default App;
