import React from 'react';
import { ShieldAlert, Home, LayoutDashboard } from 'lucide-react';

const NotFound = ({ onGoHome }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4 space-y-8">
      <div className="relative">
        <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-3xl scale-150 pointer-events-none" />
        <div className="relative bg-dark-card border border-dark-border p-8 rounded-3xl">
          <ShieldAlert className="h-20 w-20 text-indigo-500/60 mx-auto mb-4" />
          <h1 className="text-7xl font-black text-white tracking-tight">404</h1>
          <p className="text-dark-muted text-sm mt-1 font-mono uppercase tracking-widest">Page Not Found</p>
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-xl font-bold text-white">Route Not Detected</h2>
        <p className="text-dark-muted text-sm">
          The page you're looking for doesn't exist in the FraudShield dashboard.
        </p>
      </div>

      <button
        onClick={onGoHome}
        className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
      >
        <LayoutDashboard className="h-4 w-4" />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
};

export default NotFound;
