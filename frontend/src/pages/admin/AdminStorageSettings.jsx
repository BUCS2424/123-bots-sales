import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Cloud, Key, Database, Globe, Check, X, Loader2, Eye, EyeOff, TestTube, Save, Lock, Pencil
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminStorageSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [isLocked, setIsLocked] = useState(true); // Card is locked by default
  
  const [settings, setSettings] = useState({
    endpoint_url: '',
    access_key: '',
    secret_key: '',
    bucket_name: '',
    region: 'us-east-1',
    public_url: '',
  });
  
  const [currentSettings, setCurrentSettings] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/storage/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSettings(response.data);
      setSettings({
        endpoint_url: response.data.endpoint_url || '',
        access_key: '', // Don't pre-fill for security
        secret_key: '',
        bucket_name: response.data.bucket_name || '',
        region: response.data.region || 'us-east-1',
        public_url: response.data.public_url || '',
      });
      // If already configured, keep locked
      setIsLocked(response.data.is_configured || false);
    } catch (error) {
      console.error('Failed to fetch storage settings:', error);
      setIsLocked(false); // Unlock if no settings exist
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Only send fields that have values (except public_url: allow clearing)
      const updateData = {};
      if (settings.endpoint_url) updateData.endpoint_url = settings.endpoint_url;
      if (settings.access_key) updateData.access_key = settings.access_key;
      if (settings.secret_key) updateData.secret_key = settings.secret_key;
      if (settings.bucket_name) updateData.bucket_name = settings.bucket_name;
      if (settings.region) updateData.region = settings.region;
      updateData.public_url = (settings.public_url || '').trim();
      
      const response = await axios.put(`${API}/storage/settings`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCurrentSettings(response.data);
      toast({ title: 'Success', description: 'Storage settings saved successfully' });
      
      // Clear sensitive fields after save
      setSettings(prev => ({
        ...prev,
        access_key: '',
        secret_key: '',
      }));
      
      // Lock the card after successful save
      setIsLocked(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save settings',
        variant: 'destructive'
      });
    }
    setSaving(false);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/storage/test-connection`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: 'Connection successful! Your storage is working.' });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: error.response?.data?.detail || 'Failed to connect to storage',
        variant: 'destructive'
      });
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#6e2ea8] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl" data-testid="storage-settings-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Storage Settings</h1>
        <p className="text-gray-500 mt-1">Configure iDrive E2 cloud storage for product images and files</p>
      </div>

      {/* Status Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${currentSettings?.is_configured ? 'bg-green-100' : 'bg-yellow-100'}`}>
                <Cloud className={`w-5 h-5 ${currentSettings?.is_configured ? 'text-green-600' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">iDrive E2 Storage</p>
                <p className="text-sm text-gray-500">S3-compatible cloud storage</p>
              </div>
            </div>
            <Badge className={currentSettings?.is_configured ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
              {currentSettings?.is_configured ? (
                <><Check className="w-3 h-3 mr-1" /> Configured</>
              ) : (
                <><X className="w-3 h-3 mr-1" /> Not Configured</>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Form */}
      <Card className={isLocked ? 'opacity-90' : ''}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isLocked && <Lock className="w-4 h-4 text-amber-600" />}
              Configuration
            </CardTitle>
            <CardDescription>
              {isLocked 
                ? 'Storage is configured. Click Edit to modify settings.'
                : 'Enter your iDrive E2 credentials. You can find these in your iDrive E2 dashboard under "Access Keys".'
              }
            </CardDescription>
          </div>
          {isLocked && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLocked(false)}
              className="flex items-center gap-2"
              data-testid="edit-settings-btn"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {isLocked ? (
            /* Locked View - Show summary of current settings */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Endpoint URL</Label>
                  <p className="text-sm font-medium truncate">{currentSettings?.endpoint_url || 'Not set'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Bucket Name</Label>
                  <p className="text-sm font-medium">{currentSettings?.bucket_name || 'Not set'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Region</Label>
                  <p className="text-sm font-medium">{currentSettings?.region || 'Not set'}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Access Key</Label>
                  <p className="text-sm font-medium">{currentSettings?.access_key_masked || 'Not set'}</p>
                </div>
              </div>
              {currentSettings?.public_url && (
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Public URL</Label>
                  <p className="text-sm font-medium truncate">{currentSettings.public_url}</p>
                </div>
              )}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={testing || !currentSettings?.is_configured}
                  data-testid="test-connection-btn"
                >
                  {testing ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
                  ) : (
                    <><TestTube className="w-4 h-4 mr-2" /> Test Connection</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            /* Unlocked View - Show editable form */
            <>
          {/* Endpoint URL */}
          <div className="space-y-2">
            <Label htmlFor="endpoint" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              Endpoint URL
            </Label>
            <Input
              id="endpoint"
              value={settings.endpoint_url}
              onChange={(e) => setSettings({ ...settings, endpoint_url: e.target.value })}
              placeholder="https://your-endpoint.e2.idrivee2.com"
              data-testid="endpoint-input"
            />
            <p className="text-xs text-gray-500">Example: https://f7z2.c18.e2-1.dev</p>
          </div>

          {/* Bucket Name */}
          <div className="space-y-2">
            <Label htmlFor="bucket" className="flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-500" />
              Bucket Name
            </Label>
            <Input
              id="bucket"
              value={settings.bucket_name}
              onChange={(e) => setSettings({ ...settings, bucket_name: e.target.value })}
              placeholder="my-storage-bucket"
              data-testid="bucket-input"
            />
          </div>

          {/* Region */}
          <div className="space-y-2">
            <Label htmlFor="region" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              Region
            </Label>
            <Input
              id="region"
              value={settings.region}
              onChange={(e) => setSettings({ ...settings, region: e.target.value })}
              placeholder="us-central-1"
              data-testid="region-input"
            />
          </div>

          {/* Public URL (Optional) */}
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="public-url" className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-500" />
              Public Bucket URL (Optional)
            </Label>
            <Input
              id="public-url"
              value={settings.public_url}
              onChange={(e) => setSettings({ ...settings, public_url: e.target.value })}
              placeholder="https://your-bucket.region.e2.idrivee2.com"
              data-testid="public-url-input"
            />
            <p className="text-xs text-gray-500">
              Find this in your iDrive E2 dashboard under bucket settings. Leave blank to auto-generate.
            </p>
          </div>

          {/* Access Key */}
          <div className="space-y-2">
            <Label htmlFor="access-key" className="flex items-center gap-2">
              <Key className="w-4 h-4 text-gray-500" />
              Access Key ID
            </Label>
            <Input
              id="access-key"
              value={settings.access_key}
              onChange={(e) => setSettings({ ...settings, access_key: e.target.value })}
              placeholder={currentSettings?.access_key_masked || 'Enter access key'}
              data-testid="access-key-input"
            />
            {currentSettings?.access_key_masked && (
              <p className="text-xs text-gray-500">Current: {currentSettings.access_key_masked}</p>
            )}
          </div>

          {/* Secret Key */}
          <div className="space-y-2">
            <Label htmlFor="secret-key" className="flex items-center gap-2">
              <Key className="w-4 h-4 text-gray-500" />
              Secret Access Key
            </Label>
            <div className="relative">
              <Input
                id="secret-key"
                type={showSecretKey ? 'text' : 'password'}
                value={settings.secret_key}
                onChange={(e) => setSettings({ ...settings, secret_key: e.target.value })}
                placeholder="Enter secret key"
                className="pr-10"
                data-testid="secret-key-input"
              />
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#6e2ea8] hover:bg-[#a01830]"
              data-testid="save-settings-btn"
            >
              {saving ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
              ) : (
                <><Save className="w-4 h-4 mr-2" /> Save Settings</>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !currentSettings?.is_configured}
              data-testid="test-connection-btn"
            >
              {testing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Testing...</>
              ) : (
                <><TestTube className="w-4 h-4 mr-2" /> Test Connection</>
              )}
            </Button>
            {currentSettings?.is_configured && (
              <Button
                variant="ghost"
                onClick={() => setIsLocked(true)}
                className="ml-auto"
              >
                Cancel
              </Button>
            )}
          </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How to get your iDrive E2 credentials</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
            <li>Log in to your <a href="https://console.idrivee2.com/partner/a2gdesigns" target="_blank" rel="noopener noreferrer" className="text-[#0066cc] hover:underline">iDrive E2 dashboard</a></li>
            <li>Navigate to <strong>Access Keys</strong> section</li>
            <li>Create a new access key or use an existing one</li>
            <li>Copy the <strong>Endpoint URL</strong>, <strong>Access Key ID</strong>, and <strong>Secret Access Key</strong></li>
            <li>Create a bucket if you haven't already, and note the <strong>Bucket Name</strong></li>
            <li>Make sure your bucket has public read access enabled for product images</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStorageSettings;
