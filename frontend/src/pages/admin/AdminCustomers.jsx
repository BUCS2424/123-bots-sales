import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Users, Mail, Phone, ShoppingBag,
  DollarSign, ChevronRight, UserPlus, LogIn, KeyRound, Pencil, Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const emptyForm = { name: '', email: '', password: '', phone: '', address: '', city: '', state: '', zip_code: '' };

const AdminCustomers = () => {
  const navigate = useNavigate();
  const { startImpersonation } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [impersonatingCustomerId, setImpersonatingCustomerId] = useState('');

  // Create / Edit dialog
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Reset password dialog
  const [resetPwOpen, setResetPwOpen] = useState(false);
  const [resetPwUser, setResetPwUser] = useState(null);
  const [resetPwValue, setResetPwValue] = useState('');

  useEffect(() => { fetchCustomers(); }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/store/customers`, { headers: getAuthHeaders() });
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
    setLoading(false);
  };

  const openCreate = () => {
    setFormMode('create');
    setForm(emptyForm);
    setEditingId(null);
    setFormOpen(true);
  };

  const openEdit = (customer) => {
    setFormMode('edit');
    setForm({
      name: customer.name || '',
      email: customer.email || '',
      password: '',
      phone: customer.phone || '',
      address: customer.address || '',
      city: customer.city || '',
      state: customer.state || '',
      zip_code: customer.zip_code || '',
    });
    setEditingId(customer.id);
    setFormOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      toast({ title: 'Missing info', description: 'Name and email are required.', variant: 'destructive' });
      return;
    }
    if (formMode === 'create' && (!form.password || form.password.length < 6)) {
      toast({ title: 'Weak password', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (formMode === 'create') {
        await axios.post(`${API}/admin/customers`, form, { headers: getAuthHeaders() });
        toast({ title: 'Customer created', description: `${form.email} can now purchase across all enabled systems.` });
      } else {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await axios.put(`${API}/admin/customers/${editingId}`, payload, { headers: getAuthHeaders() });
        toast({ title: 'Customer updated', description: `${form.email} has been updated.` });
      }
      setFormOpen(false);
      await fetchCustomers();
    } catch (error) {
      toast({ title: 'Save failed', description: error.response?.data?.detail || 'Please try again.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomer = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`${API}/admin/customers/${deleteTarget.id}`, { headers: getAuthHeaders() });
      toast({ title: 'Customer deleted', description: `${deleteTarget.email} has been removed.` });
      setDeleteTarget(null);
      await fetchCustomers();
    } catch (error) {
      toast({ title: 'Delete failed', description: error.response?.data?.detail || 'Please try again.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const handleImpersonateCustomer = async (customer) => {
    setImpersonatingCustomerId(customer.id);
    try {
      const response = await axios.post(`${API}/admin/customers/${customer.id}/impersonate`, {}, { headers: getAuthHeaders() });
      const { access_token, user } = response.data;
      const result = await startImpersonation(access_token, user);
      if (!result.success) throw new Error(result.error || 'Could not start impersonation');
      toast({ title: 'Impersonation active', description: `Now signed in as ${user?.email || customer.email}` });
      window.location.assign('/account');
    } catch (error) {
      toast({ title: 'Impersonation failed', description: error.response?.data?.detail || error.message || 'Unable to impersonate this customer.', variant: 'destructive' });
    } finally {
      setImpersonatingCustomerId('');
    }
  };

  const handleResetCustomerPassword = async () => {
    if (!resetPwUser || !resetPwValue || resetPwValue.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    try {
      await axios.put(`${API}/users/reset-password/${resetPwUser.user_id || resetPwUser.id}`, { new_password: resetPwValue }, { headers: getAuthHeaders() });
      toast({ title: 'Password Reset', description: `Password updated for ${resetPwUser.email}` });
      setResetPwOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to reset password.', variant: 'destructive' });
    }
  };

  const handleViewCustomer = (customer) => navigate(`/admin/user-management/customers/${customer.id}`);

  const filteredCustomers = customers.filter(customer => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return customer.name?.toLowerCase().includes(query) || customer.email?.toLowerCase().includes(query);
    }
    return true;
  });

  const field = (key, label, type = 'text', placeholder = '') => (
    <div>
      <Label className="text-gray-700">{label}</Label>
      <Input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className="mt-1"
        data-testid={`customer-form-${key}`}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-500">Create, edit, impersonate and delete customer accounts</p>
        </div>
        <Button
          onClick={openCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          data-testid="create-customer-button"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Create a Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <Users className="w-10 h-10 text-blue-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-blue-600/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {customers.reduce((sum, c) => sum + (c.total_orders || 0), 0)}
                </p>
              </div>
              <ShoppingBag className="w-10 h-10 text-blue-600/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Orders</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Total Spent</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
                            {customer.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900">{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1 text-gray-700">
                            <Mail className="w-3 h-3 text-gray-400" /> {customer.email}
                          </p>
                          {customer.phone && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {customer.city && customer.state ? (
                          <span className="text-sm text-gray-500">{customer.city}, {customer.state}</span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{customer.total_orders || 0} orders</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-green-600">${customer.total_spent?.toFixed(2) || '0.00'}</span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline" size="sm"
                            onClick={() => handleImpersonateCustomer(customer)}
                            disabled={impersonatingCustomerId === customer.id}
                            data-testid={`impersonate-customer-button-${customer.id}`}
                          >
                            <LogIn className="w-4 h-4 mr-1" />
                            {impersonatingCustomerId === customer.id ? '...' : 'Impersonate'}
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => openEdit(customer)}
                            className="text-blue-600 hover:text-blue-700"
                            data-testid={`edit-customer-button-${customer.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => { setResetPwUser(customer); setResetPwValue(''); setResetPwOpen(true); }}
                            className="text-amber-600 hover:text-amber-700"
                            data-testid={`reset-password-customer-${customer.id}`}
                          >
                            <KeyRound className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => setDeleteTarget(customer)}
                            className="text-red-600 hover:text-red-700"
                            data-testid={`delete-customer-button-${customer.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            onClick={() => handleViewCustomer(customer)}
                            data-testid={`view-customer-button-${customer.id}`}
                          >
                            View <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No customers found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle>{formMode === 'create' ? 'Create a Customer' : 'Edit Customer'}</DialogTitle>
          <p className="text-sm text-gray-500">
            {formMode === 'create'
              ? 'Creates a login + storefront account that can purchase across all enabled systems.'
              : 'Update this customer\u2019s details. Leave password blank to keep it unchanged.'}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {field('name', 'Full Name *', 'text', 'Jane Doe')}
            {field('email', 'Email *', 'email', 'jane@example.com')}
            {field('password', formMode === 'create' ? 'Password *' : 'New Password (optional)', 'text', 'Min 6 characters')}
            {field('phone', 'Phone', 'text', '(555) 123-4567')}
            <div className="col-span-2">{field('address', 'Address', 'text', '123 Main St')}</div>
            {field('city', 'City')}
            {field('state', 'State')}
            <div className="col-span-2">{field('zip_code', 'ZIP Code')}</div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button
              onClick={handleSaveCustomer}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="customer-form-submit"
            >
              {saving ? 'Saving...' : formMode === 'create' ? 'Create Customer' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Delete Customer</DialogTitle>
          <p className="text-sm text-gray-600">
            Are you sure you want to permanently delete <span className="font-semibold">{deleteTarget?.name || deleteTarget?.email}</span>?
            This removes their login and storefront account. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button
              onClick={handleDeleteCustomer}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="confirm-delete-customer"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={resetPwOpen} onOpenChange={setResetPwOpen}>
        <DialogContent className="max-w-sm">
          <DialogTitle>Reset Customer Password</DialogTitle>
          <p className="text-sm text-gray-500">Set a new password for {resetPwUser?.name || resetPwUser?.email}</p>
          <div className="space-y-4 mt-2">
            <div>
              <Label>New Password</Label>
              <Input type="text" value={resetPwValue} onChange={(e) => setResetPwValue(e.target.value)} placeholder="Enter new password" className="mt-1" data-testid="reset-customer-password-input" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setResetPwOpen(false)}>Cancel</Button>
              <Button onClick={handleResetCustomerPassword} className="bg-blue-600 hover:bg-blue-700 text-white" data-testid="reset-customer-password-confirm">Reset Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomers;
