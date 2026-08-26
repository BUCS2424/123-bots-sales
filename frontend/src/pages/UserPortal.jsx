import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import {
  User,
  Package,
  MapPin,
  CreditCard,
  RefreshCw,
  LogOut,
  ChevronRight,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Edit2,
  Plus,
  Trash2,
  Eye,
  MessageCircle,
  Star,
  ShoppingBag,
  Loader2,
  Save,
  X,
  Wrench
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { EmailTwoFactorSettingsCard } from '../components/security/EmailTwoFactorSettingsCard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function UserPortal() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const initialTab = new URLSearchParams(window.location.search).get('tab') === 'services' ? 'services' : 'orders';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [orders, setOrders] = useState([]);
  const [serviceRequests, setServiceRequests] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [customerInfo, setCustomerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [token]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersRes, customerRes, serviceRes] = await Promise.all([
        axios.get(`${API_URL}/api/portal/my-orders`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API_URL}/api/portal/my-account`, { headers }).catch(() => ({ data: null })),
        axios.get(`${API_URL}/api/portal/my-service-requests`, { headers }).catch(() => ({ data: [] }))
      ]);

      setOrders(ordersRes.data || []);
      setServiceRequests(serviceRes.data || []);
      setCustomerInfo(customerRes.data);
      setAddresses(customerRes.data?.addresses || []);
      setProfileData({
        name: customerRes.data?.name || user?.name || '',
        email: customerRes.data?.email || user?.email || ''
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'shipped':
      case 'in_transit':
        return <Truck className="w-4 h-4 text-blue-500" />;
      case 'processing':
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'shipped':
      case 'in_transit':
        return 'bg-blue-100 text-blue-700';
      case 'processing':
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handleReorder = async (order) => {
    try {
      // Add items to cart
      const cart = JSON.parse(localStorage.getItem('amino_cart') || '[]');
      order.items?.forEach(item => {
        const existingIndex = cart.findIndex(c => c.id === item.product_id);
        if (existingIndex >= 0) {
          cart[existingIndex].quantity += item.quantity;
        } else {
          cart.push({
            id: item.product_id,
            name: item.product_name,
            price: item.price,
            quantity: item.quantity
          });
        }
      });
      localStorage.setItem('amino_cart', JSON.stringify(cart));
      toast.success('Items added to cart!');
      navigate('/checkout');
    } catch (error) {
      toast.error('Failed to add items to cart');
    }
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await axios.put(`${API_URL}/api/portal/my-account`, profileData, { headers });
      toast.success('Profile updated successfully');
      setShowProfileEdit(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordData.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    setSavingProfile(true);
    try {
      await axios.post(`${API_URL}/api/portal/change-password`, {
        current_password: passwordData.current,
        new_password: passwordData.new
      }, { headers });
      toast.success('Password changed successfully');
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveAddress = async (addressData) => {
    setSavingAddress(true);
    try {
      if (editingAddress?.id) {
        await axios.put(`${API_URL}/api/portal/addresses/${editingAddress.id}`, addressData, { headers });
        toast.success('Address updated');
      } else {
        await axios.post(`${API_URL}/api/portal/addresses`, addressData, { headers });
        toast.success('Address added');
      }
      setShowAddressModal(false);
      setEditingAddress(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!confirm('Delete this address?')) return;
    try {
      await axios.delete(`${API_URL}/api/portal/addresses/${addressId}`, { headers });
      toast.success('Address deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete address');
    }
  };

  const openChat = () => {
    // Trigger the chat widget to open with user context
    window.dispatchEvent(new CustomEvent('openAtomChat', { 
      detail: { 
        userId: user?.id,
        userName: user?.name,
        userEmail: user?.email,
        customerType: customerInfo?.customer_type
      }
    }));
  };

  const tabs = [
    { id: 'orders', label: 'My Orders', icon: Package },
    ...(serviceRequests.length > 0 ? [{ id: 'services', label: 'My Services', icon: Wrench }] : []),
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'pricing', label: 'My Pricing', icon: CreditCard },
  ];

  const ACTIVITY_LABELS = {
    clock_in: 'Technician clocked in',
    clock_out: 'Technician clocked out',
    unit_received: 'Unit received at shop',
    unit_returned: 'Unit returned to you',
    loaner_out: 'Loaner unit issued to you',
    loaner_in: 'Loaner unit checked in',
  };

  const SERVICE_STATUS_LABELS = {
    new_request: 'Request Received',
    scheduled: 'Scheduled',
    diagnosed: 'Diagnosed',
    awaiting_parts: 'Awaiting Parts',
    in_repair: 'In Repair',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  const SERVICE_STATUS_COLOR = {
    new_request: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-indigo-100 text-indigo-700',
    diagnosed: 'bg-amber-100 text-amber-700',
    awaiting_parts: 'bg-orange-100 text-orange-700',
    in_repair: 'bg-purple-100 text-purple-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-gray-100 text-gray-500',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1625] to-[#2d2438] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#b9893d]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pt-[105px]" data-testid="user-portal">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1625] to-[#2d2438] text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0] || 'Researcher'}</h1>
              <p className="text-slate-300 mt-1">Manage your account and orders</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="border-[#b9893d] text-[#b9893d] hover:bg-[#b9893d] hover:text-white"
                onClick={openChat}
                data-testid="portal-chat-btn"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Us
              </Button>
              <Button
                variant="ghost"
                className="text-slate-300 hover:text-white"
                onClick={() => { logout(); navigate('/'); }}
                data-testid="portal-logout-btn"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <nav className="space-y-2">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-[#6e2ea8] text-white'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      {tab.label}
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    </button>
                  ))}
                </nav>
                
                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#6e2ea8]">{orders.length}</div>
                      <div className="text-xs text-slate-500">Total Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#b9893d]">
                        {customerInfo?.customer_type === 'wholesale' ? 'VIP' : 'Retail'}
                      </div>
                      <div className="text-xs text-slate-500">Your Tier</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Order History</h2>
                  <Button variant="outline" onClick={() => navigate('/shop')}>
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Shop Now
                  </Button>
                </div>
                
                {orders.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Package className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                      <h3 className="font-semibold text-lg">No orders yet</h3>
                      <p className="text-slate-500 mt-2">Start shopping to see your orders here</p>
                      <Button className="mt-4" onClick={() => navigate('/shop')}>
                        Browse Products
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  orders.map(order => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm text-slate-500">#{order.id?.slice(-8).toUpperCase()}</span>
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1">{order.status}</span>
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              {new Date(order.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-lg">${order.total?.toFixed(2)}</div>
                            <div className="text-sm text-slate-500">{order.items?.length || 0} items</div>
                          </div>
                        </div>
                        
                        {/* Order Items Preview */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          {order.items?.slice(0, 3).map((item, idx) => (
                            <span key={idx} className="text-sm bg-slate-100 px-3 py-1 rounded-full">
                              {item.product_name} x{item.quantity}
                            </span>
                          ))}
                          {order.items?.length > 3 && (
                            <span className="text-sm text-slate-500">+{order.items.length - 3} more</span>
                          )}
                        </div>
                        
                        {/* Actions */}
                        <div className="mt-4 flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setSelectedOrder(order); setShowOrderDetail(true); }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReorder(order)}
                          >
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Reorder
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-4" data-testid="portal-services-tab">
                <h2 className="text-xl font-semibold">My Services</h2>
                {serviceRequests.map((req) => (
                  <Card key={req.id} data-testid={`portal-service-request-${req.id}`}>
                    <CardContent className="p-5 space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{req.make} {req.model}</p>
                          <p className="text-xs text-slate-500">SN: {req.serial_number || 'N/A'} &middot; Submitted {new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SERVICE_STATUS_COLOR[req.status] || 'bg-gray-100 text-gray-600'}`}>
                          {SERVICE_STATUS_LABELS[req.status] || req.status}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 bg-slate-50 rounded-lg p-3">{req.issue_description}</p>

                      {req.activity_log && req.activity_log.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-xs font-semibold text-slate-500 uppercase mb-2">Status Timeline</p>
                          <div className="space-y-2">
                            {[...req.activity_log]
                              .filter((item) => item.type !== 'clock_in' && item.type !== 'clock_out')
                              .reverse()
                              .map((item) => (
                                <div key={item.id} className="flex items-center justify-between text-sm">
                                  <span className="text-slate-700">{ACTIVITY_LABELS[item.type] || item.type}</span>
                                  <span className="text-xs text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">My Profile</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          disabled={!showProfileEdit}
                        />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input
                          value={profileData.email}
                          onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                          disabled={!showProfileEdit}
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {showProfileEdit ? (
                        <>
                          <Button onClick={handleSaveProfile} disabled={savingProfile}>
                            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Changes
                          </Button>
                          <Button variant="outline" onClick={() => setShowProfileEdit(false)}>
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button variant="outline" onClick={() => setShowProfileEdit(true)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Change Password</CardTitle>
                    <CardDescription>Update your account password</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Current Password</Label>
                      <Input
                        type="password"
                        value={passwordData.current}
                        onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label>New Password</Label>
                        <Input
                          type="password"
                          value={passwordData.new}
                          onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Confirm New Password</Label>
                        <Input
                          type="password"
                          value={passwordData.confirm}
                          onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button onClick={handleChangePassword} disabled={savingProfile || !passwordData.current || !passwordData.new}>
                      {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Change Password
                    </Button>
                  </CardContent>
                </Card>

                <EmailTwoFactorSettingsCard
                  testIdPrefix="portal-email-2fa"
                  title="Protect My Portal Login"
                  description="Add a 6-digit email code to every login, with an optional 30-day trusted browser remember setting."
                />
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Shipping Addresses</h2>
                  <Button onClick={() => { setEditingAddress(null); setShowAddressModal(true); }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Address
                  </Button>
                </div>
                
                {addresses.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <MapPin className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                      <h3 className="font-semibold text-lg">No addresses saved</h3>
                      <p className="text-slate-500 mt-2">Add a shipping address for faster checkout</p>
                      <Button className="mt-4" onClick={() => setShowAddressModal(true)}>
                        Add Address
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {addresses.map(address => (
                      <Card key={address.id}>
                        <CardContent className="p-4">
                          {address.is_default && (
                            <Badge className="mb-2 bg-[#6e2ea8]">Default</Badge>
                          )}
                          <p className="font-semibold">{address.name}</p>
                          <p className="text-sm text-slate-600">{address.street}</p>
                          {address.street2 && <p className="text-sm text-slate-600">{address.street2}</p>}
                          <p className="text-sm text-slate-600">
                            {address.city}, {address.state} {address.zip}
                          </p>
                          <p className="text-sm text-slate-600">{address.country || 'USA'}</p>
                          {address.phone && <p className="text-sm text-slate-500 mt-1">{address.phone}</p>}
                          
                          <div className="flex gap-2 mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setEditingAddress(address); setShowAddressModal(true); }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Pricing Tab */}
            {activeTab === 'pricing' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">My Pricing & Tier</h2>
                
                <Card className={customerInfo?.customer_type === 'wholesale' ? 'border-[#b9893d] border-2' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                        customerInfo?.customer_type === 'wholesale'
                          ? 'bg-gradient-to-br from-[#b9893d] to-[#d4a94d]'
                          : 'bg-gradient-to-br from-[#6e2ea8] to-[#8e4ec8]'
                      }`}>
                        <Star className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800">
                          {customerInfo?.customer_type === 'wholesale' ? 'Wholesale' : 'Retail'} Member
                        </h3>
                        <p className="text-slate-600">
                          {customerInfo?.customer_type === 'wholesale'
                            ? 'You enjoy exclusive wholesale pricing on all products'
                            : 'Standard retail pricing applies to your orders'}
                        </p>
                      </div>
                    </div>
                    
                    {customerInfo?.customer_type === 'wholesale' && (
                      <div className="mt-6 p-4 bg-[#b9893d]/10 rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">Your Discount:</span>
                          <span className="text-2xl font-bold text-[#b9893d]">
                            {customerInfo?.custom_discount_percentage || 20}% OFF
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mt-2">
                          This discount is automatically applied at checkout
                        </p>
                      </div>
                    )}
                    
                    {customerInfo?.customer_type !== 'wholesale' && (
                      <div className="mt-6 p-4 bg-slate-100 rounded-lg">
                        <h4 className="font-semibold text-slate-800">Upgrade to Wholesale</h4>
                        <p className="text-sm text-slate-600 mt-1">
                          Contact us to learn about wholesale pricing for research institutions and bulk orders.
                        </p>
                        <Button className="mt-3 text-gray-900" variant="outline" onClick={openChat}>
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Inquire About Wholesale
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Purchase Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-3xl font-bold text-[#6e2ea8]">{orders.length}</div>
                        <div className="text-sm text-slate-500">Total Orders</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-[#b9893d]">
                          ${orders.reduce((sum, o) => sum + (o.total || 0), 0).toFixed(0)}
                        </div>
                        <div className="text-sm text-slate-500">Total Spent</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-green-600">
                          {orders.reduce((sum, o) => sum + (o.items?.length || 0), 0)}
                        </div>
                        <div className="text-sm text-slate-500">Items Purchased</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={showOrderDetail} onOpenChange={setShowOrderDetail}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order #{selectedOrder?.id?.slice(-8).toUpperCase()}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1">{selectedOrder.status}</span>
                </Badge>
                <span className="text-sm text-slate-500">
                  {new Date(selectedOrder.created_at).toLocaleString()}
                </span>
              </div>
              
              <div className="border rounded-lg divide-y">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between">
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${selectedOrder.discount?.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${selectedOrder.shipping?.toFixed(2) || '0.00'}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>${selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>
              
              {selectedOrder.shipping_address && (
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Shipping Address</h4>
                  <p className="text-sm text-slate-600">
                    {selectedOrder.shipping_address.name}<br />
                    {selectedOrder.shipping_address.street}<br />
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.zip}
                  </p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetail(false)}>Close</Button>
            <Button onClick={() => { handleReorder(selectedOrder); setShowOrderDetail(false); }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reorder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Address Modal */}
      <AddressModal
        open={showAddressModal}
        onClose={() => { setShowAddressModal(false); setEditingAddress(null); }}
        address={editingAddress}
        onSave={handleSaveAddress}
        saving={savingAddress}
      />
    </div>
  );
}

// Address Modal Component
function AddressModal({ open, onClose, address, onSave, saving }) {
  const [formData, setFormData] = useState({
    name: '',
    street: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    phone: '',
    is_default: false
  });

  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name || '',
        street: address.street || '',
        street2: address.street2 || '',
        city: address.city || '',
        state: address.state || '',
        zip: address.zip || '',
        country: address.country || 'USA',
        phone: address.phone || '',
        is_default: address.is_default || false
      });
    } else {
      setFormData({
        name: '',
        street: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        country: 'USA',
        phone: '',
        is_default: false
      });
    }
  }, [address, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{address ? 'Edit Address' : 'Add New Address'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Full Name</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Street Address</Label>
            <Input
              value={formData.street}
              onChange={(e) => setFormData({ ...formData, street: e.target.value })}
              required
            />
          </div>
          <div>
            <Label>Apt, Suite, etc. (optional)</Label>
            <Input
              value={formData.street2}
              onChange={(e) => setFormData({ ...formData, street2: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>State</Label>
              <Input
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ZIP Code</Label>
              <Input
                value={formData.zip}
                onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Phone (optional)</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
            />
            <Label htmlFor="is_default" className="cursor-pointer">Set as default address</Label>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              {address ? 'Update' : 'Add'} Address
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
