import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const initialDialogState = {
  currentPassword: '',
  verificationCode: '',
  challengeId: '',
  mode: null,
};

export const EmailTwoFactorSettingsCard = ({
  testIdPrefix,
  title = 'Email 2-Step Verification',
  description = 'Require a 6-digit email code at login, with a trusted browser option for 30 days.',
}) => {
  const [status, setStatus] = useState({ enabled: false, trustedDeviceCount: 0, loading: true });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogState, setDialogState] = useState(initialDialogState);
  const [submitting, setSubmitting] = useState(false);

  const authHeaders = useMemo(() => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/2fa/status`, { headers: authHeaders });
      setStatus({
        enabled: response.data?.email_2fa_enabled || false,
        trustedDeviceCount: response.data?.trusted_device_count || 0,
        loading: false,
      });
    } catch (error) {
      setStatus((prev) => ({ ...prev, loading: false }));
      toast.error(error.response?.data?.detail || 'Unable to load two-step verification status');
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const closeDialog = (force = false) => {
    if (submitting && !force) {
      return;
    }
    setDialogOpen(false);
    setDialogState(initialDialogState);
  };

  const handleToggleIntent = (nextValue) => {
    setDialogState({ ...initialDialogState, mode: nextValue ? 'enable' : 'disable' });
    setDialogOpen(true);
  };

  const sendEnableCode = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/2fa/send-setup-code`,
        { current_password: dialogState.currentPassword },
        { headers: authHeaders }
      );
      setDialogState((prev) => ({ ...prev, challengeId: response.data.challenge_id }));
      toast.success(response.data?.message || 'Verification code sent');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to send verification code');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmEnable = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/2fa/verify-setup`,
        { challenge_id: dialogState.challengeId, code: dialogState.verificationCode },
        { headers: authHeaders }
      );
      toast.success(response.data?.message || 'Email two-step verification enabled');
      closeDialog(true);
      setStatus({ enabled: true, trustedDeviceCount: 0, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to enable email two-step verification');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDisable = async () => {
    setSubmitting(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/auth/2fa/disable`,
        { current_password: dialogState.currentPassword },
        { headers: authHeaders }
      );
      toast.success(response.data?.message || 'Email two-step verification disabled');
      closeDialog(true);
      setStatus({ enabled: false, trustedDeviceCount: 0, loading: false });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Unable to disable email two-step verification');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card data-testid={`${testIdPrefix}-card`}>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#ff8c42]" />
                {title}
              </CardTitle>
              <CardDescription data-testid={`${testIdPrefix}-description`}>{description}</CardDescription>
            </div>
            {status.loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#ff8c42]" />
            ) : (
              <div className="flex items-center gap-3">
                <Badge variant="outline" data-testid={`${testIdPrefix}-status-badge`}>
                  {status.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
                <Switch
                  checked={status.enabled}
                  onCheckedChange={handleToggleIntent}
                  data-testid={`${testIdPrefix}-toggle`}
                />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-[#ff8c42]/20 bg-[#fff7f1] p-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-[#5c2f12]" data-testid={`${testIdPrefix}-summary-title`}>
                  {status.enabled ? 'Your account is protected at sign-in.' : 'Turn this on for extra account protection.'}
                </p>
                <p className="text-sm text-[#8b5a3c]" data-testid={`${testIdPrefix}-summary-copy`}>
                  Every login requires a fresh email code unless you trust the current browser for 30 days.
                </p>
              </div>
              <div className="text-sm text-[#8b5a3c]" data-testid={`${testIdPrefix}-trusted-device-count`}>
                Trusted browsers: <span className="font-semibold text-[#c45508]">{status.trustedDeviceCount}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={(open) => (!open ? closeDialog() : setDialogOpen(true))}>
        <DialogContent data-testid={`${testIdPrefix}-dialog`}>
          <DialogHeader>
            <DialogTitle>
              {dialogState.mode === 'enable' ? 'Enable email 2-step verification' : 'Turn off email 2-step verification'}
            </DialogTitle>
            <DialogDescription>
              {dialogState.mode === 'enable'
                ? 'Confirm your password, then enter the email code we send you.'
                : 'Enter your current password to turn off the extra email code at login.'}
            </DialogDescription>
          </DialogHeader>

          {dialogState.mode === 'enable' && !dialogState.challengeId ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${testIdPrefix}-enable-password`}>Current Password</Label>
                <Input
                  id={`${testIdPrefix}-enable-password`}
                  type="password"
                  value={dialogState.currentPassword}
                  onChange={(event) => setDialogState((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  data-testid={`${testIdPrefix}-password-input`}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} data-testid={`${testIdPrefix}-cancel-button`}>
                  Cancel
                </Button>
                <Button
                  onClick={sendEnableCode}
                  disabled={submitting || !dialogState.currentPassword}
                  data-testid={`${testIdPrefix}-send-code-button`}
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <LockKeyhole className="w-4 h-4 mr-2" />}
                  Send Verification Code
                </Button>
              </DialogFooter>
            </div>
          ) : null}

          {dialogState.mode === 'enable' && dialogState.challengeId ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${testIdPrefix}-verification-code`}>Verification Code</Label>
                <Input
                  id={`${testIdPrefix}-verification-code`}
                  inputMode="numeric"
                  maxLength={6}
                  value={dialogState.verificationCode}
                  onChange={(event) => setDialogState((prev) => ({ ...prev, verificationCode: event.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="Enter 6-digit code"
                  data-testid={`${testIdPrefix}-code-input`}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} data-testid={`${testIdPrefix}-close-button`}>
                  Cancel
                </Button>
                <Button
                  onClick={confirmEnable}
                  disabled={submitting || dialogState.verificationCode.length !== 6}
                  data-testid={`${testIdPrefix}-confirm-enable-button`}
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                  Enable Protection
                </Button>
              </DialogFooter>
            </div>
          ) : null}

          {dialogState.mode === 'disable' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${testIdPrefix}-disable-password`}>Current Password</Label>
                <Input
                  id={`${testIdPrefix}-disable-password`}
                  type="password"
                  value={dialogState.currentPassword}
                  onChange={(event) => setDialogState((prev) => ({ ...prev, currentPassword: event.target.value }))}
                  data-testid={`${testIdPrefix}-disable-password-input`}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeDialog} data-testid={`${testIdPrefix}-disable-cancel-button`}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDisable}
                  disabled={submitting || !dialogState.currentPassword}
                  data-testid={`${testIdPrefix}-confirm-disable-button`}
                >
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Turn Off Protection
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};