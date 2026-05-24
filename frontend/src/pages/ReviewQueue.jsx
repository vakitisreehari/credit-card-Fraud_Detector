import React, { useState, useEffect } from 'react';
import { getTransactions, updateTransactionStatus } from '../utils/api';
import { ShieldCheck, X, Clock, AlertTriangle, Inbox, Check, Shield, Lock, Fingerprint, Loader2 } from 'lucide-react';

const DigiLockerIcon = (props) => (
  <svg viewBox="0 0 24 24" width="24" height="24" {...props}>
    {/* Saffron banner */}
    <path d="M4 4h16v3H4z" fill="#FF9933" />
    {/* White banner */}
    <path d="M4 7h16v3H4z" fill="#FFFFFF" />
    {/* Green banner */}
    <path d="M4 10h16v3H4z" fill="#138808" />
    {/* Ashoka Chakra circle */}
    <circle cx="12" cy="8.5" r="1.2" fill="#000080" />
    {/* Shield structure representing documents and security */}
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="#1e3a8a" opacity="0.85" />
    <path d="M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-1 9V9l3 3-3 3z" fill="#3b82f6" />
  </svg>
);

const ReviewQueue = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({}); // mapping txId -> seconds left
  
  // DigiLocker Verification States
  const [verifiedTxs, setVerifiedTxs] = useState({}); // txId -> { name, aadhaar, pan }
  const [activeVerificationTx, setActiveVerificationTx] = useState(null);
  const [verificationStep, setVerificationStep] = useState(0); // 0: loading/scanning, 1: showing verified docs
  const [verificationProgress, setVerificationProgress] = useState('');
  const [scanPercentage, setScanPercentage] = useState(0);

  const startVerification = (tx) => {
    setActiveVerificationTx(tx);
    setVerificationStep(0);
    setScanPercentage(0);
    setVerificationProgress('Establishing secure tunnel to UIDAI & Income Tax servers...');

    const timeline = [
      { percentage: 20, text: 'Querying DigiLocker government document vault...' },
      { percentage: 50, text: 'Redirecting to real DigiLocker portal for digital authorization...' },
      { percentage: 80, text: 'Decrypting official Aadhaar & PAN registries...' },
      { percentage: 95, text: 'Executing biometric facematch verification...' },
      { percentage: 100, text: 'Verified successfully!' }
    ];

    timeline.forEach((item) => {
      setTimeout(() => {
        setScanPercentage(item.percentage);
        setVerificationProgress(item.text);
        
        // Real-time Government Redirect Hook
        if (item.percentage === 50) {
          window.open(`http://localhost:8080/digilocker.html?cardholderName=${encodeURIComponent(tx.cardholderName)}&cardNumber=${encodeURIComponent(tx.cardNumber)}&amount=${encodeURIComponent(tx.amount)}&merchant=${encodeURIComponent(tx.merchant || 'Retail Store')}`, '_blank');
        }

        if (item.percentage === 100) {
          setTimeout(() => {
            const initials = tx.cardholderName.split(' ').map(n => n[0]).join('').toUpperCase();
            const panMock = `${initials}PC${Math.floor(1000 + Math.random() * 9000)}R`;
            const aadhaarMock = `XXXX-XXXX-${Math.floor(1000 + Math.random() * 9000)}`;
            
            setVerifiedTxs(prev => ({
              ...prev,
              [tx._id]: {
                name: tx.cardholderName,
                aadhaar: aadhaarMock,
                pan: panMock
              }
            }));
            setVerificationStep(1);
          }, 400);
        }
      }, item.percentage * 15); // ~1.5s verification
    });
  };

  const fetchFlaggedTransactions = async () => {
    try {
      setLoading(true);
      const response = await getTransactions({ status: 'PENDING_REVIEW' });
      const txs = response.data.transactions || [];
      setTransactions(txs);
      
      // Initialize SLA timers for new items (5 minutes = 300 seconds)
      const newTimers = {};
      txs.forEach(tx => {
        // Calculate remaining seconds from transaction creation date
        const elapsedSeconds = Math.floor((Date.now() - new Date(tx.createdAt).getTime()) / 1000);
        const remaining = Math.max(0, 300 - elapsedSeconds);
        newTimers[tx._id] = remaining;
      });
      setTimers(newTimers);
    } catch (e) {
      console.error("Failed to load review queue", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedTransactions();
  }, []);

  // Countdown timer tick effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prevTimers => {
        const updated = { ...prevTimers };
        let changed = false;
        
        Object.keys(updated).forEach(id => {
          if (updated[id] > 0) {
            updated[id] -= 1;
            changed = true;
          }
        });
        
        return changed ? updated : prevTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [transactions]);

  const handleResolve = async (id, status) => {
    try {
      await updateTransactionStatus(id, status);
      // Remove from visual queue list
      setTransactions(prev => prev.filter(tx => tx._id !== id));
    } catch (err) {
      alert("Failed to resolve transaction. Server error.");
    }
  };

  const formatTimer = (seconds) => {
    if (seconds <= 0) return '00:00 (SLA Violated)';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getTimerColorClass = (seconds) => {
    if (seconds <= 60) return 'text-brand-danger bg-brand-danger/10 border-brand-danger/20'; // under 1 minute
    if (seconds <= 180) return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20'; // under 3 minutes
    return 'text-indigo-400 bg-indigo-950/20 border-indigo-500/20';
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 text-dark-text">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Manual Review Inbox</h1>
        <p className="text-dark-muted text-sm mt-1">Review and resolve flagged transactions before the 5-minute Service Level Agreement (SLA) expires.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Clock className="h-8 w-8 text-indigo-400 animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="glass p-12 rounded-2xl border border-dark-border text-center max-w-lg mx-auto space-y-3">
          <Inbox className="h-10 w-10 text-dark-muted/40 mx-auto" />
          <h3 className="font-bold text-md">Your review queue is empty</h3>
          <p className="text-xs text-dark-muted leading-relaxed">Excellent work! No flagged transactions are awaiting manual resolution. Run medium-risk simulator presets to trigger more reviews.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {transactions.map((tx) => {
            const secondsLeft = timers[tx._id] || 300;
            return (
              <div key={tx._id} className="glass rounded-2xl p-5 border border-dark-border flex flex-col justify-between space-y-4 hover:border-indigo-500/30 transition-all duration-300 relative">
                
                {/* Timer Badge */}
                <div className={`absolute top-4 right-4 text-[11px] font-mono font-bold px-2.5 py-1 rounded-full border flex items-center space-x-1.5 ${getTimerColorClass(secondsLeft)}`}>
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatTimer(secondsLeft)}</span>
                </div>

                {/* Cardholder details */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-dark-muted uppercase tracking-wider block font-mono">Flagged Transaction</span>
                  <h3 className="text-md font-bold text-dark-text leading-tight">{tx.cardholderName}</h3>
                  <p className="text-xs text-dark-muted">{tx.merchant} • {tx.merchantCategory || 'Retail'}</p>
                </div>

                {/* Billing details */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-dark-bg/40 p-3.5 rounded-xl border border-dark-border/40 font-mono">
                  <div>
                    <span className="text-dark-muted block text-[9px] uppercase tracking-wider mb-0.5">Amount</span>
                    <span className="font-bold text-dark-text">${tx.amount.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-dark-muted block text-[9px] uppercase tracking-wider mb-0.5">Card</span>
                    <span className="font-bold text-dark-text">{tx.cardNumber}</span>
                  </div>
                  <div>
                    <span className="text-dark-muted block text-[9px] uppercase tracking-wider mb-0.5">Risk Level</span>
                    <span className={`font-bold ${tx.riskScore >= 75 ? 'text-brand-danger' : 'text-brand-warning'}`}>
                      {tx.riskScore}%
                    </span>
                  </div>
                  <div>
                    <span className="text-dark-muted block text-[9px] uppercase tracking-wider mb-0.5">Geo Distance</span>
                    <span className="font-bold text-dark-text">{tx.distance_from_home || 0} km</span>
                  </div>
                </div>

                {/* Warnings list */}
                {tx.fraudPatternsTriggered && tx.fraudPatternsTriggered.length > 0 && (
                  <div className="bg-brand-warning/5 border border-brand-warning/10 rounded-xl p-3 text-[10.5px] leading-relaxed space-y-1">
                    <span className="font-bold text-brand-warning uppercase text-[9px] flex items-center font-mono tracking-wider">
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      Triggered Anomalies
                    </span>
                    {tx.fraudPatternsTriggered.map((warn, idx) => (
                      <p key={idx} className="text-brand-warning/80 font-mono">
                        • {warn}
                      </p>
                    ))}
                  </div>
                )}

                {/* DigiLocker Customer Verification Badge */}
                {verifiedTxs[tx._id] ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-3 text-[10.5px] leading-relaxed space-y-1.5 animate-scale-up">
                    <span className="font-extrabold text-emerald-400 uppercase text-[9px] flex items-center font-mono tracking-wider">
                      <Check className="h-4 w-4 mr-1 text-emerald-400 shrink-0" />
                      DigiLocker Govt. Verified Match
                    </span>
                    <div className="text-[10px] text-dark-muted font-mono space-y-0.5">
                      <p>• Aadhaar Holder: <span className="text-dark-text font-semibold">{verifiedTxs[tx._id].name}</span></p>
                      <p>• Aadhaar UIDAI: <span className="text-dark-text">{verifiedTxs[tx._id].aadhaar}</span></p>
                      <p>• PAN Card: <span className="text-dark-text">{verifiedTxs[tx._id].pan}</span></p>
                      <p>• Verification: <span className="text-emerald-400 font-bold">DIGITALLY SIGNED & AUTHORIZED</span></p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startVerification(tx)}
                    className="w-full bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 border border-emerald-500/25 font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1.5 font-mono focus:outline-none"
                  >
                    <DigiLockerIcon className="h-4 w-4 shrink-0" />
                    <span>Verify Customer Identity via DigiLocker</span>
                  </button>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => handleResolve(tx._id, 'BLOCKED')}
                    className="flex-1 bg-brand-danger/10 hover:bg-brand-danger/25 text-brand-danger border border-brand-danger/20 font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <X className="h-4 w-4" />
                    <span>Decline Block</span>
                  </button>

                  <button
                    onClick={() => handleResolve(tx._id, 'APPROVED')}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer flex items-center justify-center space-x-1"
                  >
                    <Check className="h-4 w-4" />
                    <span>Approve Funds</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MOCK DIGILOCKER GOVERNMENT VERIFICATION OVERLAY MODAL */}
      {activeVerificationTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-[480px] bg-slate-900 border-2 border-indigo-500/30 rounded-2xl shadow-2xl p-6 relative animate-scale-up">
            
            {/* Tricolor Government Border Top decoration */}
            <div className="absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl flex overflow-hidden">
              <div className="flex-1 h-full bg-[#FF9933]"></div>
              <div className="flex-1 h-full bg-[#FFFFFF]"></div>
              <div className="flex-1 h-full bg-[#138808]"></div>
            </div>

            <div className="flex justify-between items-center mb-6 pt-2">
              <div className="flex items-center space-x-2">
                <DigiLockerIcon className="h-5 w-5" />
                <span className="text-[10px] text-slate-400 font-bold font-mono tracking-wider uppercase">National DigiLocker Vault Gateway</span>
              </div>
              <button
                onClick={() => setActiveVerificationTx(null)}
                className="text-slate-400 hover:text-white text-sm focus:outline-none bg-transparent border-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {verificationStep === 0 ? (
              <div className="text-center py-6 space-y-6">
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-dashed border-emerald-500/30 rounded-full animate-spin-slow" />
                  <div className="absolute inset-2 border-2 border-emerald-500/10 rounded-full scale-105 animate-ping-slow" />
                  <Fingerprint className="h-16 w-16 text-emerald-400 animate-pulse" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-md font-bold text-white">Verifying Government Document Registry</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                    Requesting verified credentials for citizen <span className="text-indigo-400 font-bold">{activeVerificationTx.cardholderName}</span>...
                  </p>
                </div>

                <div className="space-y-2 max-w-xs mx-auto">
                  <div className="font-mono text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-900/50 py-2 px-3 rounded-lg flex items-center justify-center min-h-[36px]">
                    <Loader2 className="h-3 w-3 mr-2 animate-spin text-emerald-400 shrink-0" />
                    <span>{verificationProgress}</span>
                  </div>

                  <div className="w-full bg-slate-950 border border-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-full rounded-full transition-all duration-200" 
                      style={{ width: `${scanPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5 py-2">
                <div className="bg-emerald-950/20 border border-emerald-500/35 rounded-xl p-4.5 text-center flex flex-col items-center justify-center space-y-2">
                  <Check className="h-8 w-8 text-emerald-400 bg-emerald-500/10 p-1.5 border border-emerald-500/25 rounded-full" />
                  <h3 className="text-sm font-extrabold text-emerald-400 tracking-wide uppercase">Identity Verification Successful</h3>
                  <p className="text-[11px] text-slate-400">All requested documents match successfully with UIDAI and Income Tax databases.</p>
                </div>

                <div className="space-y-3.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-mono">Digitally Signed Credentials Fetched:</span>
                  
                  {/* Aadhaar card mock */}
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-2 text-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#FF9933]/15 text-[#FF9933] border-l border-b border-slate-700/40 px-2 py-0.5 rounded-bl font-mono text-[9px] uppercase font-bold">Aadhaar</div>
                    <div className="grid grid-cols-2 gap-y-2">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono tracking-wider">Full Name:</span>
                        <span className="font-bold text-white text-[11px]">{verifiedTxs[activeVerificationTx._id]?.name}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono tracking-wider">Aadhaar UIDAI:</span>
                        <span className="font-mono text-white text-[11px]">{verifiedTxs[activeVerificationTx._id]?.aadhaar}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono tracking-wider">Verification Authority:</span>
                        <span className="font-bold text-emerald-400 text-[10px]">Govt. of India</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono tracking-wider">Status:</span>
                        <span className="font-bold text-emerald-400 text-[10px]">✓ Verified Secure</span>
                      </div>
                    </div>
                  </div>

                  {/* PAN card mock */}
                  <div className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-2 text-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-[#138808]/15 text-[#138808] border-l border-b border-slate-700/40 px-2 py-0.5 rounded-bl font-mono text-[9px] uppercase font-bold">Income Tax</div>
                    <div className="grid grid-cols-2 gap-y-2">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono tracking-wider">PAN Holder Name:</span>
                        <span className="font-bold text-white text-[11px]">{verifiedTxs[activeVerificationTx._id]?.name.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono tracking-wider">PAN Card Index:</span>
                        <span className="font-mono text-white text-[11px]">{verifiedTxs[activeVerificationTx._id]?.pan}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono tracking-wider">Facematch Score:</span>
                        <span className="font-bold text-emerald-400 text-[10px]">99.4% Facematch</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block font-mono tracking-wider">Verification Hash:</span>
                        <span className="font-mono text-slate-400 text-[9px]">DS_HASH_M4562A</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setActiveVerificationTx(null)}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer text-center border-none"
                  >
                    Confirm & Apply Document Verification
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
