import React from 'react';
import { Shield, Lock, Key, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';

const DevSecuritySettings = () => {
  return (
    <div className="max-w-4xl" data-testid="dev-security-settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-7 h-7 text-[#6e2ea8]" />
            Security Settings
          </h2>
          <p className="text-gray-500 mt-1">Configure authentication and security options</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-base">Authentication</CardTitle>
              <CardDescription>Configure login and session settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Session Timeout</p>
                <p className="text-sm text-gray-500">Automatically log out after inactivity</p>
              </div>
              <div className="flex items-center gap-2">
                <Input type="number" defaultValue="30" className="w-20" />
                <span className="text-gray-500">minutes</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Password Requirements</p>
                <p className="text-sm text-gray-500">Minimum 8 characters with numbers</p>
              </div>
              <Button size="sm" variant="outline">Configure</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Key className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-base">JWT Settings</CardTitle>
              <CardDescription>Configure token-based authentication</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label>JWT Secret Key</Label>
              <Input type="password" placeholder="••••••••" className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Token Expiration</Label>
                <Input type="number" defaultValue="24" className="mt-1" />
                <p className="text-xs text-gray-500 mt-1">Hours until token expires</p>
              </div>
              <div>
                <Label>Refresh Token Expiration</Label>
                <Input type="number" defaultValue="7" className="mt-1" />
                <p className="text-xs text-gray-500 mt-1">Days until refresh token expires</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-[#6e2ea8]" />
            </div>
            <div>
              <CardTitle className="text-base">Role Management</CardTitle>
              <CardDescription>Configure user roles and permissions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { role: 'Super Admin', description: 'Full access to all features including dev settings', count: 1 },
              { role: 'Admin', description: 'Access to admin panel and management features', count: 0 },
              { role: 'Staff', description: 'Limited access to POS and inventory', count: 0 },
              { role: 'Customer', description: 'Public user with order history', count: 0 },
            ].map((item) => (
              <div key={item.role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{item.role}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">{item.count} users</span>
                  <Button size="sm" variant="outline">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevSecuritySettings;
