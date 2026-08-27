import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, Mail, Clock, Save, Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminBusinessSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    business_name: '123Bots',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '(844) 589-PEPS (7377)',
    email: 'support@123bots.com',
    website: '',
    description: '',
    monday_hours: '9:00 AM - 6:00 PM',
    tuesday_hours: '9:00 AM - 6:00 PM',
    wednesday_hours: '9:00 AM - 6:00 PM',
    thursday_hours: '9:00 AM - 6:00 PM',
    friday_hours: '9:00 AM - 6:00 PM',
    saturday_hours: '10:00 AM - 4:00 PM',
    sunday_hours: 'Closed',
    show_address_on_contact: true,
    show_hours_on_contact: true,
  });

  // Fetch existing settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/api/admin-settings/business`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          setFormData(prev => ({ ...prev, ...response.data }));
        }
      } catch (error) {
        console.error('Error fetching business settings:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleToggle = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/admin-settings/business`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({
        title: 'Settings Saved',
        description: 'Business information has been updated across the site.',
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="business-settings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Building2 className="w-7 h-7 text-[rgb(37, 99, 235)]" />
            Business Information
          </h1>
          <p className="text-gray-500 mt-1">Manage your business details - changes apply site-wide</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[rgb(37, 99, 235)] hover:bg-[#5a2490]">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[rgb(37, 99, 235)]" />
              Basic Information
            </CardTitle>
            <CardDescription>Your business name and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="business_name">Business Name</Label>
              <Input
                id="business_name"
                name="business_name"
                value={formData.business_name}
                onChange={handleChange}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="mt-1"
                rows={3}
                placeholder="Brief description of your business"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="(844) 589-PEPS (7377)"
                />
              </div>
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1"
                  placeholder="support@123bots.com"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="mt-1"
                placeholder="www.123bots.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[rgb(37, 99, 235)]" />
              Location
            </CardTitle>
            <CardDescription>Business address information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="mt-1"
                placeholder="123 Main Street"
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="col-span-1">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="zip_code">ZIP Code</Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-[rgb(37, 99, 235)]" />
              Business Hours
            </CardTitle>
            <CardDescription>Set your operating hours</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'monday_hours', label: 'Monday' },
              { key: 'tuesday_hours', label: 'Tuesday' },
              { key: 'wednesday_hours', label: 'Wednesday' },
              { key: 'thursday_hours', label: 'Thursday' },
              { key: 'friday_hours', label: 'Friday' },
              { key: 'saturday_hours', label: 'Saturday' },
              { key: 'sunday_hours', label: 'Sunday' },
            ].map(({ key, label }) => (
              <div key={key} className="grid grid-cols-2 sm:grid-cols-3 gap-4 items-center">
                <Label className="text-sm font-medium">{label}</Label>
                <Input
                  name={key}
                  value={formData[key]}
                  onChange={handleChange}
                  className="col-span-2"
                  placeholder="9:00 AM - 6:00 PM"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5 text-[rgb(37, 99, 235)]" />
              Display Settings
            </CardTitle>
            <CardDescription>Control what information is shown publicly</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Show Address on Contact Page</Label>
                <p className="text-sm text-gray-500">
                  Display your physical address on the public contact page
                </p>
              </div>
              <Switch
                checked={formData.show_address_on_contact}
                onCheckedChange={() => handleToggle('show_address_on_contact')}
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div className="space-y-0.5">
                <Label className="text-base font-medium">Show Business Hours on Contact Page</Label>
                <p className="text-sm text-gray-500">
                  Display your operating hours on the public contact page
                </p>
              </div>
              <Switch
                checked={formData.show_hours_on_contact}
                onCheckedChange={() => handleToggle('show_hours_on_contact')}
              />
            </div>
            
            {/* Preview info */}
            <div className="p-4 border border-amber-200 bg-amber-50 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Changes to business information will be reflected across:
              </p>
              <ul className="text-sm text-amber-700 mt-2 list-disc list-inside space-y-1">
                <li>Top navigation bar (phone & email)</li>
                <li>Contact page</li>
                <li>Footer</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminBusinessSettings;
