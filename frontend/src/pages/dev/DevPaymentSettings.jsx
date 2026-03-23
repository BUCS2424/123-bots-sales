import React from 'react';
import { CreditCard, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';

const DevPaymentSettings = () => {
  return (
    <div className="max-w-4xl" data-testid="dev-payment-settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-[#6e2ea8]" />
            Payment Settings
          </h2>
          <p className="text-gray-500 mt-1">Configure payment gateway and processing</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-base">Stripe Configuration</CardTitle>
                <CardDescription>Accept payments with Stripe</CardDescription>
              </div>
            </div>
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Test Mode</p>
                <p className="text-sm text-gray-500">Use test keys for development</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Publishable Key</Label>
                <Input placeholder="pk_test_..." className="mt-1" />
              </div>
              <div>
                <Label>Secret Key</Label>
                <Input type="password" value="sk_test_emergent" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Webhook Secret</Label>
              <Input type="password" placeholder="whsec_..." className="mt-1" />
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button>Save Settings</Button>
              <Button variant="outline">Test Connection</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Methods</CardTitle>
          <CardDescription>Enable or disable payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { name: 'Credit/Debit Cards', enabled: true },
              { name: 'Apple Pay', enabled: false },
              { name: 'Google Pay', enabled: false },
              { name: 'Cash (In-Store)', enabled: true },
            ].map((method) => (
              <div key={method.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{method.name}</span>
                <Switch defaultChecked={method.enabled} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevPaymentSettings;
