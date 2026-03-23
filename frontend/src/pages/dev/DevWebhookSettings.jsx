import React from 'react';
import { Webhook, Plus, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const DevWebhookSettings = () => {
  const webhooks = [
    { id: 1, name: 'Stripe Webhook', url: '/api/webhook/stripe', events: ['payment.success', 'subscription.created'], status: 'active', lastTriggered: '2026-02-07' },
    { id: 2, name: 'Order Notifications', url: '/api/webhook/orders', events: ['order.created', 'order.shipped'], status: 'active', lastTriggered: '2026-02-06' },
  ];

  return (
    <div className="max-w-4xl" data-testid="dev-webhook-settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Webhook className="w-7 h-7 text-[#6e2ea8]" />
            Webhooks
          </h2>
          <p className="text-gray-500 mt-1">Configure webhook endpoints for event notifications</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Webhook
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Webhook Endpoints</CardTitle>
          <CardDescription>Receive real-time notifications for events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <div key={webhook.id} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{webhook.name}</p>
                    <Badge variant={webhook.status === 'active' ? 'default' : 'secondary'}>
                      {webhook.status === 'active' ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                      {webhook.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 font-mono">{webhook.url}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {webhook.events.map((event) => (
                    <Badge key={event} variant="outline" className="text-xs">{event}</Badge>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-2">Last triggered: {webhook.lastTriggered}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevWebhookSettings;
