import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, CreditCard, DollarSign, Warehouse, User, Search, CheckCircle,
  Loader2, Plus, Minus, Receipt, Printer, X, AlertCircle, Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Success Modal
const SuccessModal = ({ isOpen, onClose, rental, customer }) => {
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '');

  if (!isOpen || !rental) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Storage Rental Receipt - ${rental.unit_number}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { font-size: 16px; margin: 0; }
          .header p { font-size: 12px; margin: 5px 0; }
          .details { margin: 20px 0; }
          .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px; }
          .highlight { background: #f0f0f0; padding: 15px; text-align: center; margin: 15px 0; }
          .highlight .label { font-size: 12px; color: #666; }
          .highlight .value { font-size: 28px; font-weight: bold; letter-spacing: 3px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; border-top: 1px dashed #000; padding-top: 10px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>123Bots</h1>
          <p>7860 Eddins Road</p>
          <p>Dothan, Alabama 36301</p>
          <p>Tel: (334) 555-0123</p>
          <p style="margin-top: 10px;"><strong>STORAGE RENTAL RECEIPT</strong></p>
        </div>
        <div class="details">
          <div class="row"><span>Date:</span><span>${new Date().toLocaleString()}</span></div>
          <div class="row"><span>Unit Number:</span><span><strong>${rental.unit_number}</strong></span></div>
          <div class="row"><span>Customer:</span><span>${customer?.first_name} ${customer?.last_name}</span></div>
          <div class="row"><span>Amount Paid:</span><span><strong>$${rental.price?.toFixed(2)}</strong></span></div>
        </div>
        <div class="highlight">
          <div class="label">YOUR ACCESS CODE</div>
          <div class="value">${rental.access_code}</div>
        </div>
        <div class="footer">
          <p><strong>IMPORTANT:</strong> Save this code!</p>
          <p>You will need it to access the facility.</p>
          <p>24/7 Access Available</p>
          <p style="margin-top: 10px;">Thank you for choosing us!</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleEmailReceipt = async () => {
    if (!customerEmail || !customerEmail.includes('@')) {
      toast({ title: 'Error', description: 'Please enter a valid email address', variant: 'destructive' });
      return;
    }
    
    setEmailSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/storage-rentals/receipt/email`, {
        rental_id: rental.id,
        unit_number: rental.unit_number,
        access_code: rental.access_code,
        email: customerEmail,
        price: rental.price,
        customer_name: `${customer?.first_name} ${customer?.last_name}`
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailSent(true);
      toast({ title: 'Success', description: 'Receipt sent to ' + customerEmail });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send email receipt', variant: 'destructive' });
    }
    setEmailSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="success-modal">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Rental Created!</h2>
          <p className="text-gray-600 mb-6">The customer has been successfully assigned a storage unit.</p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Unit Number:</span>
              <span className="font-bold text-lg">{rental.unit_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Access Code:</span>
              <span className="font-mono text-2xl font-bold text-[#6e2ea8]">{rental.access_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-bold text-green-600">${rental.price?.toFixed(2)}</span>
            </div>
          </div>

          {/* Email Receipt Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <Label className="text-sm font-medium text-gray-700">Email Receipt To:</Label>
            <div className="flex gap-2 mt-2">
              <Input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="customer@email.com"
                className="flex-1"
                disabled={emailSent}
              />
              <Button 
                variant="outline" 
                onClick={handleEmailReceipt}
                disabled={emailSending || emailSent}
                className={emailSent ? 'bg-green-100 text-green-700' : ''}
              >
                {emailSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : emailSent ? (
                  <><CheckCircle className="w-4 h-4 mr-1" /> Sent</>
                ) : (
                  <><Mail className="w-4 h-4 mr-1" /> Send</>
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handlePrint} className="flex-1" data-testid="print-receipt-btn">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button onClick={onClose} className="flex-1 bg-[#6e2ea8]" data-testid="done-btn">
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PointOfSalePage = () => {
  const navigate = useNavigate();
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [billingType, setBillingType] = useState('monthly');
  const [showSuccess, setShowSuccess] = useState(false);
  const [completedRental, setCompletedRental] = useState(null);
  
  // Customer form
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

  useEffect(() => {
    fetchSizes();
  }, []);

  const fetchSizes = async () => {
    try {
      const response = await axios.get(`${API}/storage-rentals/sizes`);
      setSizes(response.data);
    } catch (error) {
      console.error('Error fetching sizes:', error);
      toast({ title: 'Error', description: 'Failed to load storage sizes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (field, value) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!selectedSize) {
      toast({ title: 'Error', description: 'Please select a storage unit size', variant: 'destructive' });
      return false;
    }
    if (!customer.first_name.trim() || !customer.last_name.trim()) {
      toast({ title: 'Error', description: 'Customer name is required', variant: 'destructive' });
      return false;
    }
    if (!customer.email.trim() || !customer.email.includes('@')) {
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

  const handleCheckout = async () => {
    if (!validateForm()) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/storage-rentals/pos/checkout`, {
        unit_size_id: selectedSize.id,
        customer: customer,
        billing_type: billingType,
        origin_url: BACKEND_URL
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setCompletedRental(response.data);
      setShowSuccess(true);
      toast({ title: 'Success', description: 'Rental created successfully!' });
    } catch (error) {
      console.error('Checkout error:', error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to process rental', 
        variant: 'destructive' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    setCompletedRental(null);
    setSelectedSize(null);
    setCustomer({
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
    // Refresh sizes to update availability
    fetchSizes();
  };

  const getPrice = () => {
    if (!selectedSize) return 0;
    return billingType === 'yearly' ? selectedSize.yearly_price : selectedSize.monthly_price;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1e3a5f] to-gray-900" data-testid="pos-page">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/storage" className="p-2 hover:bg-white/10 rounded-lg transition-colors" data-testid="back-to-storage-btn">
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <CreditCard className="w-8 h-8 text-[#6e2ea8]" />
                Storage POS
              </h1>
              <p className="text-white/60 text-sm">Point of Sale - In-Person Rentals</p>
            </div>
          </div>
          <img
            src="https://customer-assets.emergentagent.com/job_35efb418-d957-4303-979f-4e5863096b08/artifacts/hzi2b2xm_amino-chain-logo-final-1.png"
            alt="APS"
            className="h-12"
          />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Side - Unit Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unit Size Selection */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Warehouse className="w-5 h-5" />
                  Select Unit Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {sizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSize(size)}
                      disabled={size.available_units === 0}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        selectedSize?.id === size.id
                          ? 'border-[#6e2ea8] bg-[#6e2ea8]/20'
                          : size.available_units === 0
                          ? 'border-gray-600 bg-gray-800/50 opacity-50 cursor-not-allowed'
                          : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                      }`}
                      data-testid={`size-${size.id}`}
                    >
                      <div className="text-2xl font-bold text-white mb-1">{size.name}</div>
                      <div className="text-white/60 text-sm mb-2">{size.square_feet} sq ft</div>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {size.climate_controlled && (
                          <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">Climate</Badge>
                        )}
                        {size.drive_up_access && (
                          <Badge variant="outline" className="text-xs border-green-400 text-green-400">Drive-Up</Badge>
                        )}
                      </div>
                      <div className="text-lg font-bold text-white">${size.monthly_price}/mo</div>
                      <div className={`text-xs mt-1 ${size.available_units > 3 ? 'text-green-400' : size.available_units > 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {size.available_units} available
                      </div>
                    </button>
                  ))}
                </div>

                {sizes.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
                    <p className="text-white/60">No storage sizes configured yet.</p>
                    <Link to="/admin/storage">
                      <Button variant="outline" className="mt-4">
                        Configure Sizes
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Type */}
            {selectedSize && (
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Billing Period
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setBillingType('monthly')}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        billingType === 'monthly'
                          ? 'border-[#6e2ea8] bg-[#6e2ea8]/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                      data-testid="billing-monthly"
                    >
                      <div className="text-lg font-bold text-white">Monthly</div>
                      <div className="text-3xl font-bold text-white mt-2">
                        ${selectedSize.monthly_price.toFixed(2)}
                        <span className="text-sm font-normal text-white/60">/mo</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setBillingType('yearly')}
                      className={`p-4 rounded-xl border-2 transition-all relative overflow-hidden ${
                        billingType === 'yearly'
                          ? 'border-[#6e2ea8] bg-[#6e2ea8]/20'
                          : 'border-white/20 bg-white/5 hover:border-white/40'
                      }`}
                      data-testid="billing-yearly"
                    >
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-0.5 rounded-bl">
                        Save ${((selectedSize.monthly_price * 12) - selectedSize.yearly_price).toFixed(0)}
                      </div>
                      <div className="text-lg font-bold text-white">Yearly</div>
                      <div className="text-3xl font-bold text-white mt-2">
                        ${selectedSize.yearly_price.toFixed(2)}
                        <span className="text-sm font-normal text-white/60">/yr</span>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Customer Information */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80">First Name *</Label>
                    <Input
                      value={customer.first_name}
                      onChange={(e) => handleCustomerChange('first_name', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      placeholder="John"
                      data-testid="customer-first-name"
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">Last Name *</Label>
                    <Input
                      value={customer.last_name}
                      onChange={(e) => handleCustomerChange('last_name', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      placeholder="Doe"
                      data-testid="customer-last-name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-white/80">Email *</Label>
                    <Input
                      type="email"
                      value={customer.email}
                      onChange={(e) => handleCustomerChange('email', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      placeholder="john@example.com"
                      data-testid="customer-email"
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">Phone *</Label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => handleCustomerChange('phone', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      placeholder="(555) 555-5555"
                      data-testid="customer-phone"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/80">Street Address *</Label>
                  <Input
                    value={customer.address}
                    onChange={(e) => handleCustomerChange('address', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    placeholder="123 Main St"
                    data-testid="customer-address"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-white/80">City *</Label>
                    <Input
                      value={customer.city}
                      onChange={(e) => handleCustomerChange('city', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      placeholder="Dothan"
                      data-testid="customer-city"
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">State</Label>
                    <Select value={customer.state} onValueChange={(v) => handleCustomerChange('state', v)}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white" data-testid="customer-state">
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
                    <Label className="text-white/80">ZIP Code *</Label>
                    <Input
                      value={customer.zip_code}
                      onChange={(e) => handleCustomerChange('zip_code', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      placeholder="36301"
                      data-testid="customer-zip"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <Label className="text-white/80">Emergency Contact Name</Label>
                    <Input
                      value={customer.emergency_contact_name}
                      onChange={(e) => handleCustomerChange('emergency_contact_name', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <Label className="text-white/80">Emergency Contact Phone</Label>
                    <Input
                      value={customer.emergency_contact_phone}
                      onChange={(e) => handleCustomerChange('emergency_contact_phone', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                      placeholder="(555) 555-5556"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Order Summary */}
          <div className="lg:col-span-1">
            <Card className="bg-white sticky top-24 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {selectedSize ? (
                  <>
                    <div className="flex justify-between items-center pb-4 border-b">
                      <div>
                        <p className="font-bold text-lg">{selectedSize.name}</p>
                        <p className="text-sm text-gray-500">{selectedSize.square_feet} sq ft</p>
                      </div>
                      <Badge variant="outline" className="capitalize">{billingType}</Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Unit Price</span>
                        <span>${getPrice().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tax</span>
                        <span>$0.00</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t text-xl font-bold">
                      <span>Total Due</span>
                      <span className="text-[#6e2ea8]">${getPrice().toFixed(2)}</span>
                    </div>

                    <Button
                      onClick={handleCheckout}
                      disabled={processing}
                      className="w-full h-14 text-lg bg-[#6e2ea8] hover:bg-[#a01830]"
                      data-testid="complete-checkout-btn"
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Complete Rental
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      Payment collected in-person (Cash/Card)
                    </p>
                  </>
                ) : (
                  <div className="py-8 text-center text-gray-500">
                    <Warehouse className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Select a unit size to continue</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={handleCloseSuccess}
        rental={completedRental}
        customer={customer}
      />
    </div>
  );
};

export default PointOfSalePage;
