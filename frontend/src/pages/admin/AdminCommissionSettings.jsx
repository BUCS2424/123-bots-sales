import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  PiggyBank, Save, ToggleLeft, ToggleRight, Percent, Eye, EyeOff,
  AlertCircle, CheckCircle, Loader2, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminCommissionSettings = () => {
  const [settings, setSettings] = useState({
    enabled: false,
    percentage: 10.0,
    visible_to_roles: ['admin', 'store_owner']
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tempPercentage, setTempPercentage] = useState('10');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin-settings/commission`);
      setSettings(response.data);
      setTempPercentage(response.data.percentage?.toString() || '10');
    } catch (error) {
      console.error('Failed to fetch commission settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load commission settings.',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleToggleEnabled = async () => {
    const newEnabled = !settings.enabled;
    await saveSettings({ ...settings, enabled: newEnabled });
  };

  const handleSavePercentage = async () => {
    const percentage = parseFloat(tempPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: 'Invalid Percentage',
        description: 'Please enter a number between 0 and 100.',
        variant: 'destructive'
      });
      return;
    }
    await saveSettings({ ...settings, percentage });
    setIsEditing(false);
  };

  const saveSettings = async (newSettings) => {
    setSaving(true);
    try {
      await axios.put(`${BACKEND_URL}/api/admin-settings/commission`, newSettings);
      setSettings(newSettings);
      toast({
        title: 'Settings Saved',
        description: 'Commission settings updated successfully.',
      });
    } catch (error) {
      console.error('Failed to save commission settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save commission settings.',
        variant: 'destructive'
      });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="commission-settings-page">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <PiggyBank className="w-8 h-8 text-purple-600" />
          Commission Settings
        </h1>
        <p className="text-gray-500 mt-1">
          Configure the commission percentage displayed on the Accounting Dashboard
        </p>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">How this works:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>When enabled, a commission card will appear on the Accounting Dashboard</li>
                <li>The card shows the configured percentage of Gross Profit</li>
                <li>Only super admins can modify these settings</li>
                <li>Store owners will see the commission card when enabled</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-purple-600" />
            Commission Configuration
          </CardTitle>
          <CardDescription>
            Set the commission percentage and visibility
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-base font-semibold">Show Commission Card</Label>
              <p className="text-sm text-gray-500 mt-1">
                Display the commission stat card on the Accounting Dashboard
              </p>
            </div>
            <button
              onClick={handleToggleEnabled}
              disabled={saving}
              className="focus:outline-none"
              data-testid="commission-toggle"
            >
              {settings.enabled ? (
                <ToggleRight className="w-12 h-12 text-green-600 hover:text-green-700 transition-colors" />
              ) : (
                <ToggleLeft className="w-12 h-12 text-gray-400 hover:text-gray-500 transition-colors" />
              )}
            </button>
          </div>

          {/* Current Status */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            {settings.enabled ? (
              <Badge className="bg-green-100 text-green-700">
                <Eye className="w-3 h-3 mr-1" />
                Visible to Admins
              </Badge>
            ) : (
              <Badge variant="outline" className="text-gray-500">
                <EyeOff className="w-3 h-3 mr-1" />
                Hidden
              </Badge>
            )}
          </div>

          {/* Percentage Setting */}
          <div className="border-t pt-6">
            <Label className="text-base font-semibold mb-4 block">Commission Percentage</Label>
            
            {isEditing ? (
              <div className="flex items-center gap-4">
                <div className="relative w-32">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={tempPercentage}
                    onChange={(e) => setTempPercentage(e.target.value)}
                    className="pr-8 text-lg font-bold"
                    data-testid="percentage-input"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                </div>
                <Button 
                  onClick={handleSavePercentage} 
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                  data-testid="save-percentage-btn"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setTempPercentage(settings.percentage.toString());
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="text-4xl font-bold text-purple-600">
                  {settings.percentage}%
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  data-testid="edit-percentage-btn"
                >
                  <Percent className="w-4 h-4 mr-2" />
                  Edit Percentage
                </Button>
              </div>
            )}

            <p className="text-sm text-gray-500 mt-3">
              This percentage will be calculated from the Gross Profit and displayed on the Accounting Dashboard
            </p>
          </div>

          {/* Preview */}
          {settings.enabled && (
            <div className="border-t pt-6">
              <Label className="text-base font-semibold mb-4 block">Preview</Label>
              <div className="max-w-sm">
                <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 ring-2 ring-purple-100">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-600">{settings.percentage}% Commission</p>
                        <p className="text-3xl font-bold text-purple-700">$1,250.00</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-purple-100 text-purple-700">
                            Current Month
                          </Badge>
                        </div>
                      </div>
                      <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                        <PiggyBank className="w-7 h-7 text-purple-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  Example: {settings.percentage}% of $12,500 gross profit
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Last Updated */}
      {settings.updated_at && (
        <p className="text-sm text-gray-400 text-center">
          Last updated: {new Date(settings.updated_at).toLocaleString()}
        </p>
      )}
    </div>
  );
};

export default AdminCommissionSettings;
