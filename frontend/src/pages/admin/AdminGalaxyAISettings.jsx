import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Sparkles, ExternalLink, Key, Save, Loader2, Eye, EyeOff,
  CheckCircle, AlertCircle, Zap, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminGalaxyAISettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    api_key: '',
    model: 'gpt-4',
    max_tokens: 2000,
    temperature: 0.7
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin-settings/galaxy-ai`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (error) {
      console.error('Failed to load Galaxy AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/admin-settings/galaxy-ai`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Settings Saved',
        description: 'Galaxy AI settings have been updated.'
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save Galaxy AI settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const maskApiKey = (key) => {
    if (!key) return '';
    if (key.length <= 8) return '••••••••';
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-galaxy-ai-settings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            Galaxy AI Settings
          </h1>
          <p className="text-gray-500">Configure AI-powered features for your store</p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-[rgb(37, 99, 235)] hover:bg-[#a01830]"
          data-testid="save-galaxy-settings-btn"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      {/* Get API Key Card */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-600 rounded-xl text-white">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Get Your Galaxy AI Key</h3>
                <p className="text-gray-600 mt-1">
                  Power your store with advanced AI capabilities. Generate product descriptions, 
                  analyze customer data, and automate tasks.
                </p>
              </div>
            </div>
            <a
              href="https://galaxy.ai/?ref=melvingn"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shrink-0"
              data-testid="get-ai-key-link"
            >
              <Zap className="w-5 h-5" />
              Get Your AI Key Here
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">API Configuration</CardTitle>
          <CardDescription>Enter your Galaxy AI credentials to enable AI features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Galaxy AI</Label>
              <p className="text-xs text-gray-500">Turn on AI-powered features across your store</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enabled: checked }))}
              data-testid="galaxy-ai-enabled-switch"
            />
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">API Key</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="api-key"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter your Galaxy AI API key"
                    value={settings.api_key}
                    onChange={(e) => setSettings(prev => ({ ...prev, api_key: e.target.value }))}
                    className="pr-10"
                    data-testid="galaxy-api-key-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Your API key is stored securely and never shared with third parties.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="model">AI Model</Label>
                <select
                  id="model"
                  value={settings.model}
                  onChange={(e) => setSettings(prev => ({ ...prev, model: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  data-testid="galaxy-model-select"
                >
                  <option value="gpt-4">GPT-4 (Most Capable)</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo (Faster)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Budget)</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-tokens">Max Tokens</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min="100"
                  max="8000"
                  value={settings.max_tokens}
                  onChange={(e) => setSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 2000 }))}
                  data-testid="galaxy-max-tokens-input"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {settings.enabled && settings.api_key ? (
              <>
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-green-700">Galaxy AI is Active</p>
                  <p className="text-sm text-gray-500">AI features are enabled and ready to use</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-amber-700">Galaxy AI is Inactive</p>
                  <p className="text-sm text-gray-500">
                    {!settings.api_key 
                      ? 'Add your API key to enable AI features' 
                      : 'Enable the toggle above to activate AI features'}
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            AI Features & Pricing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Product Descriptions</h4>
              <p className="text-sm text-gray-500">Auto-generate compelling product descriptions from basic info</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Category Fields</h4>
              <p className="text-sm text-gray-500">AI suggests custom fields for each product category</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Price Suggestions</h4>
              <p className="text-sm text-gray-500">Get market-based pricing recommendations</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Customer Insights</h4>
              <p className="text-sm text-gray-500">Analyze customer behavior and trends</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Pricing is based on API usage. Visit Galaxy AI for detailed pricing information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminGalaxyAISettings;
