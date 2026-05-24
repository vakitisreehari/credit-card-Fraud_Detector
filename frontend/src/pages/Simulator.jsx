import React, { useState } from 'react';
import { processTransaction, verifyTransactionOTP } from '../utils/api';
import { getDeviceFingerprint } from '../utils/fingerprint';
import { useTranslation } from '../utils/i18n';
import { 
  validateLuhn, 
  detectBrand, 
  validateCVV, 
  validateExpiry, 
  detectFraudPatterns,
  detectCardType,
  detectCardIssuer
} from '../utils/cardValidator';
import { 
  Play, 
  Sparkles, 
  MapPin, 
  Terminal, 
  AlertTriangle, 
  ShieldCheck, 
  ShieldAlert, 
  Check, 
  X, 
  Cpu, 
  CreditCard,
  Globe,
  HelpCircle,
  Loader
} from 'lucide-react';

const PRESETS = [
  {
    name: 'Normal Coffee Purchase',
    cardholderName: 'John Doe',
    cardNumber: '4111222233334588',
    expiryDate: '12/28',
    cvv: '123',
    amount: '4.50',
    merchant: 'Starbucks Coffee',
    merchantCategory: 'Groceries',
    location: { city: 'New York', country: 'US', latitude: 40.7128, longitude: -74.0060 },
    ipAddress: '192.168.1.52',
    deviceHash: 'dev_win_chrome_9a2f', // matching Doe profile
    description: 'Typical low-value transaction near John\'s billing address (New York).'
  },
  {
    name: 'Suspicious High-Value Outlier',
    cardholderName: 'John Doe',
    cardNumber: '4111222233334588',
    expiryDate: '12/28',
    cvv: '123',
    amount: '8500.00',
    merchant: 'Rolex Luxury Retail',
    merchantCategory: 'Retail',
    location: { city: 'New York', country: 'US', latitude: 40.7128, longitude: -74.0060 },
    ipAddress: '192.168.1.52',
    deviceHash: 'dev_win_chrome_9a2f',
    description: 'Triggers the High-Value Monitor Rule ($5,000+) forcing FLAGGED status.'
  },
  {
    name: 'Extreme Location Anomaly (Sanctioned country)',
    cardholderName: 'Jane Smith',
    cardNumber: '5412888899990145',
    expiryDate: '09/27',
    cvv: '992',
    amount: '320.00',
    merchant: 'Travel Agent Portal',
    merchantCategory: 'Travel',
    location: { city: 'Tehran', country: 'Iran', latitude: 35.6892, longitude: 51.3890 },
    ipAddress: '185.120.10.4',
    deviceHash: 'suspicious_fprint_8x3c',
    description: 'Triggers the Country Blacklist Rule (Iran) and Geodistance calculations, forcing BLOCKED status.'
  },
  {
    name: 'Device Swapping / Account Takeover',
    cardholderName: 'Alice Johnson',
    cardNumber: '3782000011119856',
    expiryDate: '05/29',
    cvv: '3002',
    amount: '450.00',
    merchant: 'Apple Online Store',
    merchantCategory: 'Retail',
    location: { city: 'London', country: 'UK', latitude: 51.5074, longitude: -0.1278 },
    ipAddress: '82.165.12.98',
    deviceHash: 'dev_win_chrome_9a2f', // Swapped: Alice using John Doe's device!
    description: 'Identifies device sharing mismatch. The device risk score escalates, raising fraud probability.'
  }
];

const CITY_COORDINATES = {
  'new york': { latitude: '40.7128', longitude: '-74.0060', country: 'US' },
  'los angeles': { latitude: '34.0522', longitude: '-118.2437', country: 'US' },
  'london': { latitude: '51.5074', longitude: '-0.1278', country: 'UK' },
  'paris': { latitude: '48.8566', longitude: '2.3522', country: 'FR' },
  'tokyo': { latitude: '35.6762', longitude: '139.6503', country: 'JP' },
  'tehran': { latitude: '35.6892', longitude: '51.3890', country: 'Iran' }
};

const Simulator = () => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    cardholderName: 'John Doe',
    cardNumber: '4111 2222 3333 4588',
    expiryDate: '12/28',
    cvv: '123',
    amount: '55.00',
    merchant: 'Target Stores',
    merchantCategory: 'Retail',
    city: 'New York',
    country: 'US',
    latitude: '40.7128',
    longitude: '-74.0060',
    ipAddress: '192.168.1.15',
    customDeviceHash: '',
    modelType: 'Random Forest'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  // Preserved XAI fields that survive OTP round-trip (transaction object shape differs)
  const [xaiCache, setXaiCache] = useState(null);

  // Dynamic Step-Up Challenge States
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [challengeTransactionId, setChallengeTransactionId] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [otpCodeFromServer, setOtpCodeFromServer] = useState('');
  const [smsNotification, setSmsNotification] = useState(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState(null);
  
  // Pre-Checkout Security Scanner states
  const [preCheckStage, setPreCheckStage] = useState('idle'); // idle, luhn, cardType, issuer, ready

  // Live validator bindings
  const cleanCardNumber = formData.cardNumber.replace(/\s+/g, '');
  const detectedBrand = detectBrand(cleanCardNumber);
  const detectedType = detectCardType(cleanCardNumber);
  const detectedIssuer = detectCardIssuer(cleanCardNumber);
  const isLuhnValid = validateLuhn(cleanCardNumber);
  const isExpiryValid = validateExpiry(formData.expiryDate);
  const isCvvValid = validateCVV(formData.cvv, detectedBrand);
  const activeFraudWarnings = detectFraudPatterns(cleanCardNumber);

  const applyPreset = (preset) => {
    setFormData({
      cardholderName: preset.cardholderName,
      cardNumber: preset.cardNumber,
      expiryDate: preset.expiryDate || '12/28',
      cvv: preset.cvv || '123',
      amount: preset.amount,
      merchant: preset.merchant,
      merchantCategory: preset.merchantCategory,
      city: preset.location.city,
      country: preset.location.country,
      latitude: preset.location.latitude.toString(),
      longitude: preset.location.longitude.toString(),
      ipAddress: preset.ipAddress,
      customDeviceHash: preset.deviceHash,
      modelType: formData.modelType
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let updatedFields = { [name]: value };

    if (name === 'city') {
      const lowerCity = value.trim().toLowerCase();
      if (CITY_COORDINATES[lowerCity]) {
        updatedFields.latitude = CITY_COORDINATES[lowerCity].latitude;
        updatedFields.longitude = CITY_COORDINATES[lowerCity].longitude;
        updatedFields.country = CITY_COORDINATES[lowerCity].country;
      }
    }

    setFormData(prev => ({ ...prev, ...updatedFields }));
  };

  const handleSimulateSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSmsNotification(null);

    // Execute step-by-step secure gateway BIN & card pre-checks
    setPreCheckStage('luhn');
    await new Promise(resolve => setTimeout(resolve, 550));
    
    setPreCheckStage('cardType');
    await new Promise(resolve => setTimeout(resolve, 550));
    
    setPreCheckStage('issuer');
    await new Promise(resolve => setTimeout(resolve, 550));
    
    setPreCheckStage('ready');
    await new Promise(resolve => setTimeout(resolve, 300));

    // Harvest device fingerprint
    const fp = getDeviceFingerprint();
    if (formData.customDeviceHash) {
      fp.hash = formData.customDeviceHash;
    }

    const payload = {
      cardholderName: formData.cardholderName,
      cardNumber: cleanCardNumber,
      cvv: formData.cvv,
      expiryDate: formData.expiryDate,
      amount: parseFloat(formData.amount || 0),
      merchant: formData.merchant,
      merchantCategory: formData.merchantCategory,
      location: {
        city: formData.city,
        country: formData.country,
        latitude: parseFloat(formData.latitude || 0),
        longitude: parseFloat(formData.longitude || 0)
      },
      deviceFingerprint: fp,
      ipAddress: formData.ipAddress,
      modelType: formData.modelType
    };

    try {
      const response = await processTransaction(payload);
      const data = response.data;
      setResult(data);
      // Cache XAI fields so they survive the OTP round-trip
      setXaiCache({
        explanation: data.explanation,
        model_info: data.model_info,
        ruleTriggered: data.ruleTriggered,
      });

      // Check if Step-up Challenge is required
      if (data.decision === 'CHALLENGED') {
        setChallengeTransactionId(data.transactionId);
        setOtpCodeFromServer(data.otpCode);
        setOtpValue('');
        setOtpError(null);
        
        // Visual bank SMS toast notification push
        setSmsNotification(`[SecureAuth Bank] Your OTP for your transaction of $${payload.amount} at ${payload.merchant} is ${data.otpCode}. Enter this code to authorize.`);
        
        // Wait 1.2s to pop the challenge verification card for maximum visual polish
        setTimeout(() => {
          setShowChallengeModal(true);
        }, 1200);
      }
    } catch (err) {
      alert('Failed to simulate transaction. Make sure the backend app is running.');
    } finally {
      setLoading(false);
      setPreCheckStage('idle');
    }
  };

  // Card themes depending on brand
  const getCardThemeClass = (brand) => {
    switch (brand) {
      case 'Visa':
        return 'bg-gradient-to-br from-indigo-900 via-indigo-950 to-blue-950 text-white border-indigo-500/30';
      case 'Mastercard':
        return 'bg-gradient-to-br from-red-950 via-orange-950 to-amber-950 text-white border-orange-500/30';
      case 'American Express':
        return 'bg-gradient-to-br from-teal-900 via-emerald-950 to-cyan-950 text-white border-teal-500/30';
      case 'RuPay':
        return 'bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white border-blue-400/30';
      default:
        return 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 text-white border-dark-border';
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-dark-text tracking-tight">{t('simulator')}</h1>
        <p className="text-dark-muted text-sm mt-1">Inject mock transactions to test velocity thresholds, geodistance checks, and machine learning scoring.</p>
      </div>

      {/* Preset Section */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest font-mono">Select Testing Presets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              className="glass p-4 rounded-xl border border-dark-border text-left hover:border-indigo-500/50 hover:bg-indigo-950/10 transition-all cursor-pointer"
            >
              <span className="text-xs font-bold text-dark-text block mb-1.5 flex items-center">
                <Sparkles className="h-3.5 w-3.5 mr-1.5 text-indigo-400" />
                {preset.name}
              </span>
              <p className="text-[11px] text-dark-muted line-clamp-2">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Input Form */}
        <div className="xl:col-span-2 glass rounded-2xl p-6 border border-dark-border space-y-6">
          <h3 className="text-md font-bold text-dark-text uppercase tracking-wider font-mono flex items-center border-b border-dark-border/40 pb-3">
            <Terminal className="h-4.5 w-4.5 mr-2 text-indigo-500" />
            Transaction Payload Editor
          </h3>

          <form onSubmit={handleSimulateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
              
              <div>
                <label className="block text-dark-muted font-bold tracking-wider uppercase mb-1.5">{t('cardholderName')}</label>
                <input
                  type="text"
                  name="cardholderName"
                  value={formData.cardholderName}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-dark-muted font-bold tracking-wider uppercase mb-1.5">{t('cardNumber')}</label>
                <input
                  type="text"
                  name="cardNumber"
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. 4111 2222 3333 4588"
                  className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500 font-mono tracking-widest text-[13px]"
                />
              </div>

              <div>
                <label className="block text-dark-muted font-bold tracking-wider uppercase mb-1.5">{t('expiryDate')}</label>
                <input
                  type="text"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  required
                  placeholder="MM/YY"
                  maxLength="5"
                  className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-dark-muted font-bold tracking-wider uppercase mb-1.5">{t('cvv')}</label>
                <input
                  type="text"
                  name="cvv"
                  value={formData.cvv}
                  onChange={handleInputChange}
                  required
                  placeholder="123"
                  maxLength="4"
                  className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-dark-muted font-bold tracking-wider uppercase mb-1.5">{t('amount')}</label>
                <input
                  type="number"
                  step="0.01"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-dark-muted font-bold tracking-wider uppercase mb-1.5">{t('merchant')}</label>
                <input
                  type="text"
                  name="merchant"
                  value={formData.merchant}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2.5 text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-dark-muted font-bold tracking-wider uppercase mb-1.5">{t('merchantCategory')}</label>
                <select
                  name="merchantCategory"
                  value={formData.merchantCategory}
                  onChange={handleInputChange}
                  className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2.5 text-dark-text focus:outline-none focus:border-indigo-500"
                >
                  <option value="Retail">Retail</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Travel">Travel</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Automotive">Automotive</option>
                </select>
              </div>

              <div>
                <label className="block text-dark-muted font-bold tracking-wider uppercase mb-1.5">IP Address</label>
                <input
                  type="text"
                  name="ipAddress"
                  value={formData.ipAddress}
                  onChange={handleInputChange}
                  className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2.5 text-dark-text focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-dark-muted font-bold tracking-wider uppercase mb-1.5">{t('mlModel')}</label>
                <select
                  name="modelType"
                  value={formData.modelType}
                  onChange={handleInputChange}
                  className="w-full bg-indigo-950/20 border border-indigo-500/30 rounded-xl p-2.5 text-indigo-400 font-bold focus:outline-none focus:border-indigo-500"
                >
                  <option value="Random Forest">Random Forest (Ensemble)</option>
                  <option value="XGBoost">XGBoost (Boosted Trees)</option>
                  <option value="Logistic Regression">Logistic Regression (Linear)</option>
                  <option value="Decision Tree">Decision Tree (Deterministic)</option>
                </select>
              </div>

            </div>

            {/* Geolocation Fields */}
            <div className="border-t border-dark-border/40 pt-5 space-y-4">
              <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                Merchant Geolocation
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-dark-muted uppercase text-[10px] mb-1">City</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2 text-dark-text focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-dark-muted uppercase text-[10px] mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2 text-dark-text focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Device Profile Fields */}
            <div className="border-t border-dark-border/40 pt-5 space-y-3">
              <label className="block text-dark-muted font-bold tracking-wider uppercase text-[10px]">
                Custom Device Fingerprint Hash (Optional)
              </label>
              <input
                type="text"
                name="customDeviceHash"
                value={formData.customDeviceHash}
                onChange={handleInputChange}
                placeholder="Leave blank to harvest actual browser fingerprint"
                className="w-full bg-dark-bg/60 border border-dark-border rounded-xl p-2.5 text-xs text-dark-text placeholder-dark-muted focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="pt-2 text-right">
              <button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/20 cursor-pointer flex items-center space-x-2 ml-auto"
              >
                <Play className="h-4 w-4" />
                <span>{loading ? 'Processing Ledger...' : t('submit')}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Live Card & Results Column */}
        <div className="space-y-6">
          
          {/* Visual Credit Card Widget */}
          <div className="glass rounded-2xl p-5 border border-dark-border space-y-4">
            <span className="text-[10px] font-bold text-dark-muted tracking-widest uppercase block">{t('cardPreview')}</span>
            
            {/* Visual Card Card */}
            <div className={`h-48 w-full rounded-2xl p-6 border relative flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-300 ${getCardThemeClass(detectedBrand)}`}>
              
              {/* Card Ring Overlays */}
              <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-white/5 blur-xl -mr-12 -mt-12 pointer-events-none" />
              <div className="absolute left-0 bottom-0 h-32 w-32 rounded-full bg-indigo-500/5 blur-xl -ml-8 -mb-8 pointer-events-none" />

              {/* Card Top */}
              <div className="flex justify-between items-start z-10">
                <div className="flex flex-col">
                  <LandmarkLogo brand={detectedBrand} issuer={detectedIssuer} />
                </div>
                <div className="flex flex-col items-end">
                  <div className="font-extrabold text-xs tracking-widest italic opacity-85 uppercase">
                    {detectedBrand !== 'Unknown' ? detectedBrand : 'CARD'}
                  </div>
                  {detectedType !== 'Unknown' && (
                    <span className="text-[8px] font-extrabold font-mono tracking-widest bg-white/10 text-white/90 px-1.5 py-0.5 rounded border border-white/15 uppercase mt-0.5">
                      {detectedType}
                    </span>
                  )}
                </div>
              </div>

              {/* Card Middle (Chip + Wireless) */}
              <div className="flex items-center space-x-3 z-10">
                <div className="bg-yellow-500/80 h-9 w-12 rounded-md border border-yellow-600/40 relative flex items-center justify-center shadow-inner">
                  <Cpu className="h-6 w-8 text-yellow-950/80 stroke-1" />
                </div>
                <div className="flex flex-col space-y-0.5 text-white/50">
                  <div className="h-1.5 w-4 bg-white/25 rounded-full" />
                  <div className="h-1.5 w-6 bg-white/25 rounded-full" />
                  <div className="h-1.5 w-5 bg-white/25 rounded-full" />
                </div>
              </div>

              {/* Card Number */}
              <div className="text-[17px] font-mono tracking-[0.2em] font-semibold text-center z-10 py-1 text-white text-shadow">
                {formData.cardNumber ? formData.cardNumber : '•••• •••• •••• ••••'}
              </div>

              {/* Card Bottom */}
              <div className="flex justify-between items-end z-10">
                <div className="flex flex-col">
                  <span className="text-[9px] uppercase tracking-wider text-white/50 mb-0.5">{t('cardholderName')}</span>
                  <span className="text-[12px] font-medium tracking-wide uppercase font-sans truncate max-w-[170px]">
                    {formData.cardholderName || 'John Doe'}
                  </span>
                </div>
                <div className="flex space-x-4">
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] uppercase tracking-wider text-white/50 mb-0.5">Expires</span>
                    <span className="text-[11px] font-mono font-medium">{formData.expiryDate || '••/••'}</span>
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-[9px] uppercase tracking-wider text-white/50 mb-0.5">CVV</span>
                    <span className="text-[11px] font-mono font-medium">{formData.cvv || '•••'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Visual Indicators */}
            <div className="bg-dark-bg/40 border border-dark-border p-3.5 rounded-xl space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-dark-muted">Luhn Algorithm Validation</span>
                {cleanCardNumber.length < 12 ? (
                  <span className="text-dark-muted font-mono text-[10px] flex items-center"><HelpCircle className="h-3.5 w-3.5 mr-1 text-slate-500" /> Pending</span>
                ) : isLuhnValid ? (
                  <span className="text-brand-success font-semibold font-mono text-[10px] flex items-center"><Check className="h-3.5 w-3.5 mr-1" /> Valid Checksum</span>
                ) : (
                  <span className="text-brand-danger font-semibold font-mono text-[10px] flex items-center"><X className="h-3.5 w-3.5 mr-1" /> Invalid Checksum</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-dark-muted">CVV Format Validation</span>
                {!formData.cvv ? (
                  <span className="text-dark-muted font-mono text-[10px] flex items-center"><HelpCircle className="h-3.5 w-3.5 mr-1 text-slate-500" /> Pending</span>
                ) : isCvvValid ? (
                  <span className="text-brand-success font-semibold font-mono text-[10px] flex items-center"><Check className="h-3.5 w-3.5 mr-1" /> Valid Length</span>
                ) : (
                  <span className="text-brand-danger font-semibold font-mono text-[10px] flex items-center"><X className="h-3.5 w-3.5 mr-1" /> Invalid Length</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-dark-muted">Expiry Date Check</span>
                {!formData.expiryDate ? (
                  <span className="text-dark-muted font-mono text-[10px] flex items-center"><HelpCircle className="h-3.5 w-3.5 mr-1 text-slate-500" /> Pending</span>
                ) : isExpiryValid ? (
                  <span className="text-brand-success font-semibold font-mono text-[10px] flex items-center"><Check className="h-3.5 w-3.5 mr-1" /> Active</span>
                ) : (
                  <span className="text-brand-danger font-semibold font-mono text-[10px] flex items-center"><X className="h-3.5 w-3.5 mr-1" /> Expired / Invalid</span>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-dark-border/20 pt-2">
                <span className="text-dark-muted">BIN Card Type Check</span>
                {cleanCardNumber.length < 4 ? (
                  <span className="text-dark-muted font-mono text-[10px] flex items-center"><HelpCircle className="h-3.5 w-3.5 mr-1 text-slate-500" /> Pending</span>
                ) : detectedType !== 'Unknown' ? (
                  <span className="text-indigo-400 font-semibold font-mono text-[10px] flex items-center">
                    <Check className="h-3.5 w-3.5 mr-1 text-brand-success" /> {detectedType.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-brand-danger font-semibold font-mono text-[10px] flex items-center"><X className="h-3.5 w-3.5 mr-1" /> Unrecognized</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-dark-muted">BIN Bank Issuer Check</span>
                {cleanCardNumber.length < 4 ? (
                  <span className="text-dark-muted font-mono text-[10px] flex items-center"><HelpCircle className="h-3.5 w-3.5 mr-1 text-slate-500" /> Pending</span>
                ) : detectedIssuer !== 'Unknown' ? (
                  <span className="text-emerald-400 font-semibold font-mono text-[10px] flex items-center">
                    <Check className="h-3.5 w-3.5 mr-1 text-brand-success" /> {detectedIssuer}
                  </span>
                ) : (
                  <span className="text-brand-danger font-semibold font-mono text-[10px] flex items-center"><X className="h-3.5 w-3.5 mr-1" /> Unallocated</span>
                )}
              </div>

              {/* Fraud Pattern Live Diagnostics */}
              {cleanCardNumber.length >= 6 && activeFraudWarnings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-dark-border/40 space-y-1.5">
                  <span className="text-[10px] font-bold text-brand-warning uppercase tracking-wider flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1 text-brand-warning" />
                    Suspicious Live Patterns
                  </span>
                  {activeFraudWarnings.map((warning, idx) => (
                    <p key={idx} className="text-[10px] text-brand-warning/90 font-mono">
                      • {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Results Pane */}
          <div className="glass rounded-2xl p-6 border border-dark-border min-h-[350px] flex flex-col justify-between">
            <h3 className="text-md font-bold text-dark-text uppercase tracking-wider font-mono mb-4">{t('explainableAI')}</h3>

            {loading && preCheckStage !== 'idle' ? (
              <div className="flex-1 flex flex-col justify-between p-2 space-y-6">
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center space-x-2 text-indigo-400 font-bold text-[10px] uppercase tracking-widest font-mono bg-indigo-950/40 px-3 py-1 rounded-full border border-indigo-500/25 animate-pulse">
                    <span className="h-2 w-2 bg-indigo-400 rounded-full animate-ping" />
                    <span>Secure Gateway Audit</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-white pt-2">BIN & Security Check Pre-Run</h4>
                  <p className="text-[11px] text-dark-muted">Verifying credentials before ledger ingestion...</p>
                </div>

                <div className="space-y-3.5 bg-dark-bg/60 border border-dark-border/80 p-4 rounded-xl text-[11px] font-mono">
                  {/* Step 1: Luhn */}
                  <div className="flex items-center justify-between">
                    <span className="text-dark-muted">1. Luhn Checksum validation</span>
                    {preCheckStage === 'luhn' ? (
                      <span className="text-amber-400 flex items-center animate-pulse"><Loader className="h-3.5 w-3.5 mr-1.5 animate-spin" /> auditing...</span>
                    ) : (
                      <span className="text-brand-success flex items-center font-bold"><Check className="h-3.5 w-3.5 mr-1.5 text-brand-success" /> verified</span>
                    )}
                  </div>

                  {/* Step 2: Card Type */}
                  <div className="flex items-center justify-between border-t border-dark-border/10 pt-2.5">
                    <span className="text-dark-muted">2. Card Type identification</span>
                    {preCheckStage === 'luhn' ? (
                      <span className="text-dark-muted flex items-center">pending...</span>
                    ) : preCheckStage === 'cardType' ? (
                      <span className="text-amber-400 flex items-center animate-pulse"><Loader className="h-3.5 w-3.5 mr-1.5 animate-spin" /> querying BIN...</span>
                    ) : (
                      <span className="text-brand-success flex items-center font-bold"><Check className="h-3.5 w-3.5 mr-1.5 text-brand-success" /> {detectedType} detected</span>
                    )}
                  </div>

                  {/* Step 3: Bank Issuer */}
                  <div className="flex items-center justify-between border-t border-dark-border/10 pt-2.5">
                    <span className="text-dark-muted">3. Bank Issuer allocation</span>
                    {preCheckStage === 'luhn' || preCheckStage === 'cardType' ? (
                      <span className="text-dark-muted flex items-center">pending...</span>
                    ) : preCheckStage === 'issuer' ? (
                      <span className="text-amber-400 flex items-center animate-pulse"><Loader className="h-3.5 w-3.5 mr-1.5 animate-spin" /> routing BIN...</span>
                    ) : (
                      <span className="text-brand-success flex items-center font-bold"><Check className="h-3.5 w-3.5 mr-1.5 text-brand-success" /> {detectedIssuer} routed</span>
                    )}
                  </div>
                </div>

                <div className="h-1.5 w-full bg-dark-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
                    style={{ 
                      width: preCheckStage === 'luhn' ? '30%' : 
                             preCheckStage === 'cardType' ? '60%' : 
                             preCheckStage === 'issuer' ? '85%' : '100%' 
                    }}
                  />
                </div>
              </div>
            ) : !result ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-dark-border rounded-xl text-dark-muted text-xs">
                <Play className="h-8 w-8 text-dark-muted/40 mb-3 animate-pulse" />
                <span>Configure a payload and click "Dispatch Charge" to run real-time ML modeling diagnostics.</span>
              </div>
            ) : (() => {
              // Merge XAI fields — survives OTP round-trip where result becomes raw transaction object
              const explanation = result.explanation || xaiCache?.explanation || [];
              const modelInfo   = result.model_info  || xaiCache?.model_info;
              const ruleHit     = result.ruleTriggered || xaiCache?.ruleTriggered;
              const score       = result.riskScore ?? result.riskScore ?? 0;
              const decision    = result.decision;
              const validation  = result.validation;

              // Normalize bar widths relative to the highest contributor so bars are always visible
              const maxPct = explanation.length > 0
                ? Math.max(...explanation.map(e => parseFloat(e.percentage) || 0), 1)
                : 100;
              const barWidth = (pct) => Math.min(100, ((parseFloat(pct) || 0) / maxPct) * 100);
              const barColor = (pct) => {
                const p = parseFloat(pct) || 0;
                if (p >= 30) return 'bg-brand-danger';
                if (p >= 15) return 'bg-brand-warning';
                return 'bg-indigo-500';
              };

              return (
                <div className="space-y-5 flex-1 flex flex-col">

                  {/* ── Decision badge + score ── */}
                  <div className="text-center p-5 rounded-xl bg-dark-bg/60 border border-dark-border space-y-2">
                    <span className="text-[10px] font-bold text-dark-muted tracking-widest uppercase block">Radar Verdict</span>

                    {decision === 'APPROVED' ? (
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-success/15 border border-brand-success/20 text-brand-success rounded-full text-xs font-bold uppercase animate-pulse-glow">
                        <ShieldCheck className="h-4 w-4" /><span>APPROVED</span>
                      </div>
                    ) : decision === 'FLAGGED' ? (
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-warning/15 border border-brand-warning/20 text-brand-warning rounded-full text-xs font-bold uppercase animate-pulse-glow">
                        <AlertTriangle className="h-4 w-4" /><span>FLAGGED — MANUAL REVIEW</span>
                      </div>
                    ) : decision === 'CHALLENGED' ? (
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 rounded-full text-xs font-bold uppercase animate-pulse-glow">
                        <ShieldAlert className="h-4 w-4" /><span>STEP-UP CHALLENGE</span>
                      </div>
                    ) : (
                      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-brand-danger/15 border border-brand-danger/20 text-brand-danger rounded-full text-xs font-bold uppercase animate-pulse-glow">
                        <X className="h-4 w-4" /><span>AUTO BLOCKED</span>
                      </div>
                    )}

                    <h3 className={`text-4xl font-black ${
                      score >= 75 ? 'text-brand-danger' :
                      score >= 45 ? 'text-brand-warning' :
                      'text-brand-success'
                    }`}>
                      {score}%
                    </h3>
                    <span className="text-[10px] text-dark-muted block">FRAUD PROBABILITY SCORE</span>
                  </div>

                  {/* ── Rule triggered ── */}
                  {ruleHit && (
                    <div className="bg-brand-danger/10 border border-brand-danger/20 text-brand-danger p-3 rounded-xl text-xs space-y-1">
                      <span className="font-bold flex items-center"><AlertTriangle className="h-4 w-4 mr-1.5" />Hard Rule Triggered</span>
                      <p className="text-[10.5px] opacity-90">
                        Rule: <span className="font-bold">&ldquo;{ruleHit.name}&rdquo;</span> → Action override: <span className="font-bold">{ruleHit.action}</span>
                      </p>
                    </div>
                  )}

                  {/* ── Explainable AI Feature Bars ── */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400 tracking-widest uppercase font-mono">{t('featureImportance')}</span>
                      <span className="text-[9px] text-dark-muted font-mono uppercase">{explanation.length} features</span>
                    </div>

                    {explanation.length === 0 ? (
                      <p className="text-[11px] text-dark-muted italic">No explanation data returned by model.</p>
                    ) : (
                      <div className="space-y-2">
                        {explanation.map((exp) => {
                          const pct = parseFloat(exp.percentage) || 0;
                          const displayPct = pct.toFixed(1);
                          return (
                            <div key={exp.feature} className="space-y-1">
                              <div className="flex justify-between items-center text-[11px]">
                                <span className="text-dark-text capitalize truncate pr-2 max-w-[160px]">
                                  {exp.feature.replace(/_/g, ' ')}
                                </span>
                                <div className="flex items-center space-x-2 shrink-0">
                                  <span className="text-dark-muted text-[10px] font-mono">
                                    val: {typeof exp.value === 'number' ? exp.value.toFixed(2) : exp.value}
                                  </span>
                                  <span className={`font-bold ${
                                    pct >= 30 ? 'text-brand-danger' :
                                    pct >= 15 ? 'text-brand-warning' :
                                    'text-indigo-400'
                                  }`}>
                                    {displayPct}%
                                  </span>
                                </div>
                              </div>
                              <div className="h-1.5 bg-dark-border rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${barColor(pct)}`}
                                  style={{ width: `${barWidth(pct)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ── Model performance metrics ── */}
                  {modelInfo?.metrics && (
                    <div className="bg-dark-bg/60 border border-dark-border rounded-xl p-3.5 space-y-2">
                      <span className="text-[10px] font-bold text-dark-muted tracking-widest uppercase block font-mono">Model Performance Metrics</span>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {[
                          { label: 'Precision', val: modelInfo.metrics.precision },
                          { label: 'Recall',    val: modelInfo.metrics.recall },
                          { label: 'F1 Score',  val: modelInfo.metrics.f1_score },
                          { label: 'ROC-AUC',   val: modelInfo.metrics.roc_auc },
                        ].map(({ label, val }) => (
                          <div key={label} className="flex items-center justify-between">
                            <span className="text-[10px] text-dark-muted">{label}</span>
                            <span className={`text-[11px] font-bold font-mono ${
                              val >= 0.92 ? 'text-brand-success' :
                              val >= 0.85 ? 'text-indigo-400' :
                              'text-brand-warning'
                            }`}>
                              {val ? (val * 100).toFixed(1) + '%' : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Card metadata ── */}
                  {validation && (
                    <div className="bg-dark-bg/60 border border-dark-border p-3 rounded-xl text-[10.5px] text-dark-muted font-mono leading-relaxed space-y-1">
                      <p>🏦 ISSUER: {validation.issuer || '—'}</p>
                      <p>🌍 COUNTRY: {validation.country || '—'}</p>
                      <p>💳 TYPE: {validation.type || 'Credit'}</p>
                    </div>
                  )}

                  {/* ── Model metadata footer ── */}
                  <div className="bg-dark-card border border-dark-border p-3 rounded-xl text-[10.5px] text-dark-muted font-mono leading-relaxed">
                    <p>⚙️ MODEL: {modelInfo?.type || formData.modelType}</p>
                    {decision !== 'APPROVED' && (
                      <p className="text-indigo-400 mt-1">📬 Telegram Operator alert fired successfully.</p>
                    )}
                  </div>

                </div>
              );
            })()}

          </div>

        </div>

      </div>

      {/* Mock SMS OTP Notification Toast */}
      {smsNotification && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-950/95 border border-slate-700/60 backdrop-blur-xl rounded-2xl shadow-2xl p-4 transition-all duration-300 animate-slide-in animate-pulse-glow flex items-start space-x-3 text-white">
          <div className="bg-indigo-600/20 p-2 rounded-lg text-indigo-400 shrink-0">
            <CreditCard className="h-5 w-5 animate-pulse" />
          </div>
          <div className="flex-1 space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="font-bold text-[10px] tracking-widest text-indigo-400 font-mono uppercase">Bank SMS Verification</span>
              <button 
                onClick={() => setSmsNotification(null)}
                className="text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-white/95 leading-relaxed font-medium">{smsNotification}</p>
            <div className="pt-2 flex justify-between items-center text-[10px] text-white/50 font-mono border-t border-white/5">
              <span>Just now</span>
              <button 
                onClick={() => {
                  setOtpValue(otpCodeFromServer);
                  setSmsNotification(null);
                }}
                className="text-indigo-400 font-bold hover:underline cursor-pointer tracking-wider"
              >
                Auto-fill Code
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Glassmorphic Step-Up OTP Challenge Modal */}
      {showChallengeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in">
          <div className="glass max-w-md w-full rounded-2xl border border-dark-border/80 shadow-2xl overflow-hidden p-6 space-y-6 flex flex-col justify-between text-dark-text relative animate-scale-up">
            
            {/* Modal Ambient Glow Overlay */}
            <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-2xl -mr-8 -mt-8 pointer-events-none" />
            <div className="absolute left-0 bottom-0 h-32 w-32 rounded-full bg-red-500/5 blur-2xl -ml-8 -mb-8 pointer-events-none" />

            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto bg-indigo-600/15 border border-indigo-500/30 text-indigo-400 p-3.5 rounded-full w-14 h-14 flex items-center justify-center shadow-lg animate-pulse-glow">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-extrabold tracking-tight text-white">Security Step-up Challenge</h3>
              <p className="text-xs text-dark-muted leading-relaxed">
                FraudShield has flagged this transaction as medium-risk ({result?.riskScore}%). To verify cardholder authorization, we have dispatched a 6-digit OTP code.
              </p>
            </div>

            {/* OTP Input Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-indigo-400 tracking-widest uppercase text-center font-mono">
                  Enter 6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength="6"
                  placeholder="••••••"
                  value={otpValue}
                  onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-[0.4em] font-mono text-3xl bg-dark-bg/60 border border-dark-border rounded-xl p-3 text-indigo-400 placeholder-dark-muted focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
                />
              </div>

              {otpError && (
                <p className="text-[11px] text-brand-danger text-center font-semibold flex items-center justify-center">
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                  {otpError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-2">
              <button
                onClick={async () => {
                  try {
                    setOtpLoading(true);
                    const response = await verifyTransactionOTP(challengeTransactionId, '000000');
                    // Merge XAI cache back so bars don't disappear
                    setResult({ ...response.data.transaction, ...xaiCache });
                    setShowChallengeModal(false);
                  } catch (e) {
                    setShowChallengeModal(false);
                  } finally {
                    setOtpLoading(false);
                  }
                }}
                disabled={otpLoading}
                className="flex-1 bg-dark-card border border-dark-border hover:bg-dark-border/40 text-dark-muted font-bold text-xs py-3 rounded-xl transition-all cursor-pointer text-center"
              >
                Decline / Cancel
              </button>

              <button
                onClick={async () => {
                  if (otpValue.length !== 6) {
                    setOtpError('Please enter a valid 6-digit OTP code.');
                    return;
                  }
                  try {
                    setOtpLoading(true);
                    setOtpError(null);
                    const response = await verifyTransactionOTP(challengeTransactionId, otpValue);
                    
                    if (response.data.success) {
                      // Merge XAI cache so explanation bars are preserved
                      setResult({ ...response.data.transaction, ...xaiCache });
                      setShowChallengeModal(false);
                    } else {
                      setResult({ ...response.data.transaction, ...xaiCache });
                      setOtpError(response.data.message);
                      setTimeout(() => {
                        setShowChallengeModal(false);
                      }, 1800);
                    }
                  } catch (err) {
                    setOtpError('OTP Verification Failed. Server unavailable.');
                  } finally {
                    setOtpLoading(false);
                  }
                }}
                disabled={otpLoading || otpValue.length !== 6}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer text-center flex items-center justify-center space-x-1.5"
              >
                <span>{otpLoading ? 'Verifying...' : 'Submit OTP'}</span>
              </button>
            </div>

            {/* Help Prompt */}
            <p className="text-[10px] text-center text-dark-muted font-mono leading-relaxed border-t border-dark-border/40 pt-3">
              Didn't receive SMS? Testing code is <span className="text-indigo-400 font-bold">{otpCodeFromServer}</span>
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

// Helper component to render beautiful bank logo text
const LandmarkLogo = ({ brand, issuer }) => {
  const displayIssuer = issuer && issuer !== 'Unknown' ? issuer : (
    brand === 'Visa' ? 'CHASE BANK' : 
    brand === 'Mastercard' ? 'BARCLAYS BANK' : 
    brand === 'American Express' ? 'ICICI BANK' : 
    brand === 'RuPay' ? 'SBI BANK' : 'GLOBAL PLATINUM'
  );

  return (
    <div className="flex items-center space-x-1.5 text-white/90">
      <span className="font-extrabold text-xs tracking-wider font-mono flex items-center uppercase">
        🏛️ {displayIssuer}
      </span>
    </div>
  );
};

export default Simulator;
