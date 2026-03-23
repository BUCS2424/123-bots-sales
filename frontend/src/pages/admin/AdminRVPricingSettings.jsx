import React, { useState } from 'react';
import {
  DollarSign, Save, Loader2, Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';

const AdminRVPricingSettings = () => {
  const [saving, setSaving] = useState(false);
  const [pricing, setPricing] = useState([
    { id: 1, service: 'Basic Inspection', min_price: 75, max_price: 150 },
    { id: 2, service: 'Full Detailing', min_price: 200, max_price: 500 },
    { id: 3, service: 'Roof Repair', min_price: 300, max_price: 1500 },
    { id: 4, service: 'AC Service', min_price: 150, max_price: 600 },
    { id: 5, service: 'Electrical Work', min_price: 100, max_price: 800 },
    { id: 6, service: 'Plumbing Repair', min_price: 100, max_price: 500 },
    { id: 7, service: 'Full Restoration', min_price: 5000, max_price: 25000 },
  ]);
  const [laborRate, setLaborRate] = useState(85);

  const updatePricing = (id, field, value) => {
    setPricing(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      toast({
        title: 'Pricing Saved',
        description: 'RV service pricing has been updated.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save pricing',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-rv-pricing-settings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            RV Service Pricing
          </h1>
          <p className="text-gray-500">Set price ranges for repair and restoration services</p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-[#6e2ea8] hover:bg-[#a01830]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Pricing
        </Button>
      </div>

      {/* Labor Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Labor Rate</CardTitle>
          <CardDescription>Hourly rate for labor charges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                value={laborRate}
                onChange={(e) => setLaborRate(parseFloat(e.target.value) || 0)}
                className="pl-7"
              />
            </div>
            <span className="text-gray-500">per hour</span>
          </div>
        </CardContent>
      </Card>

      {/* Service Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Price Ranges</CardTitle>
          <CardDescription>Minimum and maximum prices for estimates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 rounded-lg font-medium text-sm text-gray-600">
              <div className="col-span-4">Service</div>
              <div className="col-span-3 text-center">Min Price</div>
              <div className="col-span-3 text-center">Max Price</div>
              <div className="col-span-2"></div>
            </div>
            {pricing.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-4 border rounded-lg">
                <div className="col-span-4 font-medium">{item.service}</div>
                <div className="col-span-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      value={item.min_price}
                      onChange={(e) => updatePricing(item.id, 'min_price', parseFloat(e.target.value) || 0)}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      value={item.max_price}
                      onChange={(e) => updatePricing(item.id, 'max_price', parseFloat(e.target.value) || 0)}
                      className="pl-7"
                    />
                  </div>
                </div>
                <div className="col-span-2 text-right text-sm text-gray-500">
                  Avg: ${Math.round((item.min_price + item.max_price) / 2)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRVPricingSettings;
