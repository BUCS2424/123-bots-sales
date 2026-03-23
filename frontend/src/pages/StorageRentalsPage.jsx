import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Warehouse, CheckCircle, Thermometer, Car, Building, Shield, Clock,
  Loader2, MapPin, Phone, ChevronRight, Star, Lock, CreditCard, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Success Page Component
const SuccessPage = ({ searchParams }) => {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [rental, setRental] = useState(null);
  const rentalId = searchParams.get('rental_id');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Get checkout status
        if (sessionId) {
          const statusRes = await axios.get(`${API}/storage-rentals/checkout/status/${sessionId}`);
          setStatus(statusRes.data);
        }
        
        // Get rental details
        if (rentalId) {
          const rentalRes = await axios.get(`${API}/storage-rentals/rentals/${rentalId}`);
          setRental(rentalRes.data);
        }
      } catch (error) {
        console.error('Error checking status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [rentalId, sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#c41e3a]" />
      </div>
    );
  }

  const isPaid = status?.payment_status === 'paid' || rental?.payment_status === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2d5a8f] to-[#1e3a5f] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-2xl" data-testid="success-card">
        <CardContent className="p-8 text-center">
          {isPaid ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Rental Confirmed!</h1>
              <p className="text-gray-600 mb-6">Your storage unit has been reserved.</p>
              
              {rental && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Unit Number</span>
                    <span className="text-2xl font-bold text-[#1e3a5f]">{rental.unit_number}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b">
                    <span className="text-gray-600">Your Access Code</span>
                    <span className="font-mono text-3xl font-bold text-[#c41e3a]">{rental.access_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid</span>
                    <span className="font-bold text-green-600">${rental.price?.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h3 className="font-bold text-[#1e3a5f] mb-2">Facility Location</h3>
                <p className="text-gray-600">7860 Eddins Road</p>
                <p className="text-gray-600">Dothan, Alabama 36301</p>
                <p className="text-gray-600 mt-2">
                  <Phone className="w-4 h-4 inline mr-1" />
                  (334) 555-0123
                </p>
              </div>

              <div className="text-sm text-gray-500 mb-6">
                <p>A confirmation email has been sent to your email address.</p>
                <p className="mt-2">Please save your access code - you'll need it to enter the facility.</p>
              </div>

              <Button asChild className="w-full bg-[#c41e3a]">
                <a href="/">Return Home</a>
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-yellow-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Processing Payment</h1>
              <p className="text-gray-600 mb-6">Your payment is being processed. Please wait...</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Check Status
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Main Storage Rentals Page
const StorageRentalsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1); // 1: Select Size, 2: Customer Info, 3: Checkout
  const [selectedSize, setSelectedSize] = useState(null);
  const [billingType, setBillingType] = useState('monthly');
  const [processing, setProcessing] = useState(false);
  
  const [customer, setCustomer] = useState({
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

  // Check if this is a success redirect
  const isSuccessPage = searchParams.get('session_id') || searchParams.get('rental_id');

  useEffect(() => {
    if (!isSuccessPage) {
      fetchSizes();
    } else {
      setLoading(false);
    }
  }, [isSuccessPage]);

  const fetchSizes = async () => {
    try {
      const response = await axios.get(`${API}/storage-rentals/sizes`);
      setSizes(response.data);
    } catch (error) {
      console.error('Error fetching sizes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (field, value) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectSize = (size) => {
    setSelectedSize(size);
    setStep(2);
  };

  const validateCustomer = () => {
    if (!customer.first_name.trim() || !customer.last_name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return false;
    }
    if (!customer.email.includes('@')) {
      toast({ title: 'Error', description: 'Valid email is required', variant: 'destructive' });
      return false;
    }
    if (!customer.phone.trim()) {
      toast({ title: 'Error', description: 'Phone number is required', variant: 'destructive' });
      return false;
    }
    if (!customer.address.trim() || !customer.city.trim() || !customer.zip_code.trim()) {
      toast({ title: 'Error', description: 'Full address is required', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleContinueToCheckout = () => {
    if (validateCustomer()) {
      setStep(3);
    }
  };

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      const response = await axios.post(`${API}/storage-rentals/rentals`, {
        unit_size_id: selectedSize.id,
        customer: customer,
        billing_type: billingType,
        origin_url: window.location.origin
      });

      // Redirect to Stripe checkout
      if (response.data.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to initiate checkout', 
        variant: 'destructive' 
      });
      setProcessing(false);
    }
  };

  const getPrice = () => {
    if (!selectedSize) return 0;
    return billingType === 'yearly' ? selectedSize.yearly_price : selectedSize.monthly_price;
  };

  // Render success page if we have session or rental id
  if (isSuccessPage) {
    return <SuccessPage searchParams={searchParams} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-[#c41e3a]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="storage-rentals-page">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Rent Storage Online</h1>
            <p className="text-xl text-white/80 mb-8">
              Secure, convenient storage units available 24/7. Reserve your space today!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Shield className="w-5 h-5" />
                <span>24/7 Security</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Clock className="w-5 h-5" />
                <span>24/7 Access</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
                <Lock className="w-5 h-5" />
                <span>Secure Facility</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center py-4">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#c41e3a]' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-[#c41e3a] text-white' : 'bg-gray-200'}`}>1</div>
                <span className="hidden sm:inline font-medium">Select Unit</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
              <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#c41e3a]' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-[#c41e3a] text-white' : 'bg-gray-200'}`}>2</div>
                <span className="hidden sm:inline font-medium">Your Info</span>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300" />
              <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#c41e3a]' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-[#c41e3a] text-white' : 'bg-gray-200'}`}>3</div>
                <span className="hidden sm:inline font-medium">Payment</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Step 1: Select Unit Size */}
        {step === 1 && (
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Storage Unit</h2>
            
            {sizes.length === 0 ? (
              <Card className="max-w-md mx-auto">
                <CardContent className="py-12 text-center">
                  <Warehouse className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Units Available</h3>
                  <p className="text-gray-600 mb-4">Please check back later or contact us directly.</p>
                  <Button asChild variant="outline">
                    <a href="/contact">Contact Us</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sizes.map((size) => (
                  <Card 
                    key={size.id} 
                    className={`overflow-hidden hover:shadow-xl transition-all cursor-pointer ${size.available_units === 0 ? 'opacity-60' : ''}`}
                    onClick={() => size.available_units > 0 && handleSelectSize(size)}
                    data-testid={`unit-size-${size.id}`}
                  >
                    <CardHeader className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] text-white">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-3xl">{size.name}</CardTitle>
                          <p className="text-white/80">{size.square_feet} sq ft</p>
                        </div>
                        {size.available_units <= 3 && size.available_units > 0 && (
                          <Badge className="bg-yellow-500">Only {size.available_units} left!</Badge>
                        )}
                        {size.available_units === 0 && (
                          <Badge variant="destructive">Sold Out</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <p className="text-gray-600 mb-4">{size.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {size.climate_controlled && (
                          <Badge variant="outline" className="gap-1">
                            <Thermometer className="w-3 h-3" />
                            Climate Controlled
                          </Badge>
                        )}
                        {size.drive_up_access && (
                          <Badge variant="outline" className="gap-1">
                            <Car className="w-3 h-3" />
                            Drive-Up Access
                          </Badge>
                        )}
                        <Badge variant="outline" className="gap-1">
                          <Building className="w-3 h-3" />
                          {size.floor_level === 'ground' ? 'Ground Floor' : 'Upper Floor'}
                        </Badge>
                      </div>

                      <div className="space-y-2 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">Monthly</span>
                          <span className="text-2xl font-bold text-gray-900">${size.monthly_price.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600">
                            Yearly 
                            <span className="text-green-600 text-sm ml-1">
                              (Save ${((size.monthly_price * 12) - size.yearly_price).toFixed(0)})
                            </span>
                          </span>
                          <span className="text-xl font-bold text-green-600">${size.yearly_price.toFixed(2)}</span>
                        </div>
                      </div>

                      {size.available_units > 0 && (
                        <Button className="w-full mt-4 bg-[#c41e3a]">
                          Select This Unit
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Customer Information */}
        {step === 2 && selectedSize && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <button onClick={() => setStep(1)} className="text-[#c41e3a] hover:underline flex items-center gap-1">
                ← Back to unit selection
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Your Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>First Name *</Label>
                        <Input
                          value={customer.first_name}
                          onChange={(e) => handleCustomerChange('first_name', e.target.value)}
                          placeholder="John"
                          data-testid="online-customer-first-name"
                        />
                      </div>
                      <div>
                        <Label>Last Name *</Label>
                        <Input
                          value={customer.last_name}
                          onChange={(e) => handleCustomerChange('last_name', e.target.value)}
                          placeholder="Doe"
                          data-testid="online-customer-last-name"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Email *</Label>
                        <Input
                          type="email"
                          value={customer.email}
                          onChange={(e) => handleCustomerChange('email', e.target.value)}
                          placeholder="john@example.com"
                          data-testid="online-customer-email"
                        />
                      </div>
                      <div>
                        <Label>Phone *</Label>
                        <Input
                          value={customer.phone}
                          onChange={(e) => handleCustomerChange('phone', e.target.value)}
                          placeholder="(555) 555-5555"
                          data-testid="online-customer-phone"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Street Address *</Label>
                      <Input
                        value={customer.address}
                        onChange={(e) => handleCustomerChange('address', e.target.value)}
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>City *</Label>
                        <Input
                          value={customer.city}
                          onChange={(e) => handleCustomerChange('city', e.target.value)}
                          placeholder="Dothan"
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Select value={customer.state} onValueChange={(v) => handleCustomerChange('state', v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AL">Alabama</SelectItem>
                            <SelectItem value="FL">Florida</SelectItem>
                            <SelectItem value="GA">Georgia</SelectItem>
                            <SelectItem value="MS">Mississippi</SelectItem>
                            <SelectItem value="TN">Tennessee</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>ZIP Code *</Label>
                        <Input
                          value={customer.zip_code}
                          onChange={(e) => handleCustomerChange('zip_code', e.target.value)}
                          placeholder="36301"
                        />
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Emergency Contact (Optional)</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Name</Label>
                          <Input
                            value={customer.emergency_contact_name}
                            onChange={(e) => handleCustomerChange('emergency_contact_name', e.target.value)}
                            placeholder="Jane Doe"
                          />
                        </div>
                        <div>
                          <Label>Phone</Label>
                          <Input
                            value={customer.emergency_contact_phone}
                            onChange={(e) => handleCustomerChange('emergency_contact_phone', e.target.value)}
                            placeholder="(555) 555-5556"
                          />
                        </div>
                      </div>
                    </div>

                    <Button onClick={handleContinueToCheckout} className="w-full bg-[#c41e3a]" data-testid="continue-to-checkout-btn">
                      Continue to Checkout
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Order Summary Sidebar */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader className="bg-gray-50">
                    <CardTitle className="text-lg">Order Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unit Size</span>
                      <span className="font-bold">{selectedSize.name}</span>
                    </div>
                    <div>
                      <Label className="text-sm">Billing Period</Label>
                      <Select value={billingType} onValueChange={setBillingType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly - ${selectedSize.monthly_price}/mo</SelectItem>
                          <SelectItem value="yearly">Yearly - ${selectedSize.yearly_price}/yr</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="pt-3 border-t flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-[#c41e3a]">${getPrice().toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Review & Checkout */}
        {step === 3 && selectedSize && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <button onClick={() => setStep(2)} className="text-[#c41e3a] hover:underline flex items-center gap-1">
                ← Back to your information
              </button>
            </div>

            <Card>
              <CardHeader className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] text-white">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Review Your Order
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Unit Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold mb-3">Storage Unit</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xl font-bold">{selectedSize.name}</p>
                      <p className="text-gray-600">{selectedSize.square_feet} sq ft • {billingType === 'yearly' ? 'Annual' : 'Monthly'} billing</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#c41e3a]">${getPrice().toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{billingType === 'yearly' ? 'per year' : 'per month'}</p>
                    </div>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-bold mb-3">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <p className="text-gray-600">Name:</p>
                    <p>{customer.first_name} {customer.last_name}</p>
                    <p className="text-gray-600">Email:</p>
                    <p>{customer.email}</p>
                    <p className="text-gray-600">Phone:</p>
                    <p>{customer.phone}</p>
                    <p className="text-gray-600">Address:</p>
                    <p>{customer.address}, {customer.city}, {customer.state} {customer.zip_code}</p>
                  </div>
                </div>

                {/* Facility Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-bold text-[#1e3a5f] mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Facility Location
                  </h3>
                  <p className="text-gray-700">7860 Eddins Road, Dothan, Alabama 36301</p>
                  <p className="text-sm text-gray-600 mt-2">
                    After payment, you'll receive your unit number and access code via email.
                  </p>
                </div>

                {/* Payment Button */}
                <Button 
                  onClick={handleCheckout} 
                  disabled={processing}
                  className="w-full h-14 text-lg bg-[#c41e3a] hover:bg-[#a01830]"
                  data-testid="pay-with-stripe-btn"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Redirecting to payment...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5 mr-2" />
                      Pay ${getPrice().toFixed(2)} with Stripe
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-gray-500">
                  Secure payment powered by Stripe. Your payment information is encrypted and secure.
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Location Info Section */}
      {step === 1 && (
        <section className="bg-white py-16 border-t">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-6">Visit Our Facility</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex items-start gap-4 text-left">
                  <MapPin className="w-6 h-6 text-[#c41e3a] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold">Address</h3>
                    <p className="text-gray-600">7860 Eddins Road<br />Dothan, Alabama 36301</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 text-left">
                  <Phone className="w-6 h-6 text-[#c41e3a] flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-bold">Contact</h3>
                    <p className="text-gray-600">Call us: (334) 555-0123<br />Open 24/7 for access</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default StorageRentalsPage;
