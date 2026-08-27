import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User, Mail, Phone, MapPin, CreditCard, FileText, History, Receipt,
  ArrowLeft, Edit, Plus, Search, Calendar, DollarSign, Package,
  AlertTriangle, CheckCircle, Clock, ChevronDown, ChevronUp, X,
  Car, IdCard, Home, Building2, Loader2, Upload, Image, Trash2, Eye, Camera
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from '../../hooks/use-toast';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StorageCustomerDetail = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  // Extract customer ID from URL path since we're not using nested React Router
  const customerId = window.location.pathname.split('/').pop();
  const [customer, setCustomer] = useState(null);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [editMode, setEditMode] = useState(false);
  const [showPastRentals, setShowPastRentals] = useState(false);
  const [formData, setFormData] = useState({});
  
  // DL Image state
  const [dlImages, setDlImages] = useState([]);
  const [uploadingDL, setUploadingDL] = useState(false);
  const [loadingDLImages, setLoadingDLImages] = useState(false);
  const dlFileInputRef = useRef(null);

  useEffect(() => {
    fetchCustomerData();
  }, [customerId]);

  // Fetch DL images when tab changes
  useEffect(() => {
    if (activeTab === 'dl-image' && customer) {
      fetchDLImages();
    }
  }, [activeTab, customer]);

  const getTenantFolderName = (customerData) => {
    if (!customerData?.name) return 'unknown-tenant';
    const nameParts = customerData.name.trim().split(' ');
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : nameParts[0];
    const firstName = nameParts[0];
    return `tenant-${lastName.toLowerCase()}-${firstName.toLowerCase()}`.replace(/[^a-z0-9-]/g, '');
  };

  const fetchDLImages = async () => {
    if (!customer) return;
    setLoadingDLImages(true);
    try {
      const token = localStorage.getItem('token');
      const folderName = getTenantFolderName(customer);
      const response = await axios.get(`${API}/storage/list/${folderName}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDlImages(response.data.files || []);
    } catch (error) {
      console.error('Failed to fetch DL images:', error);
      // If folder doesn't exist yet, that's okay
      setDlImages([]);
    } finally {
      setLoadingDLImages(false);
    }
  };

  const handleDLUpload = async (file) => {
    if (!file || !customer) return;
    
    setUploadingDL(true);
    try {
      const token = localStorage.getItem('token');
      const folderName = getTenantFolderName(customer);
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', folderName);

      const response = await axios.post(`${API}/storage/upload`, formDataUpload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update customer record with DL image URL
      await axios.put(`${API}/storage-rentals/customers/${customerId}`, {
        dl_image_url: response.data.url,
        dl_image_folder: folderName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ title: 'Success', description: 'Driver\'s license image uploaded' });
      fetchDLImages();
      fetchCustomerData();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ 
        title: 'Upload Failed', 
        description: error.response?.data?.detail || 'Could not upload image. Check storage configuration.',
        variant: 'destructive' 
      });
    } finally {
      setUploadingDL(false);
    }
  };

  const handleDeleteDLImage = async (imageUrl, fileName) => {
    if (user?.role !== 'super_admin') {
      toast({ 
        title: 'Permission Denied', 
        description: 'Only super admins can delete driver\'s license images',
        variant: 'destructive' 
      });
      return;
    }

    if (!confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const folderName = getTenantFolderName(customer);
      
      await axios.delete(`${API}/storage/delete`, {
        headers: { Authorization: `Bearer ${token}` },
        data: { folder: folderName, filename: fileName }
      });

      toast({ title: 'Success', description: 'Image deleted' });
      fetchDLImages();
    } catch (error) {
      toast({ 
        title: 'Delete Failed', 
        description: error.response?.data?.detail || 'Could not delete image',
        variant: 'destructive' 
      });
    }
  };

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch customer details
      const customerRes = await axios.get(`${API}/storage-rentals/customers/${customerId}`, { headers });
      setCustomer(customerRes.data);
      setFormData(customerRes.data);

      // Fetch customer's rentals
      const rentalsRes = await axios.get(`${API}/storage-rentals/rentals?customer_id=${customerId}`, { headers });
      setRentals(rentalsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch customer:', error);
      toast({ title: 'Error', description: 'Failed to load customer data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/storage-rentals/customers/${customerId}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomer(formData);
      setEditMode(false);
      toast({ title: 'Success', description: 'Customer information updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update customer', variant: 'destructive' });
    }
  };

  const activeRentals = rentals.filter(r => r.status === 'active');
  const pastRentals = rentals.filter(r => r.status !== 'active');

  // Calculate account balance
  const calculateBalance = () => {
    let totalDue = 0;
    activeRentals.forEach(rental => {
      if (rental.balance_due) totalDue += rental.balance_due;
    });
    return totalDue;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-12">
        <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Customer Not Found</h2>
        <p className="text-gray-500 mt-2">The customer you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/admin/storage/customers')} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="storage-customer-detail">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/storage/customers')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-[rgb(37, 99, 235)] to-[#e63950] rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {customer.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
              <p className="text-gray-500 text-sm">Account #{customer.account_number || customer.id?.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-1" /> Add Note
          </Button>
          <Button variant="outline" size="sm">
            <FileText className="w-4 h-4 mr-1" /> Upload
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="general" className="data-[state=active]:bg-white">General</TabsTrigger>
          <TabsTrigger value="dl-image" className="data-[state=active]:bg-white">
            <IdCard className="w-4 h-4 mr-1" /> D/L Image
          </TabsTrigger>
          <TabsTrigger value="documents" className="data-[state=active]:bg-white">Documents</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white">History</TabsTrigger>
          <TabsTrigger value="ledger" className="data-[state=active]:bg-white">Ledger</TabsTrigger>
          <TabsTrigger value="payment" className="data-[state=active]:bg-white">Payment Methods</TabsTrigger>
          {calculateBalance() > 0 && (
            <TabsTrigger value="delinquent" className="data-[state=active]:bg-white text-red-600">
              Delinquent
            </TabsTrigger>
          )}
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* General Information */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">General Information</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => editMode ? handleSave() : setEditMode(true)}
                >
                  {editMode ? 'Save' : 'Edit Tenant'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-[140px_1fr] gap-y-4 text-sm">
                  <span className="text-gray-500 font-medium">Account Number</span>
                  <span className="text-gray-900">{customer.account_number || customer.id?.slice(-8).toUpperCase()}</span>

                  <span className="text-gray-500 font-medium">Tenant Name</span>
                  {editMode ? (
                    <Input 
                      value={formData.name || ''} 
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="h-8"
                    />
                  ) : (
                    <span className="text-gray-900">{customer.name}</span>
                  )}

                  <span className="text-gray-500 font-medium">Email</span>
                  {editMode ? (
                    <Input 
                      value={formData.email || ''} 
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="h-8"
                    />
                  ) : (
                    <a href={`mailto:${customer.email}`} className="text-[rgb(37, 99, 235)] hover:underline">{customer.email}</a>
                  )}

                  <span className="text-gray-500 font-medium">Phone</span>
                  {editMode ? (
                    <Input 
                      value={formData.phone || ''} 
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="h-8"
                    />
                  ) : (
                    <div>
                      <span className="text-gray-900">{customer.phone || '(000) 000-0000'}</span>
                      {customer.phone && <span className="text-green-600 text-xs ml-2">✓ Primary Number</span>}
                    </div>
                  )}

                  <span className="text-gray-500 font-medium">Addresses</span>
                  {editMode ? (
                    <Input 
                      value={formData.address || ''} 
                      onChange={(e) => setFormData({...formData, address: e.target.value})}
                      className="h-8"
                    />
                  ) : (
                    <div>
                      <span className="text-gray-900">{customer.address || 'No address on file'}</span>
                      {customer.address && <span className="text-green-600 text-xs block">✓ Primary Address</span>}
                    </div>
                  )}

                  <span className="text-gray-500 font-medium">Driver's License</span>
                  {editMode ? (
                    <Input 
                      value={formData.drivers_license || ''} 
                      onChange={(e) => setFormData({...formData, drivers_license: e.target.value})}
                      className="h-8"
                      placeholder="Enter license number"
                    />
                  ) : (
                    <span className="text-gray-900">{customer.drivers_license || '—'}</span>
                  )}

                  <span className="text-gray-500 font-medium">License Plate</span>
                  {editMode ? (
                    <Input 
                      value={formData.license_plate || ''} 
                      onChange={(e) => setFormData({...formData, license_plate: e.target.value})}
                      className="h-8"
                      placeholder="Enter license plate"
                    />
                  ) : (
                    <span className="text-gray-900">{customer.license_plate || '—'}</span>
                  )}

                  <span className="text-gray-500 font-medium">Vehicle Description</span>
                  {editMode ? (
                    <Input 
                      value={formData.vehicle_description || ''} 
                      onChange={(e) => setFormData({...formData, vehicle_description: e.target.value})}
                      className="h-8"
                      placeholder="e.g., Blue Ford F-150"
                    />
                  ) : (
                    <span className="text-gray-900">{customer.vehicle_description || '—'}</span>
                  )}

                  <span className="text-gray-500 font-medium">Invoice Delivery</span>
                  <span className="text-gray-900">{customer.invoice_delivery || 'Email'}</span>

                  <span className="text-gray-500 font-medium">Exemptions</span>
                  <span className="text-gray-900">{customer.exemptions || 'No Exemptions'}</span>

                  <span className="text-gray-500 font-medium">Rental Center</span>
                  <span className="text-gray-500">Last login: {customer.last_login || 'Never'}</span>
                </div>

                {editMode && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" className="flex-1" onClick={() => { setEditMode(false); setFormData(customer); }}>
                      Cancel
                    </Button>
                    <Button className="flex-1 bg-[rgb(37, 99, 235)] hover:bg-[#a01830]" onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Balance & Rentals */}
            <div className="space-y-6">
              {/* Account Balance */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Account Balance</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                      <DollarSign className="w-4 h-4 mr-1" /> Pay Now
                    </Button>
                    <Button variant="outline" size="sm">Edit Upcoming Charges</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center py-4 border-b">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Paid Through</p>
                      <p className="text-lg font-semibold text-gray-900 mt-1">
                        {customer.paid_through || new Date().toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Prepaid Credit</p>
                      <p className="text-lg font-semibold text-green-600 mt-1">
                        ${customer.prepaid_credit?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider">Balance Due</p>
                      <p className={`text-lg font-semibold mt-1 ${calculateBalance() > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                        ${calculateBalance().toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {/* Past Due Units */}
                  {pastRentals.length > 0 && (
                    <div className="mt-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-500 uppercase tracking-wider">
                            <th className="text-left py-2">Past Unit</th>
                            <th className="text-left py-2">Moved-Out Date</th>
                            <th className="text-right py-2">Credit</th>
                            <th className="text-right py-2">Balance Due</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pastRentals.slice(0, 3).map((rental) => (
                            <tr key={rental.id} className="border-t">
                              <td className="py-2">
                                <span className="text-[rgb(37, 99, 235)]">#{rental.unit_name || rental.unit_id?.slice(-4)}</span>
                              </td>
                              <td className="py-2 text-gray-600">
                                {rental.end_date ? new Date(rental.end_date).toLocaleDateString() : '—'}
                              </td>
                              <td className="py-2 text-right text-gray-600">$0.00</td>
                              <td className="py-2 text-right">
                                <span className={rental.balance_due > 0 ? 'text-red-600' : 'text-gray-900'}>
                                  ${rental.balance_due?.toFixed(2) || '0.00'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Current Rentals */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Rentals</CardTitle>
                  {pastRentals.length > 0 && (
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-[rgb(37, 99, 235)]"
                      onClick={() => setShowPastRentals(!showPastRentals)}
                    >
                      {showPastRentals ? 'Hide' : 'Show'} Past Rentals
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeRentals.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No active rentals</p>
                    </div>
                  ) : (
                    activeRentals.map((rental) => (
                      <div key={rental.id} className="border rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-gray-50">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                            <span className="text-[rgb(37, 99, 235)] font-medium">#{rental.unit_name || rental.unit_id?.slice(-4)}</span>
                            <span className="text-gray-600">• {rental.size || '10x10x10'} • Self-Storage Unit</span>
                          </div>
                          <Button variant="outline" size="sm">Edit Rental</Button>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Moved-In</span>
                              <p className="font-medium">
                                {rental.start_date ? new Date(rental.start_date).toLocaleDateString() : '—'}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <ArrowLeft className="w-3 h-3 mr-1" /> Move-Out
                              </Button>
                              <Button variant="outline" size="sm">
                                Transfer →
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                            <div>
                              <span className="text-gray-500">Lease Number</span>
                              <p className="font-medium">{rental.lease_number || rental.id?.slice(-6)}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Gate Code</span>
                              <p className="font-medium">{rental.gate_code || '—'}</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                            <div>
                              <span className="text-gray-500">Billing Cycle</span>
                              <p className="font-medium">{rental.billing_cycle || '1st of month'}</p>
                              <p className="text-xs text-gray-400">Next charge: {rental.next_charge_date || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-500">Monthly Rate</span>
                              <p className="font-medium text-green-600">${rental.monthly_rate?.toFixed(2) || '0.00'}/mo</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Additional Contacts */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg">Additional Contacts</CardTitle>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-1" /> New
                  </Button>
                </CardHeader>
                <CardContent>
                  {customer.additional_contacts?.length > 0 ? (
                    <div className="space-y-2">
                      {customer.additional_contacts.map((contact, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-sm text-gray-500">{contact.phone} • {contact.relationship}</p>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No Additional Contacts</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* D/L Image Tab */}
        <TabsContent value="dl-image" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IdCard className="w-5 h-5" />
                Driver's License Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 mb-4">
                Upload tenant's driver's license for verification. Images are stored securely in iDrive E2 storage.
                <br />
                <span className="font-medium">Folder: </span>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{getTenantFolderName(customer)}</code>
              </p>

              {/* Upload Section */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-[rgb(37, 99, 235)] transition-colors">
                <input
                  ref={dlFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleDLUpload(file);
                    e.target.value = '';
                  }}
                />
                
                {uploadingDL ? (
                  <div className="py-4">
                    <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)] mx-auto mb-2" />
                    <p className="text-gray-500">Uploading image...</p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Drop image here or click to upload</p>
                    <Button 
                      variant="outline" 
                      onClick={() => dlFileInputRef.current?.click()}
                      className="border-[rgb(37, 99, 235)] text-[rgb(37, 99, 235)] hover:bg-[rgb(37, 99, 235)] hover:text-white"
                    >
                      <Camera className="w-4 h-4 mr-2" /> Choose Image
                    </Button>
                    <p className="text-xs text-gray-400 mt-2">Supported: JPG, PNG, WEBP (Max 10MB)</p>
                  </>
                )}
              </div>

              {/* Images Grid */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Uploaded Images ({dlImages.length})
                </h3>
                
                {loadingDLImages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : dlImages.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Image className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">No driver's license images uploaded yet</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {dlImages.map((image, idx) => (
                      <div 
                        key={idx} 
                        className="relative group border rounded-lg overflow-hidden bg-gray-50"
                        data-testid={`dl-image-${idx}`}
                      >
                        <img 
                          src={image.url} 
                          alt={`DL Image ${idx + 1}`}
                          className="w-full h-40 object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/200x160?text=Image+Error';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(image.url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {user?.role === 'super_admin' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteDLImage(image.url, image.filename)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="p-2 text-xs text-gray-500 truncate">
                          {image.filename}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info Box */}
              {user?.role !== 'super_admin' && dlImages.length > 0 && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 inline mr-2" />
                  Only super admins can delete driver's license images.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value="documents" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No documents uploaded</p>
                <Button variant="outline" className="mt-4">
                  <Plus className="w-4 h-4 mr-2" /> Upload Document
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { date: new Date().toLocaleDateString(), action: 'Account created', user: 'System' },
                  ...rentals.map(r => ({
                    date: r.start_date ? new Date(r.start_date).toLocaleDateString() : 'Unknown',
                    action: `Rented unit ${r.unit_name || r.unit_id?.slice(-4)}`,
                    user: 'Admin'
                  }))
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="w-2 h-2 bg-[rgb(37, 99, 235)] rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.action}</p>
                      <p className="text-sm text-gray-500">{item.date} by {item.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Ledger Tab */}
        <TabsContent value="ledger" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Ledger</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-500 uppercase tracking-wider border-b">
                      <th className="text-left py-3">Date</th>
                      <th className="text-left py-3">Description</th>
                      <th className="text-right py-3">Charges</th>
                      <th className="text-right py-3">Payments</th>
                      <th className="text-right py-3">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3">{new Date().toLocaleDateString()}</td>
                      <td className="py-3">Monthly Storage Fee</td>
                      <td className="py-3 text-right">$89.00</td>
                      <td className="py-3 text-right">—</td>
                      <td className="py-3 text-right font-medium">$89.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3">{new Date().toLocaleDateString()}</td>
                      <td className="py-3 text-green-600">Payment - Credit Card</td>
                      <td className="py-3 text-right">—</td>
                      <td className="py-3 text-right text-green-600">$89.00</td>
                      <td className="py-3 text-right font-medium">$0.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Payment Methods</CardTitle>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" /> Add Payment Method
              </Button>
            </CardHeader>
            <CardContent>
              {customer.stripe_customer_id ? (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-gray-500">Expires 12/25</p>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Default</Badge>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No payment methods on file</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delinquent Tab */}
        <TabsContent value="delinquent" className="mt-6">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Delinquent Account
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <p className="text-red-800 font-medium">Balance Due: ${calculateBalance().toFixed(2)}</p>
                <p className="text-red-600 text-sm mt-1">This account has an outstanding balance.</p>
              </div>
              <Button className="w-full bg-red-600 hover:bg-red-700">
                <DollarSign className="w-4 h-4 mr-2" /> Collect Payment Now
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StorageCustomerDetail;
