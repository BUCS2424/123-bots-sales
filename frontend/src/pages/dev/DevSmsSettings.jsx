import React from 'react';
import { MessageSquare, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';

const DevSmsSettings = () => {
  return (
    <div className="max-w-4xl" data-testid="dev-sms-settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-[#6e2ea8]" />
            SMS Settings
          </h2>
          <p className="text-gray-500 mt-1">Configure Twilio SMS notifications</p>
        </div>
      </div>

      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Phone className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">Twilio Configuration</CardTitle>
                <CardDescription>Configure Twilio for SMS messaging</CardDescription>
              </div>
            </div>
            <Badge variant="outline">Not Configured</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Account SID</Label>
                <Input placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxx" className="mt-1" />
              </div>
              <div>
                <Label>Auth Token</Label>
                <Input type="password" placeholder="••••••••" className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Phone Number</Label>
              <Input placeholder="+1234567890" className="mt-1" />
              <p className="text-xs text-gray-500 mt-1">Your Twilio phone number for sending SMS</p>
            </div>
            <div className="flex gap-2 pt-4 border-t">
              <Button>Save Settings</Button>
              <Button variant="outline">Send Test SMS</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">SMS Templates</CardTitle>
          <CardDescription>Configure automated SMS messages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Order Shipped', 'Storage Access Code', 'Payment Reminder', 'Appointment Reminder'].map((template) => (
              <div key={template} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">{template}</span>
                <Button size="sm" variant="outline">Edit Template</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevSmsSettings;
