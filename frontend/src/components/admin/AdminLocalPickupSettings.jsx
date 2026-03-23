import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  MapPin, Plus, Trash2, Edit, Save, X, Loader2, Clock, Phone,
  Building, CheckCircle, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from '../../hooks/use-toast';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

const AdminLocalPickupSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    enabled: false,
    locations: []
  });
  
  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [locationForm, setLocationForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    hours: '',
    notes: '',
    active: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin-settings/local-pickup`);
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching local pickup settings:', error);
    }
    setLoading(false);
  };

  const handleToggleEnabled = async (enabled) => {
    setSaving(true);
    try {
      await axios.put(`${API}/admin-settings/local-pickup`, {
        ...settings,
        enabled
      });
      setSettings(prev => ({ ...prev, enabled }));
      toast({
        title: 'Success',
        description: `Local pickup ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update settings',
        variant: 'destructive'
      });
    }
    setSaving(false);
  };

  const openAddDialog = () => {
    setEditingLocation(null);
    setLocationForm({
      name: '',
      address: '',
      city: '',
      state: '',
      zip_code: '',
      phone: '',
      hours: '',
      notes: '',
      active: true
    });
    setDialogOpen(true);
  };

  const openEditDialog = (location) => {
    setEditingLocation(location);
    setLocationForm({
      name: location.name || '',
      address: location.address || '',
      city: location.city || '',
      state: location.state || '',
      zip_code: location.zip_code || '',
      phone: location.phone || '',
      hours: location.hours || '',
      notes: location.notes || '',
      active: location.active !== false
    });
    setDialogOpen(true);
  };

  const handleSaveLocation = async () => {
    if (!locationForm.name || !locationForm.address || !locationForm.city || !locationForm.state || !locationForm.zip_code) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (Name, Address, City, State, ZIP)',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      if (editingLocation) {
        // Update existing location
        await axios.put(`${API}/admin-settings/local-pickup/locations/${editingLocation.id}`, locationForm);
        setSettings(prev => ({
          ...prev,
          locations: prev.locations.map(loc => 
            loc.id === editingLocation.id ? { ...locationForm, id: editingLocation.id } : loc
          )
        }));
        toast({ title: 'Success', description: 'Location updated' });
      } else {
        // Add new location
        const response = await axios.post(`${API}/admin-settings/local-pickup/locations`, locationForm);
        setSettings(prev => ({
          ...prev,
          locations: [...prev.locations, response.data.location]
        }));
        toast({ title: 'Success', description: 'Location added' });
      }
      setDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save location',
        variant: 'destructive'
      });
    }
    setSaving(false);
  };

  const handleDeleteLocation = async (locationId) => {
    if (!window.confirm('Are you sure you want to delete this pickup location?')) {
      return;
    }

    try {
      await axios.delete(`${API}/admin-settings/local-pickup/locations/${locationId}`);
      setSettings(prev => ({
        ...prev,
        locations: prev.locations.filter(loc => loc.id !== locationId)
      }));
      toast({ title: 'Success', description: 'Location deleted' });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete location',
        variant: 'destructive'
      });
    }
  };

  const handleToggleLocationActive = async (locationId, active) => {
    const location = settings.locations.find(loc => loc.id === locationId);
    if (!location) return;

    try {
      await axios.put(`${API}/admin-settings/local-pickup/locations/${locationId}`, {
        ...location,
        active
      });
      setSettings(prev => ({
        ...prev,
        locations: prev.locations.map(loc => 
          loc.id === locationId ? { ...loc, active } : loc
        )
      }));
      toast({ 
        title: 'Success', 
        description: `Location ${active ? 'activated' : 'deactivated'}` 
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update location',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <>
      <Card data-testid="local-pickup-settings-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle>Local Pickup</CardTitle>
                <CardDescription>
                  Allow customers to pick up orders from your physical locations
                </CardDescription>
              </div>
            </div>
            <Switch
              data-testid="local-pickup-toggle"
              checked={settings.enabled}
              onCheckedChange={handleToggleEnabled}
              disabled={saving}
            />
          </div>
        </CardHeader>
        
        {settings.enabled && (
          <CardContent className="space-y-4">
            {/* Status indicator */}
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              settings.locations.filter(l => l.active !== false).length > 0
                ? 'bg-green-50 border border-green-200'
                : 'bg-amber-50 border border-amber-200'
            }`}>
              {settings.locations.filter(l => l.active !== false).length > 0 ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-700">
                    {settings.locations.filter(l => l.active !== false).length} active pickup location(s) available at checkout
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    No active pickup locations. Add a location below.
                  </span>
                </>
              )}
            </div>

            {/* Locations list */}
            <div className="space-y-3">
              {settings.locations.map((location) => (
                <div
                  key={location.id}
                  data-testid={`pickup-location-${location.id}`}
                  className={`p-4 border rounded-lg ${
                    location.active !== false ? 'bg-white' : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900">{location.name}</h4>
                        {location.active === false && (
                          <Badge variant="outline" className="text-gray-500">Inactive</Badge>
                        )}
                      </div>
                      <div className="mt-1 space-y-1 text-sm text-gray-600">
                        <p className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {location.address}, {location.city}, {location.state} {location.zip_code}
                        </p>
                        {location.phone && (
                          <p className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {location.phone}
                          </p>
                        )}
                        {location.hours && (
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {location.hours}
                          </p>
                        )}
                        {location.notes && (
                          <p className="text-gray-500 italic mt-1">
                            {location.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Switch
                        checked={location.active !== false}
                        onCheckedChange={(active) => handleToggleLocationActive(location.id, active)}
                        aria-label="Toggle location active"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(location)}
                        data-testid={`edit-location-${location.id}`}
                      >
                        <Edit className="w-4 h-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteLocation(location.id)}
                        data-testid={`delete-location-${location.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add location button */}
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={openAddDialog}
              data-testid="add-pickup-location-btn"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Pickup Location
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Add/Edit Location Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingLocation ? 'Edit Pickup Location' : 'Add Pickup Location'}
            </DialogTitle>
            <DialogDescription>
              {editingLocation 
                ? 'Update the details for this pickup location.'
                : 'Add a new location where customers can pick up their orders.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="location-name">Location Name *</Label>
              <Input
                id="location-name"
                placeholder="e.g., Main Store, Warehouse"
                value={locationForm.name}
                onChange={(e) => setLocationForm(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1"
                data-testid="location-name-input"
              />
            </div>

            <div>
              <Label htmlFor="location-address">Street Address *</Label>
              <Input
                id="location-address"
                placeholder="123 Main Street"
                value={locationForm.address}
                onChange={(e) => setLocationForm(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1"
                data-testid="location-address-input"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="location-city">City *</Label>
                <Input
                  id="location-city"
                  placeholder="Dothan"
                  value={locationForm.city}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, city: e.target.value }))}
                  className="mt-1"
                  data-testid="location-city-input"
                />
              </div>
              <div>
                <Label htmlFor="location-state">State *</Label>
                <Input
                  id="location-state"
                  placeholder="AL"
                  value={locationForm.state}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, state: e.target.value.toUpperCase() }))}
                  className="mt-1 uppercase"
                  maxLength={2}
                  data-testid="location-state-input"
                />
              </div>
              <div>
                <Label htmlFor="location-zip">ZIP Code *</Label>
                <Input
                  id="location-zip"
                  placeholder="36301"
                  value={locationForm.zip_code}
                  onChange={(e) => setLocationForm(prev => ({ ...prev, zip_code: e.target.value }))}
                  className="mt-1"
                  data-testid="location-zip-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="location-phone">Phone Number</Label>
              <Input
                id="location-phone"
                placeholder="(555) 123-4567"
                value={locationForm.phone}
                onChange={(e) => setLocationForm(prev => ({ ...prev, phone: e.target.value }))}
                className="mt-1"
                data-testid="location-phone-input"
              />
            </div>

            <div>
              <Label htmlFor="location-hours">Business Hours</Label>
              <Input
                id="location-hours"
                placeholder="Mon-Fri: 9am-5pm, Sat: 10am-2pm"
                value={locationForm.hours}
                onChange={(e) => setLocationForm(prev => ({ ...prev, hours: e.target.value }))}
                className="mt-1"
                data-testid="location-hours-input"
              />
            </div>

            <div>
              <Label htmlFor="location-notes">Pickup Instructions</Label>
              <Textarea
                id="location-notes"
                placeholder="e.g., Enter through the side door, ask for store manager"
                value={locationForm.notes}
                onChange={(e) => setLocationForm(prev => ({ ...prev, notes: e.target.value }))}
                className="mt-1"
                rows={2}
                data-testid="location-notes-input"
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="location-active"
                checked={locationForm.active}
                onCheckedChange={(active) => setLocationForm(prev => ({ ...prev, active }))}
                data-testid="location-active-toggle"
              />
              <Label htmlFor="location-active" className="cursor-pointer">
                Location is active and visible at checkout
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveLocation}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-700"
              data-testid="save-location-btn"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {editingLocation ? 'Update Location' : 'Add Location'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminLocalPickupSettings;
