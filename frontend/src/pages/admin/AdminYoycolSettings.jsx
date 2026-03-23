import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Loader2, Save, CheckCircle, AlertCircle, Link2, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../hooks/use-toast';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AdminYoycolSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [maskedAccessKey, setMaskedAccessKey] = useState('');
  const [maskedSecretKey, setMaskedSecretKey] = useState('');
  const [lastValidationStatus, setLastValidationStatus] = useState('');
  const [lastValidationMessage, setLastValidationMessage] = useState('');
  const [form, setForm] = useState({ access_key: '', secret_key: '' });

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const flagsRes = await axios.get(`${API}/settings/feature-flags`);
      const enabled = Boolean(flagsRes.data?.yoycol_enabled);
      setFeatureEnabled(enabled);

      if (!enabled && !isSuperAdmin) {
        setLoading(false);
        return;
      }

      const credentialsRes = await axios.get(`${API}/yoycol/credentials`, { headers: authHeaders });
      const data = credentialsRes.data || {};
      setConfigured(Boolean(data.configured));
      setMaskedAccessKey(data.access_key_masked || '');
      setMaskedSecretKey(data.secret_key_masked || '');
      setLastValidationStatus(data.last_validation_status || '');
    } catch (error) {
      toast({
        title: 'Load Failed',
        description: error.response?.data?.detail || 'Could not load YOYCOL settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSave = async () => {
    if (!form.access_key.trim() || !form.secret_key.trim()) {
      toast({
        title: 'Missing fields',
        description: 'Access Key and Secret Key are required.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      await axios.put(`${API}/yoycol/credentials`, {
        access_key: form.access_key.trim(),
        secret_key: form.secret_key.trim(),
      }, { headers: authHeaders });

      toast({ title: 'Saved', description: 'YOYCOL credentials saved successfully.' });
      setForm({ access_key: '', secret_key: '' });
      await loadData();
    } catch (error) {
      toast({
        title: 'Save failed',
        description: error.response?.data?.detail || 'Could not save YOYCOL credentials.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const onValidate = async () => {
    const useStored = !form.access_key.trim() && !form.secret_key.trim();

    if (!useStored && (!form.access_key.trim() || !form.secret_key.trim())) {
      toast({
        title: 'Validation needs complete fields',
        description: 'Fill both fields, or clear them and validate saved credentials.',
        variant: 'destructive',
      });
      return;
    }

    if (useStored && !configured) {
      toast({
        title: 'No saved credentials',
        description: 'Save credentials first before using saved validation.',
        variant: 'destructive',
      });
      return;
    }

    setValidating(true);
    try {
      const response = await axios.post(`${API}/yoycol/validate`, {
        use_stored: useStored,
        access_key: useStored ? undefined : form.access_key.trim(),
        secret_key: useStored ? undefined : form.secret_key.trim(),
      }, { headers: authHeaders });

      setLastValidationStatus(response.data?.last_validation_status || (response.data?.valid ? 'valid' : 'invalid'));
      setLastValidationMessage(response.data?.message || 'Validation completed.');

      toast({
        title: response.data?.valid ? 'Connected' : 'Validation failed',
        description: response.data?.message || 'Validation completed.',
        variant: response.data?.valid ? 'default' : 'destructive',
      });

      await loadData();
    } catch (error) {
      const message = error.response?.data?.detail || 'Validation failed.';
      setLastValidationStatus('invalid');
      setLastValidationMessage(message);
      toast({ title: 'Validation failed', description: message, variant: 'destructive' });
    } finally {
      setValidating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="yoycol-settings-loading">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  if (!featureEnabled && !isSuperAdmin) {
    return (
      <Card className="max-w-3xl" data-testid="yoycol-feature-disabled-card">
        <CardHeader>
          <CardTitle>YOYCOL is currently disabled</CardTitle>
          <CardDescription>
            Ask your super admin to enable <strong>yoycol_enabled</strong> in Dev Feature Flags.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl space-y-6" data-testid="yoycol-settings-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" data-testid="yoycol-settings-title">YOYCOL Integration</h1>
        <p className="text-gray-500 mt-1" data-testid="yoycol-settings-subtitle">Save and validate your store-specific YOYCOL API credentials.</p>
      </div>

      {!featureEnabled && isSuperAdmin && (
        <Alert data-testid="yoycol-superadmin-disabled-alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            YOYCOL feature flag is OFF for store owners. You can still configure keys here as super admin.
          </AlertDescription>
        </Alert>
      )}

      <Card data-testid="yoycol-credentials-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> API Credentials</CardTitle>
          <CardDescription>Required fields: Access Key and Secret Key.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="yoycol-access-key">YOYCOL Access Key</Label>
            <Input
              id="yoycol-access-key"
              type="password"
              value={form.access_key}
              onChange={(e) => setForm((prev) => ({ ...prev, access_key: e.target.value }))}
              placeholder={configured ? 'Enter new access key to replace existing one' : 'ak_...'}
              data-testid="yoycol-access-key-input"
            />
            {configured && maskedAccessKey && (
              <p className="text-xs text-gray-500" data-testid="yoycol-access-key-masked">Saved access key: {maskedAccessKey}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2">
            <Label htmlFor="yoycol-secret-key">YOYCOL Secret Key</Label>
            <Input
              id="yoycol-secret-key"
              type="password"
              value={form.secret_key}
              onChange={(e) => setForm((prev) => ({ ...prev, secret_key: e.target.value }))}
              placeholder={configured ? 'Enter new secret key to replace existing one' : 'sk_...'}
              data-testid="yoycol-secret-key-input"
            />
            {configured && maskedSecretKey && (
              <p className="text-xs text-gray-500" data-testid="yoycol-secret-key-masked">Saved secret key: {maskedSecretKey}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-2" data-testid="yoycol-action-buttons">
            <Button
              onClick={onSave}
              disabled={saving}
              className="bg-[#6e2ea8] hover:bg-[#5a238a]"
              data-testid="yoycol-save-credentials-button"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Credentials
            </Button>
            <Button
              variant="outline"
              onClick={onValidate}
              disabled={validating}
              data-testid="yoycol-validate-credentials-button"
            >
              {validating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />} Validate Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="yoycol-status-card">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="text-sm text-gray-700" data-testid="yoycol-credential-configured-status">
            Credentials configured: <strong>{configured ? 'Yes' : 'No'}</strong>
          </div>
          <div className="text-sm text-gray-700" data-testid="yoycol-last-validation-status">
            Last validation: <strong>{lastValidationStatus || 'Not tested yet'}</strong>
          </div>
          {lastValidationMessage && (
            <div className="text-sm flex items-center gap-2" data-testid="yoycol-last-validation-message">
              {lastValidationStatus === 'valid' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-600" />
              )}
              <span>{lastValidationMessage}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminYoycolSettings;