import React, { useState } from 'react';
import {
  Wrench, Save, Loader2, Plus, Trash2, Edit, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';

const AdminRVServicesSettings = () => {
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([
    { id: 1, name: 'Basic Inspection', enabled: true, description: 'Comprehensive RV inspection' },
    { id: 2, name: 'Full Detailing', enabled: true, description: 'Interior and exterior cleaning' },
    { id: 3, name: 'Roof Repair', enabled: true, description: 'Leak repair and resealing' },
    { id: 4, name: 'AC Service', enabled: true, description: 'Air conditioning maintenance' },
    { id: 5, name: 'Electrical Work', enabled: true, description: 'Wiring and electrical repairs' },
    { id: 6, name: 'Plumbing Repair', enabled: true, description: 'Water system maintenance' },
    { id: 7, name: 'Full Restoration', enabled: true, description: 'Complete RV renovation' },
    { id: 8, name: 'Paint & Body', enabled: false, description: 'Exterior refinishing' },
  ]);

  const toggleService = (id) => {
    setServices(prev => prev.map(service => 
      service.id === id ? { ...service, enabled: !service.enabled } : service
    ));
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      toast({
        title: 'Services Saved',
        description: 'RV services have been updated.'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save services',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-rv-services-settings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Wrench className="w-8 h-8 text-[rgb(37, 99, 235)]" />
            RV Services
          </h1>
          <p className="text-gray-500">Configure available repair and restoration services</p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={saving}
          className="bg-[rgb(37, 99, 235)] hover:bg-[#a01830]"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Save Services
        </Button>
      </div>

      {/* Services List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Available Services</CardTitle>
          <CardDescription>Enable or disable services offered to customers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {services.map((service) => (
              <div 
                key={service.id} 
                className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  service.enabled ? 'bg-white border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {service.enabled ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                  <div>
                    <p className={`font-medium ${service.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                      {service.name}
                    </p>
                    <p className="text-sm text-gray-500">{service.description}</p>
                  </div>
                </div>
                <Switch
                  checked={service.enabled}
                  onCheckedChange={() => toggleService(service.id)}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add New Service */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add New Service</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="service-name">Service Name</Label>
              <Input id="service-name" placeholder="e.g., Window Replacement" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-desc">Description</Label>
              <Input id="service-desc" placeholder="Brief description of service" />
            </div>
          </div>
          <Button className="mt-4" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Service
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminRVServicesSettings;
