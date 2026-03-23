import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Save, Eye, EyeOff, AlertCircle, CheckCircle, 
  Settings, ExternalLink, Shield, Key, ChevronUp,
  Loader2, Edit3, DollarSign, Smartphone
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Reusable Accordion Card Component
const PaymentCard = ({ 
  title, 
  icon: Icon, 
  iconBg, 
  isEnabled, 
  isConfigured, 
  badges = [], 
  isExpanded, 
  onToggle, 
  children,
  onSave,
  saving,
  docsUrl
}) => {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      {/* Card Header */}
      <div 
        className={`p-6 cursor-pointer transition-colors ${isExpanded ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
        onClick={() => !isExpanded && onToggle()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              isEnabled ? iconBg : 'bg-gray-100'
            }`}>
              <Icon className={`w-7 h-7 ${isEnabled ? 'text-white' : 'text-gray-400'}`} />
            </div>
            
            <div>
              <h2 className="text-lg font-bold text-gray-900">{title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isEnabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                  {isEnabled ? 'Active' : 'Disabled'}
                </span>
                
                {badges.map((badge, i) => (
                  <span key={i} className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.className}`}>
                    {badge.icon && <badge.icon className="w-3 h-3" />}
                    {badge.text}
                  </span>
                ))}
                
                {!isConfigured && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                    <AlertCircle className="w-3 h-3" />
                    Not Configured
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isExpanded && docsUrl && (
              <a 
                href={docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-sm text-gray-500 hover:text-[rgb(37, 99, 235)] flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Docs
              </a>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                isExpanded 
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300' 
                  : 'bg-[rgb(37, 99, 235)] text-white hover:bg-[#a01830]'
              }`}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Collapse
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  Edit
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-200 p-6 space-y-6 bg-white">
              {children}
              
              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-6 flex items-center justify-end gap-3">
                <button
                  onClick={onToggle}
                  className="px-5 py-2.5 text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[rgb(37, 99, 235)] hover:bg-[#a01830] text-white font-semibold rounded-lg transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save & Close
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AdminPaymentSettings = () => {
  const [durangoExpanded, setDurangoExpanded] = useState(false);
  const [stripeExpanded, setStripeExpanded] = useState(false);
  const [paypalExpanded, setPaypalExpanded] = useState(false);
  const [cashAppExpanded, setCashAppExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingDurango, setSavingDurango] = useState(false);
  const [savingStripe, setSavingStripe] = useState(false);
  const [savingPaypal, setSavingPaypal] = useState(false);
  const [savingCashApp, setSavingCashApp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showStripeSecrets, setShowStripeSecrets] = useState(false);
  const [showPaypalSecrets, setShowPaypalSecrets] = useState(false);
  
  // Durango Settings
  const [durangoSettings, setDurangoSettings] = useState({
    tokenization_key: '',
    api_username: '',
    api_password: '',
    gateway_url: 'https://secure.durango-direct.com/api/transact.php',
    is_test_mode: true,
    is_enabled: false
  });

  // CashApp/Venmo Settings
  const [cashAppSettings, setCashAppSettings] = useState({
    cashapp_id: '',
    venmo_id: '',
    is_enabled: false,
    instructions: 'Please send payment to the ID shown and include your order number in the note.'
  });

  // Stripe Settings
  const [stripeSettings, setStripeSettings] = useState({
    publishable_key: '',
    secret_key: '',
    webhook_secret: '',
    is_test_mode: true,
    is_enabled: false
  });

  // PayPal Settings
  const [paypalSettings, setPaypalSettings] = useState({
    paypal_email: '',
    setup_mode: 'email',
    sandbox_client_id: '',
    sandbox_client_secret: '',
    live_client_id: '',
    live_client_secret: '',
    is_test_mode: true,
    is_enabled: false,
    instructions: 'Use your order number in the PayPal note.'
  });

  const isDurangoConfigured = durangoSettings.api_username && durangoSettings.api_password && durangoSettings.tokenization_key;
  const isStripeConfigured = stripeSettings.publishable_key && stripeSettings.secret_key;
  const isPayPalConfigured = paypalSettings.setup_mode === 'email'
    ? Boolean(paypalSettings.paypal_email)
    : Boolean(
        paypalSettings.is_test_mode
          ? (paypalSettings.sandbox_client_id && paypalSettings.sandbox_client_secret)
          : (paypalSettings.live_client_id && paypalSettings.live_client_secret)
      );
  const isCashAppConfigured = cashAppSettings.cashapp_id || cashAppSettings.venmo_id;

  useEffect(() => {
    fetchAllSettings();
  }, []);

  const fetchAllSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch Durango settings
      const durangoRes = await fetch(`${API_URL}/api/payments/settings/durango`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (durangoRes.ok) {
        const data = await durangoRes.json();
        setDurangoSettings({
          tokenization_key: data.tokenization_key || '',
          api_username: data.api_username || '',
          api_password: data.api_password || '',
          gateway_url: data.gateway_url || 'https://secure.durango-direct.com/api/transact.php',
          is_test_mode: data.is_test_mode ?? true,
          is_enabled: data.is_enabled ?? false
        });
      }

      // Fetch CashApp/Venmo settings
      const cashAppRes = await fetch(`${API_URL}/api/payments/settings/cashapp-venmo`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (cashAppRes.ok) {
        const data = await cashAppRes.json();
        setCashAppSettings({
          cashapp_id: data.cashapp_id || '',
          venmo_id: data.venmo_id || '',
          is_enabled: data.is_enabled ?? false,
          instructions: data.instructions || 'Please send payment to the ID shown and include your order number in the note.'
        });
      }

      // Fetch Stripe settings
      const stripeRes = await fetch(`${API_URL}/api/payments/settings/stripe`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (stripeRes.ok) {
        const data = await stripeRes.json();
        setStripeSettings({
          publishable_key: data.publishable_key || '',
          secret_key: data.secret_key || '',
          webhook_secret: data.webhook_secret || '',
          is_test_mode: data.is_test_mode ?? true,
          is_enabled: data.is_enabled ?? false
        });
      }

      // Fetch PayPal settings
      const paypalRes = await fetch(`${API_URL}/api/payments/settings/paypal`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (paypalRes.ok) {
        const data = await paypalRes.json();
        setPaypalSettings({
          paypal_email: data.paypal_email || '',
          setup_mode: data.setup_mode || 'email',
          sandbox_client_id: data.sandbox_client_id || '',
          sandbox_client_secret: data.sandbox_client_secret || '',
          live_client_id: data.live_client_id || '',
          live_client_secret: data.live_client_secret || '',
          is_test_mode: data.is_test_mode ?? true,
          is_enabled: data.is_enabled ?? false,
          instructions: data.instructions || 'Use your order number in the PayPal note.'
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDurango = async () => {
    setSavingDurango(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/payments/settings/durango`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(durangoSettings)
      });

      if (response.ok) {
        toast({ title: 'Settings Saved', description: 'Durango gateway settings updated.' });
        fetchAllSettings();
        setDurangoExpanded(false);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save settings');
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingDurango(false);
    }
  };

  const handleSaveCashApp = async () => {
    setSavingCashApp(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/payments/settings/cashapp-venmo`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(cashAppSettings)
      });

      if (response.ok) {
        toast({ title: 'Settings Saved', description: 'CashApp & Venmo settings updated.' });
        fetchAllSettings();
        setCashAppExpanded(false);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save settings');
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingCashApp(false);
    }
  };

  const handleSaveStripe = async () => {
    setSavingStripe(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/payments/settings/stripe`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(stripeSettings)
      });

      if (response.ok) {
        toast({ title: 'Settings Saved', description: 'Stripe gateway settings updated.' });
        fetchAllSettings();
        setStripeExpanded(false);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save settings');
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingStripe(false);
    }
  };

  const handleSavePayPal = async () => {
    setSavingPaypal(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/payments/settings/paypal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paypalSettings)
      });

      if (response.ok) {
        toast({ title: 'Settings Saved', description: 'PayPal gateway settings updated.' });
        fetchAllSettings();
        setPaypalExpanded(false);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save settings');
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSavingPaypal(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[rgb(37, 99, 235)]/30 focus:border-[rgb(37, 99, 235)] transition-all font-mono text-sm";
  const labelClasses = "block text-sm font-medium text-gray-700 mb-2";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="payment-settings-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <CreditCard className="w-7 h-7 text-[rgb(37, 99, 235)]" />
          Payment Settings
        </h1>
        <p className="text-gray-500 mt-1">Configure payment gateways for accepting online payments</p>
      </div>

      {/* Durango Merchant Services Card */}
      <PaymentCard
        title="Durango Merchant Services"
        icon={CreditCard}
        iconBg="bg-purple-600"
        isEnabled={durangoSettings.is_enabled}
        isConfigured={isDurangoConfigured}
        badges={durangoSettings.is_enabled ? [{
          text: durangoSettings.is_test_mode ? 'Test Mode' : 'Live Mode',
          className: durangoSettings.is_test_mode ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
        }] : []}
        isExpanded={durangoExpanded}
        onToggle={() => setDurangoExpanded(!durangoExpanded)}
        onSave={handleSaveDurango}
        saving={savingDurango}
        docsUrl="https://durangomerchantservices.com/gateway-integration-instructions/"
      >
        {/* Durango Form Content */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-5 h-5 text-[rgb(37, 99, 235)]" />
              <h3 className="font-semibold text-gray-900">API Credentials</h3>
            </div>
            
            <div>
              <label className={labelClasses}>API Username <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={durangoSettings.api_username}
                onChange={(e) => setDurangoSettings({...durangoSettings, api_username: e.target.value})}
                className={inputClasses}
                placeholder="Your Durango API username"
              />
            </div>

            <div>
              <label className={labelClasses}>API Password <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={durangoSettings.api_password}
                  onChange={(e) => setDurangoSettings({...durangoSettings, api_password: e.target.value})}
                  className={`${inputClasses} pr-12`}
                  placeholder="Your Durango API password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className={labelClasses}>Gateway URL</label>
              <input
                type="text"
                value={durangoSettings.gateway_url}
                onChange={(e) => setDurangoSettings({...durangoSettings, gateway_url: e.target.value})}
                className={inputClasses}
                placeholder="https://secure.durango-direct.com/api/transact.php"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-[rgb(37, 99, 235)]" />
              <h3 className="font-semibold text-gray-900">Collect.js Tokenization</h3>
            </div>
            
            <div>
              <label className={labelClasses}>Tokenization Key (Public) <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={durangoSettings.tokenization_key}
                onChange={(e) => setDurangoSettings({...durangoSettings, tokenization_key: e.target.value})}
                className={inputClasses}
                placeholder="Your Collect.js public key"
              />
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[rgb(37, 99, 235)] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium">PCI Compliant</p>
                  <p className="text-[rgb(37, 99, 235)]">Card data tokenized in secure iframes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="border-t border-gray-200 pt-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Test Mode</p>
                  <p className="text-xs text-gray-500">Sandbox for testing</p>
                </div>
                <button
                  onClick={() => setDurangoSettings({...durangoSettings, is_test_mode: !durangoSettings.is_test_mode})}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    durangoSettings.is_test_mode ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    durangoSettings.is_test_mode ? 'left-1' : 'left-6'
                  }`} />
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Enable Gateway</p>
                  <p className="text-xs text-gray-500">Accept card payments</p>
                </div>
                <button
                  onClick={() => setDurangoSettings({...durangoSettings, is_enabled: !durangoSettings.is_enabled})}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    durangoSettings.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    durangoSettings.is_enabled ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </PaymentCard>

      {/* Stripe Card */}
      <PaymentCard
        title="Stripe"
        icon={CreditCard}
        iconBg="bg-indigo-600"
        isEnabled={stripeSettings.is_enabled}
        isConfigured={isStripeConfigured}
        badges={stripeSettings.is_enabled ? [{
          text: stripeSettings.is_test_mode ? 'Test Mode' : 'Live Mode',
          className: stripeSettings.is_test_mode ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
        }] : []}
        isExpanded={stripeExpanded}
        onToggle={() => setStripeExpanded(!stripeExpanded)}
        onSave={handleSaveStripe}
        saving={savingStripe}
        docsUrl="https://docs.stripe.com/keys"
      >
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="https://dashboard.stripe.com/register"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between p-4 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              data-testid="stripe-signup-link"
            >
              <span className="font-medium">Sign up & register Stripe</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between p-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              data-testid="stripe-get-keys-link"
            >
              <span className="font-medium">Get API keys</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className={labelClasses}>Publishable Key <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={stripeSettings.publishable_key}
                onChange={(e) => setStripeSettings({ ...stripeSettings, publishable_key: e.target.value })}
                className={inputClasses}
                placeholder="pk_test_... or pk_live_..."
                data-testid="stripe-publishable-key-input"
              />
            </div>
            <div>
              <label className={labelClasses}>Secret Key <span className="text-red-500">*</span></label>
              <div className="relative">
                <input
                  type={showStripeSecrets ? 'text' : 'password'}
                  value={stripeSettings.secret_key}
                  onChange={(e) => setStripeSettings({ ...stripeSettings, secret_key: e.target.value })}
                  className={`${inputClasses} pr-12`}
                  placeholder="sk_test_... or sk_live_..."
                  data-testid="stripe-secret-key-input"
                />
                <button
                  type="button"
                  onClick={() => setShowStripeSecrets(!showStripeSecrets)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                  data-testid="stripe-secret-visibility-toggle"
                >
                  {showStripeSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className={labelClasses}>Webhook Secret</label>
            <input
              type={showStripeSecrets ? 'text' : 'password'}
              value={stripeSettings.webhook_secret}
              onChange={(e) => setStripeSettings({ ...stripeSettings, webhook_secret: e.target.value })}
              className={inputClasses}
              placeholder="whsec_..."
              data-testid="stripe-webhook-secret-input"
            />
          </div>

          <div className="border-t border-gray-200 pt-5 grid sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Test Mode</p>
                  <p className="text-xs text-gray-500">Use Stripe test keys</p>
                </div>
                <button
                  onClick={() => setStripeSettings({ ...stripeSettings, is_test_mode: !stripeSettings.is_test_mode })}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    stripeSettings.is_test_mode ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  data-testid="stripe-test-mode-toggle"
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    stripeSettings.is_test_mode ? 'left-1' : 'left-6'
                  }`} />
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Enable Gateway</p>
                  <p className="text-xs text-gray-500">Turn on Stripe payment gateway</p>
                </div>
                <button
                  onClick={() => setStripeSettings({ ...stripeSettings, is_enabled: !stripeSettings.is_enabled })}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    stripeSettings.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  data-testid="stripe-enable-gateway-toggle"
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    stripeSettings.is_enabled ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </PaymentCard>

      {/* PayPal Card */}
      <PaymentCard
        title="PayPal"
        icon={CreditCard}
        iconBg="bg-blue-600"
        isEnabled={paypalSettings.is_enabled}
        isConfigured={isPayPalConfigured}
        badges={paypalSettings.is_enabled ? [{
          text: paypalSettings.setup_mode === 'email' ? 'Email Mode' : (paypalSettings.is_test_mode ? 'Sandbox API' : 'Live API'),
          className: paypalSettings.setup_mode === 'email' ? 'bg-blue-100 text-blue-700' : (paypalSettings.is_test_mode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700')
        }] : []}
        isExpanded={paypalExpanded}
        onToggle={() => setPaypalExpanded(!paypalExpanded)}
        onSave={handleSavePayPal}
        saving={savingPaypal}
        docsUrl="https://developer.paypal.com/docs/checkout/"
      >
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <a
              href="https://www.paypal.com/us/webapps/mpp/account-selection"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between p-4 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              data-testid="paypal-signup-link"
            >
              <span className="font-medium">Sign up for PayPal</span>
              <ExternalLink className="w-4 h-4" />
            </a>
            <a
              href="https://developer.paypal.com/developer/applications/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between p-4 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              data-testid="paypal-get-keys-link"
            >
              <span className="font-medium">Get Client ID & Secret</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div>
            <label className={labelClasses}>PayPal Setup Method</label>
            <div className="grid sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaypalSettings({ ...paypalSettings, setup_mode: 'email' })}
                className={`p-3 rounded-lg border text-sm font-semibold transition-colors ${
                  paypalSettings.setup_mode === 'email'
                    ? 'bg-blue-50 border-blue-400 text-blue-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                data-testid="paypal-setup-mode-email"
              >
                Email Payment Link
              </button>
              <button
                type="button"
                onClick={() => setPaypalSettings({ ...paypalSettings, setup_mode: 'api_keys' })}
                className={`p-3 rounded-lg border text-sm font-semibold transition-colors ${
                  paypalSettings.setup_mode === 'api_keys'
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
                data-testid="paypal-setup-mode-api-keys"
              >
                API Keys
              </button>
            </div>
          </div>

          {paypalSettings.setup_mode === 'email' ? (
            <div>
              <label className={labelClasses}>PayPal Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={paypalSettings.paypal_email}
                onChange={(e) => setPaypalSettings({ ...paypalSettings, paypal_email: e.target.value })}
                className={inputClasses}
                placeholder="merchant@yourstore.com"
                data-testid="paypal-email-input"
              />
              <p className="text-xs text-gray-500 mt-1">Customers are sent to this PayPal account for payment.</p>
            </div>
          ) : (
            <>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">API Environment</p>
                    <p className="text-xs text-gray-500">Choose sandbox or live credentials</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaypalSettings({ ...paypalSettings, is_test_mode: !paypalSettings.is_test_mode })}
                    className={`relative w-12 h-7 rounded-full transition-colors ${
                      paypalSettings.is_test_mode ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    data-testid="paypal-test-mode-toggle"
                  >
                    <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      paypalSettings.is_test_mode ? 'left-1' : 'left-6'
                    }`} />
                  </button>
                </div>
                <p className="text-xs mt-2 font-medium text-gray-600">
                  {paypalSettings.is_test_mode ? 'Sandbox mode active' : 'Live mode active'}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClasses}>
                    {paypalSettings.is_test_mode ? 'Sandbox Client ID' : 'Live Client ID'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={paypalSettings.is_test_mode ? paypalSettings.sandbox_client_id : paypalSettings.live_client_id}
                    onChange={(e) => setPaypalSettings({
                      ...paypalSettings,
                      [paypalSettings.is_test_mode ? 'sandbox_client_id' : 'live_client_id']: e.target.value
                    })}
                    className={inputClasses}
                    placeholder="Client ID"
                    data-testid="paypal-client-id-input"
                  />
                </div>

                <div>
                  <label className={labelClasses}>
                    {paypalSettings.is_test_mode ? 'Sandbox Secret' : 'Live Secret'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPaypalSecrets ? 'text' : 'password'}
                      value={paypalSettings.is_test_mode ? paypalSettings.sandbox_client_secret : paypalSettings.live_client_secret}
                      onChange={(e) => setPaypalSettings({
                        ...paypalSettings,
                        [paypalSettings.is_test_mode ? 'sandbox_client_secret' : 'live_client_secret']: e.target.value
                      })}
                      className={`${inputClasses} pr-12`}
                      placeholder="Secret"
                      data-testid="paypal-client-secret-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPaypalSecrets(!showPaypalSecrets)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
                      data-testid="paypal-secret-visibility-toggle"
                    >
                      {showPaypalSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className={labelClasses}>Customer Payment Instructions</label>
            <textarea
              value={paypalSettings.instructions}
              onChange={(e) => setPaypalSettings({ ...paypalSettings, instructions: e.target.value })}
              className={`${inputClasses} resize-none`}
              rows="2"
              placeholder="Use your order number in the PayPal note."
              data-testid="paypal-instructions-input"
            />
          </div>

          <div className="border-t border-gray-200 pt-5">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Enable Gateway</p>
                  <p className="text-xs text-gray-500">Show PayPal as checkout option</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPaypalSettings({ ...paypalSettings, is_enabled: !paypalSettings.is_enabled })}
                  className={`relative w-12 h-7 rounded-full transition-colors ${
                    paypalSettings.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                  data-testid="paypal-enable-gateway-toggle"
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    paypalSettings.is_enabled ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </PaymentCard>

      {/* CashApp & Venmo Card */}
      <PaymentCard
        title="CashApp & Venmo"
        icon={Smartphone}
        iconBg="bg-green-600"
        isEnabled={cashAppSettings.is_enabled}
        isConfigured={isCashAppConfigured}
        badges={[
          cashAppSettings.cashapp_id && { text: 'CashApp', className: 'bg-green-100 text-green-700' },
          cashAppSettings.venmo_id && { text: 'Venmo', className: 'bg-blue-100 text-blue-700' }
        ].filter(Boolean)}
        isExpanded={cashAppExpanded}
        onToggle={() => setCashAppExpanded(!cashAppExpanded)}
        onSave={handleSaveCashApp}
        saving={savingCashApp}
      >
        {/* CashApp/Venmo Form Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* CashApp */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900">CashApp</h3>
            </div>
            
            <div>
              <label className={labelClasses}>CashApp ID ($cashtag)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-600 font-bold">$</span>
                <input
                  type="text"
                  value={cashAppSettings.cashapp_id}
                  onChange={(e) => setCashAppSettings({...cashAppSettings, cashapp_id: e.target.value.replace(/^\$/, '')})}
                  className={`${inputClasses} pl-8`}
                  placeholder="yourcashtag"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter without the $ symbol</p>
            </div>
          </div>

          {/* Venmo */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[rgb(37, 99, 235)] flex items-center justify-center">
                <span className="text-white font-bold text-sm">V</span>
              </div>
              <h3 className="font-semibold text-gray-900">Venmo</h3>
            </div>
            
            <div>
              <label className={labelClasses}>Venmo ID (@username)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(37, 99, 235)] font-bold">@</span>
                <input
                  type="text"
                  value={cashAppSettings.venmo_id}
                  onChange={(e) => setCashAppSettings({...cashAppSettings, venmo_id: e.target.value.replace(/^@/, '')})}
                  className={`${inputClasses} pl-8`}
                  placeholder="yourusername"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Enter without the @ symbol</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className={labelClasses}>Payment Instructions (shown in email)</label>
          <textarea
            value={cashAppSettings.instructions}
            onChange={(e) => setCashAppSettings({...cashAppSettings, instructions: e.target.value})}
            className={`${inputClasses} resize-none`}
            rows="2"
            placeholder="Instructions sent to customer..."
          />
        </div>

        {/* Info Box */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <p className="font-medium">How it works:</p>
              <ul className="mt-1 space-y-1 text-amber-600">
                <li>• Customer selects CashApp or Venmo at checkout</li>
                <li>• Order is created with "Awaiting Payment" status</li>
                <li>• Customer receives email with payment ID and order number</li>
                <li>• Customer sends payment with order number in the note</li>
                <li>• You manually verify and mark order as paid</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Enable Toggle */}
        <div className="border-t border-gray-200 pt-6">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-md">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Enable CashApp & Venmo</p>
                <p className="text-xs text-gray-500">Show as payment option at checkout</p>
              </div>
              <button
                onClick={() => setCashAppSettings({...cashAppSettings, is_enabled: !cashAppSettings.is_enabled})}
                className={`relative w-12 h-7 rounded-full transition-colors ${
                  cashAppSettings.is_enabled ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  cashAppSettings.is_enabled ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </PaymentCard>
    </div>
  );
};

export default AdminPaymentSettings;
