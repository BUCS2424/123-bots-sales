import React from 'react';
import { Key, Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const DevApiSettings = () => {
  const apiKeys = [
    { id: 1, name: 'Production API Key', key: 'sk_live_...abc123', created: '2026-01-15', lastUsed: '2026-02-07', status: 'active' },
    { id: 2, name: 'Test API Key', key: 'sk_test_...xyz789', created: '2026-02-01', lastUsed: '2026-02-06', status: 'active' },
  ];

  return (
    <div className="max-w-4xl" data-testid="dev-api-settings">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Key className="w-7 h-7 text-[#6e2ea8]" />
            API Keys
          </h2>
          <p className="text-gray-500 mt-1">Manage API keys for external integrations</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create API Key
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Active API Keys</CardTitle>
          <CardDescription>Keys used to authenticate API requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{apiKey.name}</p>
                    <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                      {apiKey.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 font-mono mt-1">{apiKey.key}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Created: {apiKey.created} • Last used: {apiKey.lastUsed}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DevApiSettings;
