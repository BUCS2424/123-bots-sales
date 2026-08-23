import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Mail, Save, Send, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DevEmailSettings = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState({
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: '',
    from_name: '123Bots',
    use_tls: true,
  });
  const [isConfigured, setIsConfigured] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [token]);

  const loadSettings = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${BACKEND_URL}/api/settings/smtp`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSettings({
        smtp_host: response.data.smtp_host || '',
        smtp_port: response.data.smtp_port || 587,
        smtp_username: response.data.smtp_username || '',
        smtp_password: '', // Never returned from API
        from_email: response.data.from_email || '',
        from_name: response.data.from_name || '123Bots',
        use_tls: response.data.use_tls ?? true,
      });
      setIsConfigured(response.data.is_configured || false);
      setPasswordSet(response.data.smtp_password_set || false);
    } catch (error) {
      console.error('Error loading SMTP settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${BACKEND_URL}/api/settings/smtp`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Settings Saved',
        description: 'SMTP settings have been updated successfully.',
      });
      setIsConfigured(true);
      if (settings.smtp_password) {
        setPasswordSet(true);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save settings.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/settings/smtp/test`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Test Email Sent',
        description: response.data.message,
      });
    } catch (error) {
      toast({
        title: 'Test Failed',
        description: error.response?.data?.detail || 'Failed to send test email.',
        variant: 'destructive'
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Email Settings</h2>
        <p className="text-gray-500">Configure SMTP settings for sending emails (verification, notifications, receipts)</p>
      </div>

      {/* Status Banner */}
      <div className={`p-4 rounded-lg flex items-center gap-3 ${isConfigured ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
        {isConfigured ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">SMTP is configured and ready to send emails</span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-700 font-medium">SMTP not configured - emails will not be sent</span>
          </>
        )}
      </div>

      {/* SMTP Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            SMTP Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                placeholder="smtp.example.com"
                value={settings.smtp_host}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input
                type="number"
                placeholder="587"
                value={settings.smtp_port}
                onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) || 587 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                placeholder="your-email@example.com"
                value={settings.smtp_username}
                onChange={(e) => setSettings({ ...settings, smtp_username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Password {passwordSet && <span className="text-green-600 text-xs">(currently set)</span>}</Label>
              <Input
                type="password"
                placeholder={passwordSet ? "••••••••" : "Enter password"}
                value={settings.smtp_password}
                onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
              />
              {passwordSet && (
                <p className="text-xs text-gray-500">Leave blank to keep existing password</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>From Email</Label>
              <Input
                placeholder="noreply@123bots.com"
                value={settings.from_email}
                onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>From Name</Label>
              <Input
                placeholder="123Bots"
                value={settings.from_name}
                onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label>Use TLS Encryption</Label>
              <p className="text-sm text-gray-500">Enable STARTTLS for secure connection (recommended)</p>
            </div>
            <Switch
              checked={settings.use_tls}
              onCheckedChange={(checked) => setSettings({ ...settings, use_tls: checked })}
            />
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleTestEmail} 
              disabled={testing || !isConfigured}
            >
              {testing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Test Email
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Email Templates Info */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 mb-4">
            The following email templates are used by the system:
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Email Verification</p>
                <p className="text-sm text-gray-500">Sent when users register</p>
              </div>
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Order Confirmation</p>
                <p className="text-sm text-gray-500">Sent after successful order</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Password Reset</p>
                <p className="text-sm text-gray-500">Sent for password recovery</p>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Coming Soon</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevEmailSettings;
