import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Search, Plus, Minus, Trash2, User, CreditCard, DollarSign,
  Loader2, CheckCircle, Package, MapPin, Barcode, ShoppingCart, Receipt,
  Printer, X, AlertCircle, Tag, Warehouse, Clock, RefreshCw, Mail, Smartphone, Wallet,
  Truck, Phone, UserSearch
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { toast } from '../../hooks/use-toast';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const TAX_RATE = 0.10; // 10% tax

// Success Modal Component
const SuccessModal = ({ isOpen, onClose, receipt, customer, cart, paymentMethod }) => {
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [customerEmail, setCustomerEmail] = useState(customer?.email || '');

  const isAwaitingPayment = paymentMethod === 'cashapp' || paymentMethod === 'venmo';

  if (!isOpen || !receipt) return null;

  const handlePrint = () => {
    // Create a printable receipt
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receipt.receipt_number || receipt.order_number}</title>
        <style>
          body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h1 { font-size: 18px; margin: 0; }
          .header p { font-size: 12px; margin: 5px 0; }
          .items { border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .item { display: flex; justify-content: space-between; font-size: 12px; margin: 5px 0; }
          .totals { font-size: 14px; }
          .totals .row { display: flex; justify-content: space-between; margin: 5px 0; }
          .totals .total { font-weight: bold; font-size: 16px; border-top: 2px solid #000; padding-top: 5px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          .payment-pending { background: #fff3cd; padding: 10px; margin: 10px 0; text-align: center; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>123Bots</h1>
          <p>7860 Eddins Road</p>
          <p>Dothan, Alabama 36301</p>
          <p>Tel: (334) 555-0123</p>
        </div>
        <div style="text-align: center; margin: 10px 0;">
          <p><strong>${isAwaitingPayment ? 'Order' : 'Receipt'} #:</strong> ${receipt.receipt_number || receipt.order_number}</p>
          <p>${new Date().toLocaleString()}</p>
        </div>
        ${isAwaitingPayment ? `
          <div class="payment-pending">
            <strong>PAYMENT PENDING</strong><br/>
            Pay via ${paymentMethod === 'cashapp' ? 'CashApp' : 'Venmo'}<br/>
            Include order # in payment note
          </div>
        ` : ''}
        <div class="items">
          ${cart?.map(item => `
            <div class="item">
              <span>${item.name} x${item.quantity}</span>
              <span>$${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('') || ''}
        </div>
        <div class="totals">
          <div class="row"><span>Subtotal:</span><span>$${(receipt.total / 1.1).toFixed(2)}</span></div>
          <div class="row"><span>Tax (10%):</span><span>$${(receipt.total - receipt.total / 1.1).toFixed(2)}</span></div>
          <div class="row total"><span>TOTAL ${isAwaitingPayment ? 'DUE' : ''}:</span><span>$${receipt.total?.toFixed(2)}</span></div>
          ${receipt.change_due > 0 ? `
            <div class="row"><span>Cash Received:</span><span>$${(receipt.total + receipt.change_due).toFixed(2)}</span></div>
            <div class="row"><span>Change:</span><span>$${receipt.change_due?.toFixed(2)}</span></div>
          ` : ''}
        </div>
        <div class="footer">
          <p>Thank you for your business!</p>
          <p>All sales final. No refunds.</p>
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
      await axios.post(`${API}/pawn-pos/receipt/email`, {
        receipt_number: receipt.receipt_number || receipt.order_number,
        transaction_id: receipt.transaction_id || receipt.id,
        email: customerEmail,
        total: receipt.total,
        items_count: receipt.items_count || cart?.length,
        payment_method: paymentMethod,
        is_awaiting_payment: isAwaitingPayment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailSent(true);
      toast({ title: 'Success', description: isAwaitingPayment ? 'Payment instructions sent to ' + customerEmail : 'Receipt sent to ' + customerEmail });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send email', variant: 'destructive' });
    }
    setEmailSending(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" data-testid="success-modal">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-8 text-center">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isAwaitingPayment 
              ? paymentMethod === 'cashapp' ? 'bg-green-100' : 'bg-blue-100'
              : 'bg-green-100'
          }`}>
            {isAwaitingPayment ? (
              <Clock className={`w-12 h-12 ${paymentMethod === 'cashapp' ? 'text-green-600' : 'text-[#6e2ea8]'}`} />
            ) : (
              <CheckCircle className="w-12 h-12 text-green-600" />
            )}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {isAwaitingPayment ? 'Order Created!' : 'Sale Complete!'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isAwaitingPayment 
              ? `Awaiting ${paymentMethod === 'cashapp' ? 'CashApp' : 'Venmo'} payment.`
              : 'Transaction processed successfully.'}
          </p>
          
          {/* Awaiting Payment Banner */}
          {isAwaitingPayment && (
            <div className={`p-4 rounded-lg mb-4 ${
              paymentMethod === 'cashapp' ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                {paymentMethod === 'cashapp' ? (
                  <DollarSign className="w-5 h-5 text-green-600" />
                ) : (
                  <span className="text-[#6e2ea8] font-bold text-lg">V</span>
                )}
                <span className={`font-semibold ${paymentMethod === 'cashapp' ? 'text-green-700' : 'text-blue-700'}`}>
                  {paymentMethod === 'cashapp' ? 'CashApp' : 'Venmo'} Payment Pending
                </span>
              </div>
              <p className={`text-sm ${paymentMethod === 'cashapp' ? 'text-green-600' : 'text-[#6e2ea8]'}`}>
                Customer will receive payment instructions via email.
                Order ships once payment is confirmed.
              </p>
            </div>
          )}
          
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">{isAwaitingPayment ? 'Order' : 'Receipt'} #:</span>
              <span className="font-mono font-bold">{receipt.receipt_number || receipt.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Items:</span>
              <span className="font-bold">{receipt.items_count || cart?.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment:</span>
              <span className={`font-bold ${
                paymentMethod === 'cashapp' ? 'text-green-600' 
                : paymentMethod === 'venmo' ? 'text-[#6e2ea8]'
                : paymentMethod === 'card' ? 'text-purple-600'
                : 'text-gray-700'
              }`}>
                {paymentMethod === 'cashapp' ? 'CashApp' 
                  : paymentMethod === 'venmo' ? 'Venmo'
                  : paymentMethod === 'card' ? 'Card'
                  : 'Cash'}
              </span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-600">{isAwaitingPayment ? 'Total Due' : 'Total'}:</span>
              <span className={`font-bold ${isAwaitingPayment ? 'text-orange-600' : 'text-green-600'}`}>
                ${receipt.total?.toFixed(2)}
              </span>
            </div>
            {receipt.change_due > 0 && (
              <div className="flex justify-between text-lg pt-2 border-t">
                <span className="text-gray-600">Change Due:</span>
                <span className="font-bold text-purple-600">${receipt.change_due?.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Email Receipt Section */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <Label className="text-sm font-medium text-gray-700">
              {isAwaitingPayment ? 'Send Payment Instructions To:' : 'Email Receipt To:'}
            </Label>
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
            <Button onClick={onClose} className="flex-1 bg-purple-600 hover:bg-purple-700" data-testid="new-sale-btn">
              New Sale
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Location Modal
const LocationModal = ({ isOpen, onClose, product, onSave }) => {
  const [location, setLocation] = useState({
    aisle: product?.warehouse_location?.aisle || '',
    shelf: product?.warehouse_location?.shelf || '',
    bin: product?.warehouse_location?.bin || '',
    notes: product?.warehouse_location?.notes || ''
  });
  const [saving, setSaving] = useState(false);

  if (!isOpen || !product) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/pawn-pos/products/${product.id}/location`, location, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Success', description: 'Location updated' });
      onSave(location);
      onClose();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update location', variant: 'destructive' });
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Set Warehouse Location</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">{product.name}</p>
          
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Aisle</Label>
                <Input 
                  value={location.aisle}
                  onChange={(e) => setLocation({...location, aisle: e.target.value})}
                  placeholder="A1"
                />
              </div>
              <div>
                <Label>Shelf</Label>
                <Input 
                  value={location.shelf}
                  onChange={(e) => setLocation({...location, shelf: e.target.value})}
                  placeholder="S2"
                />
              </div>
              <div>
                <Label>Bin</Label>
                <Input 
                  value={location.bin}
                  onChange={(e) => setLocation({...location, bin: e.target.value})}
                  placeholder="B3"
                />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input 
                value={location.notes}
                onChange={(e) => setLocation({...location, notes: e.target.value})}
                placeholder="Top shelf, back corner"
              />
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1 bg-purple-600 hover:bg-purple-700">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Location'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Custom Item Modal
const CustomItemModal = ({ isOpen, onClose, onAdd }) => {
  const [item, setItem] = useState({
    name: '',
    price: '',
    sku: '',
    quantity: 1
  });

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!item.name || !item.price) {
      toast({ title: 'Error', description: 'Name and price are required', variant: 'destructive' });
      return;
    }
    onAdd({
      ...item,
      price: parseFloat(item.price),
      is_custom: true
    });
    setItem({ name: '', price: '', sku: '', quantity: 1 });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Add Custom Item</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <Label>Item Name *</Label>
              <Input 
                value={item.name}
                onChange={(e) => setItem({...item, name: e.target.value})}
                placeholder="Enter item name"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price *</Label>
                <Input 
                  type="number"
                  step="0.01"
                  value={item.price}
                  onChange={(e) => setItem({...item, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>SKU (optional)</Label>
                <Input 
                  value={item.sku}
                  onChange={(e) => setItem({...item, sku: e.target.value})}
                  placeholder="SKU-XXXX"
                />
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={handleAdd} className="flex-1 bg-purple-600 hover:bg-purple-700">Add to Cart</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PeptidesPOSPage = () => {
  const { logoUrl, siteName } = useSiteSettings();
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashReceived, setCashReceived] = useState('');
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);
  
  // Customer state
  const [customer, setCustomer] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'AL',
    zip_code: '',
    id_type: '',
    id_number: ''
  });
  
  // Existing customers for dropdown
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  
  // Shipping state for phone orders
  const [isPhoneOrder, setIsPhoneOrder] = useState(false);
  const [shippingCost, setShippingCost] = useState('');
  
  // Recurring order state
  const [isRecurringOrder, setIsRecurringOrder] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState(30);

  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchCategories();
    fetchStats();
    fetchPaymentSettings();
    fetchExistingCustomers();
    // Focus search on load
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchProducts();
      } else if (searchQuery.length === 0) {
        setSearchResults([]);
      }
    }, 300);
    return () => clearTimeout(delaySearch);
  }, [searchQuery, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/pawn-pos/categories`);
      setCategories(['All', ...response.data]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/pawn-pos/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchPaymentSettings = async () => {
    try {
      const response = await axios.get(`${API}/payments/settings/cashapp-venmo/public`);
      setPaymentSettings(response.data);
    } catch (error) {
      console.error('Error fetching payment settings:', error);
    }
  };

  const fetchExistingCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExistingCustomers(response.data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
    setLoadingCustomers(false);
  };

  const handleSelectExistingCustomer = (customerId) => {
    setSelectedCustomerId(customerId);
    if (customerId === 'new') {
      // Clear form for new customer
      setCustomer({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: 'AL',
        zip_code: '',
        id_type: '',
        id_number: ''
      });
      return;
    }
    
    const selected = existingCustomers.find(c => c.id === customerId);
    if (selected) {
      setCustomer({
        first_name: selected.name?.split(' ')[0] || '',
        last_name: selected.name?.split(' ').slice(1).join(' ') || '',
        email: selected.email || '',
        phone: selected.phone || '',
        address: selected.address || '',
        city: selected.city || '',
        state: selected.state || 'AL',
        zip_code: selected.zip_code || '',
        id_type: '',
        id_number: ''
      });
    }
  };

  const searchProducts = async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedCategory !== 'All') params.append('category', selectedCategory);
      
      const response = await axios.get(`${API}/pawn-pos/products/search?${params}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching products:', error);
    }
    setSearching(false);
  };

  const addToCart = (product) => {
    const existing = cart.find(item => item.product_id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.product_id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        product_id: product.id,
        name: product.name,
        sku: product.sku || '',
        price: product.price,
        quantity: 1,
        discount: 0,
        warehouse_location: product.warehouse_location,
        is_custom: false
      }]);
    }
    toast({ title: 'Added to cart', description: product.name });
  };

  const addCustomItem = (item) => {
    setCart([...cart, {
      product_id: null,
      name: item.name,
      sku: item.sku || '',
      price: item.price,
      quantity: item.quantity || 1,
      discount: 0,
      warehouse_location: null,
      is_custom: true
    }]);
  };

  const updateCartItem = (index, field, value) => {
    setCart(cart.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeFromCart = (index) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity) - item.discount, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * TAX_RATE;
  };

  const calculateShipping = () => {
    return isPhoneOrder ? (parseFloat(shippingCost) || 0) : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax() + calculateShipping();
  };

  const calculateChange = () => {
    const cash = parseFloat(cashReceived) || 0;
    return Math.max(0, cash - calculateTotal());
  };

  const handleCustomerChange = (field, value) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
  };

  const validateCheckout = () => {
    if (cart.length === 0) {
      toast({ title: 'Error', description: 'Cart is empty', variant: 'destructive' });
      return false;
    }
    if (!customer.first_name || !customer.last_name) {
      toast({ title: 'Error', description: 'Customer name is required', variant: 'destructive' });
      return false;
    }
    if (!customer.phone) {
      toast({ title: 'Error', description: 'Customer phone is required', variant: 'destructive' });
      return false;
    }
    // Require email for CashApp/Venmo orders
    if ((paymentMethod === 'cashapp' || paymentMethod === 'venmo') && !customer.email) {
      toast({ title: 'Error', description: 'Customer email is required for CashApp/Venmo payments', variant: 'destructive' });
      return false;
    }
    // Require address for phone orders with shipping
    if (isPhoneOrder && (!customer.address || !customer.city || !customer.zip_code)) {
      toast({ title: 'Error', description: 'Shipping address is required for phone orders', variant: 'destructive' });
      return false;
    }
    if (paymentMethod === 'cash' && parseFloat(cashReceived) < calculateTotal()) {
      toast({ title: 'Error', description: 'Insufficient cash received', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateCheckout()) return;
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      
      // For CashApp/Venmo, create an order via the payments API
      if (paymentMethod === 'cashapp' || paymentMethod === 'venmo') {
        const orderData = {
          items: cart.map(item => ({
            product_id: item.product_id || 'pos-item',
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          shipping: {
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email,
            phone: customer.phone,
            address1: customer.address || 'In-Store Pickup',
            city: customer.city || 'Dothan',
            state: customer.state || 'AL',
            zipCode: customer.zip_code || '36301',
            country: 'US'
          },
          billing: {
            firstName: customer.first_name,
            lastName: customer.last_name,
            email: customer.email,
            phone: customer.phone,
            address1: customer.address || 'In-Store Pickup',
            city: customer.city || 'Dothan',
            state: customer.state || 'AL',
            zipCode: customer.zip_code || '36301',
            country: 'US'
          },
          subtotal: calculateSubtotal(),
          shipping_cost: calculateShipping(),
          tax: calculateTax(),
          total: calculateTotal(),
          customer_email: customer.email,
          customer_name: `${customer.first_name} ${customer.last_name}`,
          payment_method: paymentMethod,
          source: isPhoneOrder ? 'phone_order' : 'pos',
          is_recurring: isRecurringOrder,
          recurring_interval_days: isRecurringOrder ? recurringInterval : null
        };
        
        const response = await axios.post(`${API}/payments/orders`, orderData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setReceipt({
            ...response.data.order,
            items_count: cart.length,
            change_due: 0
          });
          setShowSuccess(true);
          fetchStats();
        } else {
          toast({
            title: 'Error',
            description: response.data.message || 'Order creation failed',
            variant: 'destructive'
          });
        }
      } else {
        // Regular POS checkout for cash/card
        const response = await axios.post(`${API}/pawn-pos/checkout`, {
          items: cart,
          customer: customer,
          payment_method: paymentMethod,
          subtotal: calculateSubtotal(),
          tax_rate: TAX_RATE,
          tax_amount: calculateTax(),
          shipping_cost: calculateShipping(),
          discount_total: cart.reduce((sum, item) => sum + item.discount, 0),
          total: calculateTotal(),
          cash_received: paymentMethod === 'cash' ? parseFloat(cashReceived) : null,
          change_due: paymentMethod === 'cash' ? calculateChange() : null,
          is_phone_order: isPhoneOrder
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setReceipt(response.data);
        setShowSuccess(true);
        fetchStats();
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Checkout failed', 
        variant: 'destructive' 
      });
    }
    setProcessing(false);
  };

  const handleNewSale = () => {
    setShowSuccess(false);
    setReceipt(null);
    setCart([]);
    setCustomer({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: 'AL',
      zip_code: '',
      id_type: '',
      id_number: ''
    });
    setCashReceived('');
    setSearchQuery('');
    setSearchResults([]);
    searchInputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#1e3a5f] to-gray-900" data-testid="pawn-pos-page">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-sm border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin" className="p-2 hover:bg-white/10 rounded-lg transition-colors" data-testid="back-btn">
              <ArrowLeft className="w-6 h-6 text-white" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-3">
                <ShoppingCart className="w-7 h-7 text-purple-500" />
                POS
              </h1>
              <p className="text-white/60 text-sm">Point of Sale</p>
            </div>
          </div>
          
          {/* Stats */}
          {stats && (
            <div className="hidden lg:flex items-center gap-6">
              <div className="text-center">
                <p className="text-white/60 text-xs">Today's Sales</p>
                <p className="text-white font-bold">${stats.today_revenue?.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-white/60 text-xs">Transactions</p>
                <p className="text-white font-bold">{stats.today_transactions}</p>
              </div>
              <div className="h-8 w-px bg-white/20"></div>
            </div>
          )}
          
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={siteName || 'Site logo'}
              className="h-10"
              data-testid="pawn-pos-header-logo"
            />
          ) : (
            <span className="text-white font-semibold" data-testid="pawn-pos-header-logo-fallback">{siteName || '123Bots'}</span>
          )}
        </div>
      </header>

      <div className="max-w-[1920px] mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Side - Product Search & Results */}
          <div className="lg:col-span-5 space-y-4">
            {/* Search Bar */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <Input
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name, SKU, UPC, or brand..."
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      data-testid="product-search"
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowCustomModal(true)}
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Custom Item
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={searchProducts}
                    className="text-white border-white/30 hover:bg-white/10"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            <Card className="bg-white/10 backdrop-blur border-white/20 max-h-[calc(100vh-280px)] overflow-hidden">
              <CardHeader className="py-3 px-4 border-b border-white/10">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Products {searchResults.length > 0 && `(${searchResults.length})`}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 overflow-y-auto max-h-[calc(100vh-350px)]">
                {searching ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-white/50" />
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-8 text-white/50">
                    <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Search for products to add to cart</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all group"
                        onClick={() => addToCart(product)}
                        data-testid={`product-${product.id}`}
                      >
                        <div className="w-14 h-14 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-full h-full p-3 text-white/30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate">{product.name}</p>
                          <div className="flex items-center gap-2 text-xs text-white/60">
                            {product.sku && <span>{product.sku}</span>}
                            {product.category && <Badge variant="outline" className="text-xs py-0 border-white/30 text-white/60">{product.category}</Badge>}
                          </div>
                          {product.warehouse_location?.aisle && (
                            <div className="flex items-center gap-1 text-xs text-blue-400 mt-1">
                              <MapPin className="w-3 h-3" />
                              {product.warehouse_location.aisle}-{product.warehouse_location.shelf}-{product.warehouse_location.bin}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-white font-bold">${product.price?.toFixed(2)}</p>
                          <p className="text-xs text-white/50">Qty: {product.quantity || 0}</p>
                        </div>
                        <Button 
                          size="sm" 
                          className="opacity-0 group-hover:opacity-100 bg-purple-600 hover:bg-purple-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                            setShowLocationModal(true);
                          }}
                        >
                          <MapPin className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle - Cart */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader className="py-3 px-4 border-b border-white/10">
                <CardTitle className="text-white text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Cart ({cart.length} items)
                  </span>
                  {cart.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setCart([])}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      Clear All
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2 max-h-[300px] overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-white/50">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>Cart is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium truncate text-sm">{item.name}</p>
                          <p className="text-xs text-white/50">${item.price.toFixed(2)} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateCartItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                            className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-white w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateCartItem(index, 'quantity', item.quantity + 1)}
                            className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right w-20">
                          <p className="text-white font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(index)}
                          className="p-1.5 hover:bg-red-500/20 rounded text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader className="py-3 px-4 border-b border-white/10">
                <CardTitle className="text-white text-sm flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Information
                  </span>
                  {/* Phone Order Toggle */}
                  <button
                    onClick={() => setIsPhoneOrder(!isPhoneOrder)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isPhoneOrder 
                        ? 'bg-amber-500 text-white' 
                        : 'bg-white/10 text-white/60 hover:bg-white/20'
                    }`}
                  >
                    <Phone className="w-3 h-3" />
                    Phone Order
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {/* Existing Customer Dropdown */}
                <div>
                  <Label className="text-white/70 text-xs flex items-center gap-1">
                    <UserSearch className="w-3 h-3" />
                    Select Existing Customer
                  </Label>
                  <Select value={selectedCustomerId} onValueChange={handleSelectExistingCustomer}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white h-9">
                      <SelectValue placeholder={loadingCustomers ? "Loading..." : "New Customer"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">+ New Customer</SelectItem>
                      {existingCustomers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} - {c.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70 text-xs">First Name *</Label>
                    <Input
                      value={customer.first_name}
                      onChange={(e) => handleCustomerChange('first_name', e.target.value)}
                      className="bg-white/10 border-white/20 text-white h-9"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs">Last Name *</Label>
                    <Input
                      value={customer.last_name}
                      onChange={(e) => handleCustomerChange('last_name', e.target.value)}
                      className="bg-white/10 border-white/20 text-white h-9"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-white/70 text-xs">Phone *</Label>
                    <Input
                      value={customer.phone}
                      onChange={(e) => handleCustomerChange('phone', e.target.value)}
                      className="bg-white/10 border-white/20 text-white h-9"
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  <div>
                    <Label className="text-white/70 text-xs">Email</Label>
                    <Input
                      type="email"
                      value={customer.email}
                      onChange={(e) => handleCustomerChange('email', e.target.value)}
                      className="bg-white/10 border-white/20 text-white h-9"
                      placeholder="john@email.com"
                    />
                  </div>
                </div>

                {/* Shipping Address - Only show for phone orders */}
                {isPhoneOrder && (
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
                      <Truck className="w-4 h-4" />
                      Shipping Address
                    </div>
                    <div>
                      <Label className="text-white/70 text-xs">Street Address *</Label>
                      <Input
                        value={customer.address}
                        onChange={(e) => handleCustomerChange('address', e.target.value)}
                        className="bg-white/10 border-white/20 text-white h-9"
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-white/70 text-xs">City *</Label>
                        <Input
                          value={customer.city}
                          onChange={(e) => handleCustomerChange('city', e.target.value)}
                          className="bg-white/10 border-white/20 text-white h-9"
                          placeholder="Dothan"
                        />
                      </div>
                      <div>
                        <Label className="text-white/70 text-xs">State</Label>
                        <Select value={customer.state} onValueChange={(v) => handleCustomerChange('state', v)}>
                          <SelectTrigger className="bg-white/10 border-white/20 text-white h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="AL">AL</SelectItem>
                            <SelectItem value="FL">FL</SelectItem>
                            <SelectItem value="GA">GA</SelectItem>
                            <SelectItem value="MS">MS</SelectItem>
                            <SelectItem value="TN">TN</SelectItem>
                            <SelectItem value="LA">LA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-white/70 text-xs">ZIP *</Label>
                        <Input
                          value={customer.zip_code}
                          onChange={(e) => handleCustomerChange('zip_code', e.target.value)}
                          className="bg-white/10 border-white/20 text-white h-9"
                          placeholder="36301"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* ID Info - Only show for in-store */}
                {!isPhoneOrder && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white/70 text-xs">ID Type</Label>
                      <Select value={customer.id_type} onValueChange={(v) => handleCustomerChange('id_type', v)}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white h-9">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="drivers_license">Driver's License</SelectItem>
                          <SelectItem value="state_id">State ID</SelectItem>
                          <SelectItem value="passport">Passport</SelectItem>
                          <SelectItem value="military_id">Military ID</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-white/70 text-xs">ID Number</Label>
                      <Input
                        value={customer.id_number}
                        onChange={(e) => handleCustomerChange('id_number', e.target.value)}
                        className="bg-white/10 border-white/20 text-white h-9"
                        placeholder="ID #"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side - Payment & Totals */}
          <div className="lg:col-span-3">
            <Card className="bg-white sticky top-20 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-t-lg py-4">
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="w-5 h-5" />
                  Order Total
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                {/* Totals */}
                <div className="space-y-2 pb-4 border-b">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${calculateSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                    <span>${calculateTax().toFixed(2)}</span>
                  </div>
                  {/* Shipping Line - Only for phone orders */}
                  {isPhoneOrder && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Shipping
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={shippingCost}
                          onChange={(e) => setShippingCost(e.target.value)}
                          placeholder="0.00"
                          className="w-20 h-7 text-sm text-right p-1"
                        />
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between text-xl font-bold pt-2">
                    <span>Total</span>
                    <span className="text-purple-600">${calculateTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('cash')}
                      className={`flex items-center justify-center gap-2 ${paymentMethod === 'cash' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                      data-testid="payment-cash"
                    >
                      <DollarSign className="w-4 h-4" />
                      Cash
                    </Button>
                    <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      onClick={() => setPaymentMethod('card')}
                      className={`flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                      data-testid="payment-card"
                    >
                      <CreditCard className="w-4 h-4" />
                      Card
                    </Button>
                    {paymentSettings?.is_enabled && paymentSettings?.cashapp_available && (
                      <Button
                        variant={paymentMethod === 'cashapp' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('cashapp')}
                        className={`flex items-center justify-center gap-2 ${paymentMethod === 'cashapp' ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
                        data-testid="payment-cashapp"
                      >
                        <DollarSign className="w-4 h-4" />
                        CashApp
                      </Button>
                    )}
                    {paymentSettings?.is_enabled && paymentSettings?.venmo_available && (
                      <Button
                        variant={paymentMethod === 'venmo' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('venmo')}
                        className={`flex items-center justify-center gap-2 ${paymentMethod === 'venmo' ? 'bg-[#6e2ea8] hover:bg-[#5a2589]' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}`}
                        data-testid="payment-venmo"
                      >
                        <span className="font-bold">V</span>
                        Venmo
                      </Button>
                    )}
                  </div>
                </div>

                {/* CashApp/Venmo Info */}
                {(paymentMethod === 'cashapp' || paymentMethod === 'venmo') && (
                  <div className={`p-3 rounded-lg border ${
                    paymentMethod === 'cashapp' 
                      ? 'bg-green-50 border-green-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-2">
                      <Smartphone className={`w-4 h-4 mt-0.5 ${paymentMethod === 'cashapp' ? 'text-green-600' : 'text-[#6e2ea8]'}`} />
                      <div className={`text-xs ${paymentMethod === 'cashapp' ? 'text-green-700' : 'text-blue-700'}`}>
                        <p className="font-medium">Requires customer email</p>
                        <p>Order will be created with "Awaiting Payment" status. Customer receives payment instructions via email.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Cash Input */}
                {paymentMethod === 'cash' && (
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm">Cash Received</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        placeholder="0.00"
                        className="text-lg font-bold text-center"
                      />
                    </div>

                {/* Recurring Order Toggle */}
                <div className="p-3 rounded-lg border border-purple-200 bg-purple-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-purple-600" />
                      <Label className="text-sm font-medium text-purple-800">Set Up Auto-Reorder</Label>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isRecurringOrder}
                        onChange={(e) => setIsRecurringOrder(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                  {isRecurringOrder && (
                    <div className="mt-2">
                      <Label className="text-xs text-purple-700">Invoice every:</Label>
                      <select
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(parseInt(e.target.value))}
                        className="w-full mt-1 p-2 text-sm border border-purple-200 rounded-lg bg-white focus:ring-2 focus:ring-purple-500"
                      >
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                      </select>
                    </div>
                  )}
                </div>
                    {parseFloat(cashReceived) >= calculateTotal() && (
                      <div className="flex justify-between text-lg font-bold text-green-600 bg-green-50 p-3 rounded-lg">
                        <span>Change Due</span>
                        <span>${calculateChange().toFixed(2)}</span>
                      </div>
                    )}
                    {/* Quick Cash Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                      {[20, 50, 100, calculateTotal()].map((amount) => (
                        <Button
                          key={amount}
                          variant="outline"
                          size="sm"
                          onClick={() => setCashReceived(amount.toFixed(2))}
                          className="text-xs"
                        >
                          ${amount === calculateTotal() ? 'Exact' : amount}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Complete Sale Button */}
                <Button
                  onClick={handleCheckout}
                  disabled={processing || cart.length === 0}
                  className={`w-full h-14 text-lg ${
                    paymentMethod === 'cashapp' 
                      ? 'bg-green-600 hover:bg-green-700'
                      : paymentMethod === 'venmo'
                      ? 'bg-[#6e2ea8] hover:bg-[#5a2589]'
                      : 'bg-purple-600 hover:bg-purple-700'
                  }`}
                  data-testid="complete-sale-btn"
                >
                  {processing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : paymentMethod === 'cashapp' || paymentMethod === 'venmo' ? (
                    <>
                      <Clock className="w-5 h-5 mr-2" />
                      Create Order (Pending Payment)
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Complete Sale
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={handleNewSale}
        receipt={receipt}
        customer={customer}
        cart={cart}
        paymentMethod={paymentMethod}
      />
      
      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        product={selectedProduct}
        onSave={(loc) => {
          // Update product in search results
          setSearchResults(prev => prev.map(p => 
            p.id === selectedProduct.id 
              ? { ...p, warehouse_location: loc }
              : p
          ));
        }}
      />
      
      <CustomItemModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onAdd={addCustomItem}
      />
    </div>
  );
};

export default PeptidesPOSPage;
