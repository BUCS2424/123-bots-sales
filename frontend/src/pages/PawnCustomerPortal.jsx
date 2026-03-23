import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Search, User, CreditCard, DollarSign, Loader2, CheckCircle,
  Package, Clock, Calendar, ArrowLeft, Eye, Wallet, FileText,
  AlertTriangle, ShieldCheck, Phone, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from '../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// ============ LOOKUP FORM ============
const LookupForm = ({ onSuccess }) => {
  const [driversLicense, setDriversLicense] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    
    if (!driversLicense || !lastName) {
      toast({ title: 'Error', description: 'Please enter both Driver\'s License and Last Name', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API}/pawn-contracts/portal/login`, {
        drivers_license: driversLicense,
        last_name: lastName
      });
      
      onSuccess(response.data);
    } catch (error) {
      toast({ 
        title: 'Not Found', 
        description: error.response?.data?.detail || 'No account found with this information. Please check your Driver\'s License number and Last Name.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="w-16 h-16 bg-[#c41e3a] rounded-full flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-white" />
        </div>
        <CardTitle>Find Your Items</CardTitle>
        <CardDescription>
          Enter your Driver's License number and Last Name to view your items and make payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <Label>Driver's License Number *</Label>
            <Input
              value={driversLicense}
              onChange={(e) => setDriversLicense(e.target.value.toUpperCase())}
              placeholder="Enter your DL number"
              className="text-lg"
              data-testid="portal-dl-input"
            />
          </div>
          <div>
            <Label>Last Name *</Label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Enter your last name"
              className="text-lg"
              data-testid="portal-lastname-input"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-[#c41e3a] hover:bg-[#a01830] py-6 text-lg"
            disabled={loading}
            data-testid="portal-lookup-btn"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
            Look Up My Items
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// ============ CUSTOMER DASHBOARD ============
const CustomerDashboard = ({ customer, onLogout }) => {
  const [selectedContract, setSelectedContract] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const activeContracts = customer.contracts?.filter(c => c.status === 'active') || [];
  const paidContracts = customer.contracts?.filter(c => c.status === 'paid') || [];
  const defaultedContracts = customer.contracts?.filter(c => c.status === 'defaulted') || [];

  const totalOwed = activeContracts.reduce((sum, c) => sum + (c.balance_due || 0), 0);

  const getDaysRemaining = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    return Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Welcome Header */}
      <Card className="bg-gradient-to-r from-[#c41e3a] to-[#8b1428] text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Welcome, {customer.first_name}!</h2>
              <p className="text-white/80">DL: {customer.drivers_license}</p>
            </div>
            <Button variant="outline" className="text-white border-white hover:bg-white/20" onClick={onLogout}>
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Active Contracts</p>
            <p className="text-3xl font-bold text-[#c41e3a]">{activeContracts.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Total Amount Owed</p>
            <p className="text-3xl font-bold text-red-600">${totalOwed.toFixed(2)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-gray-500">Items Redeemed</p>
            <p className="text-3xl font-bold text-green-600">{paidContracts.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Tabs */}
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="active">
            <TabsList className="w-full rounded-none border-b">
              <TabsTrigger value="active" className="flex-1">
                Active ({activeContracts.length})
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex-1">
                Paid ({paidContracts.length})
              </TabsTrigger>
              <TabsTrigger value="defaulted" className="flex-1">
                Defaulted ({defaultedContracts.length})
              </TabsTrigger>
            </TabsList>

            <div className="p-4">
              <TabsContent value="active" className="mt-0 space-y-3">
                {activeContracts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-400" />
                    <p>No active contracts!</p>
                  </div>
                ) : (
                  activeContracts.map((contract) => {
                    const daysRemaining = getDaysRemaining(contract.due_date);
                    const isOverdue = daysRemaining < 0;

                    return (
                      <Card 
                        key={contract.id} 
                        className={`${isOverdue ? 'border-red-300 bg-red-50' : 'border-amber-200'}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-semibold">{contract.contract_number}</span>
                                {isOverdue && (
                                  <Badge variant="destructive">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> OVERDUE
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">
                                Ticket: {contract.ticket_number}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Balance Due</p>
                              <p className="text-2xl font-bold text-red-600">${contract.balance_due?.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="border-t pt-3">
                            <p className="text-sm font-medium mb-2">Pledged Items:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {contract.items?.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-gray-400" />
                                  {item.description}
                                  {item.serial_number && <span className="text-xs text-gray-400">(S/N: {item.serial_number})</span>}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t">
                            <div className="text-sm">
                              <span className="text-gray-500">Due: </span>
                              <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
                                {new Date(contract.due_date).toLocaleDateString()}
                              </span>
                              <span className="text-gray-400 ml-2">
                                ({isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`})
                              </span>
                            </div>
                            <Button 
                              onClick={() => {
                                setSelectedContract(contract);
                                setShowPaymentModal(true);
                              }}
                              className="bg-[#c41e3a] hover:bg-[#a01830]"
                              data-testid={`pay-contract-${contract.id}`}
                            >
                              <CreditCard className="w-4 h-4 mr-1" /> Make Payment
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </TabsContent>

              <TabsContent value="paid" className="mt-0 space-y-3">
                {paidContracts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>No paid contracts yet</p>
                  </div>
                ) : (
                  paidContracts.map((contract) => (
                    <Card key={contract.id} className="bg-green-50 border-green-200">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono">{contract.contract_number}</span>
                              <Badge variant="success" className="bg-green-600">PAID</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {contract.items?.map(i => i.description).join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">Paid</p>
                            <p className="font-semibold text-green-600">${contract.amount_paid?.toFixed(2)}</p>
                            <p className="text-xs text-gray-400">
                              {contract.paid_date && new Date(contract.paid_date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="defaulted" className="mt-0 space-y-3">
                {defaultedContracts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-2 text-green-400" />
                    <p>No defaulted contracts</p>
                  </div>
                ) : (
                  defaultedContracts.map((contract) => (
                    <Card key={contract.id} className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-gray-500">{contract.contract_number}</span>
                              <Badge variant="secondary">FORFEITED</Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {contract.items?.map(i => i.description).join(', ')}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            Defaulted: {contract.default_date && new Date(contract.default_date).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Payment Modal */}
      {showPaymentModal && selectedContract && (
        <OnlinePaymentModal
          contract={selectedContract}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedContract(null);
          }}
          onSuccess={() => {
            // Refresh customer data
            window.location.reload();
          }}
        />
      )}
    </div>
  );
};

// ============ ONLINE PAYMENT MODAL ============
const OnlinePaymentModal = ({ contract, onClose, onSuccess }) => {
  const [amount, setAmount] = useState(contract.balance_due?.toFixed(2) || '');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/pawn-contracts/portal/payment`, {
        contract_id: contract.id,
        amount: parseFloat(amount),
        payment_method: 'online',
        notes: 'Online portal payment'
      });

      toast({ 
        title: 'Payment Successful!', 
        description: parseFloat(amount) >= contract.balance_due 
          ? 'Your items are ready for pickup!' 
          : `Payment of $${amount} received. Remaining balance: $${(contract.balance_due - parseFloat(amount)).toFixed(2)}`
      });
      onSuccess();
    } catch (error) {
      toast({ title: 'Payment Failed', description: error.response?.data?.detail || 'Please try again', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Make a Payment</DialogTitle>
          <DialogDescription>Contract: {contract.contract_number}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Original Loan:</span>
              <span>${contract.loan_amount?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Interest:</span>
              <span>${(contract.current_payoff - contract.loan_amount)?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Already Paid:</span>
              <span className="text-green-600">-${contract.amount_paid?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg border-t pt-2">
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
              className="text-xl text-center"
              data-testid="online-payment-amount"
            />
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setAmount(contract.balance_due?.toFixed(2))}
              >
                Pay Full Balance
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={() => setAmount((contract.balance_due / 2).toFixed(2))}
              >
                Pay Half
              </Button>
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg text-sm">
            <p className="font-medium text-amber-800 mb-1">
              <AlertTriangle className="w-4 h-4 inline mr-1" />
              Important
            </p>
            <p className="text-amber-700">
              Once paid in full, visit our store with your ID to pick up your items.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handlePayment} 
            disabled={loading}
            className="bg-[#c41e3a] hover:bg-[#a01830]"
            data-testid="submit-online-payment"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <CreditCard className="w-4 h-4 mr-1" />}
            Pay ${amount || '0.00'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ============ MAIN COMPONENT ============
const PeptidesCustomerPortal = () => {
  const [customer, setCustomer] = useState(null);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-[#c41e3a] text-white">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <img 
                src="https://i.ibb.co/JwNWWxp4/ap-logo.png" 
                alt="123Bots" 
                className="h-12"
              />
              <div>
                <h1 className="text-xl font-bold">Customer Portal</h1>
                <p className="text-sm text-white/80">View & Pay Your Items</p>
              </div>
            </Link>
            <Link to="/">
              <Button variant="outline" className="text-white border-white hover:bg-white/20">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-6">
        {customer ? (
          <CustomerDashboard 
            customer={customer} 
            onLogout={() => setCustomer(null)} 
          />
        ) : (
          <>
            <LookupForm onSuccess={setCustomer} />

            {/* Info Section */}
            <div className="mt-8 grid grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#c41e3a]" /> Visit Us
                  </h3>
                  <p className="text-gray-600">
                    123Bots<br />
                    7860 Eddins Road<br />
                    Dothan, Alabama 36301
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-[#c41e3a]" /> Contact Us
                  </h3>
                  <p className="text-gray-600">
                    Phone: (334) 555-0123<br />
                    Hours: Mon-Sat 9AM-6PM<br />
                    Sunday: Closed
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">How It Works</h3>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>Enter your Driver's License number and Last Name</li>
                <li>View your active contracts and items</li>
                <li>Make payments online or visit us in store</li>
                <li>Once paid in full, bring your ID to pick up your items</li>
              </ol>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 bg-gray-800 text-white py-6">
        <div className="max-w-4xl mx-auto px-6 text-center text-sm">
          <p>© {new Date().getFullYear()} 123Bots. All rights reserved.</p>
          <p className="text-gray-400 mt-1">
            Secure payments powered by Stripe. Your information is protected.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PeptidesCustomerPortal;
