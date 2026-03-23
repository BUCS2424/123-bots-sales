import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  ShoppingCart, Search, Send, Trash2, RefreshCw, Settings, Tag,
  Mail, Clock, DollarSign, Eye, TrendingUp, CheckCircle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminAbandonedCarts = () => {
  const [carts, setCarts] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [hasEmailFilter, setHasEmailFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCart, setSelectedCart] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [recoveryCoupons, setRecoveryCoupons] = useState([]);
  const [couponSearch, setCouponSearch] = useState('');
  const [activeTab, setActiveTab] = useState('carts');

  useEffect(() => {
    fetchCarts();
    fetchStats();
    fetchSettings();
  }, [page, statusFilter, hasEmailFilter]);

  useEffect(() => {
    if (activeTab === 'coupons') {
      fetchRecoveryCoupons();
    }
  }, [activeTab, couponSearch]);

  const fetchCarts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 15);
      if (statusFilter) params.append('status', statusFilter);
      if (hasEmailFilter) params.append('has_email', hasEmailFilter === 'yes');
      if (searchQuery) params.append('search', searchQuery);

      const response = await axios.get(`${API}/abandoned-carts?${params}`);
      setCarts(response.data.carts);
      setTotalPages(response.data.pages);
    } catch (error) {
      console.error('Failed to fetch carts:', error);
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/abandoned-carts/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/abandoned-carts/settings`);
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const fetchRecoveryCoupons = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', 1);
      params.append('limit', 50);
      if (couponSearch) params.append('search', couponSearch);
      
      const response = await axios.get(`${API}/abandoned-carts/recovery-coupons/search?${params}`);
      setRecoveryCoupons(response.data.coupons);
    } catch (error) {
      console.error('Failed to fetch recovery coupons:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCarts();
  };

  const handleResendEmail = async (cartId) => {
    try {
      await axios.post(`${API}/abandoned-carts/${cartId}/resend-email`);
      toast({ title: 'Email Sent', description: 'Recovery email has been sent successfully.' });
      fetchCarts();
      fetchStats();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to send email',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCart = async (cartId) => {
    if (!window.confirm('Are you sure you want to delete this abandoned cart and its coupon?')) return;
    try {
      await axios.delete(`${API}/abandoned-carts/${cartId}`);
      toast({ title: 'Deleted', description: 'Cart and associated coupon have been deleted.' });
      fetchCarts();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete cart', variant: 'destructive' });
    }
  };

  const handleProcessCarts = async () => {
    setProcessing(true);
    try {
      const response = await axios.post(`${API}/abandoned-carts/process-abandoned`);
      const results = response.data.results;
      toast({
        title: 'Processing Complete',
        description: `Marked: ${results.marked_abandoned}, First emails: ${results.first_emails_sent}, Second emails: ${results.second_emails_sent}, Cleaned: ${results.cleaned_up}`
      });
      fetchCarts();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to process carts', variant: 'destructive' });
    }
    setProcessing(false);
  };

  const handleSaveSettings = async () => {
    try {
      await axios.post(`${API}/abandoned-carts/settings`, settings);
      toast({ title: 'Settings Saved', description: 'Abandoned cart settings have been updated.' });
      setShowSettings(false);
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'bg-blue-100 text-blue-800',
      abandoned: 'bg-yellow-100 text-yellow-800',
      recovered: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      empty: 'bg-gray-100 text-gray-500'
    };
    return <Badge className={variants[status] || variants.active}>{status}</Badge>;
  };

  return (
    <div className="space-y-6" data-testid="abandoned-carts-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Abandoned Carts</h1>
          <p className="text-gray-500">Recover lost sales with automated cart recovery emails</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(true)}
            data-testid="settings-btn"
          >
            <Settings className="w-4 h-4 mr-2" /> Settings
          </Button>
          <Button
            onClick={handleProcessCarts}
            disabled={processing}
            className="bg-[#6e2ea8] hover:bg-[#5a2589]"
            data-testid="process-carts-btn"
          >
            {processing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Process Now
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Abandoned</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.total_abandoned}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-yellow-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Recovered</p>
                  <p className="text-2xl font-bold text-green-600">{stats.total_recovered}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Recovery Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.recovery_rate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Recovered Value (30d)</p>
                  <p className="text-2xl font-bold text-green-600">${stats.total_recovered_value_30d?.toLocaleString() || '0'}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="carts" data-testid="carts-tab">
            <ShoppingCart className="w-4 h-4 mr-2" /> Abandoned Carts
          </TabsTrigger>
          <TabsTrigger value="coupons" data-testid="coupons-tab">
            <Tag className="w-4 h-4 mr-2" /> Recovery Coupons
          </TabsTrigger>
        </TabsList>

        {/* Abandoned Carts Tab */}
        <TabsContent value="carts" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by email, name, or coupon code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="search-input"
                    />
                  </div>
                </div>
                <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[150px]" data-testid="status-filter">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                    <SelectItem value="recovered">Recovered</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={hasEmailFilter || 'all'} onValueChange={(v) => setHasEmailFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Carts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Carts</SelectItem>
                    <SelectItem value="yes">Has Email</SelectItem>
                    <SelectItem value="no">No Email</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" variant="outline">
                  <Search className="w-4 h-4 mr-2" /> Search
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Carts List */}
          <div className="space-y-3">
            {loading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                </CardContent>
              </Card>
            ) : carts.length > 0 ? (
              carts.map((cart) => (
                <Card key={cart.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Cart Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusBadge(cart.status)}
                          {cart.recovery_coupon_code && (
                            <Badge className="bg-purple-100 text-purple-800 font-mono">
                              <Tag className="w-3 h-3 mr-1" />
                              {cart.recovery_coupon_code}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Email:</span>{' '}
                            <span className="font-medium">{cart.email || <span className="text-gray-400">Not provided</span>}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Name:</span>{' '}
                            <span className="font-medium">{cart.user_name || <span className="text-gray-400">Guest</span>}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Items:</span>{' '}
                            <span className="font-medium">{cart.items?.length || 0} items</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span><Clock className="w-3 h-3 inline mr-1" /> Updated: {formatDate(cart.updated_at)}</span>
                          {cart.first_email_sent && (
                            <span className="text-green-600">
                              <Mail className="w-3 h-3 inline mr-1" /> 1st email sent
                            </span>
                          )}
                          {cart.second_email_sent && (
                            <span className="text-green-600">
                              <Mail className="w-3 h-3 inline mr-1" /> 2nd email sent
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cart Value & Actions */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">${cart.subtotal?.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-gray-500">Cart Value</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedCart(cart)}
                            data-testid={`view-cart-${cart.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {cart.email && cart.status === 'abandoned' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleResendEmail(cart.id)}
                              className="text-purple-600 hover:text-purple-700"
                              data-testid={`resend-email-${cart.id}`}
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCart(cart.id)}
                            className="text-red-500 hover:text-red-700"
                            data-testid={`delete-cart-${cart.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No abandoned carts found</p>
                  <p className="text-sm text-gray-400">Carts will appear here after 24 hours of inactivity</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Recovery Coupons Tab */}
        <TabsContent value="coupons" className="space-y-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by coupon code or email..."
                      value={couponSearch}
                      onChange={(e) => setCouponSearch(e.target.value)}
                      className="pl-10"
                      data-testid="coupon-search-input"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3">
            {recoveryCoupons.length > 0 ? (
              recoveryCoupons.map((coupon) => (
                <Card key={coupon.id} className={coupon.times_used > 0 ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Tag className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg font-mono">{coupon.code}</span>
                            <Badge className={coupon.times_used > 0 ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}>
                              {coupon.times_used > 0 ? 'Used' : 'Active'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{coupon.recovery_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-purple-600">
                            {coupon.discount_type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                          </p>
                          <p className="text-xs text-gray-500">Discount</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">${coupon.cart_value_at_creation?.toFixed(2) || '0.00'}</p>
                          <p className="text-xs text-gray-500">Cart Value</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm">{coupon.expires_at ? formatDate(coupon.expires_at).split(',')[0] : '-'}</p>
                          <p className="text-xs text-gray-500">Expires</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recovery coupons found</p>
                  <p className="text-sm text-gray-400">Coupons are generated when recovery emails are sent</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Cart Detail Dialog */}
      <Dialog open={!!selectedCart} onOpenChange={() => setSelectedCart(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cart Details</DialogTitle>
            <DialogDescription>
              View cart items and customer information
            </DialogDescription>
          </DialogHeader>
          {selectedCart && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">Email</Label>
                  <p className="font-medium">{selectedCart.email || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Name</Label>
                  <p className="font-medium">{selectedCart.user_name || 'Guest'}</p>
                </div>
                <div>
                  <Label className="text-gray-500">Status</Label>
                  <div>{getStatusBadge(selectedCart.status)}</div>
                </div>
                <div>
                  <Label className="text-gray-500">Coupon Code</Label>
                  <p className="font-mono font-bold text-purple-600">{selectedCart.recovery_coupon_code || 'Not generated'}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-gray-500 mb-2 block">Cart Items</Label>
                <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {selectedCart.items?.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center gap-3">
                      <img
                        src={item.image || 'https://via.placeholder.com/60'}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-mono font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="text-lg font-semibold">Subtotal</span>
                <span className="text-2xl font-bold text-purple-600">${selectedCart.subtotal?.toFixed(2) || '0.00'}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>Created: {formatDate(selectedCart.created_at)}</div>
                <div>Updated: {formatDate(selectedCart.updated_at)}</div>
                {selectedCart.first_email_sent_at && (
                  <div>1st Email: {formatDate(selectedCart.first_email_sent_at)}</div>
                )}
                {selectedCart.second_email_sent_at && (
                  <div>2nd Email: {formatDate(selectedCart.second_email_sent_at)}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Abandoned Cart Settings</DialogTitle>
            <DialogDescription>
              Configure cart recovery automation
            </DialogDescription>
          </DialogHeader>
          {settings && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable Abandoned Cart Recovery</Label>
                  <p className="text-sm text-gray-500">Automatically send recovery emails</p>
                </div>
                <Switch
                  checked={settings.enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, enabled: checked })}
                  data-testid="settings-enabled-toggle"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Email (hours)</Label>
                  <Input
                    type="number"
                    value={settings.first_email_hours}
                    onChange={(e) => setSettings({ ...settings, first_email_hours: parseInt(e.target.value) || 24 })}
                  />
                  <p className="text-xs text-gray-500">After cart becomes inactive</p>
                </div>
                <div className="space-y-2">
                  <Label>Second Email (hours)</Label>
                  <Input
                    type="number"
                    value={settings.second_email_hours}
                    onChange={(e) => setSettings({ ...settings, second_email_hours: parseInt(e.target.value) || 36 })}
                  />
                  <p className="text-xs text-gray-500">After first email</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={settings.discount_type}
                    onValueChange={(v) => setSettings({ ...settings, discount_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Discount Value</Label>
                  <div className="relative">
                    {settings.discount_type === 'fixed' ? (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    ) : (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.discount_value}
                      onChange={(e) => setSettings({ ...settings, discount_value: parseFloat(e.target.value) || 10 })}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Cart Value ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={settings.min_cart_value}
                    onChange={(e) => setSettings({ ...settings, min_cart_value: parseFloat(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-gray-500">0 = no minimum</p>
                </div>
                <div className="space-y-2">
                  <Label>Coupon Prefix</Label>
                  <Input
                    value={settings.coupon_prefix}
                    onChange={(e) => setSettings({ ...settings, coupon_prefix: e.target.value.toUpperCase() })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Retention Period (days)</Label>
                <Input
                  type="number"
                  value={settings.retention_days}
                  onChange={(e) => setSettings({ ...settings, retention_days: parseInt(e.target.value) || 365 })}
                />
                <p className="text-xs text-gray-500">Carts and coupons are deleted after this period</p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSettings} className="bg-[#6e2ea8] hover:bg-[#5a2589]">
                  Save Settings
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAbandonedCarts;
