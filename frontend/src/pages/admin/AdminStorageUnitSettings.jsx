import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Save, Loader2, Plus, Trash2, Edit, DollarSign, 
  Thermometer, Lock, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminStorageUnitSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enable_online_rentals: true,
    require_insurance: false,
    insurance_monthly_rate: 15,
    late_fee_percentage: 10,
    grace_period_days: 5,
    auto_lock_days_overdue: 30,
    climate_control_premium: 25
  });

  const saveSettings = async () => {
    setSaving(true);
    try {
      toast({
        title: 'Settings Saved',
        description: 'Storage unit settings have been updated.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-storage-unit-settings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Box className="w-8 h-8 text-[rgb(37, 99, 235)]" />
            Storage Unit Settings
          </h1>
          <p className="text-gray-500">Configure storage unit rentals and policies</p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-[rgb(37, 99, 235)] hover:bg-[#a01830]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Settings
        </Button>
      </div>

      {/* Rental Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rental Settings</CardTitle>
          <CardDescription>Configure how rentals work</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Online Rentals</Label>
              <p className="text-xs text-gray-500">Allow customers to rent units online</p>
            </div>
            <Switch
              checked={settings.enable_online_rentals}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_online_rentals: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Require Insurance</Label>
              <p className="text-xs text-gray-500">Mandate insurance for all rentals</p>
            </div>
            <Switch
              checked={settings.require_insurance}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, require_insurance: checked }))}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-2">
              <Label htmlFor="insurance-rate">Insurance Monthly Rate ($)</Label>
              <Input
                id="insurance-rate"
                type="number"
                value={settings.insurance_monthly_rate}
                onChange={(e) => setSettings(prev => ({ ...prev, insurance_monthly_rate: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="climate-premium">Climate Control Premium (%)</Label>
              <Input
                id="climate-premium"
                type="number"
                value={settings.climate_control_premium}
                onChange={(e) => setSettings(prev => ({ ...prev, climate_control_premium: parseFloat(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Late Fee Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Late Payment Policies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="grace-period">Grace Period (Days)</Label>
              <Input
                id="grace-period"
                type="number"
                value={settings.grace_period_days}
                onChange={(e) => setSettings(prev => ({ ...prev, grace_period_days: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="late-fee">Late Fee (%)</Label>
              <Input
                id="late-fee"
                type="number"
                value={settings.late_fee_percentage}
                onChange={(e) => setSettings(prev => ({ ...prev, late_fee_percentage: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="auto-lock">Auto-Lock After (Days Overdue)</Label>
              <Input
                id="auto-lock"
                type="number"
                value={settings.auto_lock_days_overdue}
                onChange={(e) => setSettings(prev => ({ ...prev, auto_lock_days_overdue: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStorageUnitSettings;
