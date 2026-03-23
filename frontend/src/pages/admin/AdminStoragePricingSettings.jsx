import React, { useState } from 'react';
import {
  DollarSign, Save, Loader2, Plus, Trash2, Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';

const AdminStoragePricingSettings = () => {
  const [saving, setSaving] = useState(false);
  const [unitPrices, setUnitPrices] = useState([
    { id: 1, size: '5x5', monthly_rate: 45, description: 'Small closet' },
    { id: 2, size: '5x10', monthly_rate: 65, description: 'Walk-in closet' },
    { id: 3, size: '10x10', monthly_rate: 95, description: 'Small room' },
    { id: 4, size: '10x15', monthly_rate: 125, description: 'Large room' },
    { id: 5, size: '10x20', monthly_rate: 155, description: 'One car garage' },
    { id: 6, size: '10x30', monthly_rate: 195, description: 'Large garage' },
  ]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      toast({
        title: 'Pricing Saved',
        description: 'Storage pricing has been updated.'
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

  const updatePrice = (id, field, value) => {
    setUnitPrices(prev => prev.map(unit => 
      unit.id === id ? { ...unit, [field]: value } : unit
    ));
  };

  return (
    <div className="space-y-6" data-testid="admin-storage-pricing-settings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-600" />
            Storage Pricing & Fees
          </h1>
          <p className="text-gray-500">Set rental rates for each unit size</p>
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

      {/* Unit Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Unit Size Pricing</CardTitle>
          <CardDescription>Monthly rental rates by unit size</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {unitPrices.map((unit) => (
              <div key={unit.id} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="w-24 font-bold text-lg text-[#6e2ea8]">{unit.size}</div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">{unit.description}</p>
                </div>
                <div className="w-32">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <Input
                      type="number"
                      value={unit.monthly_rate}
                      onChange={(e) => updatePrice(unit.id, 'monthly_rate', parseFloat(e.target.value) || 0)}
                      className="pl-7"
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-500">/month</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Fees */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Fees</CardTitle>
          <CardDescription>One-time and recurring charges</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <Label className="font-medium">Admin Fee (One-time)</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input type="number" defaultValue={25} className="pl-7" />
              </div>
            </div>
            <div className="p-4 border rounded-lg">
              <Label className="font-medium">Lock Purchase</Label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <Input type="number" defaultValue={15} className="pl-7" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStoragePricingSettings;
