import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Warehouse, CreditCard, User, Phone, Mail, MapPin, 
  Shield, CheckCircle, Loader2, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminStoragePOS = () => {
  const navigate = useNavigate();
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState(1); // 1: Select Size, 2: Customer Info, 3: Confirmation
  const [selectedSize, setSelectedSize] = useState(null);
  const [billingType, setBillingType] = useState('monthly');
  const [completedRental, setCompletedRental] = useState(null);
  
  const [customerInfo, setCustomerInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'AL',
    zip_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  });

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      const response = await axios.get(`${API}/storage-rentals/sizes`);
      setSizes(response.data);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load storage sizes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getPrice = () => {
    if (!selectedSize) return 0;
    return billingType === 'yearly' ? selectedSize.yearly_price : selectedSize.monthly_price;
  };

  const handleSelectSize = (size) => {
    if (size.available_units <= 0) return;
    setSelectedSize(size);
    setStep(2);
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!customerInfo.first_name || !customerInfo.last_name || !customerInfo.email || 
        !customerInfo.phone || !customerInfo.address || !customerInfo.city || !customerInfo.zip_code) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    
    setStep(3);
  };

  const handleProcessPayment = async () => {
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/storage-rentals/pos/checkout`, {
        unit_size_id: selectedSize.id,
        customer: customerInfo,
        billing_type: billingType,
        origin_url: window.location.origin
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setCompletedRental(response.data);
      setStep(4);
      toast({ title: 'Success!', description: 'Rental created successfully' });
      
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to process payment', 
        variant: 'destructive' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleNewRental = () => {
    setStep(1);
    setSelectedSize(null);
    setBillingType('monthly');
    setCompletedRental(null);
    setCustomerInfo({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'AL',
      zip_code: '',
      emergency_contact_name: '',
      emergency_contact_phone: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="w-12 h-12 animate-spin text-[rgb(37, 99, 235)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[rgb(37, 99, 235)] text-white p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/storage" className="p-2 hover:bg-white/10 rounded-lg">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div className="flex items-center gap-3">
              <Warehouse className="w-8 h-8" />
              <div>
                <h1 className="text-xl font-bold">Storage POS</h1>
                <p className="text-sm text-white/70">Point of Sale System</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span>Ready for Payment</span>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-center gap-4">
            {[
              { num: 1, label: 'Select Unit' },
              { num: 2, label: 'Customer Info' },
              { num: 3, label: 'Review & Pay' },
              { num: 4, label: 'Complete' }
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div className={`flex items-center gap-2 ${step >= s.num ? 'text-[rgb(37, 99, 235)]' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    step >= s.num ? 'bg-[rgb(37, 99, 235)] text-white' : 'bg-gray-200'
                  }`}>
                    {step > s.num ? <CheckCircle className="w-5 h-5" /> : s.num}
                  </div>
                  <span className="font-medium hidden sm:inline">{s.label}</span>
                </div>
                {i < 3 && <div className={`w-12 h-1 ${step > s.num ? 'bg-[rgb(37, 99, 235)]' : 'bg-gray-200'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4">
        {/* Step 1: Select Unit Size */}
        {step === 1 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Storage Unit Size</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sizes.map((size) => (
                <Card 
                  key={size.id} 
                  className={`cursor-pointer transition-all ${
                    size.available_units > 0 
                      ? 'hover:shadow-xl hover:border-[rgb(37, 99, 235)]' 
                      : 'opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => handleSelectSize(size)}
                >
                  <CardHeader className="bg-gradient-to-r from-[rgb(37, 99, 235)] to-[#2d5a8f] text-white">
                    <CardTitle className="text-3xl">{size.name}</CardTitle>
                    <p className="text-white/80">{size.square_feet} sq ft</p>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span>Monthly</span>
                        <span className="text-2xl font-bold">${size.monthly_price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-green-600">
                        <span>Yearly (Save!)</span>
                        <span className="text-2xl font-bold">${size.yearly_price.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t">
                        {size.available_units > 0 ? (
                          <Badge className="bg-green-100 text-green-800">
                            {size.available_units} Available
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800">Sold Out</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{size.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Customer Information */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCustomerSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name *</Label>
                        <Input
                          value={customerInfo.first_name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, first_name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label>Last Name *</Label>
                        <Input
                          value={customerInfo.last_name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, last_name: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="flex items-center gap-1"><Mail className="w-4 h-4" /> Email *</Label>
                        <Input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label className="flex items-center gap-1"><Phone className="w-4 h-4" /> Phone *</Label>
                        <Input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="flex items-center gap-1"><MapPin className="w-4 h-4" /> Address *</Label>
                      <Input
                        value={customerInfo.address}
                        onChange={(e) => setCustomerInfo(prev => ({ ...prev, address: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>City *</Label>
                        <Input
                          value={customerInfo.city}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, city: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Input
                          value={customerInfo.state}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, state: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label>ZIP Code *</Label>
                        <Input
                          value={customerInfo.zip_code}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, zip_code: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium flex items-center gap-2 mb-3">
                        <Shield className="w-4 h-4" />
                        Emergency Contact (Optional)
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Contact Name</Label>
                          <Input
                            value={customerInfo.emergency_contact_name}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label>Contact Phone</Label>
                          <Input
                            type="tel"
                            value={customerInfo.emergency_contact_phone}
                            onChange={(e) => setCustomerInfo(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button type="submit" className="flex-1 bg-[rgb(37, 99, 235)]">
                        Continue to Review
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            <div>
              <Card className="sticky top-4">
                <CardHeader className="bg-[rgb(37, 99, 235)] text-white">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Unit Size</p>
                    <p className="text-xl font-bold">{selectedSize?.name}</p>
                    <p className="text-sm text-gray-500">{selectedSize?.square_feet} sq ft</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-2">Billing Period</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBillingType('monthly')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          billingType === 'monthly' 
                            ? 'border-[rgb(37, 99, 235)] bg-red-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium">Monthly</p>
                        <p className="text-lg font-bold">${selectedSize?.monthly_price.toFixed(2)}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingType('yearly')}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          billingType === 'yearly' 
                            ? 'border-[rgb(37, 99, 235)] bg-red-50' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium">Yearly</p>
                        <p className="text-lg font-bold text-green-600">${selectedSize?.yearly_price.toFixed(2)}</p>
                        <p className="text-xs text-green-600">Save ${((selectedSize?.monthly_price * 12) - selectedSize?.yearly_price).toFixed(2)}</p>
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Due Today</span>
                      <span className="text-2xl font-bold text-[rgb(37, 99, 235)]">${getPrice().toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Step 3: Review & Pay */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Review & Complete Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Unit Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Storage Unit</h4>
                  <div className="flex justify-between">
                    <div>
                      <p className="text-2xl font-bold">{selectedSize?.name}</p>
                      <p className="text-gray-500">{selectedSize?.square_feet} sq ft • {billingType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-bold text-[rgb(37, 99, 235)]">${getPrice().toFixed(2)}</p>
                      <p className="text-sm text-gray-500">/{billingType === 'yearly' ? 'year' : 'month'}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Customer</h4>
                  <p className="font-medium">{customerInfo.first_name} {customerInfo.last_name}</p>
                  <p className="text-gray-600">{customerInfo.email}</p>
                  <p className="text-gray-600">{customerInfo.phone}</p>
                  <p className="text-gray-600">{customerInfo.address}, {customerInfo.city}, {customerInfo.state} {customerInfo.zip_code}</p>
                </div>

                {/* Payment Notice */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[rgb(37, 99, 235)] mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">In-Person Payment</p>
                    <p className="text-sm text-blue-700">
                      Clicking "Process Payment" will mark this rental as paid. 
                      Collect payment via cash, card, or check before proceeding.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                  <Button 
                    className="flex-1 bg-[rgb(37, 99, 235)] text-lg py-6"
                    onClick={handleProcessPayment}
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Process Payment - ${getPrice().toFixed(2)}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 4: Complete */}
        {step === 4 && completedRental && (
          <div className="max-w-xl mx-auto text-center">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Rental Complete!</h2>
              <p className="text-gray-600 mb-8">The storage unit has been successfully rented.</p>

              <div className="bg-gray-50 rounded-xl p-6 text-left space-y-4 mb-8">
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit Number</span>
                  <span className="text-2xl font-bold">{completedRental.unit_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Access Code</span>
                  <span className="text-3xl font-mono font-bold text-[rgb(37, 99, 235)]">{completedRental.access_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount Paid</span>
                  <span className="text-xl font-bold">${completedRental.price.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <p className="text-yellow-800 text-sm">
                  <strong>Important:</strong> Please provide the customer with their unit number and access code. 
                  They will need the access code to enter the facility.
                </p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigate('/admin/storage')} className="flex-1">
                  Back to Dashboard
                </Button>
                <Button className="flex-1 bg-[rgb(37, 99, 235)]" onClick={handleNewRental}>
                  New Rental
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStoragePOS;
