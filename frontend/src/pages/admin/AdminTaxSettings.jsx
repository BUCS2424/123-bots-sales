import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, Save, Loader2, Percent, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminTaxSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxCalculation, setTaxCalculation] = useState('exclusive');
  const [taxRates, setTaxRates] = useState([]);

  // Fetch tax settings from backend on mount
  useEffect(() => {
    fetchTaxSettings();
  }, []);

  const fetchTaxSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin-settings/tax`);
      if (response.ok) {
        const data = await response.json();
        setTaxEnabled(data.tax_enabled ?? true);
        setTaxCalculation(data.tax_calculation || 'exclusive');
        // Convert backend format to frontend format with IDs
        const rates = (data.tax_rates || []).map((rate, index) => ({
          id: index + 1,
          name: rate.name || '',
          rate: String(rate.rate || 0),
          type: rate.type || 'other',
          active: rate.active ?? true,
        }));
        setTaxRates(rates);
      } else {
        console.error('Failed to fetch tax settings');
        toast({
          title: 'Error',
          description: 'Failed to load tax settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching tax settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to server',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Convert frontend format to backend format
      const payload = {
        tax_enabled: taxEnabled,
        tax_calculation: taxCalculation,
        tax_rates: taxRates.map(rate => ({
          name: rate.name,
          rate: parseFloat(rate.rate) || 0,
          type: rate.type,
          active: rate.active,
        })),
      };

      const response = await fetch(`${API_URL}/api/admin-settings/tax`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: 'Tax Settings Saved',
          description: 'Your tax configuration has been updated successfully.',
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.detail || 'Failed to save tax settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving tax settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to connect to server',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const addTaxRate = () => {
    const newRate = {
      id: Date.now(),
      name: '',
      rate: '0.0',
      type: 'other',
      active: true,
    };
    setTaxRates([...taxRates, newRate]);
  };

  const removeTaxRate = (id) => {
    setTaxRates(taxRates.filter(rate => rate.id !== id));
  };

  const updateTaxRate = (id, field, value) => {
    setTaxRates(taxRates.map(rate => 
      rate.id === id ? { ...rate, [field]: value } : rate
    ));
  };

  const totalRate = taxRates
    .filter(r => r.active)
    .reduce((sum, r) => sum + parseFloat(r.rate || 0), 0)
    .toFixed(2);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
        <span className="ml-2 text-gray-500">Loading tax settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="tax-settings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Receipt className="w-7 h-7 text-[rgb(37, 99, 235)]" />
            Tax Settings
          </h1>
          <p className="text-gray-500 mt-1">Configure tax rates and rules for your business</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTaxSettings} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleSave} disabled={saving} className="bg-[rgb(37, 99, 235)] hover:bg-[#5a2590]">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tax Overview Card */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Tax Overview</CardTitle>
            <CardDescription>Quick summary of your tax configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Tax Collection</Label>
                <p className="text-xs text-gray-500">Enable or disable tax collection</p>
              </div>
              <Switch
                checked={taxEnabled}
                onCheckedChange={setTaxEnabled}
                data-testid="tax-enabled-switch"
              />
            </div>

            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <p className="text-sm text-gray-500 mb-1">Combined Tax Rate</p>
              <p className="text-4xl font-bold text-[rgb(37, 99, 235)]" data-testid="combined-tax-rate">
                {taxEnabled ? totalRate : '0.00'}%
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {taxEnabled ? 'Applied to all taxable items' : 'Tax collection is disabled'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tax Calculation</Label>
              <Select value={taxCalculation} onValueChange={setTaxCalculation}>
                <SelectTrigger data-testid="tax-calculation-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inclusive">Tax Inclusive (included in price)</SelectItem>
                  <SelectItem value="exclusive">Tax Exclusive (added to price)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tax Rates */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Tax Rates</CardTitle>
              <CardDescription>Manage individual tax rates by jurisdiction</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addTaxRate} data-testid="add-tax-rate-btn">
              <Plus className="w-4 h-4 mr-1" />
              Add Rate
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {taxRates.map((rate, index) => (
                <div 
                  key={rate.id} 
                  className={`flex items-center gap-4 p-4 border rounded-lg ${!rate.active ? 'opacity-50 bg-gray-50' : ''}`}
                  data-testid={`tax-rate-row-${index}`}
                >
                  <Switch
                    checked={rate.active}
                    onCheckedChange={(checked) => updateTaxRate(rate.id, 'active', checked)}
                  />
                  <div className="flex-1 grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Name</Label>
                      <Input
                        value={rate.name}
                        onChange={(e) => updateTaxRate(rate.id, 'name', e.target.value)}
                        placeholder="Tax name"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Rate (%)</Label>
                      <div className="relative mt-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={rate.rate}
                          onChange={(e) => updateTaxRate(rate.id, 'rate', e.target.value)}
                          className="pr-8"
                        />
                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Type</Label>
                      <Select 
                        value={rate.type} 
                        onValueChange={(value) => updateTaxRate(rate.id, 'type', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="state">State</SelectItem>
                          <SelectItem value="county">County</SelectItem>
                          <SelectItem value="city">City</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeTaxRate(rate.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}

              {taxRates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tax rates configured</p>
                  <p className="text-sm">Click "Add Rate" to create your first tax rate</p>
                  <p className="text-xs mt-2 text-green-600">Tax will be 0% at checkout</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminTaxSettings;
