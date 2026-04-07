import React, { useState, useEffect } from 'react';
import { ToggleLeft, Zap, Loader2, Copy, Check, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

const DevFeatureFlags = () => {
  const [siteSettings, setSiteSettings] = useState({
    site_name: '123Bots',
    site_url: '',
    logo_url: '',
    favicon_url: '',
    admin_email: '',
    support_email: '',
    maintenance_mode: false,
    debug_mode: false,
    require_account_for_checkout: false,
    require_email_verification_for_registration: true,
  });
  const [siteFlagsSaving, setSiteFlagsSaving] = useState(false);
  const [johnny5Settings, setJohnny5Settings] = useState({
    show_menu: false,
    integration_enabled: false,
    api_key: '',
    webhook_url: ''
  });
  const [johnny5Saving, setJohnny5Saving] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [printfulAppSettings, setPrintfulAppSettings] = useState({
    configured: false,
    client_id: '',
    client_secret: '',
    client_secret_masked: '',
    callback_url: '',
  });
  const [printfulAppSaving, setPrintfulAppSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Feature flags (saved to DB)
  const [featureFlags, setFeatureFlags] = useState({
    cart_enabled: true,
    quotes_enabled: true,
    pawn_checkout: true,
    storage_online: false,
    storage_pos: false,
    ai_products: true,
    notifications: false,
    sms: false,
    analytics: true,
    printful_enabled: false,
    yoycol_enabled: false,
    owner_chat_enabled: false,
    owner_chat_ai_enabled: false,
    left_menu_enabled: true,
    coming_soon_enabled: true,
    coming_soon_password: '8487',
    external_api_enabled: false,
  });
  const [featureFlagsSaving, setFeatureFlagsSaving] = useState(false);

  // Feature definitions
  const featureDefinitions = [
    { id: 'cart_enabled', name: 'Shopping Cart Enabled', description: 'Show/hide storefront cart access in main navigation', category: 'E-commerce' },
    { id: 'quotes_enabled', name: 'Quotes', description: 'Show/hide Quotes feature across sidebar, lead modal, and client page', category: 'E-commerce' },
    { id: 'pawn_checkout', name: 'Product Checkout', description: 'When OFF, storefront runs in catalog mode (no prices, cart, or checkout)', category: 'E-commerce' },
    { id: 'storage_online', name: 'Online Storage Rentals', description: 'Allow customers to rent storage units online', category: 'Storage' },
    { id: 'storage_pos', name: 'Storage POS', description: 'Point of sale for in-person storage rentals', category: 'Storage' },
    { id: 'ai_products', name: 'AI Product Generator', description: 'Auto-fill product details using AI', category: 'AI' },
    { id: 'notifications', name: 'Email Notifications', description: 'Send email notifications for orders and rentals', category: 'Communications' },
    { id: 'sms', name: 'SMS Notifications', description: 'Send SMS notifications to customers', category: 'Communications' },
    { id: 'owner_chat_enabled', name: 'Owner Live Chat Access', description: 'Show Live Chat in admin sidebar and allow owner chat usage', category: 'Communications' },
    { id: 'analytics', name: 'Advanced Analytics', description: 'Show detailed analytics and reports', category: 'Analytics' },
    { id: 'owner_chat_ai_enabled', name: 'Owner Chat AI', description: 'Enable AI chat features for owners and unlock AI Keys settings', category: 'AI' },
    { id: 'printful_enabled', name: 'Printful Fulfillment', description: 'Show Fulfillment → Printful in owner dashboard and allow Printful OAuth connection', category: 'Fulfillment' },
    { id: 'yoycol_enabled', name: 'YOYCOL Fulfillment', description: 'Show Fulfillment → YOYCOL in owner dashboard and allow YOYCOL key management', category: 'Fulfillment' },
    { id: 'left_menu_enabled', name: 'Left Menu', description: 'Show accordion category menu on product/shop pages', category: 'Website' },
  ];

  useEffect(() => {
    loadFeatureFlags();
  }, []);

  const loadFeatureFlags = async () => {
    setLoading(true);
    try {
      await Promise.all([loadSiteSettings(), loadJohnny5Settings(), loadFeatureFlagsFromDB(), loadPrintfulAppSettings()]);
    } finally {
      setLoading(false);
    }
  };

  const loadFeatureFlagsFromDB = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/admin-settings/feature-flags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        setFeatureFlags(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Error loading feature flags:', error);
    }
  };

  const handleFeatureFlagToggle = async (flagId) => {
    const newValue = !featureFlags[flagId];
    const updatedFlags = { ...featureFlags, [flagId]: newValue };
    setFeatureFlags(updatedFlags);
    setFeatureFlagsSaving(true);
    
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/admin-settings/feature-flags`, updatedFlags, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast({ title: 'Feature Updated', description: `${flagId} is now ${newValue ? 'enabled' : 'disabled'}` });
    } catch (error) {
      // Revert on error
      setFeatureFlags(prev => ({ ...prev, [flagId]: !newValue }));
      toast({ title: 'Error', description: 'Failed to update feature flag', variant: 'destructive' });
    } finally {
      setFeatureFlagsSaving(false);
    }
  };

  const loadSiteSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/admin-settings/site`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSiteSettings((prev) => ({
        ...prev,
        ...response.data,
        require_account_for_checkout: Boolean(response.data?.require_account_for_checkout),
        require_email_verification_for_registration: response.data?.require_email_verification_for_registration !== false,
      }));
    } catch (error) {
      console.error('Error loading site feature flags:', error);
    }
  };

  const loadJohnny5Settings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/admin-settings/johnny5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setJohnny5Settings(response.data);
    } catch (error) {
      console.error('Error loading Johnny 5 settings:', error);
    }
  };

  const loadPrintfulAppSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/admin-settings/printful-oauth`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrintfulAppSettings((prev) => ({
        ...prev,
        ...response.data,
        client_secret: '',
      }));
    } catch (error) {
      console.error('Error loading Printful app settings:', error);
    }
  };

  const saveJohnny5Settings = async (newSettings) => {
    setJohnny5Saving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/api/admin-settings/johnny5`, newSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.api_key) {
        setJohnny5Settings(prev => ({ ...prev, api_key: response.data.api_key }));
      }
      
      toast({ 
        title: 'Settings Saved', 
        description: 'Johnny 5 Portal settings updated successfully.' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to save Johnny 5 settings.', 
        variant: 'destructive' 
      });
    } finally {
      setJohnny5Saving(false);
    }
  };

  const saveSiteSettings = async (newSettings) => {
    setSiteFlagsSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/api/admin-settings/site`, newSettings, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast({
        title: 'Feature Flag Updated',
        description: 'Checkout and registration access rules updated.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update feature flag.',
        variant: 'destructive',
      });
      await loadSiteSettings();
    } finally {
      setSiteFlagsSaving(false);
    }
  };

  const handleSiteFlagToggle = (field) => {
    const updated = { ...siteSettings, [field]: !siteSettings[field] };
    setSiteSettings(updated);
    saveSiteSettings(updated);
  };

  const handleJohnny5Toggle = (field) => {
    const newSettings = { ...johnny5Settings, [field]: !johnny5Settings[field] };
    setJohnny5Settings(newSettings);
    saveJohnny5Settings(newSettings);
  };

  const regenerateApiKey = async () => {
    setJohnny5Saving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/api/admin-settings/johnny5/regenerate-key`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setJohnny5Settings(prev => ({ ...prev, api_key: response.data.api_key }));
      
      toast({ 
        title: 'Key Regenerated', 
        description: 'New API key generated and saved to .env. Update Johnny 5 hub with the new key.' 
      });
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: 'Failed to regenerate API key.', 
        variant: 'destructive' 
      });
    } finally {
      setJohnny5Saving(false);
    }
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText(johnny5Settings.api_key);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
    toast({ title: 'Copied', description: 'API key copied to clipboard.' });
  };

  const savePrintfulAppSettings = async () => {
    if (!printfulAppSettings.client_id.trim()) {
      toast({ title: 'Missing Client ID', description: 'Printful Client ID is required.', variant: 'destructive' });
      return;
    }

    if (!printfulAppSettings.client_secret.trim() && !printfulAppSettings.configured) {
      toast({ title: 'Missing Client Secret', description: 'Printful Client Secret is required.', variant: 'destructive' });
      return;
    }

    setPrintfulAppSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${API}/api/admin-settings/printful-oauth`, {
        client_id: printfulAppSettings.client_id.trim(),
        client_secret: printfulAppSettings.client_secret.trim(),
        callback_url: printfulAppSettings.callback_url.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setPrintfulAppSettings((prev) => ({
        ...prev,
        configured: true,
        client_secret: '',
        client_secret_masked: response.data?.client_secret_masked || prev.client_secret_masked,
        callback_url: response.data?.callback_url || prev.callback_url,
      }));
      toast({ title: 'Printful App Saved', description: 'Client ID and Secret are ready for store-owner OAuth login.' });
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to save Printful app settings.', variant: 'destructive' });
    } finally {
      setPrintfulAppSaving(false);
    }
  };

  const categories = [...new Set(featureDefinitions.map(f => f.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl" data-testid="dev-feature-flags">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ToggleLeft className="w-7 h-7 text-[#6e2ea8]" />
            Feature Flags
          </h2>
          <p className="text-gray-500 mt-1">Enable or disable features across the platform</p>
        </div>
      </div>

      {/* Johnny 5 Portal Feature Flags */}
      <Card className="mb-4 border-purple-200 bg-purple-50/30" data-testid="checkout-registration-feature-flags">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-[#6e2ea8]" />
            Checkout & Registration Access
          </CardTitle>
          <CardDescription>
            Controls for account-required checkout and registration verification behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border" data-testid="feature-flag-register-to-shop-row">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">User must register to shop (price visibility + checkout)</p>
                <Badge variant={siteSettings.require_account_for_checkout ? 'default' : 'secondary'}>
                  {siteSettings.require_account_for_checkout ? 'ON' : 'OFF'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                When ON, guest users can browse, but product prices are hidden and checkout requires registration.
              </p>
            </div>
            <Switch
              checked={siteSettings.require_account_for_checkout}
              onCheckedChange={() => handleSiteFlagToggle('require_account_for_checkout')}
              disabled={siteFlagsSaving}
              data-testid="feature-flag-register-to-shop-toggle"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-lg border" data-testid="feature-flag-email-verify-row">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Require email verification code at registration/checkout flow</p>
                <Badge variant={siteSettings.require_email_verification_for_registration ? 'default' : 'secondary'}>
                  {siteSettings.require_email_verification_for_registration ? 'ON' : 'OFF'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                When ON, new users receive a 6-digit code and must verify before account activation.
              </p>
            </div>
            <Switch
              checked={siteSettings.require_email_verification_for_registration}
              onCheckedChange={() => handleSiteFlagToggle('require_email_verification_for_registration')}
              disabled={siteFlagsSaving}
              data-testid="feature-flag-email-verification-toggle"
            />
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon / Password Gate Settings */}
      <Card className="mb-4 border-blue-200 bg-blue-50/30" data-testid="coming-soon-feature-flags">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-blue-600" />
            Coming Soon / Password Gate
          </CardTitle>
          <CardDescription>
            Control the site preview password gate for visitors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border" data-testid="feature-flag-coming-soon-row">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Enable Coming Soon Password Gate</p>
                <Badge variant={featureFlags.coming_soon_enabled ? 'default' : 'secondary'}>
                  {featureFlags.coming_soon_enabled ? 'ON' : 'OFF'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                When ON, visitors must enter a password to access the site. When OFF, the site is fully open.
              </p>
            </div>
            <Switch
              checked={featureFlags.coming_soon_enabled}
              onCheckedChange={() => handleFeatureFlagToggle('coming_soon_enabled')}
              disabled={featureFlagsSaving}
              data-testid="feature-flag-coming-soon-toggle"
            />
          </div>

          {featureFlags.coming_soon_enabled && (
            <div className="p-4 bg-white rounded-lg border">
              <Label htmlFor="coming-soon-password" className="text-sm font-medium">
                Site Password
              </Label>
              <p className="text-sm text-gray-500 mb-2">
                Visitors will need this password to access the site
              </p>
              <div className="flex gap-2">
                <Input
                  id="coming-soon-password"
                  type="text"
                  value={featureFlags.coming_soon_password}
                  onChange={(e) => setFeatureFlags(prev => ({ ...prev, coming_soon_password: e.target.value }))}
                  placeholder="Enter site password"
                  className="max-w-xs"
                  data-testid="coming-soon-password-input"
                />
                <Button
                  onClick={async () => {
                    setFeatureFlagsSaving(true);
                    try {
                      const token = localStorage.getItem('token');
                      await axios.put(`${API}/api/admin-settings/feature-flags`, featureFlags, {
                        headers: { Authorization: `Bearer ${token}` },
                      });
                      toast({ title: 'Password Saved', description: 'Site password has been updated' });
                    } catch (error) {
                      toast({ title: 'Error', description: 'Failed to save password', variant: 'destructive' });
                    } finally {
                      setFeatureFlagsSaving(false);
                    }
                  }}
                  disabled={featureFlagsSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-testid="coming-soon-password-save-btn"
                >
                  {featureFlagsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Password'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4 border-fuchsia-200 bg-fuchsia-50/30" data-testid="printful-oauth-dev-settings-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ToggleLeft className="w-5 h-5 text-fuchsia-600" />
            Printful OAuth App
          </CardTitle>
          <CardDescription>
            Add the shared Printful Client ID and Secret here. Store owners will log into Printful from the admin fulfillment page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="printful-client-id">Printful Client ID</Label>
            <Input
              id="printful-client-id"
              value={printfulAppSettings.client_id}
              onChange={(e) => setPrintfulAppSettings((prev) => ({ ...prev, client_id: e.target.value }))}
              placeholder="Printful public app client id"
              data-testid="printful-client-id-input"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="printful-client-secret">Printful Client Secret</Label>
            <Input
              id="printful-client-secret"
              type="password"
              value={printfulAppSettings.client_secret}
              onChange={(e) => setPrintfulAppSettings((prev) => ({ ...prev, client_secret: e.target.value }))}
              placeholder={printfulAppSettings.configured ? 'Leave blank to keep existing secret' : 'Printful public app client secret'}
              data-testid="printful-client-secret-input"
            />
            {printfulAppSettings.client_secret_masked && (
              <p className="text-xs text-gray-500" data-testid="printful-client-secret-masked">Saved secret: {printfulAppSettings.client_secret_masked}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="printful-callback-url">Manual Callback URL</Label>
            <Input
              id="printful-callback-url"
              value={printfulAppSettings.callback_url}
              onChange={(e) => setPrintfulAppSettings((prev) => ({ ...prev, callback_url: e.target.value }))}
              placeholder={`${API}/api/printful/callback`}
              data-testid="printful-callback-url-input"
            />
            <p className="text-xs text-gray-500" data-testid="printful-callback-url-help">
              Enter the exact callback URL for the site you want to test. If left blank, the current site URL will be used automatically.
            </p>
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3" data-testid="printful-callback-url-whitelist-note">
              <p className="text-xs font-semibold text-amber-900">Important: add this exact URL to your Printful app Redirect URLs whitelist.</p>
              <p className="text-xs text-amber-800 mt-1">
                It must match exactly, including <strong>https</strong>, domain, and <strong>/api/printful/callback</strong>. A bare domain like <strong>https://123bots.com</strong> will not work.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-fuchsia-300 bg-white p-4" data-testid="printful-redirect-uri-card">
            <p className="text-sm font-medium text-fuchsia-900">Current callback that will be used</p>
            <p className="text-xs text-fuchsia-700 mt-1">{printfulAppSettings.callback_url || `${API}/api/printful/callback`}</p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={printfulAppSettings.configured ? 'default' : 'secondary'} data-testid="printful-app-configured-status-badge">
              {printfulAppSettings.configured ? 'Configured' : 'Not configured'}
            </Badge>
            <Button
              onClick={savePrintfulAppSettings}
              disabled={printfulAppSaving}
              className="bg-fuchsia-600 hover:bg-fuchsia-700"
              data-testid="printful-app-save-button"
            >
              {printfulAppSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Printful App
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Johnny 5 Portal Feature Flags */}
      <Card className="mb-4 border-amber-200 bg-amber-50/30" data-testid="johnny5-feature-flags">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Johnny 5 Portal
          </CardTitle>
          <CardDescription>
            Multi-store fulfillment hub configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Toggle 1: Show Menu */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Show Johnny 5 Menu</p>
                <Badge variant={johnny5Settings.show_menu ? 'default' : 'secondary'}>
                  {johnny5Settings.show_menu ? 'Visible' : 'Hidden'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Display the Johnny 5 Portal menu item in the admin sidebar
              </p>
            </div>
            <Switch
              checked={johnny5Settings.show_menu}
              onCheckedChange={() => handleJohnny5Toggle('show_menu')}
              disabled={johnny5Saving}
              data-testid="johnny5-show-menu-toggle"
            />
          </div>

          {/* Toggle 2: Integration Enabled */}
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Enable Johnny 5 Integration</p>
                <Badge variant={johnny5Settings.integration_enabled ? 'default' : 'secondary'}>
                  {johnny5Settings.integration_enabled ? 'Connected' : 'Standalone'}
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Connect this cart to the Johnny 5 fulfillment system for orders and shipping sync
              </p>
            </div>
            <Switch
              checked={johnny5Settings.integration_enabled}
              onCheckedChange={() => handleJohnny5Toggle('integration_enabled')}
              disabled={johnny5Saving}
              data-testid="johnny5-integration-toggle"
            />
          </div>

          {/* API Credentials (shown when integration is enabled) */}
          {johnny5Settings.integration_enabled && johnny5Settings.api_key && (
            <div className="p-4 bg-white rounded-lg border border-amber-300">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-amber-800">API Key (auto-saved to .env)</Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={regenerateApiKey}
                  disabled={johnny5Saving}
                  className="h-7 text-xs"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${johnny5Saving ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-50 rounded border text-sm font-mono text-gray-700 truncate">
                  {johnny5Settings.api_key}
                </code>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyApiKey}
                  className="flex-shrink-0"
                >
                  {apiKeyCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                Use this key to authenticate API requests from connected stores
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Other Feature Categories */}
      {categories.map((category) => (
        <Card key={category} className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">{category}</CardTitle>
            <CardDescription>
              {featureDefinitions.filter(f => f.category === category && featureFlags[f.id]).length} of {featureDefinitions.filter(f => f.category === category).length} enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featureDefinitions.filter(f => f.category === category).map((feature) => (
                <div key={feature.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{feature.name}</p>
                      <Badge variant={featureFlags[feature.id] ? 'default' : 'secondary'}>
                        {featureFlags[feature.id] ? 'Enabled' : 'Disabled'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                  </div>
                  <Switch 
                    checked={featureFlags[feature.id]} 
                    onCheckedChange={() => handleFeatureFlagToggle(feature.id)}
                    disabled={featureFlagsSaving}
                    data-testid={`feature-flag-toggle-${feature.id}`}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default DevFeatureFlags;
