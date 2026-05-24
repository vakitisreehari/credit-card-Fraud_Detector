import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { Cpu, RefreshCw, AlertTriangle, ShieldCheck, Activity, TrendingUp } from 'lucide-react';
import { useTranslation } from '../utils/i18n';

// Static curves data for beautiful high-fidelity representation of champion models
const ROC_CURVE_DATA = [
  { fpr: 0, tpr: 0 },
  { fpr: 0.05, tpr: 0.65 },
  { fpr: 0.08, tpr: 0.85 },
  { fpr: 0.12, tpr: 0.92 },
  { fpr: 0.18, tpr: 0.96 },
  { fpr: 0.30, tpr: 0.98 },
  { fpr: 0.50, tpr: 0.99 },
  { fpr: 1.0, tpr: 1.0 }
];

const PR_CURVE_DATA = [
  { recall: 0, precision: 1.0 },
  { recall: 0.2, precision: 0.98 },
  { recall: 0.5, precision: 0.96 },
  { recall: 0.7, precision: 0.94 },
  { recall: 0.85, precision: 0.91 },
  { recall: 0.92, precision: 0.86 },
  { recall: 0.96, precision: 0.72 },
  { recall: 1.0, precision: 0.50 }
];

const CONFUSION_MATRIX = {
  tp: 92,  // True Positives (Flagged & Verified Fraud)
  fn: 8,   // False Negatives (Missed Fraud / Chargebacks)
  fp: 5,   // False Positives (Blocked Legit / Customer Friction)
  tn: 895  // True Negatives (Correctly Approved Legit)
};

const ModelAnalytics = () => {
  const { t } = useTranslation();
  const [monitoringStatus, setMonitoringStatus] = useState('NORMAL'); // 'NORMAL' | 'WARNING'
  const [driftMetrics, setDriftMetrics] = useState({
    avgAmount: 48.50,
    amountZScore: 0.42,
    avgVelocity: 1.15,
    velocityZScore: 0.35
  });
  
  const [loadingRetrain, setLoadingRetrain] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  // Simulate concept drift checking after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      // Trigger a drift warning simulation (representing a sudden shift in customer velocity/spend)
      setMonitoringStatus('WARNING');
      setDriftMetrics({
        avgAmount: 184.20,
        amountZScore: 5.37,
        avgVelocity: 4.80,
        velocityZScore: 4.50
      });
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  const triggerRetrain = () => {
    setLoadingRetrain(true);
    setRetrainSuccess(false);
    
    // Simulate training process
    setTimeout(() => {
      setLoadingRetrain(false);
      setRetrainSuccess(true);
      setMonitoringStatus('NORMAL');
      setDriftMetrics({
        avgAmount: 51.10,
        amountZScore: 0.04,
        avgVelocity: 1.25,
        velocityZScore: 0.06
      });
      // Clear success notification
      setTimeout(() => setRetrainSuccess(false), 3000);
    }, 2000);
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 text-dark-text">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Model Analytics & Drift</h1>
          <p className="text-dark-muted text-sm mt-1">Real-time machine learning monitoring, ROC curves, and adaptive retraining triggers.</p>
        </div>
        
        {/* Retrain Controller Button */}
        <button
          onClick={triggerRetrain}
          disabled={loadingRetrain}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center space-x-2 shrink-0 transition-all"
        >
          <RefreshCw className={`h-4 w-4 ${loadingRetrain ? 'animate-spin' : ''}`} />
          <span>{loadingRetrain ? 'Retraining Champion...' : 'Force Model Retrain'}</span>
        </button>
      </div>

      {retrainSuccess && (
        <div className="bg-brand-success/15 border border-brand-success/20 text-brand-success p-4 rounded-xl text-xs flex items-center space-x-2 animate-slide-in">
          <ShieldCheck className="h-5 w-5" />
          <span>Model retrained successfully. Concept Drift metrics resolved to normal baselines. New model hot-loaded!</span>
        </div>
      )}

      {/* Concept Drift Alerts Panel */}
      <div className={`glass p-6 rounded-2xl border transition-all duration-300 ${monitoringStatus === 'WARNING' ? 'border-brand-warning/40 bg-brand-warning/5' : 'border-dark-border'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-dark-muted tracking-widest uppercase block font-mono">MLOps Monitoring</span>
            <div className="flex items-center space-x-2">
              {monitoringStatus === 'WARNING' ? (
                <>
                  <AlertTriangle className="h-5 w-5 text-brand-warning animate-bounce" />
                  <h3 className="text-md font-bold text-brand-warning">Warning: Severe Concept Drift Detected</h3>
                </>
              ) : (
                <>
                  <ShieldCheck className="h-5 w-5 text-brand-success animate-pulse-glow" />
                  <h3 className="text-md font-bold text-brand-success">Champion Model Healthy & Stable</h3>
                </>
              )}
            </div>
            <p className="text-xs text-dark-muted leading-relaxed">
              {monitoringStatus === 'WARNING' 
                ? 'Average transaction values and velocity signatures have surged beyond 3 standard deviations (Z > 2.0). Scheduled training pipeline is highly recommended.' 
                : 'Current transaction streams align within standard user distribution bounds. Feature stability index is optimal.'}
            </p>
          </div>

          {/* Current telemetry parameters */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 shrink-0 bg-dark-bg/40 p-4 rounded-xl border border-dark-border/40 text-xs">
            <div>
              <span className="text-dark-muted block uppercase text-[9px] font-mono tracking-wider mb-1">Avg Size</span>
              <span className={`font-bold ${monitoringStatus === 'WARNING' ? 'text-brand-warning' : 'text-white'}`}>
                ${driftMetrics.avgAmount.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-dark-muted block uppercase text-[9px] font-mono tracking-wider mb-1">Amt Z-Score</span>
              <span className={`font-bold ${monitoringStatus === 'WARNING' ? 'text-brand-warning' : 'text-brand-success'}`}>
                {driftMetrics.amountZScore.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-dark-muted block uppercase text-[9px] font-mono tracking-wider mb-1">Avg Velocity</span>
              <span className={`font-bold ${monitoringStatus === 'WARNING' ? 'text-brand-warning' : 'text-white'}`}>
                {driftMetrics.avgVelocity.toFixed(2)}/h
              </span>
            </div>
            <div>
              <span className="text-dark-muted block uppercase text-[9px] font-mono tracking-wider mb-1">Vel Z-Score</span>
              <span className={`font-bold ${monitoringStatus === 'WARNING' ? 'text-brand-warning' : 'text-brand-success'}`}>
                {driftMetrics.velocityZScore.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* ROC-AUC Area Chart */}
        <div className="glass rounded-2xl p-6 border border-dark-border space-y-4">
          <div className="flex justify-between items-center border-b border-dark-border/40 pb-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              ROC-AUC Performance Curve
            </span>
            <span className="text-xs text-brand-success font-bold font-mono">AUC: 0.975</span>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ROC_CURVE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="rocGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f293d" strokeDasharray="3 3" />
                <XAxis dataKey="fpr" name="FPR" stroke="#9ca3af" />
                <YAxis dataKey="tpr" name="TPR" stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1f293d' }} />
                <Area type="monotone" dataKey="tpr" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#rocGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-dark-muted leading-relaxed font-mono">Plots True Positive Rate (Sensitivity) vs False Positive Rate (1-Specificity). Optimal models lean top-left.</p>
        </div>

        {/* Precision-Recall Chart */}
        <div className="glass rounded-2xl p-6 border border-dark-border space-y-4">
          <div className="flex justify-between items-center border-b border-dark-border/40 pb-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Precision-Recall Curve
            </span>
            <span className="text-xs text-brand-success font-bold font-mono">F1-Max: 0.932</span>
          </div>
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PR_CURVE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="prGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1f293d" strokeDasharray="3 3" />
                <XAxis dataKey="recall" name="Recall" stroke="#9ca3af" />
                <YAxis dataKey="precision" name="Precision" stroke="#9ca3af" />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#1f293d' }} />
                <Area type="monotone" dataKey="precision" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#prGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[11px] text-dark-muted leading-relaxed font-mono">Measures class accuracy on rare target datasets. F1 represents standard balanced metrics balance.</p>
        </div>

        {/* Confusion Matrix Dashboard */}
        <div className="glass rounded-2xl p-6 border border-dark-border space-y-4">
          <div className="flex justify-between items-center border-b border-dark-border/40 pb-3">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center">
              <Cpu className="h-4 w-4 mr-2" />
              Confusion Matrix
            </span>
            <span className="text-xs text-brand-success font-bold font-mono">Total scored: 1000</span>
          </div>
          
          {/* Visual Confusion Matrix Block */}
          <div className="grid grid-cols-2 gap-3 text-center text-xs pt-2">
            {/* True Negative */}
            <div className="bg-emerald-950/15 border border-emerald-500/20 p-4 rounded-xl space-y-1">
              <span className="text-emerald-400 font-bold block text-[10px] font-mono">True Negative (TN)</span>
              <h3 className="text-2xl font-black text-white">{CONFUSION_MATRIX.tn}</h3>
              <span className="text-[9px] text-dark-muted block">Correctly Approved</span>
            </div>
            
            {/* False Positive */}
            <div className="bg-red-950/10 border border-red-500/10 p-4 rounded-xl space-y-1">
              <span className="text-brand-danger/80 font-bold block text-[10px] font-mono">False Positive (FP)</span>
              <h3 className="text-2xl font-black text-brand-danger/90">{CONFUSION_MATRIX.fp}</h3>
              <span className="text-[9px] text-dark-muted block">Blocked Legit (Friction)</span>
            </div>
            
            {/* False Negative */}
            <div className="bg-red-950/10 border border-red-500/10 p-4 rounded-xl space-y-1">
              <span className="text-brand-danger/80 font-bold block text-[10px] font-mono">False Negative (FN)</span>
              <h3 className="text-2xl font-black text-brand-danger/90">{CONFUSION_MATRIX.fn}</h3>
              <span className="text-[9px] text-dark-muted block">Missed Fraud (Chargeback)</span>
            </div>

            {/* True Positive */}
            <div className="bg-emerald-950/15 border border-emerald-500/20 p-4 rounded-xl space-y-1">
              <span className="text-emerald-400 font-bold block text-[10px] font-mono">True Positive (TP)</span>
              <h3 className="text-2xl font-black text-white">{CONFUSION_MATRIX.tp}</h3>
              <span className="text-[9px] text-dark-muted block">Correctly Flagged</span>
            </div>
          </div>
          
          <p className="text-[11px] text-dark-muted leading-relaxed font-mono">Confusion matrices outline exact predictions vs actual labels, confirming performance on target cases.</p>
        </div>

      </div>
    </div>
  );
};

export default ModelAnalytics;
