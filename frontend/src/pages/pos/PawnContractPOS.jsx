import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Search, Plus, Minus, Trash2, User, CreditCard, DollarSign,
  Loader2, CheckCircle, Package, Barcode, Receipt, Clock, FileText,
  Printer, X, AlertCircle, Camera, Upload, Edit, Eye, Calendar,
  Handshake, ShoppingBag, Wallet, ChevronRight, History, AlertTriangle, PenTool
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { toast } from '../../hooks/use-toast';
import ContractSigningModal from '../../components/ContractEsignModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Default interest rate and term
const DEFAULT_INTEREST_RATE = 20; // 20% monthly
const DEFAULT_LOAN_TERM = 30; // 30 days

// Item Categories
const ITEM_CATEGORIES = [
  'Electronics', 'Jewelry & Watches', 'Firearms', 'Tools', 'Musical Instruments',
  'Sporting Goods', 'Collectibles', 'Computers & Tablets', 'Gaming', 'Other'
];

const ITEM_CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor'];

// ============ CUSTOMER SEARCH COMPONENT ============
const CustomerSearch = ({ onSelectCustomer, selectedCustomer }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    first_name: '', last_name: '', phone: '', email: '',
    address: '', city: '', state: 'AL', zip_code: '',
    drivers_license: '', dl_state: 'AL', dl_expiration: '', date_of_birth: ''
  });

  const searchCustomers = useCallback(async () => {
    if (!searchQuery.trim()) {
      setCustomers([]);
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/pawn-contracts/customers/search`, {
        params: { q: searchQuery },
        headers: { Authorization: `Bearer ${token}` }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(searchCustomers, 300);
    return () => clearTimeout(timer);
  }, [searchCustomers]);

  const handleCreateCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.last_name || !newCustomer.drivers_license || !newCustomer.phone) {
      toast({ title: 'Error', description: 'First name, last name, phone, and driver\'s license are required', variant: 'destructive' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/pawn-contracts/customers`, newCustomer, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch the created customer
      const customerResponse = await axios.get(`${API}/pawn-contracts/customers/${response.data.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onSelectCustomer(customerResponse.data);
      setShowNewCustomerForm(false);
      setNewCustomer({
        first_name: '', last_name: '', phone: '', email: '',
        address: '', city: '', state: 'AL', zip_code: '',
        drivers_license: '', dl_state: 'AL', dl_expiration: '', date_of_birth: ''
      });
      toast({ title: 'Success', description: response.data.existing ? 'Existing customer found' : 'Customer created' });
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create customer', variant: 'destructive' });
    }
  };

  if (selectedCustomer) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white font-bold text-lg">
                {selectedCustomer.first_name?.[0]}{selectedCustomer.last_name?.[0]}
              </div>
              <div>
                <h3 className="font-semibold text-lg">{selectedCustomer.first_name} {selectedCustomer.last_name}</h3>
                <p className="text-sm text-gray-600">DL: {selectedCustomer.drivers_license}</p>
                <p className="text-sm text-gray-500">{selectedCustomer.phone}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant={selectedCustomer.active_contracts > 0 ? 'destructive' : 'secondary'}>
                {selectedCustomer.active_contracts || 0} Active
              </Badge>
              <p className="text-xs text-gray-500 mt-1">{selectedCustomer.total_contracts || 0} Total Contracts</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => onSelectCustomer(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, phone, or driver's license..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="customer-search-input"
          />
        </div>
        <Button onClick={() => setShowNewCustomerForm(true)} data-testid="new-customer-btn">
          <Plus className="w-4 h-4 mr-1" /> New Customer
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}

      {!loading && customers.length > 0 && (
        <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
          {customers.map((customer) => (
            <div
              key={customer.id}
              onClick={() => onSelectCustomer(customer)}
              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
              data-testid={`customer-result-${customer.id}`}
            >
              <div>
                <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                <p className="text-sm text-gray-500">DL: {customer.drivers_license} | {customer.phone}</p>
              </div>
              <Badge variant="outline">{customer.active_contracts || 0} Active</Badge>
            </div>
          ))}
        </div>
      )}

      {/* New Customer Dialog */}
      <Dialog open={showNewCustomerForm} onOpenChange={setShowNewCustomerForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Customer</DialogTitle>
            <DialogDescription>Enter customer information. Driver's license is required for contract transactions.</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={newCustomer.first_name}
                onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                data-testid="new-customer-first-name"
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={newCustomer.last_name}
                onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                data-testid="new-customer-last-name"
              />
            </div>
            <div>
              <Label>Driver's License # *</Label>
              <Input
                value={newCustomer.drivers_license}
                onChange={(e) => setNewCustomer({ ...newCustomer, drivers_license: e.target.value.toUpperCase() })}
                placeholder="e.g., 1234567"
                data-testid="new-customer-dl"
              />
            </div>
            <div>
              <Label>DL State</Label>
              <Select value={newCustomer.dl_state} onValueChange={(v) => setNewCustomer({ ...newCustomer, dl_state: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Label>Phone *</Label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="(334) 555-0123"
                data-testid="new-customer-phone"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Date of Birth</Label>
              <Input
                type="date"
                value={newCustomer.date_of_birth}
                onChange={(e) => setNewCustomer({ ...newCustomer, date_of_birth: e.target.value })}
              />
            </div>
            <div>
              <Label>DL Expiration</Label>
              <Input
                type="date"
                value={newCustomer.dl_expiration}
                onChange={(e) => setNewCustomer({ ...newCustomer, dl_expiration: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Address</Label>
              <Input
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={newCustomer.city}
                onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>State</Label>
                <Input
                  value={newCustomer.state}
                  onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                />
              </div>
              <div>
                <Label>ZIP</Label>
                <Input
                  value={newCustomer.zip_code}
                  onChange={(e) => setNewCustomer({ ...newCustomer, zip_code: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCustomerForm(false)}>Cancel</Button>
            <Button onClick={handleCreateCustomer} data-testid="save-new-customer-btn">
              <CheckCircle className="w-4 h-4 mr-1" /> Save Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ ITEM FORM COMPONENT ============
const ItemForm = ({ item, onChange, onRemove, index }) => {
  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 text-red-500 hover:text-red-700"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
      <CardContent className="p-4 pt-8">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <Label>Description *</Label>
            <Input
              value={item.description}
              onChange={(e) => onChange(index, 'description', e.target.value)}
              placeholder="e.g., 14K Gold Ring with Diamond"
              data-testid={`item-${index}-description`}
            />
          </div>
          <div>
            <Label>Category *</Label>
            <Select value={item.category} onValueChange={(v) => onChange(index, 'category', v)}>
              <SelectTrigger data-testid={`item-${index}-category`}><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                {ITEM_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Condition</Label>
            <Select value={item.condition} onValueChange={(v) => onChange(index, 'condition', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ITEM_CONDITIONS.map((cond) => (
                  <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Brand</Label>
            <Input
              value={item.brand}
              onChange={(e) => onChange(index, 'brand', e.target.value)}
              placeholder="e.g., Samsung, Fender"
            />
          </div>
          <div>
            <Label>Model</Label>
            <Input
              value={item.model}
              onChange={(e) => onChange(index, 'model', e.target.value)}
              placeholder="e.g., Galaxy S23"
            />
          </div>
          <div>
            <Label>Serial Number</Label>
            <Input
              value={item.serial_number}
              onChange={(e) => onChange(index, 'serial_number', e.target.value)}
              placeholder="If applicable"
              data-testid={`item-${index}-serial`}
            />
          </div>
          <div>
            <Label>Estimated Value ($)</Label>
            <Input
              type="number"
              value={item.estimated_value}
              onChange={(e) => onChange(index, 'estimated_value', parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              data-testid={`item-${index}-value`}
            />
          </div>
          <div className="col-span-2">
            <Label>Notes</Label>
            <Textarea
              value={item.notes}
              onChange={(e) => onChange(index, 'notes', e.target.value)}
              placeholder="Additional details, scratches, accessories included, etc."
              rows={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============ PAWN CONTRACT FORM ============
const PeptidesContractForm = ({ customer, onSuccess }) => {
  const [items, setItems] = useState([{
    description: '', category: '', brand: '', model: '',
    serial_number: '', condition: 'Good', color: '', notes: '',
    images: [], estimated_value: 0
  }]);
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState(DEFAULT_INTEREST_RATE);
  const [loanTerm, setLoanTerm] = useState(DEFAULT_LOAN_TERM);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [pawnSettings, setPeptidesSettings] = useState(null);
  const [categoryRates, setCategoryRates] = useState({});

  // Fetch peptides settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/pawn-settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPeptidesSettings(response.data);
        setInterestRate(response.data.default_interest_rate || DEFAULT_INTEREST_RATE);
        setLoanTerm(response.data.default_loan_term_days || DEFAULT_LOAN_TERM);
        
        // Build category rates lookup
        const rates = {};
        (response.data.category_rates || []).forEach(r => {
          rates[r.category.toLowerCase()] = r;
        });
        setCategoryRates(rates);
      } catch (error) {
        console.error('Failed to fetch peptides settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Update interest rate when first item's category changes
  useEffect(() => {
    if (items[0]?.category && pawnSettings) {
      const categoryKey = items[0].category.toLowerCase();
      if (categoryRates[categoryKey]) {
        setInterestRate(categoryRates[categoryKey].interest_rate);
        setLoanTerm(categoryRates[categoryKey].loan_term_days || DEFAULT_LOAN_TERM);
      } else {
        setInterestRate(pawnSettings.default_interest_rate || DEFAULT_INTEREST_RATE);
        setLoanTerm(pawnSettings.default_loan_term_days || DEFAULT_LOAN_TERM);
      }
    }
  }, [items[0]?.category, pawnSettings, categoryRates]);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      description: '', category: '', brand: '', model: '',
      serial_number: '', condition: 'Good', color: '', notes: '',
      images: [], estimated_value: 0
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calculatePayoff = () => {
    const principal = parseFloat(loanAmount) || 0;
    const rate = interestRate / 100;
    const interest = principal * rate;
    return {
      principal,
      interest: interest.toFixed(2),
      total: (principal + interest).toFixed(2)
    };
  };

  const handleSubmit = async () => {
    if (!customer) {
      toast({ title: 'Error', description: 'Please select a customer', variant: 'destructive' });
      return;
    }

    if (!loanAmount || parseFloat(loanAmount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid loan amount', variant: 'destructive' });
      return;
    }

    if (items.some(item => !item.description || !item.category)) {
      toast({ title: 'Error', description: 'All items need a description and category', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/pawn-contracts/pawn`, {
        customer_id: customer.id,
        items,
        loan_amount: parseFloat(loanAmount),
        interest_rate: interestRate,
        loan_term_days: loanTerm,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ title: 'Success', description: `Contract created: ${response.data.contract_number}` });
      onSuccess(response.data);
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create contract', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const payoff = calculatePayoff();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" /> Items to Contract ({items.length})
        </h3>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {items.map((item, index) => (
          <ItemForm
            key={index}
            item={item}
            index={index}
            onChange={handleItemChange}
            onRemove={() => removeItem(index)}
          />
        ))}
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Loan Terms
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Loan Amount ($) *</Label>
              <Input
                type="number"
                value={loanAmount}
                onChange={(e) => setLoanAmount(e.target.value)}
                placeholder="0.00"
                className="text-lg font-semibold"
                data-testid="loan-amount-input"
              />
            </div>
            <div>
              <Label>Interest Rate (%)</Label>
              <Select value={String(interestRate)} onValueChange={(v) => setInterestRate(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15% Monthly</SelectItem>
                  <SelectItem value="20">20% Monthly</SelectItem>
                  <SelectItem value="25">25% Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Loan Term</Label>
              <Select value={String(loanTerm)} onValueChange={(v) => setLoanTerm(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="60">60 Days</SelectItem>
                  <SelectItem value="90">90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 p-3 bg-white rounded-lg border">
            <div className="flex justify-between text-sm">
              <span>Principal:</span>
              <span>${payoff.principal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Interest ({interestRate}%):</span>
              <span>${payoff.interest}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t mt-2 pt-2">
              <span>Payoff Amount:</span>
              <span className="text-green-600">${payoff.total}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Due in {loanTerm} days. Interest accrues each {loanTerm}-day period.
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes for this contract..."
          rows={2}
        />
      </div>

      <Button
        className="w-full bg-[#6e2ea8] hover:bg-[#a01830] text-white py-6 text-lg"
        onClick={handleSubmit}
        disabled={loading || !customer || !loanAmount}
        data-testid="create-pawn-contract-btn"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Handshake className="w-5 h-5 mr-2" />}
        Create Contract - Pay ${loanAmount || '0.00'}
      </Button>
    </div>
  );
};

// ============ BUY CONTRACT FORM ============
const BuyContractForm = ({ customer, onSuccess }) => {
  const [items, setItems] = useState([{
    description: '', category: '', brand: '', model: '',
    serial_number: '', condition: 'Good', color: '', notes: '',
    images: [], estimated_value: 0
  }]);
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [addToInventory, setAddToInventory] = useState(true);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, {
      description: '', category: '', brand: '', model: '',
      serial_number: '', condition: 'Good', color: '', notes: '',
      images: [], estimated_value: 0
    }]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!customer) {
      toast({ title: 'Error', description: 'Please select a customer', variant: 'destructive' });
      return;
    }

    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid purchase amount', variant: 'destructive' });
      return;
    }

    if (items.some(item => !item.description || !item.category)) {
      toast({ title: 'Error', description: 'All items need a description and category', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/pawn-contracts/buy`, {
        customer_id: customer.id,
        items,
        purchase_amount: parseFloat(purchaseAmount),
        add_to_inventory: addToInventory,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ title: 'Success', description: `Buy contract created: ${response.data.contract_number}` });
      onSuccess(response.data);
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create contract', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" /> Items to Purchase ({items.length})
        </h3>
        <Button variant="outline" size="sm" onClick={addItem}>
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {items.map((item, index) => (
          <ItemForm
            key={index}
            item={item}
            index={index}
            onChange={handleItemChange}
            onRemove={() => removeItem(index)}
          />
        ))}
      </div>

      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Purchase Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Purchase Amount ($) *</Label>
              <Input
                type="number"
                value={purchaseAmount}
                onChange={(e) => setPurchaseAmount(e.target.value)}
                placeholder="Amount to pay customer"
                className="text-lg font-semibold"
                data-testid="purchase-amount-input"
              />
              <p className="text-xs text-gray-500 mt-1">Amount you're paying the customer</p>
            </div>
            <div>
              <Label>Add to Inventory</Label>
              <Select value={addToInventory ? 'yes' : 'no'} onValueChange={(v) => setAddToInventory(v === 'yes')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes - Add to store inventory</SelectItem>
                  <SelectItem value="no">No - Manual inventory later</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <Label>Notes</Label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes for this purchase..."
          rows={2}
        />
      </div>

      <Button
        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
        onClick={handleSubmit}
        disabled={loading || !customer || !purchaseAmount}
        data-testid="create-buy-contract-btn"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShoppingBag className="w-5 h-5 mr-2" />}
        Complete Purchase - Pay ${purchaseAmount || '0.00'}
      </Button>
    </div>
  );
};

// ============ PAYMENT FORM COMPONENT ============
const PaymentForm = ({ contract, onSuccess, onClose }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/pawn-contracts/payments`, {
        contract_id: contract.id,
        amount: parseFloat(amount),
        payment_method: paymentMethod,
        notes
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({ 
        title: response.data.fully_paid ? '🎉 Contract Paid Off!' : 'Payment Received',
        description: `Paid $${amount}. ${response.data.fully_paid ? 'Items can be released.' : `Remaining: $${response.data.new_balance}`}`
      });
      onSuccess(response.data);
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Payment failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make Payment</DialogTitle>
          <DialogDescription>Contract: {contract.contract_number}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between">
              <span>Principal:</span>
              <span>${contract.loan_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Interest Accrued:</span>
              <span>${contract.interest_accrued?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Amount Paid:</span>
              <span>-${contract.amount_paid?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t mt-2 pt-2">
              <span>Balance Due:</span>
              <span className="text-red-600">${contract.balance_due?.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <Label>Payment Amount ($)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="text-lg"
              data-testid="payment-amount-input"
            />
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => setAmount(contract.balance_due?.toFixed(2))}>
                Pay Full Balance
              </Button>
              <Button variant="outline" size="sm" onClick={() => setAmount((contract.loan_amount * 0.1).toFixed(2))}>
                10% Payment
              </Button>
            </div>
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} data-testid="submit-payment-btn">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CreditCard className="w-4 h-4 mr-1" />}
            Process Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============ CONTRACTS LIST COMPONENT ============
const ContractsList = ({ onMakePayment, onViewContract }) => {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');

  const fetchContracts = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/pawn-contracts/pawn`, {
        params: { status: filter === 'all' ? '' : filter },
        headers: { Authorization: `Bearer ${token}` }
      });
      setContracts(response.data);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const getDaysRemaining = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter contracts" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active Contracts</SelectItem>
            <SelectItem value="paid">Paid Off</SelectItem>
            <SelectItem value="defaulted">Defaulted</SelectItem>
            <SelectItem value="all">All Contracts</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchContracts}>
          <Loader2 className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : contracts.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No contracts found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract) => {
            const daysRemaining = getDaysRemaining(contract.due_date);
            const isOverdue = daysRemaining < 0;
            
            return (
              <Card 
                key={contract.id} 
                className={`${isOverdue && contract.status === 'active' ? 'border-red-300 bg-red-50' : ''}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-semibold">{contract.contract_number}</span>
                        <Badge variant={
                          contract.status === 'active' ? (isOverdue ? 'destructive' : 'default') :
                          contract.status === 'paid' ? 'success' : 'secondary'
                        }>
                          {contract.status === 'active' && isOverdue ? 'OVERDUE' : contract.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{contract.customer_name}</p>
                      <p className="text-xs text-gray-500">DL: {contract.customer_dl}</p>
                      <p className="text-sm mt-2">
                        {contract.items?.length || 0} item(s): {contract.items?.map(i => i.description).join(', ').slice(0, 50)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Loan: ${contract.loan_amount?.toFixed(2)}</p>
                      <p className="font-bold text-lg text-red-600">Due: ${contract.balance_due?.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {contract.status === 'active' && (
                          isOverdue 
                            ? <span className="text-red-600">{Math.abs(daysRemaining)} days overdue</span>
                            : <span>{daysRemaining} days left</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {contract.status === 'active' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t">
                      <Button size="sm" onClick={() => onMakePayment(contract)} data-testid={`pay-btn-${contract.id}`}>
                        <Wallet className="w-4 h-4 mr-1" /> Make Payment
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => onViewContract(contract)}>
                        <Eye className="w-4 h-4 mr-1" /> View Details
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ============ STATS COMPONENT ============
const PeptidesStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/pawn-contracts/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="grid grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardContent className="p-4 h-20 bg-gray-100"></CardContent>
        </Card>
      ))}
    </div>;
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Active Contracts</p>
          <p className="text-2xl font-bold">{stats?.active_contracts || 0}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-600">${stats?.total_outstanding?.toFixed(2) || '0.00'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">Today's Payments</p>
          <p className="text-2xl font-bold text-green-600">${stats?.today_payments?.toFixed(2) || '0.00'}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-gray-500">New Contracts Today</p>
          <p className="text-2xl font-bold">{stats?.today_new_contracts || 0}</p>
        </CardContent>
      </Card>
    </div>
  );
};

// ============ SUCCESS MODAL ============
const SuccessModal = ({ isOpen, onClose, result, type, onSignContract }) => {
  if (!isOpen || !result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-6 h-6" />
            {type === 'pawn' ? 'Contract Created' : 'Purchase Complete'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <p className="text-sm text-gray-600">Contract Number</p>
            <p className="text-2xl font-mono font-bold">{result.contract_number}</p>
            {result.ticket_number && (
              <>
                <p className="text-sm text-gray-600 mt-2">Ticket Number</p>
                <p className="text-xl font-mono">{result.ticket_number}</p>
              </>
            )}
          </div>

          {type === 'pawn' && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">Loan Amount</p>
                <p className="text-xl font-bold">${result.loan_amount?.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-sm text-gray-500">Payoff Amount</p>
                <p className="text-xl font-bold text-green-600">${result.payoff_amount?.toFixed(2)}</p>
              </div>
            </div>
          )}

          {type === 'pawn' && result.due_date && (
            <div className="p-3 bg-amber-50 rounded-lg text-center">
              <p className="text-sm text-amber-800">
                <Calendar className="w-4 h-4 inline mr-1" />
                Due Date: {new Date(result.due_date).toLocaleDateString()}
              </p>
            </div>
          )}

          {type === 'buy' && (
            <div className="p-3 bg-gray-50 rounded text-center">
              <p className="text-sm text-gray-500">Amount Paid to Customer</p>
              <p className="text-xl font-bold">${result.purchase_amount?.toFixed(2)}</p>
              {result.items_added > 0 && (
                <p className="text-sm text-green-600 mt-1">{result.items_added} items added to inventory</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {type === 'pawn' && (
            <Button 
              onClick={onSignContract} 
              className="bg-[#6e2ea8] hover:bg-[#a01830]"
              data-testid="sign-contract-btn"
            >
              <PenTool className="w-4 h-4 mr-1" /> E-Sign Contract
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-1" /> Print Only
          </Button>
          <Button variant="outline" onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============ MAIN COMPONENT ============
const PeptidesContractPOS = () => {
  const [activeTab, setActiveTab] = useState('pawn');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successResult, setSuccessResult] = useState(null);
  const [successType, setSuccessType] = useState('pawn');
  const [paymentContract, setPaymentContract] = useState(null);
  const [viewContract, setViewContract] = useState(null);
  const [showSigningModal, setShowSigningModal] = useState(false);
  const [contractToSign, setContractToSign] = useState(null);

  const handlePeptidesSuccess = (result) => {
    setSuccessResult(result);
    setSuccessType('pawn');
    setShowSuccess(true);
  };

  const handleBuySuccess = (result) => {
    setSuccessResult(result);
    setSuccessType('buy');
    setShowSuccess(true);
    setSelectedCustomer(null);
  };

  const handlePaymentSuccess = () => {
    setPaymentContract(null);
  };

  const handleSignContract = async () => {
    if (!successResult) return;
    
    // Fetch full contract details for signing
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/pawn-contracts/pawn/${successResult.contract_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContractToSign(response.data);
      setShowSigningModal(true);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load contract details', variant: 'destructive' });
    }
  };

  const handleSignComplete = (signatureData) => {
    toast({ title: '✅ Contract Signed', description: `Signature ID: ${signatureData.signature_id}` });
    setShowSigningModal(false);
    setContractToSign(null);
    setShowSuccess(false);
    setSuccessResult(null);
    setSelectedCustomer(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#6e2ea8] text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/cart" className="hover:bg-white/10 p-2 rounded">
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold">Contract POS</h1>
              <p className="text-sm text-white/80">Create loans, buy items, process payments</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {/* Stats */}
        <PeptidesStats />

        <div className="mt-6 grid grid-cols-3 gap-6">
          {/* Left Panel - Customer & Form */}
          <div className="col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" /> Customer
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CustomerSearch
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full rounded-none border-b">
                    <TabsTrigger value="pawn" className="flex-1 py-3" data-testid="pawn-tab">
                      <Handshake className="w-4 h-4 mr-2" /> Pledged Item
                    </TabsTrigger>
                    <TabsTrigger value="buy" className="flex-1 py-3" data-testid="buy-tab">
                      <ShoppingBag className="w-4 h-4 mr-2" /> Buy from Customer
                    </TabsTrigger>
                    <TabsTrigger value="payment" className="flex-1 py-3" data-testid="payment-tab">
                      <Wallet className="w-4 h-4 mr-2" /> Make Payment
                    </TabsTrigger>
                  </TabsList>

                  <div className="p-4">
                    <TabsContent value="pawn" className="mt-0">
                      <PeptidesContractForm customer={selectedCustomer} onSuccess={handlePeptidesSuccess} />
                    </TabsContent>

                    <TabsContent value="buy" className="mt-0">
                      <BuyContractForm customer={selectedCustomer} onSuccess={handleBuySuccess} />
                    </TabsContent>

                    <TabsContent value="payment" className="mt-0">
                      <ContractsList
                        onMakePayment={setPaymentContract}
                        onViewContract={setViewContract}
                      />
                    </TabsContent>
                  </div>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Quick Actions & Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('pawn')}>
                  <Handshake className="w-4 h-4 mr-2" /> New Contract
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('buy')}>
                  <ShoppingBag className="w-4 h-4 mr-2" /> Buy from Customer
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setActiveTab('payment')}>
                  <Wallet className="w-4 h-4 mr-2" /> Process Payment
                </Button>
                <Link to="/admin/cart/pos">
                  <Button variant="outline" className="w-full justify-start">
                    <Receipt className="w-4 h-4 mr-2" /> Sell Inventory (Retail POS)
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Terms</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Default Interest:</span>
                  <span className="font-medium">20% monthly</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Default Term:</span>
                  <span className="font-medium">30 days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Grace Period:</span>
                  <span className="font-medium">30 days</span>
                </div>
                <p className="text-xs text-gray-500 pt-2 border-t">
                  Items not redeemed within the loan period plus grace period become property of the store.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-800">ID Required</p>
                    <p className="text-sm text-amber-700">
                      Valid government-issued photo ID required for all pawn and buy transactions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={() => {
          setShowSuccess(false);
          setSuccessResult(null);
          setSelectedCustomer(null);
        }}
        result={successResult}
        type={successType}
        onSignContract={handleSignContract}
      />

      {/* Contract Signing Modal */}
      {showSigningModal && contractToSign && (
        <ContractSigningModal
          isOpen={showSigningModal}
          onClose={() => {
            setShowSigningModal(false);
            setContractToSign(null);
          }}
          contractType="pawn"
          contractId={contractToSign.id}
          contractNumber={contractToSign.contract_number}
          contractData={contractToSign}
          customerName={contractToSign.customer_name}
          onSignComplete={handleSignComplete}
        />
      )}

      {/* Payment Modal */}
      {paymentContract && (
        <PaymentForm
          contract={paymentContract}
          onSuccess={handlePaymentSuccess}
          onClose={() => setPaymentContract(null)}
        />
      )}
    </div>
  );
};

export default PeptidesContractPOS;
