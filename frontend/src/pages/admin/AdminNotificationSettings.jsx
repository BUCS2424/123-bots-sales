import React, { useState } from 'react';
import { Bell, Mail, MessageSquare, Save, Loader2, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';

const AdminNotificationSettings = () => {
  const [saving, setSaving] = useState(false);
  const [emailSettings, setEmailSettings] = useState({
    enabled: true,
    fromEmail: 'noreply@alabamapawnstorage.com',
    fromName: '123Bots',
    newOrderNotify: true,
    lowStockNotify: true,
    newCustomerNotify: false,
    dailyReportEnabled: true,
    dailyReportTime: '08:00',
  });

  const [smsSettings, setSmsSettings] = useState({
    enabled: false,
    provider: 'twilio',
    phoneNumber: '',
    rentalReminders: true,
    paymentAlerts: true,
  });

  const [notificationRecipients, setNotificationRecipients] = useState([
    { id: 1, email: 'mel@a2gdesigns.com', types: ['orders', 'stock', 'reports'] },
  ]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'Notification Settings Saved',
      description: 'Your notification preferences have been updated.',
    });
    setSaving(false);
  };

  const addRecipient = () => {
    setNotificationRecipients([
      ...notificationRecipients,
      { id: Date.now(), email: '', types: ['orders'] }
    ]);
  };

  const removeRecipient = (id) => {
    setNotificationRecipients(notificationRecipients.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-6" data-testid="notification-settings-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Bell className="w-7 h-7 text-[#6e2ea8]" />
            Notification Settings
          </h1>
          <p className="text-gray-500 mt-1">Configure email and SMS notifications</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="bg-[#6e2ea8] hover:bg-[#a01830]">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-500" />
                  Email Notifications
                </CardTitle>
                <CardDescription>Configure email alerts and reports</CardDescription>
              </div>
              <Switch
                checked={emailSettings.enabled}
                onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, enabled: checked }))}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromEmail">From Email</Label>
                <Input
                  id="fromEmail"
                  value={emailSettings.fromEmail}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, fromEmail: e.target.value }))}
                  className="mt-1"
                  disabled={!emailSettings.enabled}
                />
              </div>
              <div>
                <Label htmlFor="fromName">From Name</Label>
                <Input
                  id="fromName"
                  value={emailSettings.fromName}
                  onChange={(e) => setEmailSettings(prev => ({ ...prev, fromName: e.target.value }))}
                  className="mt-1"
                  disabled={!emailSettings.enabled}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700">Notification Types</p>
              <div className="flex items-center justify-between">
                <Label>New Order Notifications</Label>
                <Switch
                  checked={emailSettings.newOrderNotify}
                  onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, newOrderNotify: checked }))}
                  disabled={!emailSettings.enabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Low Stock Alerts</Label>
                <Switch
                  checked={emailSettings.lowStockNotify}
                  onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, lowStockNotify: checked }))}
                  disabled={!emailSettings.enabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>New Customer Signups</Label>
                <Switch
                  checked={emailSettings.newCustomerNotify}
                  onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, newCustomerNotify: checked }))}
                  disabled={!emailSettings.enabled}
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Daily Report Email</Label>
                  <p className="text-xs text-gray-500">Receive a daily sales summary</p>
                </div>
                <Switch
                  checked={emailSettings.dailyReportEnabled}
                  onCheckedChange={(checked) => setEmailSettings(prev => ({ ...prev, dailyReportEnabled: checked }))}
                  disabled={!emailSettings.enabled}
                />
              </div>
              {emailSettings.dailyReportEnabled && (
                <div>
                  <Label>Report Time</Label>
                  <Input
                    type="time"
                    value={emailSettings.dailyReportTime}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, dailyReportTime: e.target.value }))}
                    className="mt-1 w-32"
                    disabled={!emailSettings.enabled}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-gray-500" />
                  SMS Notifications
                </CardTitle>
                <CardDescription>Configure SMS alerts for customers</CardDescription>
              </div>
              <Switch
                checked={smsSettings.enabled}
                onCheckedChange={(checked) => setSmsSettings(prev => ({ ...prev, enabled: checked }))}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>SMS Provider</Label>
              <Select 
                value={smsSettings.provider} 
                onValueChange={(value) => setSmsSettings(prev => ({ ...prev, provider: value }))}
                disabled={!smsSettings.enabled}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="twilio">Twilio</SelectItem>
                  <SelectItem value="messagebird">MessageBird</SelectItem>
                  <SelectItem value="vonage">Vonage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="smsPhone">From Phone Number</Label>
              <Input
                id="smsPhone"
                placeholder="+1 (555) 000-0000"
                value={smsSettings.phoneNumber}
                onChange={(e) => setSmsSettings(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="mt-1"
                disabled={!smsSettings.enabled}
              />
            </div>

            <div className="space-y-3 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700">Customer SMS Alerts</p>
              <div className="flex items-center justify-between">
                <Label>Storage Rental Reminders</Label>
                <Switch
                  checked={smsSettings.rentalReminders}
                  onCheckedChange={(checked) => setSmsSettings(prev => ({ ...prev, rentalReminders: checked }))}
                  disabled={!smsSettings.enabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Payment Due Alerts</Label>
                <Switch
                  checked={smsSettings.paymentAlerts}
                  onCheckedChange={(checked) => setSmsSettings(prev => ({ ...prev, paymentAlerts: checked }))}
                  disabled={!smsSettings.enabled}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notification Recipients */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Notification Recipients</CardTitle>
              <CardDescription>Who should receive admin notifications</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addRecipient}>
              <Plus className="w-4 h-4 mr-1" />
              Add Recipient
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {notificationRecipients.map((recipient) => (
                <div key={recipient.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex-1">
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={recipient.email}
                      onChange={(e) => {
                        setNotificationRecipients(notificationRecipients.map(r =>
                          r.id === recipient.id ? { ...r, email: e.target.value } : r
                        ));
                      }}
                    />
                  </div>
                  <div className="flex gap-2">
                    {['orders', 'stock', 'reports'].map((type) => (
                      <button
                        key={type}
                        onClick={() => {
                          setNotificationRecipients(notificationRecipients.map(r =>
                            r.id === recipient.id
                              ? {
                                  ...r,
                                  types: r.types.includes(type)
                                    ? r.types.filter(t => t !== type)
                                    : [...r.types, type]
                                }
                              : r
                          ));
                        }}
                        className={`px-3 py-1 text-xs rounded-full transition-all ${
                          recipient.types.includes(type)
                            ? 'bg-[#6e2ea8] text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRecipient(recipient.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotificationSettings;
