import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, Save, Eye, EyeOff, AlertCircle, CheckCircle, 
  Settings, ExternalLink, Shield, Server, Key, ToggleLeft, ToggleRight
} from 'lucide-react';
import { toast } from '../../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PaymentSettings = () => {
  const [settings, setSettings] = useState({
    tokenization_key: '',
    api_username: '',
    api_password: '',
    gateway_url: 'https://secure.durango-direct.com/api/transact.php',
    is_test_mode: true,
    is_enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/payments/settings/durango`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings({
          tokenization_key: data.tokenization_key || '',
          api_username: data.api_username || '',
          api_password: data.api_password || '',
          gateway_url: data.gateway_url || 'https://secure.durango-direct.com/api/transact.php',
          is_test_mode: data.is_test_mode ?? true,
          is_enabled: data.is_enabled ?? false
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load payment settings',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/payments/settings/durango`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast({
          title: 'Settings Saved',
          description: 'Payment gateway settings have been updated successfully.',
        });
        // Refresh settings to get masked password
        fetchSettings();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to save settings');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClasses = "w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all font-mono text-sm";
  const labelClasses = "block text-sm font-medium text-slate-700 mb-2";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="payment-settings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Payment Gateway Settings</h1>
          <p className="text-slate-500 mt-1">Configure Durango Merchant Services integration</p>
        </div>
        <a 
          href="https://durangomerchantservices.com/gateway-integration-instructions/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Integration Docs
        </a>
      </div>

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-xl flex items-center gap-4 ${
          settings.is_enabled 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-amber-50 border border-amber-200'
        }`}
      >
        {settings.is_enabled ? (
          <>
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Payment Gateway Active</p>
              <p className="text-sm text-green-600">
                {settings.is_test_mode ? 'Running in TEST mode' : 'Running in LIVE mode'}
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-6 h-6 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Payment Gateway Disabled</p>
              <p className="text-sm text-amber-600">Configure and enable to accept payments</p>
            </div>
          </>
        )}
      </motion.div>

      {/* Settings Form */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* API Credentials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center">
              <Key className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">API Credentials</h2>
              <p className="text-sm text-slate-500">Backend payment processing</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClasses}>
                API Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings.api_username}
                onChange={(e) => setSettings({...settings, api_username: e.target.value})}
                className={inputClasses}
                placeholder="Your Durango API username"
                data-testid="api-username-input"
              />
            </div>

            <div>
              <label className={labelClasses}>
                API Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={settings.api_password}
                  onChange={(e) => setSettings({...settings, api_password: e.target.value})}
                  className={`${inputClasses} pr-12`}
                  placeholder="Your Durango API password"
                  data-testid="api-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Find in Gateway → Options → Security Keys
              </p>
            </div>

            <div>
              <label className={labelClasses}>Gateway URL</label>
              <input
                type="text"
                value={settings.gateway_url}
                onChange={(e) => setSettings({...settings, gateway_url: e.target.value})}
                className={inputClasses}
                placeholder="https://secure.durango-direct.com/api/transact.php"
                data-testid="gateway-url-input"
              />
            </div>
          </div>
        </motion.div>

        {/* Frontend Tokenization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-200 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Collect.js Tokenization</h2>
              <p className="text-sm text-slate-500">Secure frontend card collection</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={labelClasses}>
                Tokenization Key (Public) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={settings.tokenization_key}
                onChange={(e) => setSettings({...settings, tokenization_key: e.target.value})}
                className={inputClasses}
                placeholder="Your Collect.js public key"
                data-testid="tokenization-key-input"
              />
              <p className="text-xs text-slate-500 mt-1">
                Find in Gateway → Integration → Collect.js
              </p>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#6e2ea8] flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">PCI Compliant</p>
                  <p>Collect.js tokenizes card data in secure iframes. Sensitive card information never touches your server.</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Mode & Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 rounded-2xl p-6 lg:col-span-2"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800">Gateway Configuration</h2>
              <p className="text-sm text-slate-500">Mode and status settings</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Test Mode Toggle */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Test Mode</p>
                  <p className="text-sm text-slate-500">Use sandbox environment for testing</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, is_test_mode: !settings.is_test_mode})}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.is_test_mode ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  data-testid="test-mode-toggle"
                >
                  <span 
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      settings.is_test_mode ? 'left-1' : 'left-7'
                    }`}
                  />
                </button>
              </div>
              <p className={`text-xs mt-2 font-medium ${settings.is_test_mode ? 'text-amber-600' : 'text-green-600'}`}>
                {settings.is_test_mode ? 'TEST MODE - No real charges' : 'LIVE MODE - Real transactions'}
              </p>
            </div>

            {/* Enable Toggle */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-800">Enable Gateway</p>
                  <p className="text-sm text-slate-500">Accept payments on checkout</p>
                </div>
                <button
                  onClick={() => setSettings({...settings, is_enabled: !settings.is_enabled})}
                  className={`relative w-14 h-8 rounded-full transition-colors ${
                    settings.is_enabled ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                  data-testid="enable-gateway-toggle"
                >
                  <span 
                    className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                      settings.is_enabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
              <p className={`text-xs mt-2 font-medium ${settings.is_enabled ? 'text-green-600' : 'text-slate-500'}`}>
                {settings.is_enabled ? 'Gateway is ACTIVE' : 'Gateway is DISABLED'}
              </p>
            </div>
          </div>

          {/* Warning for Live Mode */}
          {!settings.is_test_mode && settings.is_enabled && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-medium">Live Mode Active</p>
                <p>Real credit card transactions will be processed. Ensure your credentials are correct.</p>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-amber-500 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
          data-testid="save-settings-btn"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-gradient-to-br from-purple-50 to-amber-50 border border-purple-200 rounded-2xl p-6"
      >
        <h3 className="font-bold text-slate-800 mb-4">Where to Find Your Credentials</h3>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div className="p-4 bg-white rounded-xl">
            <p className="font-medium text-purple-700 mb-2">1. API Username & Password</p>
            <p className="text-slate-600">Gateway Login → Options → Security Keys or use your gateway login credentials</p>
          </div>
          <div className="p-4 bg-white rounded-xl">
            <p className="font-medium text-purple-700 mb-2">2. Tokenization Key</p>
            <p className="text-slate-600">Gateway Login → Integration → Collect.js → Copy your public key</p>
          </div>
          <div className="p-4 bg-white rounded-xl">
            <p className="font-medium text-purple-700 mb-2">3. Gateway URL</p>
            <p className="text-slate-600">Usually provided in your welcome email or Integration documentation</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-4">
          Need help? Contact Durango support at customerservice@durangomerchantservices.com
        </p>
      </motion.div>
    </div>
  );
};

export default PaymentSettings;
