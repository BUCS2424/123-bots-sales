import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Shield, Globe, MapPin, Save, Loader2, Eye, EyeOff,
  ToggleLeft, ToggleRight, FileText, AlertTriangle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Toggle = ({ enabled, onChange, testId }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}
    data-testid={testId}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

const PasswordField = ({ label, value, onChange, placeholder, testId }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
          data-testid={testId}
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

const AdminLeadsSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState({
    enabled: false, api_url: '', api_key: '', agency_ori: '',
    username: '', password: '',
    report_pawn_transactions: true, report_buy_transactions: true,
    report_firearm_transactions: true, auto_submit: false
  });
  const [national, setNational] = useState({
    enabled: false, api_url: '', api_key: '', account_id: '',
    username: '', password: '',
    report_pawn_transactions: true, report_buy_transactions: true,
    report_firearm_transactions: true, auto_submit: false
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await axios.get(`${API}/leads-settings`);
        if (res.data.local) setLocal(res.data.local);
        if (res.data.national) setNational(res.data.national);
      } catch (err) {
        console.error('Failed to load LEADS settings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/leads-settings`, { local, national });
      toast({ title: 'Saved', description: 'LEADS reporting settings updated.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const setL = (key, val) => setLocal(prev => ({ ...prev, [key]: val }));
  const setN = (key, val) => setNational(prev => ({ ...prev, [key]: val }));

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="leads-settings-page">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-7 h-7 text-[rgb(37, 99, 235)]" />
            LEADS Reporting
          </h1>
          <p className="text-gray-500 text-sm">Configure local and national transaction reporting</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[rgb(37, 99, 235)] hover:bg-[rgb(29, 78, 216)]" data-testid="save-leads-btn">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">Credentials Required</p>
          <p>Enter your API credentials when your LEADS accounts are active. Toggle reporting categories on/off as needed.</p>
        </div>
      </div>

      {/* Alabama LEADS (Local) */}
      <Card data-testid="local-leads-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg"><MapPin className="w-5 h-5 text-[rgb(37, 99, 235)]" /></div>
              <div>
                <CardTitle className="text-lg">Alabama LEADS</CardTitle>
                <CardDescription>Law Enforcement Automated Data System — State of Alabama</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={local.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                {local.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <Toggle enabled={local.enabled} onChange={(v) => setL('enabled', v)} testId="local-enabled-toggle" />
            </div>
          </div>
        </CardHeader>
        <CardContent className={`space-y-5 ${!local.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Credentials */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Connection Credentials</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">API Endpoint URL</Label>
                <Input value={local.api_url} onChange={(e) => setL('api_url', e.target.value)} placeholder="https://leads.alabama.gov/api/v1" data-testid="local-api-url" />
              </div>
              <div>
                <Label className="text-sm">Agency ORI</Label>
                <Input value={local.agency_ori} onChange={(e) => setL('agency_ori', e.target.value)} placeholder="AL0000000" data-testid="local-agency-ori" />
              </div>
              <PasswordField label="API Key" value={local.api_key} onChange={(v) => setL('api_key', v)} placeholder="Enter API key" testId="local-api-key" />
              <div>
                <Label className="text-sm">Username</Label>
                <Input value={local.username} onChange={(e) => setL('username', e.target.value)} placeholder="Username" data-testid="local-username" />
              </div>
              <PasswordField label="Password" value={local.password} onChange={(v) => setL('password', v)} placeholder="Enter password" testId="local-password" />
            </div>
          </div>

          {/* Reporting Toggles */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">What to Report</p>
            <div className="space-y-3">
              <ToggleRow label="Contract Transactions" desc="New loans, redemptions, defaults" enabled={local.report_pawn_transactions} onChange={(v) => setL('report_pawn_transactions', v)} testId="local-pawn-toggle" />
              <ToggleRow label="Buy Transactions" desc="Items purchased outright from customers" enabled={local.report_buy_transactions} onChange={(v) => setL('report_buy_transactions', v)} testId="local-buy-toggle" />
              <ToggleRow label="Firearm Transactions" desc="Gun log entries and ATF holds" enabled={local.report_firearm_transactions} onChange={(v) => setL('report_firearm_transactions', v)} testId="local-firearm-toggle" />
              <ToggleRow label="Auto-Submit" desc="Automatically submit reports daily at midnight" enabled={local.auto_submit} onChange={(v) => setL('auto_submit', v)} testId="local-auto-submit" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LeadsOnline (National) */}
      <Card data-testid="national-leads-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg"><Globe className="w-5 h-5 text-[rgb(37, 99, 235)]" /></div>
              <div>
                <CardTitle className="text-lg">LeadsOnline</CardTitle>
                <CardDescription>National pawn reporting platform — leadsonline.com</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={national.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>
                {national.enabled ? 'Active' : 'Inactive'}
              </Badge>
              <Toggle enabled={national.enabled} onChange={(v) => setN('enabled', v)} testId="national-enabled-toggle" />
            </div>
          </div>
        </CardHeader>
        <CardContent className={`space-y-5 ${!national.enabled ? 'opacity-50 pointer-events-none' : ''}`}>
          {/* Credentials */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">Connection Credentials</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">API Endpoint URL</Label>
                <Input value={national.api_url} onChange={(e) => setN('api_url', e.target.value)} placeholder="https://api.leadsonline.com/v2" data-testid="national-api-url" />
              </div>
              <div>
                <Label className="text-sm">Account ID</Label>
                <Input value={national.account_id} onChange={(e) => setN('account_id', e.target.value)} placeholder="LOL-XXXXXXX" data-testid="national-account-id" />
              </div>
              <PasswordField label="API Key" value={national.api_key} onChange={(v) => setN('api_key', v)} placeholder="Enter API key" testId="national-api-key" />
              <div>
                <Label className="text-sm">Username</Label>
                <Input value={national.username} onChange={(e) => setN('username', e.target.value)} placeholder="Username" data-testid="national-username" />
              </div>
              <PasswordField label="Password" value={national.password} onChange={(v) => setN('password', v)} placeholder="Enter password" testId="national-password" />
            </div>
          </div>

          {/* Reporting Toggles */}
          <div className="border-t pt-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">What to Report</p>
            <div className="space-y-3">
              <ToggleRow label="Contract Transactions" desc="New loans, redemptions, defaults" enabled={national.report_pawn_transactions} onChange={(v) => setN('report_pawn_transactions', v)} testId="national-pawn-toggle" />
              <ToggleRow label="Buy Transactions" desc="Items purchased outright from customers" enabled={national.report_buy_transactions} onChange={(v) => setN('report_buy_transactions', v)} testId="national-buy-toggle" />
              <ToggleRow label="Firearm Transactions" desc="Gun log entries and ATF holds" enabled={national.report_firearm_transactions} onChange={(v) => setN('report_firearm_transactions', v)} testId="national-firearm-toggle" />
              <ToggleRow label="Auto-Submit" desc="Automatically submit reports daily at midnight" enabled={national.auto_submit} onChange={(v) => setN('auto_submit', v)} testId="national-auto-submit" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const ToggleRow = ({ label, desc, enabled, onChange, testId }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <p className="text-sm font-medium text-gray-900">{label}</p>
      <p className="text-xs text-gray-500">{desc}</p>
    </div>
    <Toggle enabled={enabled} onChange={onChange} testId={testId} />
  </div>
);

export default AdminLeadsSettings;
