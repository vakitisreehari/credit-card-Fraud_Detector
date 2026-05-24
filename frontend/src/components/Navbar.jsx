import React from 'react';
import { Shield, LayoutDashboard, History, Sliders, Play, LogOut, Terminal, Sun, Moon, Globe, Settings, User, Menu, X } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

const Navbar = ({ activeTab, setActiveTab, user, onLogout }) => {
  const { t, currentLanguage, changeLanguage } = useTranslation();
  
  const [theme, setTheme] = React.useState(localStorage.getItem('theme') || 'dark');
  
  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const navItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'transactions', label: t('transactions'), icon: History },
    { id: 'reviews', label: 'Review Inbox', icon: Shield },
    { id: 'rules', label: t('rules'), icon: Sliders },
    { id: 'analytics', label: 'ML Analytics', icon: Globe },
    { id: 'simulator', label: t('simulator'), icon: Play }
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <nav className="glass border-b border-dark-border py-4 px-6 sticky top-0 z-50 flex items-center justify-between">
      {/* Brand Header */}
      <div className="flex items-center space-x-3">
        <div className="bg-indigo-600/20 p-2 rounded-lg border border-indigo-500/30 animate-pulse-slow">
          <img src="/favicon.png" alt="FraudShield Logo" className="h-6 w-6 object-contain" />
        </div>
        <div>
          <span className="font-extrabold text-lg bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-500 bg-clip-text text-transparent tracking-wide">
            {t('appName')}
          </span>
          <div className="flex items-center text-[10px] text-dark-muted font-mono uppercase tracking-widest mt-0.5">
            <Terminal className="h-2.5 w-2.5 mr-1 text-emerald-500" /> Real-time ML Radar
          </div>
        </div>
      </div>

      {/* Nav Actions - Desktop Only (Hidden on Mobile/Tablet) */}
      <div className="hidden lg:flex items-center space-x-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30'
                  : 'text-dark-muted hover:text-dark-text hover:bg-dark-border/40 border border-transparent'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* User & Settings Actions - Desktop Only */}
      <div className="hidden lg:flex items-center space-x-4 border-l border-dark-border pl-6">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="text-dark-muted hover:text-dark-text bg-dark-card hover:bg-dark-border/40 border border-dark-border p-2 rounded-lg transition-colors cursor-pointer"
          title={theme === 'dark' ? t('lightMode') : t('darkMode')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-400" />}
        </button>

        {/* Language Selector Dropdown */}
        <div className="relative flex items-center bg-dark-card border border-dark-border px-2 py-1 rounded-lg text-xs text-dark-muted">
          <Globe className="h-3.5 w-3.5 mr-1 text-indigo-400" />
          <select
            value={currentLanguage}
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-transparent text-dark-text border-none focus:outline-none cursor-pointer font-medium"
          >
            <option value="en" className="bg-dark-card text-dark-text">EN</option>
            <option value="es" className="bg-dark-card text-dark-text">ES</option>
            <option value="hi" className="bg-dark-card text-dark-text">HI</option>
            <option value="fr" className="bg-dark-card text-dark-text">FR</option>
          </select>
        </div>

        {/* User Details */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`text-right border-l border-dark-border pl-4 cursor-pointer hover:opacity-80 transition-all group flex flex-col items-end justify-center bg-transparent border-t-0 border-r-0 border-b-0 focus:outline-none ${
            activeTab === 'profile' ? 'text-indigo-400' : ''
          }`}
          title="Account Settings"
        >
          <div className="flex items-center space-x-1">
            <User className={`h-3 w-3 ${activeTab === 'profile' ? 'text-indigo-400' : 'text-dark-muted'} group-hover:text-indigo-400 transition-colors`} />
            <p className={`text-xs font-semibold ${activeTab === 'profile' ? 'text-indigo-400' : 'text-dark-text'} group-hover:text-indigo-400 transition-colors`}>{user?.username || 'Operator'}</p>
          </div>
          <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono uppercase border ${
            activeTab === 'profile'
              ? 'bg-indigo-950/70 text-indigo-400 border-indigo-500/50'
              : 'bg-dark-card text-dark-muted border-dark-border group-hover:border-indigo-500/30 group-hover:text-indigo-400'
          } transition-all`}>
            {user?.role || 'Staff'}
          </span>
        </button>

        {/* Settings Button */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`text-dark-muted hover:text-indigo-400 bg-dark-card border p-2 rounded-lg transition-colors cursor-pointer focus:outline-none ${
            activeTab === 'profile' ? 'text-indigo-400 border-indigo-500/40 bg-indigo-950/20' : 'border-dark-border hover:bg-dark-border/40'
          }`}
          title="Account Settings"
        >
          <Settings className={`h-4 w-4 ${activeTab === 'profile' ? 'animate-spin-slow' : ''}`} />
        </button>

        {/* Log Out */}
        <button
          onClick={onLogout}
          className="text-dark-muted hover:text-brand-danger bg-dark-card hover:bg-brand-danger/10 border border-dark-border p-2 rounded-lg transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile Hamburger Actions - Visible only below 'lg' breakpoint */}
      <div className="flex items-center space-x-2.5 lg:hidden">
        {/* Mobile theme toggle */}
        <button
          onClick={toggleTheme}
          className="text-dark-muted hover:text-dark-text bg-dark-card hover:bg-dark-border/40 border border-dark-border p-2 rounded-lg transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-400" />}
        </button>

        {/* Hamburger Menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(prev => !prev)}
          className="text-dark-muted hover:text-dark-text bg-dark-card hover:bg-dark-border/40 border border-dark-border p-2 rounded-lg transition-colors cursor-pointer"
          title="Toggle Navigation Menu"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="absolute top-[75px] left-0 right-0 glass border-b border-dark-border p-5 flex flex-col space-y-4 animate-fade-in lg:hidden z-40 bg-dark-card/95 shadow-2xl">
          {/* Navigation Items */}
          <div className="flex flex-col space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/30'
                      : 'text-dark-muted hover:text-dark-text hover:bg-dark-border/40 border border-transparent'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* User Details & Action rows */}
          <div className="border-t border-dark-border pt-4 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              {/* User info */}
              <button
                onClick={() => {
                  setActiveTab('profile');
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center space-x-3 text-left bg-transparent border-none p-0 cursor-pointer focus:outline-none"
              >
                <div className="bg-indigo-600/10 p-2.5 rounded-full border border-indigo-500/20">
                  <User className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-dark-text">{user?.username || 'Operator'}</p>
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono uppercase bg-dark-card border border-dark-border text-dark-muted font-bold">
                    {user?.role || 'Staff'}
                  </span>
                </div>
              </button>

              {/* Utility actions side-by-side */}
              <div className="flex items-center space-x-2">
                {/* Profile settings button */}
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-dark-muted hover:text-indigo-400 bg-dark-card border border-dark-border p-2.5 rounded-lg cursor-pointer"
                  title="Account Settings"
                >
                  <Settings className="h-4 w-4" />
                </button>
                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="text-dark-muted hover:text-brand-danger bg-dark-card hover:bg-brand-danger/10 border border-dark-border p-2.5 rounded-lg cursor-pointer"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Language Selection */}
            <div className="relative flex items-center bg-dark-card border border-dark-border px-3.5 py-2.5 rounded-lg text-xs text-dark-muted justify-between">
              <span className="flex items-center font-bold">
                <Globe className="h-4 w-4 mr-2 text-indigo-400" /> Language / Idioma
              </span>
              <select
                value={currentLanguage}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-dark-text border-none focus:outline-none cursor-pointer font-bold text-xs"
              >
                <option value="en" className="bg-dark-card text-dark-text">EN (English)</option>
                <option value="es" className="bg-dark-card text-dark-text">ES (Español)</option>
                <option value="hi" className="bg-dark-card text-dark-text">HI (हिन्दी)</option>
                <option value="fr" className="bg-dark-card text-dark-text">FR (Français)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
