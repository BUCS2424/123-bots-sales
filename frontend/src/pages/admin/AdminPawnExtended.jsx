import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  DollarSign, FileText, Plus, Edit, Trash2, Search,
  Loader2, CreditCard, Car, FileCheck, Package, Clock, Printer,
  Calculator, AlertTriangle, CheckCircle, Save, X, Briefcase,
  Layers, Shield, Receipt, Banknote, PiggyBank, Users, Eye
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Switch } from '../../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminPeptidesExtended = ({ initialTab = 'loans' }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Loans State (Payday & Title)
  const [loans, setLoans] = useState([]);
  const [loanFilter, setLoanFilter] = useState('all');
  
  // ATF Holds State
  const [atfHolds, setAtfHolds] = useState([]);
  
  // Check Cashing State
  const [checkTransactions, setCheckTransactions] = useState([]);
  
  // Layaways State
  const [layaways, setLayaways] = useState([]);
  
  // LEADS Reports State
  const [leadsReports, setLeadsReports] = useState([]);
  const [isGenerateReportOpen, setIsGenerateReportOpen] = useState(false);
  const [reportDates, setReportDates] = useState({ start_date: '', end_date: '' });
  
  // Resale/Buy State
  const [resalePurchases, setResalePurchases] = useState([]);
  
  // Dialogs
  const [isPaydayDialogOpen, setIsPaydayDialogOpen] = useState(false);
  const [isTitleDialogOpen, setIsTitleDialogOpen] = useState(false);
  const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false);
  const [isLayawayDialogOpen, setIsLayawayDialogOpen] = useState(false);
  const [isATFDialogOpen, setIsATFDialogOpen] = useState(false);
  
  // Customer search
  const [customerSearch, setCustomerSearch] = useState('');
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  // Payday Loan Form
  const [paydayForm, setPaydayForm] = useState({
    customer_id: '', loan_amount: '', pay_date: '',
    employer_name: '', employer_phone: '', bank_name: '',
    bank_account: '', check_number: '', notes: ''
  });
  
  // Title Loan Form
  const [titleForm, setTitleForm] = useState({
    customer_id: '', loan_amount: '', vehicle_make: '',
    vehicle_model: '', vehicle_year: '', vehicle_vin: '',
    vehicle_color: '', vehicle_mileage: '', title_number: '',
    lien_holder: '', loan_term_days: 30, notes: ''
  });
  
  // Check Cashing Form
  const [checkForm, setCheckForm] = useState({
    customer_id: '', check_type: 'payroll', check_amount: '',
    check_maker: '', check_number: '', check_date: '',
    bank_name: '', notes: ''
  });
  
  // Layaway Form
  const [layawayForm, setLayawayForm] = useState({
    customer_id: '', items: [], total_price: '',
    down_payment: '', payment_schedule: 'weekly',
    number_of_payments: 4, notes: ''
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [loansRes, atfRes, checksRes, layawaysRes, leadsRes, resaleRes] = await Promise.all([
        axios.get(`${API}/pawn-extended/loans`).catch(() => ({ data: [] })),
        axios.get(`${API}/pawn-extended/atf-holds`).catch(() => ({ data: [] })),
        axios.get(`${API}/pawn-extended/check-cashing`).catch(() => ({ data: [] })),
        axios.get(`${API}/pawn-extended/layaways`).catch(() => ({ data: [] })),
        axios.get(`${API}/pawn-extended/leads-reports`).catch(() => ({ data: [] })),
        axios.get(`${API}/pawn-extended/resale`).catch(() => ({ data: [] }))
      ]);
      
      setLoans(loansRes.data || []);
      setAtfHolds(atfRes.data || []);
      setCheckTransactions(checksRes.data || []);
      setLayaways(layawaysRes.data || []);
      setLeadsReports(leadsRes.data || []);
      setResalePurchases(resaleRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const searchCustomers = async (query) => {
    if (!query || query.length < 2) {
      setCustomers([]);
      return;
    }
    try {
      const res = await axios.get(`${API}/pawn/customers/search?q=${query}`);
      setCustomers(res.data || []);
    } catch (error) {
      console.error('Customer search failed:', error);
    }
  };

  const selectCustomer = (customer, formSetter) => {
    setSelectedCustomer(customer);
    formSetter(prev => ({ ...prev, customer_id: customer.id }));
    setCustomers([]);
    setCustomerSearch('');
  };

  // ============ PAYDAY LOAN HANDLERS ============
  
  const handleCreatePaydayLoan = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/pawn-extended/loans/payday`, {
        ...paydayForm,
        loan_amount: parseFloat(paydayForm.loan_amount)
      });
      toast({ title: 'Success', description: 'Payday loan created' });
      setIsPaydayDialogOpen(false);
      fetchData();
      resetPaydayForm();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create loan', variant: 'destructive' });
    }
  };

  const resetPaydayForm = () => {
    setPaydayForm({
      customer_id: '', loan_amount: '', pay_date: '',
      employer_name: '', employer_phone: '', bank_name: '',
      bank_account: '', check_number: '', notes: ''
    });
    setSelectedCustomer(null);
  };

  // ============ TITLE LOAN HANDLERS ============
  
  const handleCreateTitleLoan = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/pawn-extended/loans/title`, {
        ...titleForm,
        loan_amount: parseFloat(titleForm.loan_amount),
        vehicle_year: parseInt(titleForm.vehicle_year),
        vehicle_mileage: titleForm.vehicle_mileage ? parseInt(titleForm.vehicle_mileage) : null,
        loan_term_days: parseInt(titleForm.loan_term_days)
      });
      toast({ title: 'Success', description: 'Title loan created' });
      setIsTitleDialogOpen(false);
      fetchData();
      resetTitleForm();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create loan', variant: 'destructive' });
    }
  };

  const resetTitleForm = () => {
    setTitleForm({
      customer_id: '', loan_amount: '', vehicle_make: '',
      vehicle_model: '', vehicle_year: '', vehicle_vin: '',
      vehicle_color: '', vehicle_mileage: '', title_number: '',
      lien_holder: '', loan_term_days: 30, notes: ''
    });
    setSelectedCustomer(null);
  };

  // ============ CHECK CASHING HANDLERS ============
  
  const handleCashCheck = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/pawn-extended/check-cashing`, {
        ...checkForm,
        check_amount: parseFloat(checkForm.check_amount)
      });
      toast({ title: 'Success', description: 'Check cashed successfully' });
      setIsCheckDialogOpen(false);
      fetchData();
      resetCheckForm();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to cash check', variant: 'destructive' });
    }
  };

  const resetCheckForm = () => {
    setCheckForm({
      customer_id: '', check_type: 'payroll', check_amount: '',
      check_maker: '', check_number: '', check_date: '',
      bank_name: '', notes: ''
    });
    setSelectedCustomer(null);
  };

  // ============ LAYAWAY HANDLERS ============
  
  const handleCreateLayaway = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/pawn-extended/layaways`, {
        ...layawayForm,
        total_price: parseFloat(layawayForm.total_price),
        down_payment: parseFloat(layawayForm.down_payment),
        number_of_payments: parseInt(layawayForm.number_of_payments),
        items: [{ description: 'Item', price: parseFloat(layawayForm.total_price) }]
      });
      toast({ title: 'Success', description: 'Layaway created' });
      setIsLayawayDialogOpen(false);
      fetchData();
      resetLayawayForm();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create layaway', variant: 'destructive' });
    }
  };

  const resetLayawayForm = () => {
    setLayawayForm({
      customer_id: '', items: [], total_price: '',
      down_payment: '', payment_schedule: 'weekly',
      number_of_payments: 4, notes: ''
    });
    setSelectedCustomer(null);
  };

  // ============ ATF HOLD HANDLERS ============
  
  const handleReleaseATFHold = async (holdId) => {
    try {
      await axios.put(`${API}/pawn-extended/atf-holds/${holdId}/release`, null, {
        params: { released_by: 'Admin' }
      });
      toast({ title: 'Success', description: 'ATF hold released' });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to release hold', variant: 'destructive' });
    }
  };

  // ============ LEADS REPORT HANDLERS ============
  
  const handleGenerateLEADSReport = async () => {
    try {
      const res = await axios.get(`${API}/pawn-extended/leads-reports/generate`, {
        params: { start_date: reportDates.start_date, end_date: reportDates.end_date }
      });
      
      // Create the report
      await axios.post(`${API}/pawn-extended/leads-reports`, {
        report_date: reportDates.start_date,
        report_type: 'manual',
        transactions: res.data.transactions,
        submitted_by: 'Admin'
      });
      
      toast({ title: 'Success', description: `LEADS report generated with ${res.data.transaction_count} transactions` });
      setIsGenerateReportOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate report', variant: 'destructive' });
    }
  };

  const filteredLoans = loanFilter === 'all' 
    ? loans 
    : loans.filter(l => l.loan_type === loanFilter);

  const checkTypes = [
    { value: 'payroll', label: 'Payroll Check' },
    { value: 'personal', label: 'Personal Check' },
    { value: 'government', label: 'Government Check' },
    { value: 'money_order', label: 'Money Order' },
    { value: 'cashiers', label: "Cashier's Check" }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Services</h1>
          <p className="text-gray-600">Manage loans, check cashing, layaways, and more</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 w-full gap-1">
          <TabsTrigger value="loans" className="text-xs">
            <Banknote className="w-3 h-3 mr-1" />
            Loans
          </TabsTrigger>
          <TabsTrigger value="checks" className="text-xs">
            <FileCheck className="w-3 h-3 mr-1" />
            Checks
          </TabsTrigger>
          <TabsTrigger value="layaways" className="text-xs">
            <PiggyBank className="w-3 h-3 mr-1" />
            Layaways
          </TabsTrigger>
          <TabsTrigger value="atf" className="text-xs">
            <Shield className="w-3 h-3 mr-1" />
            ATF Holds
          </TabsTrigger>
          <TabsTrigger value="leads" className="text-xs">
            <FileText className="w-3 h-3 mr-1" />
            LEADS
          </TabsTrigger>
          <TabsTrigger value="resale" className="text-xs">
            <DollarSign className="w-3 h-3 mr-1" />
            Resale
          </TabsTrigger>
        </TabsList>

        {/* ============ LOANS TAB ============ */}
        <TabsContent value="loans" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Payday & Title Loans</CardTitle>
                  <CardDescription>Manage payday advances and auto title loans</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    className="bg-amber-600 hover:bg-amber-700"
                    onClick={() => { resetPaydayForm(); setIsPaydayDialogOpen(true); }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Payday Loan
                  </Button>
                  <Button 
                    className="bg-[rgb(37, 99, 235)] hover:bg-[rgb(29, 78, 216)]"
                    onClick={() => { resetTitleForm(); setIsTitleDialogOpen(true); }}
                  >
                    <Car className="w-4 h-4 mr-2" />
                    Title Loan
                  </Button>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  variant={loanFilter === 'all' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setLoanFilter('all')}
                >
                  All
                </Button>
                <Button 
                  variant={loanFilter === 'payday' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setLoanFilter('payday')}
                >
                  Payday
                </Button>
                <Button 
                  variant={loanFilter === 'title' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setLoanFilter('title')}
                >
                  Title
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredLoans.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Banknote className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No loans found. Create a payday or title loan to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan #</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Total Due</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLoans.map((loan) => (
                      <TableRow key={loan.id}>
                        <TableCell className="font-mono text-sm">{loan.loan_number}</TableCell>
                        <TableCell>
                          <Badge className={loan.loan_type === 'payday' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}>
                            {loan.loan_type === 'payday' ? 'Payday' : 'Title'}
                          </Badge>
                        </TableCell>
                        <TableCell>{loan.customer_name}</TableCell>
                        <TableCell>${loan.loan_amount?.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">${loan.total_due?.toFixed(2)}</TableCell>
                        <TableCell>{loan.pay_date || loan.due_date}</TableCell>
                        <TableCell>
                          <Badge className={
                            loan.status === 'active' ? 'bg-green-100 text-green-800' :
                            loan.status === 'paid_off' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {loan.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ CHECK CASHING TAB ============ */}
        <TabsContent value="checks" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Check Cashing</CardTitle>
                  <CardDescription>Process check cashing transactions</CardDescription>
                </div>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => { resetCheckForm(); setIsCheckDialogOpen(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Cash Check
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {checkTransactions.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No check cashing transactions yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Check Amount</TableHead>
                      <TableHead>Fee</TableHead>
                      <TableHead>Cash Given</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-sm">{tx.transaction_number}</TableCell>
                        <TableCell>{tx.customer_name}</TableCell>
                        <TableCell className="capitalize">{tx.check_type}</TableCell>
                        <TableCell>${tx.check_amount?.toFixed(2)}</TableCell>
                        <TableCell className="text-red-600">${tx.fee_amount?.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold text-green-600">${tx.cash_given?.toFixed(2)}</TableCell>
                        <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ LAYAWAYS TAB ============ */}
        <TabsContent value="layaways" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Layaways</CardTitle>
                  <CardDescription>Manage customer layaway plans</CardDescription>
                </div>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => { resetLayawayForm(); setIsLayawayDialogOpen(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Layaway
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {layaways.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <PiggyBank className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No active layaways.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Layaway #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Paid</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Next Payment</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {layaways.map((lay) => (
                      <TableRow key={lay.id}>
                        <TableCell className="font-mono text-sm">{lay.layaway_number}</TableCell>
                        <TableCell>{lay.customer_name}</TableCell>
                        <TableCell>${lay.total_price?.toFixed(2)}</TableCell>
                        <TableCell className="text-green-600">${lay.amount_paid?.toFixed(2)}</TableCell>
                        <TableCell className="font-semibold">${lay.balance_due?.toFixed(2)}</TableCell>
                        <TableCell>
                          {lay.next_payment_date}
                          <span className="text-xs text-gray-500 block">${lay.payment_amount?.toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge className={
                            lay.status === 'active' ? 'bg-green-100 text-green-800' :
                            lay.status === 'paid_off' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {lay.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            Payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ ATF HOLDS TAB ============ */}
        <TabsContent value="atf" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ATF Holds</CardTitle>
              <CardDescription>Firearms waiting period holds (required by federal law)</CardDescription>
            </CardHeader>
            <CardContent>
              {atfHolds.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No active ATF holds.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hold #</TableHead>
                      <TableHead>Firearm</TableHead>
                      <TableHead>Serial</TableHead>
                      <TableHead>Hold Start</TableHead>
                      <TableHead>Hold End</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {atfHolds.map((hold) => (
                      <TableRow key={hold.id}>
                        <TableCell className="font-mono text-sm">{hold.hold_number}</TableCell>
                        <TableCell>
                          {hold.firearm_make} {hold.firearm_model}
                          <span className="text-xs text-gray-500 block">{hold.firearm_caliber}</span>
                        </TableCell>
                        <TableCell className="font-mono">{hold.serial_number}</TableCell>
                        <TableCell>{hold.hold_start_date}</TableCell>
                        <TableCell>{hold.hold_end_date}</TableCell>
                        <TableCell>
                          <Badge className={
                            hold.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            hold.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }>
                            {hold.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {hold.status === 'pending' && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleReleaseATFHold(hold.id)}
                            >
                              Release
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ LEADS TAB ============ */}
        <TabsContent value="leads" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>LEADS Reporting</CardTitle>
                  <CardDescription>Law Enforcement Automated Data System - manual reporting</CardDescription>
                </div>
                <Button 
                  className="bg-amber-600 hover:bg-amber-700"
                  onClick={() => setIsGenerateReportOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {leadsReports.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No LEADS reports generated yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Report #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leadsReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-mono text-sm">{report.report_number}</TableCell>
                        <TableCell>{report.report_date}</TableCell>
                        <TableCell className="capitalize">{report.report_type}</TableCell>
                        <TableCell>{report.transaction_count}</TableCell>
                        <TableCell>
                          <Badge className={
                            report.status === 'submitted' ? 'bg-green-100 text-green-800' :
                            report.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100'
                          }>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{report.submitted_at ? new Date(report.submitted_at).toLocaleDateString() : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ RESALE TAB ============ */}
        <TabsContent value="resale" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Buy Outright / Resale</CardTitle>
              <CardDescription>Direct purchases from customers for resale</CardDescription>
            </CardHeader>
            <CardContent>
              {resalePurchases.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No resale purchases yet. Use the POS to buy items outright.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount Paid</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Added to Inventory</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resalePurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell className="font-mono text-sm">{purchase.transaction_number}</TableCell>
                        <TableCell>{purchase.customer_name}</TableCell>
                        <TableCell className="font-semibold">${purchase.total_purchase_amount?.toFixed(2)}</TableCell>
                        <TableCell>{purchase.items?.length || 0}</TableCell>
                        <TableCell>
                          {purchase.added_to_inventory ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <X className="w-4 h-4 text-gray-400" />
                          )}
                        </TableCell>
                        <TableCell>{new Date(purchase.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ============ PAYDAY LOAN DIALOG ============ */}
      <Dialog open={isPaydayDialogOpen} onOpenChange={setIsPaydayDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Payday Loan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePaydayLoan} className="space-y-4">
            {/* Customer Search */}
            <div className="space-y-2">
              <Label>Customer *</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div>
                    <p className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                    <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                    placeholder="Search by name, phone, or ID..."
                  />
                  {customers.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {customers.map((c) => (
                        <div 
                          key={c.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => selectCustomer(c, setPaydayForm)}
                        >
                          <p className="font-medium">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-gray-500">{c.phone} | {c.drivers_license}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loan Amount *</Label>
                <Input
                  type="number"
                  value={paydayForm.loan_amount}
                  onChange={(e) => setPaydayForm({ ...paydayForm, loan_amount: e.target.value })}
                  placeholder="500.00"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Pay Date *</Label>
                <Input
                  type="date"
                  value={paydayForm.pay_date}
                  onChange={(e) => setPaydayForm({ ...paydayForm, pay_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Employer Name</Label>
                <Input
                  value={paydayForm.employer_name}
                  onChange={(e) => setPaydayForm({ ...paydayForm, employer_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Employer Phone</Label>
                <Input
                  value={paydayForm.employer_phone}
                  onChange={(e) => setPaydayForm({ ...paydayForm, employer_phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={paydayForm.bank_name}
                  onChange={(e) => setPaydayForm({ ...paydayForm, bank_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Check #</Label>
                <Input
                  value={paydayForm.check_number}
                  onChange={(e) => setPaydayForm({ ...paydayForm, check_number: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={paydayForm.notes}
                onChange={(e) => setPaydayForm({ ...paydayForm, notes: e.target.value })}
                rows={2}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsPaydayDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={!selectedCustomer}>
                Create Loan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ TITLE LOAN DIALOG ============ */}
      <Dialog open={isTitleDialogOpen} onOpenChange={setIsTitleDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Title Loan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateTitleLoan} className="space-y-4">
            {/* Customer Search */}
            <div className="space-y-2">
              <Label>Customer *</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div>
                    <p className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                    <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                    placeholder="Search by name, phone, or ID..."
                  />
                  {customers.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {customers.map((c) => (
                        <div 
                          key={c.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => selectCustomer(c, setTitleForm)}
                        >
                          <p className="font-medium">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-gray-500">{c.phone} | {c.drivers_license}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loan Amount *</Label>
                <Input
                  type="number"
                  value={titleForm.loan_amount}
                  onChange={(e) => setTitleForm({ ...titleForm, loan_amount: e.target.value })}
                  placeholder="2000.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Loan Term (Days)</Label>
                <Input
                  type="number"
                  value={titleForm.loan_term_days}
                  onChange={(e) => setTitleForm({ ...titleForm, loan_term_days: e.target.value })}
                />
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <Label className="text-base font-semibold">Vehicle Information</Label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Make *</Label>
                <Input
                  value={titleForm.vehicle_make}
                  onChange={(e) => setTitleForm({ ...titleForm, vehicle_make: e.target.value })}
                  placeholder="Ford"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Model *</Label>
                <Input
                  value={titleForm.vehicle_model}
                  onChange={(e) => setTitleForm({ ...titleForm, vehicle_model: e.target.value })}
                  placeholder="F-150"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Year *</Label>
                <Input
                  type="number"
                  value={titleForm.vehicle_year}
                  onChange={(e) => setTitleForm({ ...titleForm, vehicle_year: e.target.value })}
                  placeholder="2020"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>VIN *</Label>
                <Input
                  value={titleForm.vehicle_vin}
                  onChange={(e) => setTitleForm({ ...titleForm, vehicle_vin: e.target.value })}
                  placeholder="1FTFW1E..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <Input
                  value={titleForm.vehicle_color}
                  onChange={(e) => setTitleForm({ ...titleForm, vehicle_color: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Mileage</Label>
                <Input
                  type="number"
                  value={titleForm.vehicle_mileage}
                  onChange={(e) => setTitleForm({ ...titleForm, vehicle_mileage: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Title Number *</Label>
                <Input
                  value={titleForm.title_number}
                  onChange={(e) => setTitleForm({ ...titleForm, title_number: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Current Lien Holder</Label>
                <Input
                  value={titleForm.lien_holder}
                  onChange={(e) => setTitleForm({ ...titleForm, lien_holder: e.target.value })}
                  placeholder="None (or bank name)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsTitleDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[rgb(37, 99, 235)] hover:bg-[rgb(29, 78, 216)]" disabled={!selectedCustomer}>
                Create Title Loan
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ CHECK CASHING DIALOG ============ */}
      <Dialog open={isCheckDialogOpen} onOpenChange={setIsCheckDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Cash a Check</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCashCheck} className="space-y-4">
            {/* Customer Search */}
            <div className="space-y-2">
              <Label>Customer *</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div>
                    <p className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                    <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                    placeholder="Search customer..."
                  />
                  {customers.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {customers.map((c) => (
                        <div 
                          key={c.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => selectCustomer(c, setCheckForm)}
                        >
                          <p className="font-medium">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-gray-500">{c.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check Type *</Label>
                <select
                  value={checkForm.check_type}
                  onChange={(e) => setCheckForm({ ...checkForm, check_type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                >
                  {checkTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Check Amount *</Label>
                <Input
                  type="number"
                  value={checkForm.check_amount}
                  onChange={(e) => setCheckForm({ ...checkForm, check_amount: e.target.value })}
                  placeholder="500.00"
                  step="0.01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Check Maker *</Label>
                <Input
                  value={checkForm.check_maker}
                  onChange={(e) => setCheckForm({ ...checkForm, check_maker: e.target.value })}
                  placeholder="Company or person name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Check Number</Label>
                <Input
                  value={checkForm.check_number}
                  onChange={(e) => setCheckForm({ ...checkForm, check_number: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Check Date *</Label>
                <Input
                  type="date"
                  value={checkForm.check_date}
                  onChange={(e) => setCheckForm({ ...checkForm, check_date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Bank Name</Label>
                <Input
                  value={checkForm.bank_name}
                  onChange={(e) => setCheckForm({ ...checkForm, bank_name: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCheckDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={!selectedCustomer}>
                Cash Check
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ LAYAWAY DIALOG ============ */}
      <Dialog open={isLayawayDialogOpen} onOpenChange={setIsLayawayDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Layaway</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateLayaway} className="space-y-4">
            {/* Customer Search */}
            <div className="space-y-2">
              <Label>Customer *</Label>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div>
                    <p className="font-medium">{selectedCustomer.first_name} {selectedCustomer.last_name}</p>
                    <p className="text-xs text-gray-500">{selectedCustomer.phone}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Input
                    value={customerSearch}
                    onChange={(e) => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                    placeholder="Search customer..."
                  />
                  {customers.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-40 overflow-y-auto">
                      {customers.map((c) => (
                        <div 
                          key={c.id}
                          className="p-2 hover:bg-gray-50 cursor-pointer"
                          onClick={() => selectCustomer(c, setLayawayForm)}
                        >
                          <p className="font-medium">{c.first_name} {c.last_name}</p>
                          <p className="text-xs text-gray-500">{c.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Price *</Label>
                <Input
                  type="number"
                  value={layawayForm.total_price}
                  onChange={(e) => setLayawayForm({ ...layawayForm, total_price: e.target.value })}
                  placeholder="500.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Down Payment *</Label>
                <Input
                  type="number"
                  value={layawayForm.down_payment}
                  onChange={(e) => setLayawayForm({ ...layawayForm, down_payment: e.target.value })}
                  placeholder="50.00"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Schedule</Label>
                <select
                  value={layawayForm.payment_schedule}
                  onChange={(e) => setLayawayForm({ ...layawayForm, payment_schedule: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label># of Payments</Label>
                <Input
                  type="number"
                  value={layawayForm.number_of_payments}
                  onChange={(e) => setLayawayForm({ ...layawayForm, number_of_payments: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsLayawayDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-amber-600 hover:bg-amber-700" disabled={!selectedCustomer}>
                Create Layaway
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ============ LEADS REPORT DIALOG ============ */}
      <Dialog open={isGenerateReportOpen} onOpenChange={setIsGenerateReportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate LEADS Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input
                type="date"
                value={reportDates.start_date}
                onChange={(e) => setReportDates({ ...reportDates, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input
                type="date"
                value={reportDates.end_date}
                onChange={(e) => setReportDates({ ...reportDates, end_date: e.target.value })}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsGenerateReportOpen(false)}>Cancel</Button>
              <Button 
                onClick={handleGenerateLEADSReport} 
                className="bg-amber-600 hover:bg-amber-700"
                disabled={!reportDates.start_date || !reportDates.end_date}
              >
                Generate Report
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPeptidesExtended;
