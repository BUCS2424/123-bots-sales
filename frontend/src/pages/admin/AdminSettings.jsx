import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AdminSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [businessInfo, setBusinessInfo] = useState(null);
  const [taxSettings, setTaxSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [businessRes, taxRes] = await Promise.all([
          axios.get(`${API_URL}/api/settings/business`),
          axios.get(`${API_URL}/api/admin-settings/tax`, { headers })
        ]);
        
        setBusinessInfo(businessRes.data);
        setTaxSettings(taxRes.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  // Format address
  const getFormattedAddress = () => {
    if (!businessInfo) return 'Not configured';
    const parts = [];
    if (businessInfo.address) parts.push(businessInfo.address);
    if (businessInfo.city || businessInfo.state || businessInfo.zip_code) {
      let line = '';
      if (businessInfo.city) line += businessInfo.city;
      if (businessInfo.state) line += (line ? ', ' : '') + businessInfo.state;
      if (businessInfo.zip_code) line += ' ' + businessInfo.zip_code;
      if (line) parts.push(line);
    }
    return parts.length > 0 ? parts.join(', ') : 'Not configured';
  };

  // Get primary tax rate
  const getPrimaryTaxRate = () => {
    if (!taxSettings?.tax_rates?.length) return 'Not configured';
    const primaryRate = taxSettings.tax_rates.find(r => r.is_default) || taxSettings.tax_rates[0];
    return `${primaryRate.rate}% (${primaryRate.name})`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your store settings and preferences</p>
      </div>

      <div className="grid gap-6">
        {/* Store Info - Synced with Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Store Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Store Name</p>
                <p className="font-medium">{businessInfo?.business_name || '123Bots'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{getFormattedAddress()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{businessInfo?.phone || '(844) 589-PEPS (7377)'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{businessInfo?.email || 'support@123bots.com'}</p>
              </div>
              {businessInfo?.website && (
                <div>
                  <p className="text-sm text-gray-500">Website</p>
                  <p className="font-medium">{businessInfo.website}</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Edit in: Admin Settings → Business Information
            </p>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[rgb(37, 99, 235)] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-lg">{user?.name}</p>
                <p className="text-gray-500">{user?.email}</p>
                <Badge className="bg-purple-100 text-purple-800 mt-1">
                  {user?.role?.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tax Settings - Synced with Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Tax Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tax Status</p>
                <p className="font-medium">
                  {taxSettings?.tax_enabled ? (
                    <Badge className="bg-green-100 text-green-700">Enabled</Badge>
                  ) : (
                    <Badge variant="secondary">Disabled</Badge>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Primary Tax Rate</p>
                <p className="font-medium">{getPrimaryTaxRate()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tax Calculation</p>
                <p className="font-medium capitalize">{taxSettings?.tax_calculation || 'Exclusive'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tax Rates Configured</p>
                <p className="font-medium">{taxSettings?.tax_rates?.length || 0} rate(s)</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Edit in: Admin Settings → Tax Settings
            </p>
          </CardContent>
        </Card>

        {/* Business Hours - Synced with Business Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Business Hours</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Monday</span>
                <span className="font-medium">{businessInfo?.monday_hours || '9:00 AM - 6:00 PM'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tuesday</span>
                <span className="font-medium">{businessInfo?.tuesday_hours || '9:00 AM - 6:00 PM'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Wednesday</span>
                <span className="font-medium">{businessInfo?.wednesday_hours || '9:00 AM - 6:00 PM'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Thursday</span>
                <span className="font-medium">{businessInfo?.thursday_hours || '9:00 AM - 6:00 PM'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Friday</span>
                <span className="font-medium">{businessInfo?.friday_hours || '9:00 AM - 6:00 PM'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Saturday</span>
                <span className="font-medium">{businessInfo?.saturday_hours || '10:00 AM - 4:00 PM'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Sunday</span>
                <span className="font-medium">{businessInfo?.sunday_hours || 'Closed'}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              Edit in: Admin Settings → Business Information
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSettings;
