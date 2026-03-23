import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Package, Truck, Settings, CheckCircle, XCircle, Loader2, 
  DollarSign, Percent, MapPin, Save, TestTube, ChevronDown, ChevronUp,
  Ship, Box, Zap, Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from '../../hooks/use-toast';
import AdminLocalPickupSettings from '../../components/admin/AdminLocalPickupSettings';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const AdminShippingSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingProvider, setTestingProvider] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState({});
  
  const [settings, setSettings] = useState({
    active_provider: '',
    // Shippo
    shippo_api_key: '',
    shippo_enabled: false,
    // EasyPost
    easypost_api_key: '',
    easypost_enabled: false,
    // ShipStation
    shipstation_api_key: '',
    shipstation_api_secret: '',
    shipstation_enabled: false,
    // Stamps.com
    stamps_integration_id: '',
    stamps_username: '',
    stamps_password: '',
    stamps_enabled: false,
    // Upcharge
    global_upcharge_type: 'none',
    global_upcharge_amount: 0,
    // Free shipping
    free_shipping_enabled: true,
    free_shipping_threshold: 100,
    free_shipping_service: 'USPS First Class',
    // Origin address
    origin_name: 'Gingerkare Custom Emporium',
    origin_street1: '',
    origin_street2: '',
    origin_city: '',
    origin_state: '',
    origin_zip: '',
    origin_country: 'US',
    origin_phone: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/shipping/settings`);
      setSettings(prev => ({ ...prev, ...response.data }));
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/shipping/settings`, settings);
      toast({ title: 'Success', description: 'Shipping settings saved successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
    setSaving(false);
  };

  const testConnection = async (provider) => {
    setTestingProvider(provider);
    try {
      const response = await axios.post(`${API}/shipping/test-connection/${provider}`);
      setConnectionStatus(prev => ({
        ...prev,
        [provider]: response.data.success ? 'success' : 'failed'
      }));
      toast({
        title: response.data.success ? 'Connection Successful' : 'Connection Failed',
        description: response.data.success 
          ? `${provider} API is working correctly` 
          : `Could not connect to ${provider} API`,
        variant: response.data.success ? 'default' : 'destructive'
      });
    } catch (error) {
      setConnectionStatus(prev => ({ ...prev, [provider]: 'failed' }));
      toast({
        title: 'Connection Failed',
        description: error.response?.data?.detail || 'Could not connect to API',
        variant: 'destructive'
      });
    }
    setTestingProvider(null);
  };

  const updateSetting = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="shipping-settings-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipping Settings</h1>
          <p className="text-gray-500">Configure shipping providers, rates, and fulfillment options</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList className="bg-gray-100">
          <TabsTrigger value="providers" className="data-[state=active]:bg-white">
            <Package className="w-4 h-4 mr-2" />
            Providers
          </TabsTrigger>
          <TabsTrigger value="rates" className="data-[state=active]:bg-white">
            <DollarSign className="w-4 h-4 mr-2" />
            Rates & Upcharges
          </TabsTrigger>
          <TabsTrigger value="local-pickup" className="data-[state=active]:bg-white">
            <Building className="w-4 h-4 mr-2" />
            Local Pickup
          </TabsTrigger>
          <TabsTrigger value="origin" className="data-[state=active]:bg-white">
            <MapPin className="w-4 h-4 mr-2" />
            Origin Address
          </TabsTrigger>
        </TabsList>

        {/* Providers Tab */}
        <TabsContent value="providers" className="space-y-6">
          {/* Active Provider Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-purple-600" />
                Active Provider
              </CardTitle>
              <CardDescription>
                Select which shipping provider to use for rate calculation and label generation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={settings.active_provider || 'none'} 
                onValueChange={(v) => updateSetting('active_provider', v === 'none' ? '' : v)}
              >
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Select a provider" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Provider (Use Fallback Rates)</SelectItem>
                  <SelectItem value="shippo" disabled={!settings.shippo_enabled}>
                    Shippo {!settings.shippo_enabled && '(Not Configured)'}
                  </SelectItem>
                  <SelectItem value="easypost" disabled={!settings.easypost_enabled}>
                    EasyPost {!settings.easypost_enabled && '(Not Configured)'}
                  </SelectItem>
                  <SelectItem value="shipstation" disabled={!settings.shipstation_enabled}>
                    ShipStation {!settings.shipstation_enabled && '(Not Configured)'}
                  </SelectItem>
                  <SelectItem value="stamps" disabled={!settings.stamps_enabled}>
                    Stamps.com {!settings.stamps_enabled && '(Not Configured)'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Shippo */}
          <Card className={settings.active_provider === 'shippo' ? 'ring-2 ring-purple-500' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Ship className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Shippo</CardTitle>
                    <CardDescription>USPS, UPS, FedEx discounted rates</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {connectionStatus.shippo === 'success' && (
                    <Badge className="bg-green-100 text-green-700">Connected</Badge>
                  )}
                  {connectionStatus.shippo === 'failed' && (
                    <Badge className="bg-red-100 text-red-700">Failed</Badge>
                  )}
                  <Switch
                    checked={settings.shippo_enabled}
                    onCheckedChange={(v) => updateSetting('shippo_enabled', v)}
                  />
                </div>
              </div>
            </CardHeader>
            {settings.shippo_enabled && (
              <CardContent className="space-y-4">
                <div>
                  <Label>API Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="password"
                      value={settings.shippo_api_key}
                      onChange={(e) => updateSetting('shippo_api_key', e.target.value)}
                      placeholder="shippo_live_xxxxx or shippo_test_xxxxx"
                      className="flex-1 font-mono"
                    />
                    <Button
                      variant="outline"
                      onClick={() => testConnection('shippo')}
                      disabled={testingProvider === 'shippo' || !settings.shippo_api_key}
                    >
                      {testingProvider === 'shippo' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                      Test
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Get your API key &amp; your first $50.00 shipping included{' '}
                    <a
                      href="https://try.shippo.com/8m3s303ic0qk"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                      data-testid="shippo-api-key-offer-link"
                    >
                      Here
                    </a>
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* EasyPost */}
          <Card className={settings.active_provider === 'easypost' ? 'ring-2 ring-purple-500' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Box className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>EasyPost</CardTitle>
                    <CardDescription>100+ carriers, enterprise features</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {connectionStatus.easypost === 'success' && (
                    <Badge className="bg-green-100 text-green-700">Connected</Badge>
                  )}
                  {connectionStatus.easypost === 'failed' && (
                    <Badge className="bg-red-100 text-red-700">Failed</Badge>
                  )}
                  <Switch
                    checked={settings.easypost_enabled}
                    onCheckedChange={(v) => updateSetting('easypost_enabled', v)}
                  />
                </div>
              </div>
            </CardHeader>
            {settings.easypost_enabled && (
              <CardContent className="space-y-4">
                <div>
                  <Label>API Key</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="password"
                      value={settings.easypost_api_key}
                      onChange={(e) => updateSetting('easypost_api_key', e.target.value)}
                      placeholder="EZAKxxxxx..."
                      className="flex-1 font-mono"
                    />
                    <Button
                      variant="outline"
                      onClick={() => testConnection('easypost')}
                      disabled={testingProvider === 'easypost' || !settings.easypost_api_key}
                    >
                      {testingProvider === 'easypost' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <TestTube className="w-4 h-4" />
                      )}
                      Test
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Get your API key from <a href="https://www.easypost.com/account/api-keys" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">easypost.com/account/api-keys</a>
                  </p>
                </div>
              </CardContent>
            )}
          </Card>

          {/* ShipStation */}
          <Card className={settings.active_provider === 'shipstation' ? 'ring-2 ring-purple-500' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>ShipStation</CardTitle>
                    <CardDescription>All-in-one shipping management</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {connectionStatus.shipstation === 'success' && (
                    <Badge className="bg-green-100 text-green-700">Connected</Badge>
                  )}
                  {connectionStatus.shipstation === 'failed' && (
                    <Badge className="bg-red-100 text-red-700">Failed</Badge>
                  )}
                  <Switch
                    checked={settings.shipstation_enabled}
                    onCheckedChange={(v) => updateSetting('shipstation_enabled', v)}
                  />
                </div>
              </div>
            </CardHeader>
            {settings.shipstation_enabled && (
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>API Key</Label>
                    <Input
                      type="password"
                      value={settings.shipstation_api_key}
                      onChange={(e) => updateSetting('shipstation_api_key', e.target.value)}
                      placeholder="API Key"
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label>API Secret</Label>
                    <Input
                      type="password"
                      value={settings.shipstation_api_secret}
                      onChange={(e) => updateSetting('shipstation_api_secret', e.target.value)}
                      placeholder="API Secret"
                      className="mt-1 font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Create Your Account{' '}
                    <a
                      href="https://blue.mbsy.co/7g8N36"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                      data-testid="shipstation-account-link"
                    >
                      Here
                    </a>
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => testConnection('shipstation')}
                    disabled={testingProvider === 'shipstation' || !settings.shipstation_api_key || !settings.shipstation_api_secret}
                  >
                    {testingProvider === 'shipstation' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Stamps.com */}
          <Card className={settings.active_provider === 'stamps' ? 'ring-2 ring-purple-500' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                    <Building className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle>Stamps.com</CardTitle>
                    <CardDescription>USPS postage &amp; shipping labels</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {connectionStatus.stamps === 'success' && (
                    <Badge className="bg-green-100 text-green-700">Connected</Badge>
                  )}
                  {connectionStatus.stamps === 'failed' && (
                    <Badge className="bg-red-100 text-red-700">Failed</Badge>
                  )}
                  <Switch
                    checked={settings.stamps_enabled}
                    onCheckedChange={(v) => updateSetting('stamps_enabled', v)}
                  />
                </div>
              </div>
            </CardHeader>
            {settings.stamps_enabled && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Integration ID</Label>
                  <Input
                    type="text"
                    value={settings.stamps_integration_id}
                    onChange={(e) => updateSetting('stamps_integration_id', e.target.value)}
                    placeholder="Your Integration ID"
                    className="mt-1 font-mono"
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Username</Label>
                    <Input
                      type="text"
                      value={settings.stamps_username}
                      onChange={(e) => updateSetting('stamps_username', e.target.value)}
                      placeholder="Stamps.com username"
                      className="mt-1 font-mono"
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input
                      type="password"
                      value={settings.stamps_password}
                      onChange={(e) => updateSetting('stamps_password', e.target.value)}
                      placeholder="Stamps.com password"
                      className="mt-1 font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-500">
                    Get API credentials from{' '}
                    <a
                      href="https://developer.stamps.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline"
                    >
                      developer.stamps.com
                    </a>
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => testConnection('stamps')}
                    disabled={testingProvider === 'stamps' || !settings.stamps_integration_id || !settings.stamps_username || !settings.stamps_password}
                  >
                    {testingProvider === 'stamps' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <TestTube className="w-4 h-4" />
                    )}
                    Test Connection
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </TabsContent>

        {/* Rates & Upcharges Tab */}
        <TabsContent value="rates" className="space-y-6">
          {/* Free Shipping */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5 text-green-600" />
                    Free Shipping
                  </CardTitle>
                  <CardDescription>Offer free ground shipping on orders over a threshold</CardDescription>
                </div>
                <Switch
                  checked={settings.free_shipping_enabled}
                  onCheckedChange={(v) => updateSetting('free_shipping_enabled', v)}
                />
              </div>
            </CardHeader>
            {settings.free_shipping_enabled && (
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Minimum Order Amount</Label>
                    <div className="relative mt-1">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        type="number"
                        value={settings.free_shipping_threshold}
                        onChange={(e) => updateSetting('free_shipping_threshold', parseFloat(e.target.value) || 0)}
                        className="pl-9"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Orders over this amount get free ground shipping</p>
                  </div>
                  <div>
                    <Label>Free Shipping Service</Label>
                    <Select 
                      value={settings.free_shipping_service} 
                      onValueChange={(v) => updateSetting('free_shipping_service', v)}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USPS First Class">USPS First Class (3-5 days)</SelectItem>
                        <SelectItem value="USPS Ground Advantage">USPS Ground Advantage (2-5 days)</SelectItem>
                        <SelectItem value="UPS Ground">UPS Ground (1-5 days)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Global Upcharge */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                Shipping Upcharge
              </CardTitle>
              <CardDescription>Add a markup to all shipping rates (handling fee)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Upcharge Type</Label>
                <Select 
                  value={settings.global_upcharge_type} 
                  onValueChange={(v) => updateSetting('global_upcharge_type', v)}
                >
                  <SelectTrigger className="mt-1 w-full md:w-64">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Upcharge</SelectItem>
                    <SelectItem value="flat">Flat Amount ($)</SelectItem>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {settings.global_upcharge_type !== 'none' && (
                <div>
                  <Label>
                    {settings.global_upcharge_type === 'flat' ? 'Flat Amount' : 'Percentage'}
                  </Label>
                  <div className="relative mt-1">
                    {settings.global_upcharge_type === 'flat' ? (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    ) : (
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <Input
                      type="number"
                      value={settings.global_upcharge_amount}
                      onChange={(e) => updateSetting('global_upcharge_amount', parseFloat(e.target.value) || 0)}
                      className="pl-9 w-full md:w-64"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {settings.global_upcharge_type === 'flat' 
                      ? 'This amount will be added to every shipping rate'
                      : 'This percentage will be added to every shipping rate'
                    }
                  </p>
                </div>
              )}

              {settings.global_upcharge_type !== 'none' && settings.global_upcharge_amount > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <p className="text-sm text-purple-700">
                    <strong>Example:</strong> A $10.00 shipping rate will be charged as{' '}
                    <strong>
                      ${settings.global_upcharge_type === 'flat' 
                        ? (10 + settings.global_upcharge_amount).toFixed(2)
                        : (10 * (1 + settings.global_upcharge_amount / 100)).toFixed(2)
                      }
                    </strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Local Pickup Tab */}
        <TabsContent value="local-pickup" className="space-y-6">
          <AdminLocalPickupSettings />
        </TabsContent>

        {/* Origin Address Tab */}
        <TabsContent value="origin" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-purple-600" />
                Ship From Address
              </CardTitle>
              <CardDescription>This address will be used as the origin for all shipments</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Business Name</Label>
                  <Input
                    value={settings.origin_name}
                    onChange={(e) => updateSetting('origin_name', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Street Address</Label>
                  <Input
                    value={settings.origin_street1}
                    onChange={(e) => updateSetting('origin_street1', e.target.value)}
                    placeholder="Street address"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Address Line 2 (Optional)</Label>
                  <Input
                    value={settings.origin_street2 || ''}
                    onChange={(e) => updateSetting('origin_street2', e.target.value)}
                    placeholder="Suite, unit, building, etc."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    value={settings.origin_city}
                    onChange={(e) => updateSetting('origin_city', e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>State</Label>
                  <Input
                    value={settings.origin_state}
                    onChange={(e) => updateSetting('origin_state', e.target.value)}
                    placeholder="AL"
                    maxLength={2}
                    className="mt-1 uppercase"
                  />
                </div>
                <div>
                  <Label>ZIP Code</Label>
                  <Input
                    value={settings.origin_zip}
                    onChange={(e) => updateSetting('origin_zip', e.target.value)}
                    placeholder="36301"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={settings.origin_phone || ''}
                    onChange={(e) => updateSetting('origin_phone', e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminShippingSettings;
