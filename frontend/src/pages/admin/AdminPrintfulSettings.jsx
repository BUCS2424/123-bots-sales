import React, { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { AlertCircle, ExternalLink, Link2, Loader2, RefreshCw, Store, Unplug, Wand2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../hooks/use-toast';

const isGingerkareDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('gingerkare.com');
const API = isGingerkareDomain ? `${window.location.origin}/api` : `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyStatus = {
  app_configured: false,
  connected: false,
  store_id: '',
  store_name: '',
  connected_at: '',
  last_synced_at: '',
  last_sync_count: 0,
  webhook_registered: false,
  last_webhook_error: '',
  last_error: '',
  sync_in_progress: false,
  sync_has_more: false,
};

const AdminPrintfulSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [featureEnabled, setFeatureEnabled] = useState(false);
  const [status, setStatus] = useState(emptyStatus);
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const printfulPopupRef = useRef(null);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  }, []);

  const isSuperAdmin = user?.role === 'super_admin';

  const loadData = async () => {
    setLoading(true);
    try {
      const flagsRes = await axios.get(`${API}/settings/feature-flags`);
      const printfulEnabled = Boolean(flagsRes.data?.printful_enabled);
      setFeatureEnabled(printfulEnabled);

      if (!printfulEnabled && !isSuperAdmin) {
        setLoading(false);
        return;
      }

      const statusRes = await axios.get(`${API}/printful/status`, { headers: authHeaders });
      setStatus({ ...emptyStatus, ...(statusRes.data || {}) });
    } catch (error) {
      toast({
        title: 'Load Failed',
        description: error.response?.data?.detail || 'Could not load Printful settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const printfulState = params.get('printful');
    const message = params.get('message');

    if (!printfulState) {
      return;
    }

    toast({
      title: printfulState === 'connected' ? 'Printful connected' : 'Printful connection failed',
      description: message || (printfulState === 'connected' ? 'Your store can now sync Printful products.' : 'Please try connecting again.'),
      variant: printfulState === 'connected' ? 'default' : 'destructive',
    });

    window.history.replaceState({}, document.title, window.location.pathname);
    loadData();
  }, []);

  useEffect(() => {
    const handleMessage = async (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== 'printful-oauth-result') {
        return;
      }

      setConnecting(false);
      await loadData();
      toast({
        title: event.data?.status === 'connected' ? 'Printful connected' : 'Printful connection failed',
        description: event.data?.message || (event.data?.status === 'connected' ? 'Your store can now sync Printful products.' : 'Please try connecting again.'),
        variant: event.data?.status === 'connected' ? 'default' : 'destructive',
      });
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const response = await axios.get(`${API}/printful/connect-url`, { headers: authHeaders });
      const popup = window.open(response.data.auth_url, 'printful-oauth-login', 'width=980,height=780,menubar=no,toolbar=no,location=yes,resizable=yes,scrollbars=yes,status=no');
      if (!popup) {
        window.location.assign(response.data.auth_url);
        return;
      }

      printfulPopupRef.current = popup;
      popup.focus();

      const popupPoll = window.setInterval(async () => {
        if (!printfulPopupRef.current || printfulPopupRef.current.closed) {
          window.clearInterval(popupPoll);
          printfulPopupRef.current = null;
          setConnecting(false);
          await loadData();
        }
      }, 1200);
    } catch (error) {
      toast({
        title: 'Connect failed',
        description: error.response?.data?.detail || 'Could not start Printful login.',
        variant: 'destructive',
      });
      setConnecting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const response = await axios.post(`${API}/printful/sync-products`, {}, { headers: authHeaders });
      toast({
        title: 'Products synced',
        description: response.data?.message || 'Printful products synced successfully.',
      });
      await loadData();
      setTimeout(() => {
        loadData();
      }, 6000);
    } catch (error) {
      const detailedError =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Could not sync Printful products.';

      toast({
        title: 'Sync failed',
        description: detailedError,
        variant: 'destructive',
      });
      await loadData();
    } finally {
      setSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const response = await axios.post(`${API}/printful/disconnect`, {}, { headers: authHeaders });
      toast({ title: 'Disconnected', description: response.data?.message || 'Printful account disconnected.' });
      await loadData();
    } catch (error) {
      toast({
        title: 'Disconnect failed',
        description: error.response?.data?.detail || 'Could not disconnect Printful.',
        variant: 'destructive',
      });
    } finally {
      setDisconnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="printful-settings-loading">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  if (!featureEnabled && !isSuperAdmin) {
    return (
      <Card className="max-w-3xl" data-testid="printful-feature-disabled-card">
        <CardHeader>
          <CardTitle>Printful is currently disabled</CardTitle>
          <CardDescription>
            Ask your super admin to enable <strong>printful_enabled</strong> in Dev Feature Flags.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl space-y-6" data-testid="printful-settings-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900" data-testid="printful-settings-title">Printful Integration</h1>
        <p className="text-gray-500 mt-1" data-testid="printful-settings-subtitle">
          Connect your Printful account in a popup window, then sync products into this store once the connection is confirmed.
        </p>
      </div>

      {!featureEnabled && isSuperAdmin && (
        <Alert data-testid="printful-superadmin-disabled-alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Printful feature flag is OFF for store owners. You can still configure and test the connection here as super admin.
          </AlertDescription>
        </Alert>
      )}

      <Card data-testid="printful-signup-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Store className="w-5 h-5" /> Need a Printful account?</CardTitle>
          <CardDescription data-testid="printful-signup-description">
            To sign up for a Printful account, you can do that here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a
            href="https://www.printful.com/a/2574152:3baba470beba68c22081db5479cd5b06"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#ff8c42] px-4 py-2 font-medium text-white transition-colors hover:bg-[#e67a35]"
            data-testid="printful-signup-link"
          >
            Create a Printful account
            <ExternalLink className="w-4 h-4" />
          </a>
        </CardContent>
      </Card>

      <Card data-testid="printful-oauth-status-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Link2 className="w-5 h-5" /> Connection Status</CardTitle>
          <CardDescription>
            This store owner connects through Printful’s own OAuth login popup, not by entering API keys or passwords here.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border bg-gray-50 p-4" data-testid="printful-app-configured-row">
              <p className="text-sm text-gray-500">Dev app credentials</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={status.app_configured ? 'default' : 'secondary'} data-testid="printful-app-configured-badge">
                  {status.app_configured ? 'Configured' : 'Missing'}
                </Badge>
                {!status.app_configured && <span className="text-xs text-gray-500">Add Client ID + Secret in Dev Settings → Feature Flags</span>}
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-4" data-testid="printful-account-connected-row">
              <p className="text-sm text-gray-500">Store owner account</p>
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={status.connected ? 'default' : 'secondary'} data-testid="printful-account-connected-badge">
                  {status.connected ? 'Connected' : 'Not connected'}
                </Badge>
                {status.store_name && <span className="text-sm font-medium text-gray-800" data-testid="printful-store-name">{status.store_name}</span>}
              </div>
            </div>
          </div>

          {status.connected ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2" data-testid="printful-connected-summary">
              <p className="text-sm text-emerald-800">Connected store ID: <strong data-testid="printful-store-id">{status.store_id || 'Unavailable'}</strong></p>
              {status.connected_at && <p className="text-sm text-emerald-700" data-testid="printful-connected-at">Connected at: {new Date(status.connected_at).toLocaleString()}</p>}
              {status.last_synced_at && <p className="text-sm text-emerald-700" data-testid="printful-last-synced-at">Last sync: {new Date(status.last_synced_at).toLocaleString()}</p>}
              <p className="text-sm text-emerald-700" data-testid="printful-last-sync-count">Products imported on last sync: {status.last_sync_count || 0}</p>
              <p className="text-sm text-emerald-700" data-testid="printful-webhook-status">Webhook registration: {status.webhook_registered ? 'Connected' : 'Pending / unavailable'}</p>
              <p className="text-sm text-emerald-700" data-testid="printful-sync-progress-status">Sync status: {status.sync_in_progress ? 'Running' : 'Idle'}</p>
              {status.sync_has_more ? <p className="text-sm text-emerald-700" data-testid="printful-sync-has-more-note">More products remain. Click Sync Products again to continue import.</p> : null}
            </div>
          ) : null}

          {status.last_webhook_error && (
            <Alert data-testid="printful-webhook-warning-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.last_webhook_error}</AlertDescription>
            </Alert>
          )}

          {status.last_error && (
            <Alert data-testid="printful-last-error-alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{status.last_error}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3" data-testid="printful-oauth-action-buttons">
            <Button
              onClick={handleConnect}
              disabled={connecting || !status.app_configured}
              className="bg-[#6e2ea8] hover:bg-[#5a238a]"
              data-testid="printful-connect-button"
            >
              {connecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
              {status.connected ? 'Reconnect Printful' : 'Connect Printful'}
            </Button>

            <Button
              variant="outline"
              onClick={handleSync}
              disabled={syncing || !status.connected || status.sync_in_progress}
              data-testid="printful-sync-products-button"
            >
              {syncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {status.sync_in_progress ? 'Sync Running...' : 'Sync Products'}
            </Button>

            <Button
              variant="outline"
              onClick={handleDisconnect}
              disabled={disconnecting || !status.connected}
              data-testid="printful-disconnect-button"
            >
              {disconnecting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unplug className="w-4 h-4 mr-2" />}
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="printful-connect-how-it-works-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5" /> How it works</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p data-testid="printful-step-1">1. Builder adds the Printful Client ID + Secret in Dev Settings.</p>
          <p data-testid="printful-step-2">2. Store owner clicks <strong>Connect Printful</strong> and logs in on Printful’s own popup window.</p>
          <p data-testid="printful-step-3">3. When that popup finishes, this page refreshes the connection status automatically and auto-attempts webhook registration.</p>
          <p data-testid="printful-step-4">4. Click <strong>Sync Products</strong> to import connected Printful products into this store.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPrintfulSettings;