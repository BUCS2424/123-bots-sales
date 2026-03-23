import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus, Search, Tag, Trash2, Percent, DollarSign, Calendar, ShoppingCart, RefreshCw
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Switch } from '../../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from '../../hooks/use-toast';
import { Link } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminDiscounts = () => {
  const [discounts, setDiscounts] = useState([]);
  const [recoveryCoupons, setRecoveryCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    value: '',
    min_order_amount: '',
    max_uses: '',
    is_active: true,
  });

  useEffect(() => {
    fetchDiscounts();
    fetchRecoveryCoupons();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await axios.get(`${API}/store/discounts`);
      // Filter out recovery coupons for the main list
      const regularDiscounts = response.data.filter(d => !d.is_recovery_coupon);
      setDiscounts(regularDiscounts);
    } catch (error) {
      console.error('Failed to fetch discounts:', error);
    }
    setLoading(false);
  };

  const fetchRecoveryCoupons = async () => {
    try {
      const response = await axios.get(`${API}/abandoned-carts/recovery-coupons/search?limit=100`);
      setRecoveryCoupons(response.data.coupons || []);
    } catch (error) {
      console.error('Failed to fetch recovery coupons:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        value: parseFloat(formData.value),
        min_order_amount: formData.min_order_amount ? parseFloat(formData.min_order_amount) : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
      };
      await axios.post(`${API}/store/discounts`, data);
      toast({ title: 'Discount Created', description: `Code ${formData.code.toUpperCase()} has been created.` });
      setIsDialogOpen(false);
      resetForm();
      fetchDiscounts();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create discount',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (discount) => {
    if (!window.confirm(`Are you sure you want to delete code "${discount.code}"?`)) return;
    try {
      await axios.delete(`${API}/store/discounts/${discount.id}`);
      toast({ title: 'Discount Deleted', description: 'Discount code has been deleted.' });
      fetchDiscounts();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete discount', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      value: '',
      min_order_amount: '',
      max_uses: '',
      is_active: true,
    });
  };

  return (
    <div className="space-y-6" data-testid="admin-discounts-page">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discounts & Coupons</h1>
          <p className="text-gray-500">Create and manage promotional discount codes</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/abandoned-carts">
            <Button variant="outline">
              <ShoppingCart className="w-4 h-4 mr-2" /> Abandoned Carts
            </Button>
          </Link>
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-[#6e2ea8] hover:bg-[#5a2589]">
                <Plus className="w-4 h-4 mr-2" /> Create Discount
              </Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Discount Code</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Discount Code *</Label>
                <Input
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="20% off your order"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={formData.discount_type} onValueChange={(v) => setFormData({ ...formData, discount_type: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value *</Label>
                  <div className="relative">
                    {formData.discount_type === 'percentage' ? (
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    ) : (
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    )}
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="pl-8"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Order Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.min_order_amount}
                      onChange={(e) => setFormData({ ...formData, min_order_amount: e.target.value })}
                      className="pl-8"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Max Uses</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-[#6e2ea8] hover:bg-[#a01830]">
                  Create Discount
                </Button>
              </div>
            </form>
          </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Tabs for All Discounts vs Recovery Coupons */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all" data-testid="all-discounts-tab">
            <Tag className="w-4 h-4 mr-2" /> All Discounts ({discounts.length})
          </TabsTrigger>
          <TabsTrigger value="recovery" data-testid="recovery-coupons-tab">
            <ShoppingCart className="w-4 h-4 mr-2" /> Recovery Coupons ({recoveryCoupons.length})
          </TabsTrigger>
        </TabsList>

        {/* All Discounts Tab */}
        <TabsContent value="all">
          <div className="grid gap-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin w-8 h-8 border-4 border-[#6e2ea8] border-t-transparent rounded-full" />
              </div>
            ) : discounts.length > 0 ? (
              discounts.map((discount) => (
                <Card key={discount.id} className={!discount.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#6e2ea8]/10 rounded-lg flex items-center justify-center">
                          <Tag className="w-6 h-6 text-[#6e2ea8]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-lg font-mono">{discount.code}</span>
                            <Badge className={discount.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                              {discount.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500">{discount.description || 'No description'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-[#6e2ea8]">
                            {discount.discount_type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}
                          </p>
                          <p className="text-xs text-gray-500">Discount</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-semibold">{discount.times_used || 0}</p>
                          <p className="text-xs text-gray-500">Uses</p>
                        </div>
                        {discount.min_order_amount && (
                          <div className="text-center">
                            <p className="text-lg font-semibold">${discount.min_order_amount}</p>
                            <p className="text-xs text-gray-500">Min Order</p>
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(discount)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No discount codes yet</p>
                  <p className="text-sm text-gray-400">Create your first discount code to get started</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Recovery Coupons Tab */}
        <TabsContent value="recovery">
          <Card className="mb-4">
            <CardContent className="pt-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search by code or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Link to="/admin/abandoned-carts">
                  <Button variant="outline">
                    View All Abandoned Carts
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-4">
            {recoveryCoupons.length > 0 ? (
              recoveryCoupons
                .filter(c => !searchQuery || 
                  c.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  c.recovery_email?.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((coupon) => (
                  <Card key={coupon.id} className={coupon.times_used > 0 ? 'opacity-60' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-orange-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg font-mono">{coupon.code}</span>
                              <Badge className="bg-orange-100 text-orange-800">Recovery</Badge>
                              <Badge className={coupon.times_used > 0 ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-800'}>
                                {coupon.times_used > 0 ? 'Used' : 'Active'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500">{coupon.recovery_email || 'No email'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">
                              {coupon.discount_type === 'percentage' ? `${coupon.value}%` : `$${coupon.value}`}
                            </p>
                            <p className="text-xs text-gray-500">Discount</p>
                          </div>
                          <div className="text-center">
                            <p className="text-lg font-semibold">${coupon.cart_value_at_creation?.toFixed(2) || '0'}</p>
                            <p className="text-xs text-gray-500">Cart Value</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm">{coupon.expires_at ? new Date(coupon.expires_at).toLocaleDateString() : '-'}</p>
                            <p className="text-xs text-gray-500">Expires</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recovery coupons yet</p>
                  <p className="text-sm text-gray-400">Recovery coupons are auto-generated for abandoned carts</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDiscounts;
