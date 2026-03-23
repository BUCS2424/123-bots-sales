import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Store, Plus, Trash2, RefreshCw, Copy, Eye, EyeOff, 
  ExternalLink, CheckCircle, XCircle, Settings, Key, Truck, Boxes, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Johnny5Stores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCredentials, setShowCredentials] = useState(null);
  const [newStore, setNewStore] = useState({
    name: '',
    url: '',
    description: '',
    store_api_key: '',
    shipping_enabled: false,
    shipping_provider: 'active',
    shipping_markup_type: 'none',
    shipping_markup_amount: 0,
    stock_sync_enabled: true,
    billing_markup_type: 'none',
    billing_markup_amount: 0,
  });
  const [newCredentials, setNewCredentials] = useState(null);
  const [editingStore, setEditingStore] = useState(null);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/johnny5/stores`);
      setStores(response.data.stores || []);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
    setLoading(false);
  };

  const handleAddStore = async () => {
    if (!newStore.name || !newStore.url) {
      toast({ title: 'Error', description: 'Name and URL are required', variant: 'destructive' });
      return;
    }

    try {
      const response = await axios.post(`${BACKEND_URL}/api/johnny5/stores`, newStore);
      setNewCredentials(response.data.store);
      setStores([...stores, response.data.store]);
      setNewStore({
        name: '',
        url: '',
        description: '',
        store_api_key: '',
        shipping_enabled: false,
        shipping_provider: 'active',
        shipping_markup_type: 'none',
        shipping_markup_amount: 0,
        stock_sync_enabled: true,
        billing_markup_type: 'none',
        billing_markup_amount: 0,
      });
      setShowAddModal(false);
      toast({ title: 'Success', description: 'Store connected successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add store', variant: 'destructive' });
    }
  };

  const handleUpdateStoreSettings = async (storeId, updates) => {
    try {
      await axios.put(`${BACKEND_URL}/api/johnny5/stores/${storeId}`, updates);
      setStores(stores.map(s => s.id === storeId ? { ...s, ...updates } : s));
      setEditingStore(null);
      toast({ title: 'Success', description: 'Store settings updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update store settings', variant: 'destructive' });
    }
  };

  const handleDeleteStore = async (storeId) => {
    if (!window.confirm('Are you sure you want to disconnect this store?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/johnny5/stores/${storeId}`);
      setStores(stores.filter(s => s.id !== storeId));
      toast({ title: 'Success', description: 'Store disconnected' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to disconnect store', variant: 'destructive' });
    }
  };

  const handleRegenerateKeys = async (storeId) => {
    if (!window.confirm('This will invalidate the current API keys. Continue?')) return;

    try {
      const response = await axios.post(`${BACKEND_URL}/api/johnny5/stores/${storeId}/regenerate-keys`);
      setShowCredentials({
        storeId,
        api_key: response.data.api_key,
        api_secret: response.data.api_secret
      });
      toast({ title: 'Success', description: 'Keys regenerated. Update your store configuration.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to regenerate keys', variant: 'destructive' });
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: `${label} copied to clipboard` });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="johnny5-stores">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Store className="w-8 h-8 text-blue-600" />
            Connected Stores
          </h1>
          <p className="text-gray-500 mt-1">Manage your connected store clones</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Store
        </Button>
      </div>

      {/* New Credentials Modal */}
      {newCredentials && (
        <Card className="border-2 border-green-500 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Store Connected - Save These Credentials!
            </CardTitle>
            <CardDescription className="text-green-700">
              These credentials are only shown once. Save them securely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-green-700">Store Name</Label>
              <p className="font-semibold text-green-900">{newCredentials.name}</p>
            </div>
            <div>
              <Label className="text-green-700">API Key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                  {newCredentials.api_key}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(newCredentials.api_key, 'API Key')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-green-700">API Secret</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                  {newCredentials.api_secret}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(newCredentials.api_secret, 'API Secret')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-green-700">Webhook URL (add to connected store)</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                  {BACKEND_URL}/api/johnny5/webhook/order
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(`${BACKEND_URL}/api/johnny5/webhook/order`, 'Webhook URL')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={() => setNewCredentials(null)} className="w-full">
              I've Saved These Credentials
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Add Store Modal */}
      {showAddModal && (
        <Card className="border-2 border-blue-300">
          <CardHeader>
            <CardTitle>Add New Connected Store</CardTitle>
            <CardDescription>Connect a cloned store to receive its orders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Store Name *</Label>
              <Input
                value={newStore.name}
                onChange={(e) => setNewStore({ ...newStore, name: e.target.value })}
                placeholder="e.g., Custom Shop West"
              />
            </div>
            <div>
              <Label>Store URL / API Endpoint *</Label>
              <Input
                value={newStore.url}
                onChange={(e) => setNewStore({ ...newStore, url: e.target.value })}
                placeholder="https://custom-shop-west.com"
              />
              <p className="text-xs text-gray-500 mt-1">The base URL of the connected store</p>
            </div>
            <div>
              <Label>Store API Key (from the external store)</Label>
              <Input
                value={newStore.store_api_key}
                onChange={(e) => setNewStore({ ...newStore, store_api_key: e.target.value })}
                placeholder="j5_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                data-testid="new-store-api-key-input"
              />
              <p className="text-xs text-gray-500 mt-1">
                The API key generated when the store enables Johnny 5 integration. 
                Used to push tracking info back to the store.
              </p>
            </div>
            <div className="border rounded-lg p-3 space-y-3 bg-slate-50" data-testid="new-store-shipping-config">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm">Shipping Calculator via Johnny 5</Label>
                  <p className="text-xs text-gray-500">Connected checkout requests rates from this hub</p>
                </div>
                <Switch
                  checked={newStore.shipping_enabled}
                  onCheckedChange={(checked) => setNewStore({ ...newStore, shipping_enabled: checked })}
                  data-testid="new-store-shipping-enabled-toggle"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Provider</Label>
                  <Select value={newStore.shipping_provider} onValueChange={(value) => setNewStore({ ...newStore, shipping_provider: value })}>
                    <SelectTrigger className="mt-1 h-8" data-testid="new-store-shipping-provider-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Use active global provider</SelectItem>
                      <SelectItem value="shippo">Shippo</SelectItem>
                      <SelectItem value="easypost">EasyPost</SelectItem>
                      <SelectItem value="shipstation">ShipStation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Markup Type</Label>
                  <Select value={newStore.shipping_markup_type} onValueChange={(value) => setNewStore({ ...newStore, shipping_markup_type: value })}>
                    <SelectTrigger className="mt-1 h-8" data-testid="new-store-shipping-markup-type-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Markup Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newStore.shipping_markup_amount}
                    onChange={(e) => setNewStore({ ...newStore, shipping_markup_amount: Number(e.target.value || 0) })}
                    className="mt-1 h-8"
                    data-testid="new-store-shipping-markup-amount-input"
                  />
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-3 space-y-3 bg-purple-50/40" data-testid="new-store-billing-config">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-700">
                <DollarSign className="w-4 h-4" />
                Store Billing Defaults (Johnny 5 invoice)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Markup Type</Label>
                  <Select value={newStore.billing_markup_type} onValueChange={(value) => setNewStore({ ...newStore, billing_markup_type: value })}>
                    <SelectTrigger className="mt-1 h-8" data-testid="new-store-billing-markup-type-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Markup Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newStore.billing_markup_amount}
                    onChange={(e) => setNewStore({ ...newStore, billing_markup_amount: Number(e.target.value || 0) })}
                    className="mt-1 h-8"
                    data-testid="new-store-billing-markup-amount-input"
                  />
                </div>
                <div className="flex items-end">
                  <div className="flex items-center justify-between w-full border rounded-md px-3 h-8 bg-white">
                    <span className="text-xs text-gray-600 flex items-center gap-1"><Boxes className="w-3 h-3" />Stock Sync</span>
                    <Switch
                      checked={newStore.stock_sync_enabled}
                      onCheckedChange={(checked) => setNewStore({ ...newStore, stock_sync_enabled: checked })}
                      data-testid="new-store-stock-sync-toggle"
                    />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <Label>Description (optional)</Label>
              <Input
                value={newStore.description}
                onChange={(e) => setNewStore({ ...newStore, description: e.target.value })}
                placeholder="West coast fulfillment store"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleAddStore} className="flex-1 bg-blue-600 hover:bg-blue-700">
                Connect Store
              </Button>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regenerated Keys Display */}
      {showCredentials && (
        <Card className="border-2 border-amber-500 bg-amber-50">
          <CardHeader>
            <CardTitle className="text-amber-800 flex items-center gap-2">
              <Key className="w-5 h-5" />
              New API Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-amber-700">API Key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                  {showCredentials.api_key}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(showCredentials.api_key, 'API Key')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div>
              <Label className="text-amber-700">API Secret</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono">
                  {showCredentials.api_secret}
                </code>
                <Button size="sm" variant="outline" onClick={() => copyToClipboard(showCredentials.api_secret, 'API Secret')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <Button onClick={() => setShowCredentials(null)} className="w-full">
              Done
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Store List */}
      {stores.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="py-12 text-center">
            <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Connected Stores</h3>
            <p className="text-gray-500 mb-4">Add your first store clone to start receiving orders</p>
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Store
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {stores.map((store) => (
            <Card key={store.id} className="hover:shadow-md transition-shadow">
              <CardContent className="py-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      store.status === 'active' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <Store className={`w-6 h-6 ${
                        store.status === 'active' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{store.name}</h3>
                        <Badge variant={store.status === 'active' ? 'default' : 'secondary'}>
                          {store.status}
                        </Badge>
                        {store.store_api_key ? (
                          <Badge variant="outline" className="text-green-600 border-green-300">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Tracking Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            <XCircle className="w-3 h-3 mr-1" />
                            No Tracking Key
                          </Badge>
                        )}
                      </div>
                      <a 
                        href={store.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {store.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      {store.description && (
                        <p className="text-sm text-gray-500 mt-1">{store.description}</p>
                      )}
                      
                      {/* Store API Key Section */}
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-medium text-gray-600">Store API Key (for tracking pushback)</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingStore(editingStore === store.id ? null : store.id)}
                            className="h-6 text-xs"
                          >
                            <Settings className="w-3 h-3 mr-1" />
                            {editingStore === store.id ? 'Cancel' : 'Edit'}
                          </Button>
                        </div>
                        {editingStore === store.id ? (
                          <div className="mt-2 space-y-3" data-testid={`store-settings-editor-${store.id}`}>
                            <Input
                              defaultValue={store.store_api_key || ''}
                              placeholder="j5_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                              className="text-xs h-8"
                              id={`store-api-key-${store.id}`}
                              data-testid={`store-api-key-input-${store.id}`}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <div className="flex items-center justify-between border rounded px-2 py-1.5 bg-white">
                                <span className="text-xs flex items-center gap-1"><Truck className="w-3 h-3" />Shipping Calc</span>
                                <Switch
                                  defaultChecked={Boolean(store.shipping_enabled)}
                                  id={`store-shipping-enabled-${store.id}`}
                                  data-testid={`store-shipping-enabled-toggle-${store.id}`}
                                />
                              </div>
                              <div className="flex items-center justify-between border rounded px-2 py-1.5 bg-white">
                                <span className="text-xs flex items-center gap-1"><Boxes className="w-3 h-3" />Stock Sync</span>
                                <Switch
                                  defaultChecked={store.stock_sync_enabled !== false}
                                  id={`store-stock-sync-${store.id}`}
                                  data-testid={`store-stock-sync-toggle-${store.id}`}
                                />
                              </div>
                              <div>
                                <Label className="text-[11px]">Shipping Provider</Label>
                                <select
                                  id={`store-shipping-provider-${store.id}`}
                                  defaultValue={store.shipping_provider || 'active'}
                                  className="w-full border rounded h-8 px-2 text-xs bg-white"
                                  data-testid={`store-shipping-provider-select-${store.id}`}
                                >
                                  <option value="active">Use active global provider</option>
                                  <option value="shippo">Shippo</option>
                                  <option value="easypost">EasyPost</option>
                                  <option value="shipstation">ShipStation</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-[11px]">Shipping Markup Type</Label>
                                <select
                                  id={`store-shipping-markup-type-${store.id}`}
                                  defaultValue={store.shipping_markup_type || 'none'}
                                  className="w-full border rounded h-8 px-2 text-xs bg-white"
                                  data-testid={`store-shipping-markup-type-select-${store.id}`}
                                >
                                  <option value="none">None</option>
                                  <option value="flat">Flat</option>
                                  <option value="percentage">Percentage</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-[11px]">Shipping Markup Amount</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  defaultValue={store.shipping_markup_amount || 0}
                                  className="h-8 text-xs"
                                  id={`store-shipping-markup-amount-${store.id}`}
                                  data-testid={`store-shipping-markup-amount-input-${store.id}`}
                                />
                              </div>
                              <div>
                                <Label className="text-[11px]">Billing Markup Type</Label>
                                <select
                                  id={`store-billing-markup-type-${store.id}`}
                                  defaultValue={store.billing_markup_type || 'none'}
                                  className="w-full border rounded h-8 px-2 text-xs bg-white"
                                  data-testid={`store-billing-markup-type-select-${store.id}`}
                                >
                                  <option value="none">None</option>
                                  <option value="flat">Flat</option>
                                  <option value="percentage">Percentage</option>
                                </select>
                              </div>
                              <div>
                                <Label className="text-[11px]">Billing Markup Amount</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  defaultValue={store.billing_markup_amount || 0}
                                  className="h-8 text-xs"
                                  id={`store-billing-markup-amount-${store.id}`}
                                  data-testid={`store-billing-markup-amount-input-${store.id}`}
                                />
                              </div>
                            </div>

                            <Button
                              size="sm"
                              className="h-8"
                              data-testid={`save-store-settings-btn-${store.id}`}
                              onClick={() => {
                                const payload = {
                                  store_api_key: document.getElementById(`store-api-key-${store.id}`)?.value || '',
                                  shipping_enabled: Boolean(document.getElementById(`store-shipping-enabled-${store.id}`)?.dataset?.state === 'checked'),
                                  stock_sync_enabled: Boolean(document.getElementById(`store-stock-sync-${store.id}`)?.dataset?.state === 'checked'),
                                  shipping_provider: document.getElementById(`store-shipping-provider-${store.id}`)?.value || 'active',
                                  shipping_markup_type: document.getElementById(`store-shipping-markup-type-${store.id}`)?.value || 'none',
                                  shipping_markup_amount: Number(document.getElementById(`store-shipping-markup-amount-${store.id}`)?.value || 0),
                                  billing_markup_type: document.getElementById(`store-billing-markup-type-${store.id}`)?.value || 'none',
                                  billing_markup_amount: Number(document.getElementById(`store-billing-markup-amount-${store.id}`)?.value || 0),
                                };
                                handleUpdateStoreSettings(store.id, payload);
                              }}
                            >
                              Save Store Integration Settings
                            </Button>
                          </div>
                        ) : (
                          <code className="text-xs text-gray-600 block mt-1">
                            {store.store_api_key ? `${store.store_api_key.substring(0, 20)}...` : 'Not configured'}
                          </code>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2" data-testid={`store-config-badges-${store.id}`}>
                        <Badge variant={store.shipping_enabled ? 'default' : 'secondary'} data-testid={`store-shipping-enabled-badge-${store.id}`}>
                          {store.shipping_enabled ? `Shipping: ${store.shipping_provider || 'active'}` : 'Shipping: Off'}
                        </Badge>
                        <Badge variant={store.stock_sync_enabled !== false ? 'default' : 'secondary'} data-testid={`store-stock-sync-badge-${store.id}`}>
                          {store.stock_sync_enabled !== false ? 'Stock Sync: On' : 'Stock Sync: Off'}
                        </Badge>
                        <Badge variant="outline" data-testid={`store-billing-markup-badge-${store.id}`}>
                          Billing Markup: {store.billing_markup_type || 'none'} {store.billing_markup_amount || 0}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          {store.pending_orders || 0} pending
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-400"></span>
                          {store.total_orders || 0} total orders
                        </span>
                        {store.last_sync && (
                          <span>Last sync: {new Date(store.last_sync).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRegenerateKeys(store.id)}
                      title="Regenerate API Keys"
                    >
                      <Key className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteStore(store.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Setup Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Setup Instructions for Clone Stores</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ol className="list-decimal list-inside space-y-3 text-sm">
            <li>
              <strong>On the clone store:</strong> Enable "Johnny 5 Integration" in Dev Settings → Feature Flags
              <p className="text-xs text-blue-600 ml-5 mt-1">This generates an API key for that store</p>
            </li>
            <li>
              <strong>Add the store here</strong> with its name, URL, and the API key from step 1
              <p className="text-xs text-blue-600 ml-5 mt-1">The store's API key allows Johnny 5 to push tracking info back</p>
            </li>
            <li>
              <strong>In the clone store's</strong> <code className="bg-white px-1 rounded">.env</code> file, add:
              <pre className="bg-white p-2 rounded mt-1 text-xs">
{`JOHNNY5_HUB_URL=${BACKEND_URL}
JOHNNY5_API_KEY=your_api_key_here
JOHNNY5_API_SECRET=your_api_secret_here`}
              </pre>
              <p className="text-xs text-blue-600 ml-5 mt-1">
                Use the <strong>current hub URL</strong> above (not old domains). <code className="bg-white px-1 rounded">JOHNNY5_API_KEY</code> is required.
                <code className="bg-white px-1 rounded ml-1">JOHNNY5_API_SECRET</code> is recommended for signed webhooks ({`X-Webhook-Signature`}).
              </p>
            </li>
            <li>Orders will automatically sync to this hub when placed on the clone store</li>
            <li>
              For connected checkout shipping rates call <code className="bg-white px-1 rounded">/api/johnny5/integration/shipping/rates</code>
              with header <code className="bg-white px-1 rounded">X-Store-API-Key</code>
            </li>
            <li>
              For network inventory source call <code className="bg-white px-1 rounded">/api/johnny5/integration/stock</code> or
              <code className="bg-white px-1 rounded ml-1">/api/johnny5/integration/stock/check</code>
              <p className="text-xs text-blue-600 ml-5 mt-1">
                Configure all option-level stock/cost/ETA from Johnny 5 → Pricing & Stock Sheet (CSV import/export + manual updates)
              </p>
            </li>
            <li>Use the Fulfillment Center to process orders and push tracking back to the source store</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default Johnny5Stores;
