import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Package, DollarSign, Calendar,
  Plus, Edit2, Trash2, Star, CreditCard, Truck, FileText, ChevronDown,
  ChevronUp, Copy, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle,
  Home, Building, Save, X, MessageSquare, LogIn
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { toast } from '../../hooks/use-toast';
import { useAuth } from '../../context/AuthContext';
import { LeadQuoteContractPanel } from '../../components/quotes/LeadQuoteContractPanel';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const AdminCustomerDashboard = ({ customerId: propCustomerId }) => {
  const { customerId: paramCustomerId } = useParams();
  const customerId = propCustomerId || paramCustomerId;
  const navigate = useNavigate();
  const { startImpersonation } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [customerData, setCustomerData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Address Modal State
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    first_name: '',
    last_name: '',
    address1: '',
    address2: '',
    city: '',
    state: 'AL',
    zip_code: '',
    phone: '',
    is_default: false
  });
  const [savingAddress, setSavingAddress] = useState(false);
  
  // Profile Edit State
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    notes: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Order Detail State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailOpen, setOrderDetailOpen] = useState(false);
  
  // Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewingOrder, setReviewingOrder] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    content: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [customerReviews, setCustomerReviews] = useState([]);
  const [reviewedOrders, setReviewedOrders] = useState(new Set());
  const [impersonating, setImpersonating] = useState(false);
  const [linkedLeadId, setLinkedLeadId] = useState(null);

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
      fetchCustomerReviews();
    }
  }, [customerId]);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/customers/${customerId}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomerData(response.data);
      await fetchLinkedLead(response.data.customer?.id);
      setProfileForm({
        name: response.data.customer?.name || '',
        phone: response.data.customer?.phone || '',
        notes: response.data.customer?.notes || ''
      });
    } catch (error) {
      console.error('Error fetching customer data:', error);
      toast({ title: 'Error', description: 'Failed to load customer data', variant: 'destructive' });
    }
    setLoading(false);
  };

  const fetchLinkedLead = async (id) => {
    if (!id) {
      setLinkedLeadId(null);
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/customers/${id}/quote-lead-link`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLinkedLeadId(response.data?.lead_id || null);
    } catch (_error) {
      setLinkedLeadId(null);
    }
  };

  const fetchCustomerReviews = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/reviews/my-reviews/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomerReviews(response.data || []);
      // Build set of reviewed order IDs
      const reviewed = new Set(response.data.map(r => r.order_id));
      setReviewedOrders(reviewed);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const openReviewModal = (order) => {
    setReviewingOrder(order);
    setReviewForm({ rating: 5, title: '', content: '' });
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewForm.title || !reviewForm.content) {
      toast({ title: 'Error', description: 'Please fill in all fields', variant: 'destructive' });
      return;
    }
    
    setSubmittingReview(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/reviews/submit`, {
        order_id: reviewingOrder.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: reviewForm.content
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      toast({ title: 'Success', description: 'Review submitted! It will be visible after approval.' });
      setReviewModalOpen(false);
      fetchCustomerReviews();
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to submit review';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
    setSubmittingReview(false);
  };

  const canReviewOrder = (order) => {
    // Check if order has been reviewed
    if (reviewedOrders.has(order.id)) return false;
    // Check if order status allows review
    return ['completed', 'delivered', 'shipped', 'paid'].includes(order.status);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/users/customers/${customerId}/profile`, profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: 'Profile updated' });
      setEditingProfile(false);
      fetchCustomerData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    }
    setSavingProfile(false);
  };

  const openAddressModal = (address = null) => {
    if (address) {
      setEditingAddress(address);
      setAddressForm({
        label: address.label || 'Home',
        first_name: address.first_name || '',
        last_name: address.last_name || '',
        address1: address.address1 || '',
        address2: address.address2 || '',
        city: address.city || '',
        state: address.state || 'AL',
        zip_code: address.zip_code || '',
        phone: address.phone || '',
        is_default: address.is_default || false
      });
    } else {
      setEditingAddress(null);
      setAddressForm({
        label: 'Home',
        first_name: customerData?.customer?.name?.split(' ')[0] || '',
        last_name: customerData?.customer?.name?.split(' ').slice(1).join(' ') || '',
        address1: '',
        address2: '',
        city: '',
        state: 'AL',
        zip_code: '',
        phone: customerData?.customer?.phone || '',
        is_default: customerData?.addresses?.length === 0
      });
    }
    setAddressModalOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.first_name || !addressForm.last_name || !addressForm.address1 || 
        !addressForm.city || !addressForm.state || !addressForm.zip_code) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    
    setSavingAddress(true);
    try {
      const token = localStorage.getItem('token');
      if (editingAddress) {
        await axios.put(
          `${API}/users/customers/${customerId}/addresses/${editingAddress.id}`,
          addressForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({ title: 'Success', description: 'Address updated' });
      } else {
        await axios.post(
          `${API}/users/customers/${customerId}/addresses`,
          addressForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast({ title: 'Success', description: 'Address added' });
      }
      setAddressModalOpen(false);
      fetchCustomerData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save address', variant: 'destructive' });
    }
    setSavingAddress(false);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm('Delete this address?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/users/customers/${customerId}/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: 'Address deleted' });
      fetchCustomerData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete address', variant: 'destructive' });
    }
  };

  const handleSetDefaultAddress = async (addressId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/users/customers/${customerId}/addresses/${addressId}`,
        { is_default: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast({ title: 'Success', description: 'Default address updated' });
      fetchCustomerData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update default', variant: 'destructive' });
    }
  };

  const handleImpersonateCustomer = async () => {
    setImpersonating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/admin/customers/${customerId}/impersonate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { access_token, user } = response.data;
      const result = await startImpersonation(access_token, user);
      if (!result.success) {
        throw new Error(result.error || 'Could not start impersonation');
      }

      toast({
        title: 'Impersonation active',
        description: `Now signed in as ${user?.email || customerData?.customer?.email}`,
      });
      window.location.assign('/account');
    } catch (error) {
      toast({
        title: 'Impersonation failed',
        description: error.response?.data?.detail || error.message || 'Unable to impersonate this customer.',
        variant: 'destructive',
      });
    } finally {
      setImpersonating(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Package },
      awaiting_payment: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
      shipped: { color: 'bg-purple-100 text-purple-800', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };
    return configs[status] || { color: 'bg-gray-100 text-gray-800', icon: Package };
  };

  const renderStars = (rating, interactive = false, onChange = null) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 ${
              star <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onChange && onChange(star)}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!customerData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Customer not found</p>
        <Button onClick={() => navigate('/admin/user-management/customers')} className="mt-4">
          Back to Customers
        </Button>
      </div>
    );
  }

  const { customer, stats, addresses, orders } = customerData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/admin/user-management/customers')}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Dashboard</h1>
            <p className="text-gray-500">{customer.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleImpersonateCustomer}
            disabled={impersonating}
            data-testid="impersonate-customer-dashboard-button"
          >
            <LogIn className="w-4 h-4 mr-2" />
            {impersonating ? 'Impersonating...' : 'Impersonate User'}
          </Button>
          <Badge className={customer.customer_type === 'wholesale' ? 'bg-purple-600' : 'bg-gray-500'}>
            {customer.customer_type === 'wholesale' ? 'Wholesale' : 'Retail'}
          </Badge>
        </div>
      </div>

      {/* Customer Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-amber-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            
            <div className="flex-1">
              {editingProfile ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={profileForm.name}
                        onChange={(e) => setProfileForm({...profileForm, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={profileForm.notes}
                      onChange={(e) => setProfileForm({...profileForm, notes: e.target.value})}
                      placeholder="Internal notes about this customer..."
                      rows={2}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={savingProfile}>
                      <Save className="w-4 h-4 mr-2" />
                      {savingProfile ? 'Saving...' : 'Save'}
                    </Button>
                    <Button variant="outline" onClick={() => setEditingProfile(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{customer.name}</h2>
                    <Button variant="ghost" size="sm" onClick={() => setEditingProfile(true)}>
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-2 text-gray-600">
                    <span className="flex items-center gap-1">
                      <Mail className="w-4 h-4" /> {customer.email}
                    </span>
                    {customer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-4 h-4" /> {customer.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" /> 
                      Customer since {new Date(customer.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {customer.notes && (
                    <p className="mt-3 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                      <strong>Notes:</strong> {customer.notes}
                    </p>
                  )}
                  {customer.custom_discount_percentage && (
                    <Badge className="mt-2 bg-green-100 text-green-800">
                      Custom Discount: {customer.custom_discount_percentage}% off
                    </Badge>
                  )}
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-purple-600">{stats.total_orders}</p>
                <p className="text-sm text-gray-500">Orders</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-green-600">${stats.total_spent.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Total Spent</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4">
                <p className="text-2xl font-bold text-amber-600">${stats.avg_order_value.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Avg Order</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <User className="w-4 h-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="addresses" className="flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Addresses ({addresses.length})
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="w-4 h-4" /> Orders ({orders.length})
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="w-4 h-4" /> Invoices
          </TabsTrigger>
          <TabsTrigger value="quotes-contracts-esign" className="flex items-center gap-2" data-testid="customer-quotes-contracts-tab-trigger">
            <FileText className="w-4 h-4" /> Quotes / Contracts / eSign
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length > 0 ? (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => {
                      const statusConfig = getStatusConfig(order.status);
                      const StatusIcon = statusConfig.icon;
                      return (
                        <div 
                          key={order.id} 
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                          onClick={() => { setSelectedOrder(order); setOrderDetailOpen(true); }}
                        >
                          <div>
                            <p className="font-bold text-gray-900">{order.order_number}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString()} • {order.items_count} items
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={statusConfig.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {order.status}
                            </Badge>
                            <p className="font-semibold mt-1">${order.total?.toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                    {orders.length > 5 && (
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab('orders')}>
                        View All Orders
                      </Button>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-6">No orders yet</p>
                )}
              </CardContent>
            </Card>

            {/* Shipping Addresses */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-purple-600" />
                  Shipping Addresses
                </CardTitle>
                <Button size="sm" onClick={() => openAddressModal()}>
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </CardHeader>
              <CardContent>
                {addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.slice(0, 3).map((addr) => (
                      <div key={addr.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {addr.label === 'Home' ? <Home className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                              <span className="font-medium">{addr.label}</span>
                              {addr.is_default && <Badge className="bg-purple-100 text-purple-700 text-xs">Default</Badge>}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {addr.first_name} {addr.last_name}<br />
                              {addr.address1}{addr.address2 && `, ${addr.address2}`}<br />
                              {addr.city}, {addr.state} {addr.zip_code}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openAddressModal(addr)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {addresses.length > 3 && (
                      <Button variant="outline" className="w-full" onClick={() => setActiveTab('addresses')}>
                        View All Addresses
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No addresses saved</p>
                    <Button size="sm" className="mt-2" onClick={() => openAddressModal()}>
                      <Plus className="w-4 h-4 mr-1" /> Add Address
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Shipping Addresses</CardTitle>
              <Button onClick={() => openAddressModal()}>
                <Plus className="w-4 h-4 mr-2" /> Add New Address
              </Button>
            </CardHeader>
            <CardContent>
              {addresses.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {addresses.map((addr) => (
                    <div key={addr.id} className={`p-4 rounded-lg border-2 ${addr.is_default ? 'border-purple-500 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {addr.label === 'Home' ? <Home className="w-5 h-5 text-purple-600" /> : <Building className="w-5 h-5 text-purple-600" />}
                          <span className="font-bold">{addr.label}</span>
                        </div>
                        {addr.is_default && <Badge className="bg-purple-600 text-white">Default</Badge>}
                      </div>
                      <div className="text-sm text-gray-700 space-y-1">
                        <p className="font-medium">{addr.first_name} {addr.last_name}</p>
                        <p>{addr.address1}</p>
                        {addr.address2 && <p>{addr.address2}</p>}
                        <p>{addr.city}, {addr.state} {addr.zip_code}</p>
                        {addr.phone && <p className="text-gray-500">{addr.phone}</p>}
                      </div>
                      <div className="flex gap-2 mt-4 pt-3 border-t">
                        <Button variant="outline" size="sm" onClick={() => openAddressModal(addr)}>
                          <Edit2 className="w-4 h-4 mr-1" /> Edit
                        </Button>
                        {!addr.is_default && (
                          <Button variant="outline" size="sm" onClick={() => handleSetDefaultAddress(addr.id)}>
                            <Star className="w-4 h-4 mr-1" /> Set Default
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteAddress(addr.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700">No Addresses</h3>
                  <p className="text-gray-500 mb-4">Add shipping addresses for drop shipping and quick checkout</p>
                  <Button onClick={() => openAddressModal()}>
                    <Plus className="w-4 h-4 mr-2" /> Add First Address
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Order</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Items</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-500">Payment</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const statusConfig = getStatusConfig(order.status);
                        return (
                          <tr key={order.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <span className="font-bold text-gray-900">{order.order_number}</span>
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              {order.items_count} items
                            </td>
                            <td className="py-3 px-4">
                              <Badge className={statusConfig.color}>{order.status}</Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600 capitalize">
                              {order.payment_method}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold">
                              ${order.total?.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right flex gap-2 justify-end">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => { setSelectedOrder(order); setOrderDetailOpen(true); }}
                              >
                                View
                              </Button>
                              {canReviewOrder(order) ? (
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="text-amber-600 border-amber-600 hover:bg-amber-50"
                                  onClick={() => openReviewModal(order)}
                                >
                                  <Star className="w-3 h-3 mr-1" /> Review
                                </Button>
                              ) : reviewedOrders.has(order.id) && (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="w-3 h-3 mr-1" /> Reviewed
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.filter(o => o.status === 'completed' || o.status === 'delivered').length > 0 ? (
                <div className="space-y-3">
                  {orders.filter(o => o.status === 'completed' || o.status === 'delivered').map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <FileText className="w-10 h-10 text-purple-600" />
                        <div>
                          <p className="font-bold text-gray-900">Invoice #{order.order_number}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()} • {order.items_count} items
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xl font-bold">${order.total?.toFixed(2)}</span>
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-1" /> Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No invoices available yet</p>
                  <p className="text-sm text-gray-400">Invoices are generated for completed orders</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotes-contracts-esign" data-testid="customer-quotes-contracts-tab-content">
          <Card>
            <CardHeader>
              <CardTitle>Quotes / Contracts / eSign</CardTitle>
            </CardHeader>
            <CardContent>
              <LeadQuoteContractPanel leadId={linkedLeadId} title="Client Quote, Contract & eSign" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Address Modal */}
      <Dialog open={addressModalOpen} onOpenChange={setAddressModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Address Label</Label>
              <Select value={addressForm.label} onValueChange={(v) => setAddressForm({...addressForm, label: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Home">Home</SelectItem>
                  <SelectItem value="Work">Work</SelectItem>
                  <SelectItem value="Office">Office</SelectItem>
                  <SelectItem value="Warehouse">Warehouse</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>First Name *</Label>
                <Input
                  value={addressForm.first_name}
                  onChange={(e) => setAddressForm({...addressForm, first_name: e.target.value})}
                />
              </div>
              <div>
                <Label>Last Name *</Label>
                <Input
                  value={addressForm.last_name}
                  onChange={(e) => setAddressForm({...addressForm, last_name: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Street Address *</Label>
              <Input
                value={addressForm.address1}
                onChange={(e) => setAddressForm({...addressForm, address1: e.target.value})}
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <Label>Apt, Suite, Unit (optional)</Label>
              <Input
                value={addressForm.address2}
                onChange={(e) => setAddressForm({...addressForm, address2: e.target.value})}
                placeholder="Apt 4B"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>City *</Label>
                <Input
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({...addressForm, city: e.target.value})}
                />
              </div>
              <div>
                <Label>State *</Label>
                <Select value={addressForm.state} onValueChange={(v) => setAddressForm({...addressForm, state: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {US_STATES.map(state => (
                      <SelectItem key={state} value={state}>{state}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ZIP Code *</Label>
                <Input
                  value={addressForm.zip_code}
                  onChange={(e) => setAddressForm({...addressForm, zip_code: e.target.value})}
                />
              </div>
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input
                value={addressForm.phone}
                onChange={(e) => setAddressForm({...addressForm, phone: e.target.value})}
                placeholder="(555) 555-5555"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_default"
                checked={addressForm.is_default}
                onChange={(e) => setAddressForm({...addressForm, is_default: e.target.checked})}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is_default" className="cursor-pointer">Set as default shipping address</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddressModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAddress} disabled={savingAddress}>
              {savingAddress ? 'Saving...' : 'Save Address'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Modal */}
      <Dialog open={orderDetailOpen} onOpenChange={setOrderDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getStatusConfig(selectedOrder.status).color}>
                  {selectedOrder.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
              </div>

              {/* Items */}
              <div className="border rounded-lg divide-y">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                {selectedOrder.shipping_cost > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Shipping</span>
                    <span>${selectedOrder.shipping_cost?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Tax</span>
                  <span>${selectedOrder.tax?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>${selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shipping_address && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Shipping Address
                  </h4>
                  <p className="text-sm text-gray-600">
                    {selectedOrder.shipping_address.firstName} {selectedOrder.shipping_address.lastName}<br />
                    {selectedOrder.shipping_address.address1}<br />
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zipCode}
                  </p>
                  {selectedOrder.tracking_number && (
                    <p className="text-sm mt-2">
                      <strong>Tracking:</strong> {selectedOrder.tracking_number}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Review Modal */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Leave a Review
            </DialogTitle>
          </DialogHeader>
          {reviewingOrder && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">Order: <span className="font-medium">{reviewingOrder.order_number}</span></p>
                <p className="text-xs text-gray-500">{reviewingOrder.items_count} items • {new Date(reviewingOrder.created_at).toLocaleDateString()}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Your Rating</Label>
                <div className="mt-2">
                  {renderStars(reviewForm.rating, true, (rating) => setReviewForm({...reviewForm, rating}))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Review Title</Label>
                <Input
                  placeholder="Sum up your experience..."
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm({...reviewForm, title: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium">Your Review</Label>
                <Textarea
                  placeholder="Share your experience with these products..."
                  value={reviewForm.content}
                  onChange={(e) => setReviewForm({...reviewForm, content: e.target.value})}
                  rows={4}
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitReview} disabled={submittingReview}>
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCustomerDashboard;
