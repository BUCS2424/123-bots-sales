import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Users, UserPlus, Shield, ShoppingBag, Truck, Store, Search,
  Mail, Phone, DollarSign, Edit2, Trash2, ChevronRight, Check,
  Crown, Tag, Percent, Package, Settings, Eye, EyeOff, Save,
  AlertCircle, Building, KeyRound
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Role definitions with colors and icons
const STAFF_ROLES = {
  store_owner: { label: 'Store Owner', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Crown, description: 'Full admin access' },
  sales: { label: 'Sales', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: ShoppingBag, description: 'POS + Customer management' },
  shipper: { label: 'Shipper', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Truck, description: 'Orders + Labels + Tracking' }
};

const CUSTOMER_TIERS = {
  retail: { label: 'Retail', color: 'bg-slate-100 text-slate-800 border-slate-200', icon: Users },
  wholesale: { label: 'Wholesale', color: 'bg-green-100 text-green-800 border-green-200', icon: Building }
};

const AdminUserManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('staff');
  
  // Staff state
  const [staff, setStaff] = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [staffForm, setStaffForm] = useState({
    email: '', name: '', password: '', role: 'sales', phone: ''
  });
  
  // Customer state
  const [customers, setCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerTierFilter, setCustomerTierFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [customerTierForm, setCustomerTierForm] = useState({
    customer_type: 'retail',
    custom_discount_percentage: '',
    minimum_order_amount: 0,
    notes: ''
  });
  
  // Wholesale settings state
  const [wholesaleSettings, setWholesaleSettings] = useState({
    default_discount_percentage: 20,
    quantity_tiers: [],
    wholesale_registration_enabled: false,
    wholesale_approval_required: true
  });
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [newTier, setNewTier] = useState({ min_qty: '', discount_pct: '' });

  useEffect(() => {
    fetchStaff();
    fetchCustomers();
    fetchWholesaleSettings();
  }, []);

  // ============ Staff Functions ============
  const fetchStaff = async () => {
    try {
      const response = await axios.get(`${API}/users/staff`);
      setStaff(response.data);
    } catch (error) {
      console.error('Failed to fetch staff:', error);
    }
    setLoadingStaff(false);
  };

  const handleCreateStaff = async () => {
    try {
      if (editingStaff) {
        await axios.put(`${API}/users/staff/${editingStaff.id}`, {
          name: staffForm.name,
          role: staffForm.role,
          phone: staffForm.phone
        });
        toast({ title: 'Staff Updated', description: 'Staff member has been updated.' });
      } else {
        await axios.post(`${API}/users/staff`, staffForm);
        toast({ title: 'Staff Created', description: 'New staff member has been created.' });
      }
      setStaffDialogOpen(false);
      setEditingStaff(null);
      setStaffForm({ email: '', name: '', password: '', role: 'sales', phone: '' });
      fetchStaff();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save staff member.',
        variant: 'destructive'
      });
    }
  };

  const handleEditStaff = (member) => {
    setEditingStaff(member);
    setStaffForm({
      email: member.email,
      name: member.name,
      password: '',
      role: member.role,
      phone: member.phone || ''
    });
    setStaffDialogOpen(true);
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm('Are you sure you want to remove this staff member?')) return;
    try {
      await axios.delete(`${API}/users/staff/${staffId}`);
      toast({ title: 'Staff Removed', description: 'Staff member has been removed.' });
      fetchStaff();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to remove staff member.', variant: 'destructive' });
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordUser || !newPassword) return;
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    try {
      await axios.put(`${API}/users/reset-password/${resetPasswordUser.id}`, { new_password: newPassword });
      toast({ title: 'Password Reset', description: `Password updated for ${resetPasswordUser.email}` });
      setResetPasswordOpen(false);
      setResetPasswordUser(null);
      setNewPassword('');
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to reset password.', variant: 'destructive' });
    }
  };

  // ============ Customer Functions ============
  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/users/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
    setLoadingCustomers(false);
  };

  const handleCustomerClick = (customer) => {
    setSelectedCustomer(customer);
    setCustomerTierForm({
      customer_type: customer.customer_type || 'retail',
      custom_discount_percentage: customer.custom_discount_percentage || '',
      minimum_order_amount: customer.minimum_order_amount || 0,
      notes: customer.notes || ''
    });
    setCustomerDialogOpen(true);
  };

  const handleUpdateCustomerTier = async () => {
    try {
      await axios.put(`${API}/users/customers/${selectedCustomer.id}/tier`, {
        customer_type: customerTierForm.customer_type,
        custom_discount_percentage: customerTierForm.custom_discount_percentage ? parseFloat(customerTierForm.custom_discount_percentage) : null,
        minimum_order_amount: parseFloat(customerTierForm.minimum_order_amount) || 0,
        notes: customerTierForm.notes
      });
      toast({ 
        title: 'Customer Updated', 
        description: `${selectedCustomer.name} is now a ${customerTierForm.customer_type} customer.` 
      });
      setCustomerDialogOpen(false);
      fetchCustomers();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update customer.', variant: 'destructive' });
    }
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = !customerSearch || 
      customer.name?.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.email?.toLowerCase().includes(customerSearch.toLowerCase());
    const matchesTier = customerTierFilter === 'all' || customer.customer_type === customerTierFilter;
    return matchesSearch && matchesTier;
  });

  // ============ Wholesale Settings Functions ============
  const fetchWholesaleSettings = async () => {
    try {
      const response = await axios.get(`${API}/users/wholesale/settings`);
      setWholesaleSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch wholesale settings:', error);
    }
    setLoadingSettings(false);
  };

  const handleSaveWholesaleSettings = async () => {
    try {
      await axios.put(`${API}/users/wholesale/settings`, wholesaleSettings);
      toast({ title: 'Settings Saved', description: 'Wholesale settings have been updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings.', variant: 'destructive' });
    }
  };

  const handleAddQuantityTier = () => {
    if (!newTier.min_qty || !newTier.discount_pct) return;
    setWholesaleSettings(prev => ({
      ...prev,
      quantity_tiers: [
        ...prev.quantity_tiers,
        { min_qty: parseInt(newTier.min_qty), discount_pct: parseFloat(newTier.discount_pct) }
      ].sort((a, b) => a.min_qty - b.min_qty)
    }));
    setNewTier({ min_qty: '', discount_pct: '' });
  };

  const handleRemoveQuantityTier = (index) => {
    setWholesaleSettings(prev => ({
      ...prev,
      quantity_tiers: prev.quantity_tiers.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6" data-testid="user-management-page">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500">Manage staff, customers, and pricing tiers</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Staff Members
          </TabsTrigger>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="wholesale" className="flex items-center gap-2">
            <Percent className="w-4 h-4" />
            Wholesale Settings
          </TabsTrigger>
        </TabsList>

        {/* Staff Tab */}
        <TabsContent value="staff" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Staff Members</CardTitle>
                <CardDescription>Manage employees and their access levels</CardDescription>
              </div>
              <Button 
                onClick={() => {
                  setEditingStaff(null);
                  setStaffForm({ email: '', name: '', password: '', role: 'sales', phone: '' });
                  setStaffDialogOpen(true);
                }}
                className="bg-purple-600 hover:bg-purple-700"
                data-testid="add-staff-btn"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </CardHeader>
            <CardContent>
              {loadingStaff ? (
                <div className="text-center py-8 text-gray-500">Loading staff...</div>
              ) : staff.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No staff members yet</p>
                  <p className="text-sm">Add your first staff member to get started</p>
                </div>
              ) : (
                <div className="divide-y">
                  {staff.map(member => {
                    const roleInfo = STAFF_ROLES[member.role] || STAFF_ROLES.sales;
                    const RoleIcon = roleInfo.icon;
                    return (
                      <div key={member.id} className="py-4 flex items-center justify-between" data-testid={`staff-row-${member.id}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${roleInfo.color}`}>
                            <RoleIcon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{member.name}</p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/booking?userId=${member.id}`)}
                            data-testid={`staff-booking-settings-${member.id}`}
                          >
                            <Settings className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditStaff(member)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => { setResetPasswordUser(member); setNewPassword(''); setResetPasswordOpen(true); }} className="text-amber-500 hover:text-amber-700" data-testid={`reset-password-${member.id}`}>
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteStaff(member.id)} className="text-red-500 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Role Permissions Info */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Role Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {Object.entries(STAFF_ROLES).map(([key, role]) => {
                  const Icon = role.icon;
                  return (
                    <div key={key} className={`p-4 rounded-lg border ${role.color}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5" />
                        <span className="font-semibold">{role.label}</span>
                      </div>
                      <p className="text-sm opacity-80">{role.description}</p>
                      <ul className="mt-3 text-xs space-y-1">
                        {key === 'store_owner' && (
                          <>
                            <li>• Full admin dashboard access</li>
                            <li>• Manage all settings</li>
                            <li>• Manage users & customers</li>
                            <li>• View all reports & analytics</li>
                          </>
                        )}
                        {key === 'sales' && (
                          <>
                            <li>• Point of Sale access</li>
                            <li>• Customer management</li>
                            <li>• View & manage orders</li>
                            <li>• Inventory management</li>
                          </>
                        )}
                        {key === 'shipper' && (
                          <>
                            <li>• View orders</li>
                            <li>• Print shipping labels</li>
                            <li>• Update tracking info</li>
                            <li>• Mark orders as shipped</li>
                          </>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Customers</CardTitle>
                  <CardDescription>Manage customer accounts and pricing tiers</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9 w-64"
                      data-testid="customer-search"
                    />
                  </div>
                  <select
                    value={customerTierFilter}
                    onChange={(e) => setCustomerTierFilter(e.target.value)}
                    className="h-10 px-3 rounded-md border border-gray-200 text-sm"
                    data-testid="customer-tier-filter"
                  >
                    <option value="all">All Tiers</option>
                    <option value="retail">Retail Only</option>
                    <option value="wholesale">Wholesale Only</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-gray-500">Retail</p>
                  <p className="text-2xl font-bold text-slate-700">
                    {customers.filter(c => c.customer_type !== 'wholesale').length}
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-500">Wholesale</p>
                  <p className="text-2xl font-bold text-green-700">
                    {customers.filter(c => c.customer_type === 'wholesale').length}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-purple-700">
                    ${customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {loadingCustomers ? (
                <div className="text-center py-8 text-gray-500">Loading customers...</div>
              ) : filteredCustomers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No customers found</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredCustomers.map(customer => {
                    const tierInfo = CUSTOMER_TIERS[customer.customer_type] || CUSTOMER_TIERS.retail;
                    const TierIcon = tierInfo.icon;
                    return (
                      <div 
                        key={customer.id} 
                        className="py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 -mx-4 px-4 rounded-lg transition-colors"
                        onClick={() => handleCustomerClick(customer)}
                        data-testid={`customer-row-${customer.id}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tierInfo.color}`}>
                            <TierIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{customer.name}</p>
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">${(customer.total_spent || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-500">{customer.total_orders || 0} orders</p>
                          </div>
                          <Badge className={tierInfo.color}>{tierInfo.label}</Badge>
                          {customer.custom_discount_percentage && (
                            <Badge variant="outline" className="text-purple-600 border-purple-200">
                              {customer.custom_discount_percentage}% Custom
                            </Badge>
                          )}
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wholesale Settings Tab */}
        <TabsContent value="wholesale" className="mt-6">
          <div className="grid gap-6">
            {/* Global Discount */}
            <Card>
              <CardHeader>
                <CardTitle>Global Wholesale Discount</CardTitle>
                <CardDescription>Set the default discount percentage for all wholesale customers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Label>Default Discount Percentage</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={wholesaleSettings.default_discount_percentage}
                        onChange={(e) => setWholesaleSettings(prev => ({
                          ...prev,
                          default_discount_percentage: parseFloat(e.target.value) || 0
                        }))}
                        className="w-32"
                        data-testid="default-discount-input"
                      />
                      <span className="text-gray-500">% off retail price</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Example: A $100 product would be ${(100 * (1 - wholesaleSettings.default_discount_percentage / 100)).toFixed(2)} for wholesale
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantity Tiers */}
            <Card>
              <CardHeader>
                <CardTitle>Quantity-Based Discounts</CardTitle>
                <CardDescription>Additional discounts based on order quantity (applies to wholesale customers)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {wholesaleSettings.quantity_tiers.length > 0 && (
                  <div className="space-y-2">
                    {wholesaleSettings.quantity_tiers.map((tier, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-4">
                          <Package className="w-5 h-5 text-gray-400" />
                          <span className="font-medium">{tier.min_qty}+ units</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-green-600 font-semibold">{tier.discount_pct}% off</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleRemoveQuantityTier(index)} className="text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex items-end gap-2 pt-2">
                  <div>
                    <Label>Min Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="e.g., 10"
                      value={newTier.min_qty}
                      onChange={(e) => setNewTier(prev => ({ ...prev, min_qty: e.target.value }))}
                      className="w-32"
                    />
                  </div>
                  <div>
                    <Label>Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="e.g., 25"
                      value={newTier.discount_pct}
                      onChange={(e) => setNewTier(prev => ({ ...prev, discount_pct: e.target.value }))}
                      className="w-32"
                    />
                  </div>
                  <Button onClick={handleAddQuantityTier} variant="outline">
                    Add Tier
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Registration Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Wholesale Registration</CardTitle>
                <CardDescription>Control how customers can become wholesale buyers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Wholesale Self-Registration</Label>
                    <p className="text-sm text-gray-500">Customers can request wholesale status during registration</p>
                  </div>
                  <Switch
                    checked={wholesaleSettings.wholesale_registration_enabled}
                    onCheckedChange={(checked) => setWholesaleSettings(prev => ({
                      ...prev,
                      wholesale_registration_enabled: checked
                    }))}
                    data-testid="wholesale-registration-toggle"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Admin Approval</Label>
                    <p className="text-sm text-gray-500">New wholesale applications must be approved by store owner</p>
                  </div>
                  <Switch
                    checked={wholesaleSettings.wholesale_approval_required}
                    onCheckedChange={(checked) => setWholesaleSettings(prev => ({
                      ...prev,
                      wholesale_approval_required: checked
                    }))}
                    data-testid="wholesale-approval-toggle"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveWholesaleSettings} className="bg-purple-600 hover:bg-purple-700" data-testid="save-wholesale-settings">
                <Save className="w-4 h-4 mr-2" />
                Save Wholesale Settings
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Staff Dialog */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff Member' : 'Add Staff Member'}</DialogTitle>
            <DialogDescription>
              {editingStaff ? 'Update staff member details and role' : 'Create a new staff account with specific permissions'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm(prev => ({ ...prev, email: e.target.value }))}
                disabled={!!editingStaff}
                placeholder="staff@aminochain.com"
                data-testid="staff-email-input"
              />
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input
                value={staffForm.name}
                onChange={(e) => setStaffForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Smith"
                data-testid="staff-name-input"
              />
            </div>
            {!editingStaff && (
              <div>
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 8 characters"
                  data-testid="staff-password-input"
                />
              </div>
            )}
            <div>
              <Label>Phone</Label>
              <Input
                type="tel"
                value={staffForm.phone}
                onChange={(e) => setStaffForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label>Role *</Label>
              <select
                value={staffForm.role}
                onChange={(e) => setStaffForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full h-10 px-3 rounded-md border border-gray-200 text-sm"
                data-testid="staff-role-select"
              >
                {Object.entries(STAFF_ROLES).map(([key, role]) => (
                  <option key={key} value={key}>{role.label} - {role.description}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStaffDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateStaff} className="bg-purple-600 hover:bg-purple-700" data-testid="save-staff-btn">
              {editingStaff ? 'Update' : 'Create'} Staff Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Customer Tier Dialog */}
      <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customer Settings</DialogTitle>
            <DialogDescription>
              {selectedCustomer?.name} - {selectedCustomer?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Customer Tier</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {Object.entries(CUSTOMER_TIERS).map(([key, tier]) => {
                  const Icon = tier.icon;
                  const isSelected = customerTierForm.customer_type === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setCustomerTierForm(prev => ({ ...prev, customer_type: key }))}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isSelected 
                          ? key === 'wholesale' ? 'border-green-500 bg-green-50' : 'border-slate-500 bg-slate-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      data-testid={`tier-option-${key}`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-2 ${isSelected ? (key === 'wholesale' ? 'text-green-600' : 'text-slate-600') : 'text-gray-400'}`} />
                      <p className="font-medium">{tier.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {customerTierForm.customer_type === 'wholesale' && (
              <>
                <div>
                  <Label>Custom Discount % (Optional)</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={customerTierForm.custom_discount_percentage}
                      onChange={(e) => setCustomerTierForm(prev => ({ ...prev, custom_discount_percentage: e.target.value }))}
                      placeholder={`Default: ${wholesaleSettings.default_discount_percentage}%`}
                      className="w-32"
                      data-testid="custom-discount-input"
                    />
                    <span className="text-gray-500">% off retail</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Leave blank to use global wholesale discount</p>
                </div>

                <div>
                  <Label>Minimum Order Amount</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500">$</span>
                    <Input
                      type="number"
                      min="0"
                      value={customerTierForm.minimum_order_amount}
                      onChange={(e) => setCustomerTierForm(prev => ({ ...prev, minimum_order_amount: e.target.value }))}
                      className="w-32"
                      data-testid="min-order-input"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Set to 0 for no minimum</p>
                </div>
              </>
            )}

            <div>
              <Label>Notes</Label>
              <textarea
                value={customerTierForm.notes}
                onChange={(e) => setCustomerTierForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Internal notes about this customer..."
                className="w-full p-3 rounded-md border border-gray-200 text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Customer Stats */}
            {selectedCustomer && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 mb-2">Customer Stats</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Orders</p>
                    <p className="font-semibold">{selectedCustomer.total_orders || 0}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total Spent</p>
                    <p className="font-semibold">${(selectedCustomer.total_spent || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateCustomerTier} className="bg-purple-600 hover:bg-purple-700" data-testid="save-customer-tier">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>Set a new password for {resetPasswordUser?.name || resetPasswordUser?.email}</DialogDescription>
          <div className="space-y-4 mt-2">
            <div>
              <Label>New Password</Label>
              <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" className="mt-1" data-testid="reset-password-input" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetPasswordOpen(false)}>Cancel</Button>
              <Button onClick={handleResetPassword} data-testid="reset-password-confirm">Reset Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserManagement;
