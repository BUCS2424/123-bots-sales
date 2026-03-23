import React, { useState, useEffect } from 'react';
import { PiggyBank, Save, Loader2, RefreshCw, Percent, Eye, EyeOff, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const DevCommissionSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [percentage, setPercentage] = useState(10);
  const [visibleToRoles, setVisibleToRoles] = useState(['admin', 'store_owner']);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin-settings/commission`);
      if (response.ok) {
        const data = await response.json();
        setEnabled(data.enabled || false);
        setPercentage(data.percentage || 10);
        setVisibleToRoles(data.visible_to_roles || ['admin', 'store_owner']);
      }
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load commission settings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/api/admin-settings/commission`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled,
          percentage: parseFloat(percentage) || 10,
          visible_to_roles: visibleToRoles,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Settings Saved',
          description: 'Commission settings have been updated successfully.',
        });
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Error saving commission settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save commission settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
        <span className="ml-2 text-gray-500">Loading commission settings...</span>
      </div>
    );
  }

  // Calculate example commission
  const exampleProfit = 10000;
  const exampleCommission = (exampleProfit * percentage) / 100;

  return (
    <div className="space-y-6" data-testid="commission-settings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <PiggyBank className="w-7 h-7 text-[#6e2ea8]" />
            Commission Settings
          </h1>
          <p className="text-gray-500 mt-1">Configure profit sharing display for store owners</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchSettings} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[#6e2ea8] hover:bg-[#5a2590]">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Percent className="w-5 h-5 text-[#6e2ea8]" />
              Commission Configuration
            </CardTitle>
            <CardDescription>Set up commission percentage to display on accounting dashboards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <Label className="font-medium">Enable Commission Display</Label>
                <p className="text-sm text-gray-500 mt-1">Show commission card on accounting dashboards</p>
              </div>
              <Switch
                checked={enabled}
                onCheckedChange={setEnabled}
                className="data-[state=checked]:bg-[#6e2ea8]"
                data-testid="commission-enabled-switch"
              />
            </div>

            {/* Commission Percentage */}
            <div className="space-y-2">
              <Label>Commission Percentage</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-32 text-lg font-bold text-center"
                  data-testid="commission-percentage-input"
                />
                <span className="text-2xl font-bold text-gray-400">%</span>
              </div>
              <p className="text-xs text-gray-500">Percentage of gross profit to display as commission</p>
            </div>

            {/* Visibility */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Visible To
              </Label>
              <div className="flex flex-wrap gap-2">
                {['admin', 'store_owner', 'sales'].map((role) => (
                  <Badge
                    key={role}
                    className={`cursor-pointer transition-colors ${
                      visibleToRoles.includes(role)
                        ? 'bg-[#6e2ea8] text-white hover:bg-[#5a2590]'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    onClick={() => {
                      if (visibleToRoles.includes(role)) {
                        setVisibleToRoles(visibleToRoles.filter(r => r !== role));
                      } else {
                        setVisibleToRoles([...visibleToRoles, role]);
                      }
                    }}
                  >
                    {role === 'admin' && 'Admin'}
                    {role === 'store_owner' && 'Store Owner'}
                    {role === 'sales' && 'Sales Staff'}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500">Select which roles can see the commission card</p>
            </div>
          </CardContent>
        </Card>

        {/* Preview Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#6e2ea8]" />
              Preview
            </CardTitle>
            <CardDescription>This is how the commission card will appear on dashboards</CardDescription>
          </CardHeader>
          <CardContent>
            {enabled ? (
              <div className="space-y-4">
                {/* Preview Commission Card */}
                <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl p-6 ring-2 ring-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">{percentage}% Commission</p>
                      <p className="text-3xl font-bold text-[#6e2ea8]">
                        ${exampleCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-purple-100 text-purple-700">Current Month</Badge>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                      <PiggyBank className="w-7 h-7 text-[#6e2ea8]" />
                    </div>
                  </div>
                </div>

                {/* Example calculation */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 font-medium mb-2">Example Calculation:</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono">${exampleProfit.toLocaleString()}</span>
                    <span className="text-gray-400">×</span>
                    <span className="font-mono">{percentage}%</span>
                    <span className="text-gray-400">=</span>
                    <span className="font-mono font-bold text-[#6e2ea8]">
                      ${exampleCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  The commission card shows {percentage}% of the gross profit for the selected time period.
                  By default, it displays the current month's commission and resets every 30 days.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <EyeOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">Commission display is disabled</p>
                <p className="text-sm mt-1">Enable it to show the commission card on accounting dashboards</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="bg-purple-50 border-purple-200">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <PiggyBank className="w-5 h-5 text-[#6e2ea8]" />
            </div>
            <div>
              <p className="font-medium text-purple-800">How Commission Display Works</p>
              <ul className="text-sm text-purple-700 mt-2 space-y-1">
                <li>• The commission card appears on both accounting dashboard pages</li>
                <li>• By default, it shows the current month's commission (last 30 days)</li>
                <li>• When a date filter is applied, it shows the commission for that period</li>
                <li>• Use "Reset to Current Month" to return to the default 30-day view</li>
                <li>• Only users with the selected roles can see the commission card</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevCommissionSettings;
