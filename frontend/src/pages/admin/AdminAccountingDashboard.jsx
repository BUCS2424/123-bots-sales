import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import {
  DollarSign, TrendingUp, TrendingDown, Package, ShoppingCart, Users,
  Calendar, Download, Printer, RefreshCw, Filter, ChevronDown,
  ArrowUpRight, ArrowDownRight, Wallet, CreditCard, PiggyBank,
  BarChart3, PieChart, FileText, Clock, Truck, XCircle, AlertTriangle,
  Pencil, Check, X, Save
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Calendar as CalendarComponent } from '../../components/ui/calendar';
import { format } from 'date-fns';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/accounting`;

const PERIOD_OPTIONS = [
  { value: '7', label: 'Last 7 Days' },
  { value: '30', label: 'Last 30 Days' },
  { value: '60', label: 'Last 60 Days' },
  { value: '90', label: 'Last 90 Days' },
  { value: '365', label: 'Last Year' },
  { value: 'all', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

const AdminAccountingDashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30');
  const [customStartDate, setCustomStartDate] = useState(null);
  const [customEndDate, setCustomEndDate] = useState(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [isFilterActive, setIsFilterActive] = useState(false);
  
  const [stats, setStats] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [productsData, setProductsData] = useState([]);
  const [ordersBreakdown, setOrdersBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Commission settings
  const [commissionSettings, setCommissionSettings] = useState({ enabled: false, percentage: 10 });
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const [tempCommissionPercentage, setTempCommissionPercentage] = useState('10');
  const [savingCommission, setSavingCommission] = useState(false);
  
  const printRef = useRef(null);
  
  // Check if user is super admin (can edit commission)
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    fetchCommissionSettings();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [period, customStartDate, customEndDate]);

  const fetchCommissionSettings = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin-settings/commission`);
      setCommissionSettings(response.data);
      setTempCommissionPercentage(response.data.percentage?.toString() || '10');
    } catch (error) {
      console.error('Failed to fetch commission settings:', error);
    }
  };

  const handleSaveCommission = async () => {
    const percentage = parseFloat(tempCommissionPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast({
        title: 'Invalid Percentage',
        description: 'Please enter a number between 0 and 100.',
        variant: 'destructive'
      });
      return;
    }
    
    setSavingCommission(true);
    try {
      await axios.put(`${BACKEND_URL}/api/admin-settings/commission`, {
        ...commissionSettings,
        percentage
      });
      setCommissionSettings(prev => ({ ...prev, percentage }));
      setIsEditingCommission(false);
      toast({
        title: 'Commission Updated',
        description: `Commission percentage set to ${percentage}%`,
      });
    } catch (error) {
      console.error('Failed to save commission:', error);
      toast({
        title: 'Error',
        description: 'Failed to update commission percentage.',
        variant: 'destructive'
      });
    }
    setSavingCommission(false);
  };

  const handleCancelEditCommission = () => {
    setIsEditingCommission(false);
    setTempCommissionPercentage(commissionSettings.percentage?.toString() || '10');
  };

  const resetToCurrentMonth = () => {
    setPeriod('30');
    setCustomStartDate(null);
    setCustomEndDate(null);
    setShowCustomDatePicker(false);
    setIsFilterActive(false);
  };

  const fetchAllData = async () => {
    setRefreshing(true);
    try {
      const params = {};
      if (period !== 'custom') {
        params.period = period;
      } else if (customStartDate && customEndDate) {
        params.start_date = format(customStartDate, 'yyyy-MM-dd');
        params.end_date = format(customEndDate, 'yyyy-MM-dd');
      } else {
        params.period = '30'; // Fallback
      }
      
      const [statsRes, dailyRes, productsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`, { params }),
        axios.get(`${API}/dashboard/daily`, { params }),
        axios.get(`${API}/dashboard/products`, { params: { ...params, limit: 10 } }),
        axios.get(`${API}/dashboard/orders-breakdown`, { params }),
      ]);
      
      setStats(statsRes.data);
      setDailyData(dailyRes.data);
      setProductsData(productsRes.data);
      setOrdersBreakdown(ordersRes.data);
    } catch (error) {
      console.error('Failed to fetch accounting data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load accounting data.',
        variant: 'destructive'
      });
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handlePeriodChange = (newPeriod) => {
    if (newPeriod === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
    setPeriod(newPeriod);
    setIsFilterActive(newPeriod !== '30');
  };

  const handlePrint = () => {
    // Generate filename with current date
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const year = today.getFullYear();
    const filename = `gross-profit-report-${month}-${day}-${year}.pdf`;
    
    // Get the element to print
    const element = printRef.current;
    
    // PDF options
    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate and download PDF
    html2pdf().set(opt).from(element).save();
  };

  const handleExportCSV = async () => {
    try {
      const params = {};
      if (period !== 'custom') {
        params.period = period;
      } else if (customStartDate && customEndDate) {
        params.start_date = format(customStartDate, 'yyyy-MM-dd');
        params.end_date = format(customEndDate, 'yyyy-MM-dd');
      }
      
      const response = await axios.get(`${API}/dashboard/report`, { params });
      const report = response.data;
      
      // Generate CSV content
      let csv = 'Gingerkare Accounting Report\n';
      csv += `Generated: ${new Date().toLocaleString()}\n`;
      csv += `Period: ${report.period.start} to ${report.period.end}\n\n`;
      
      csv += 'SUMMARY\n';
      csv += `Gross Revenue,$${report.summary.gross_revenue}\n`;
      csv += `Refunds,$${report.summary.refunds}\n`;
      csv += `Net Revenue,$${report.summary.net_revenue}\n`;
      csv += `Total Cost,$${report.summary.total_cost}\n`;
      csv += `Gross Profit,$${report.summary.gross_profit}\n`;
      csv += `Profit Margin,${report.summary.profit_margin}%\n`;
      csv += `Total Orders,${report.summary.total_orders}\n`;
      csv += `Items Sold,${report.summary.items_sold}\n`;
      csv += `Total Customers,${report.summary.total_customers}\n\n`;
      
      csv += 'TOP PRODUCTS\n';
      csv += 'Product,Units Sold,Revenue,Cost,Profit,Margin\n';
      report.top_products.forEach(p => {
        csv += `"${p.name}",${p.units_sold},$${p.revenue},$${p.cost},$${p.profit},${p.margin}%\n`;
      });
      
      csv += '\nDAILY BREAKDOWN\n';
      csv += 'Date,Orders,Revenue,Cost,Profit\n';
      report.daily_breakdown.forEach(d => {
        csv += `${d.date},${d.orders},$${d.revenue},$${d.cost},$${d.profit}\n`;
      });
      
      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `accounting-report-${report.period.start}-to-${report.period.end}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({ title: 'Report Exported', description: 'CSV file downloaded successfully.' });
    } catch (error) {
      toast({ title: 'Export Failed', description: 'Could not generate report.', variant: 'destructive' });
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  const formatPercent = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  const maxRevenue = Math.max(...dailyData.map(d => d.revenue), 1);
  const maxProfit = Math.max(...dailyData.map(d => d.profit), 1);

  return (
    <div className="space-y-6 print:space-y-4" ref={printRef} data-testid="accounting-dashboard">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 print:flex-row">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <PiggyBank className="w-8 h-8 text-green-600" />
            Accounting Dashboard
          </h1>
          <p className="text-gray-500">Financial overview and profit analysis</p>
        </div>
        
        {/* Period Filter & Actions */}
        <div className="flex flex-wrap items-center gap-3 print:hidden">
          {/* Period Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white"
              data-testid="period-filter"
            >
              {PERIOD_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          
          {/* Custom Date Picker */}
          {showCustomDatePicker && (
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <Calendar className="w-4 h-4 mr-2" />
                    {customStartDate ? format(customStartDate, 'MMM d, yyyy') : 'Start Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customStartDate}
                    onSelect={(date) => { setCustomStartDate(date); setIsFilterActive(true); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <span className="text-gray-400">to</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-10">
                    <Calendar className="w-4 h-4 mr-2" />
                    {customEndDate ? format(customEndDate, 'MMM d, yyyy') : 'End Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={customEndDate}
                    onSelect={(date) => { setCustomEndDate(date); setIsFilterActive(true); }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}
          
          {/* Reset to Current Month button */}
          {isFilterActive && (
            <Button 
              variant="outline" 
              onClick={resetToCurrentMonth}
              className="border-purple-300 text-purple-700 hover:bg-purple-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset to Current Month
            </Button>
          )}
          
          {/* Actions */}
          <Button variant="outline" onClick={fetchAllData} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={handlePrint} className="bg-purple-600 hover:bg-purple-700">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Period Badge */}
      {stats?.period && (
        <div className="flex items-center gap-2 text-sm text-gray-600 print:text-xs">
          <Clock className="w-4 h-4" />
          <span>Showing data from <strong>{stats.period.start}</strong> to <strong>{stats.period.end}</strong></span>
        </div>
      )}

      {/* Main Financial Summary Cards */}
      <div className={`grid grid-cols-1 gap-4 print:gap-2 ${commissionSettings.enabled ? 'md:grid-cols-4 print:grid-cols-4' : 'md:grid-cols-3 print:grid-cols-3'}`}>
        {/* Total Revenue */}
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[#6e2ea8]">Gross Revenue</p>
                <p className="text-3xl font-bold text-gray-900 print:text-2xl">{formatCurrency(stats?.revenue?.gross)}</p>
                {stats?.revenue?.refunds > 0 && (
                  <p className="text-sm text-red-500 mt-1">- {formatCurrency(stats?.revenue?.refunds)} refunds</p>
                )}
                <p className="text-lg font-semibold text-blue-700 mt-1">Net: {formatCurrency(stats?.revenue?.net)}</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-[#6e2ea8]" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Total Cost (COGS)</p>
                <p className="text-3xl font-bold text-gray-900 print:text-2xl">{formatCurrency(stats?.costs?.total)}</p>
                <p className="text-sm text-gray-500 mt-1">{formatPercent(stats?.costs?.percentage)} of revenue</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center">
                <Wallet className="w-7 h-7 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Profit */}
        <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Gross Profit</p>
                <p className="text-3xl font-bold text-gray-900 print:text-2xl">{formatCurrency(stats?.profit?.gross)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={`${stats?.profit?.margin_percentage >= 50 ? 'bg-green-100 text-green-700' : stats?.profit?.margin_percentage >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {formatPercent(stats?.profit?.margin_percentage)} margin
                  </Badge>
                </div>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commission Card - Editable by Super Admin */}
        {commissionSettings.enabled && (
          <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200 ring-2 ring-purple-100 relative" data-testid="commission-card">
            <CardContent className="pt-6">
              {/* Edit Button for Super Admin */}
              {isSuperAdmin && !isEditingCommission && (
                <button
                  onClick={() => setIsEditingCommission(true)}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-600 transition-colors print:hidden"
                  title="Edit Commission Percentage"
                  data-testid="edit-commission-btn"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  {isEditingCommission ? (
                    /* Edit Mode */
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-purple-600">Edit Commission %</p>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={tempCommissionPercentage}
                          onChange={(e) => setTempCommissionPercentage(e.target.value)}
                          className="w-20 h-10 text-lg font-bold text-center"
                          autoFocus
                          data-testid="commission-percentage-input"
                        />
                        <span className="text-xl font-bold text-purple-400">%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveCommission}
                          disabled={savingCommission}
                          className="bg-green-600 hover:bg-green-700 h-8"
                          data-testid="save-commission-btn"
                        >
                          {savingCommission ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          <span className="ml-1">Save</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEditCommission}
                          className="h-8"
                          data-testid="cancel-commission-btn"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <>
                      <p className="text-sm font-medium text-purple-600">{commissionSettings.percentage}% Commission</p>
                      <p className="text-3xl font-bold text-[#6e2ea8] print:text-2xl">
                        {formatCurrency((stats?.profit?.gross || 0) * (commissionSettings.percentage / 100))}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-purple-100 text-purple-700">
                          {isFilterActive ? 'Filtered Period' : 'Current Month'}
                        </Badge>
                      </div>
                    </>
                  )}
                </div>
                {!isEditingCommission && (
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                    <PiggyBank className="w-7 h-7 text-[#6e2ea8]" />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Profit Formula Display */}
      <Card className="bg-slate-50 border-slate-200 print:bg-white">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-xl font-bold text-[#6e2ea8]">{formatCurrency(stats?.revenue?.net)}</p>
            </div>
            <span className="text-2xl text-gray-400">−</span>
            <div>
              <p className="text-xs text-gray-500">Cost</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(stats?.costs?.total)}</p>
            </div>
            <span className="text-2xl text-gray-400">=</span>
            <div>
              <p className="text-xs text-gray-500">Profit</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats?.profit?.gross)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4 print:gap-2">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-xs text-gray-500">Total Orders</p>
                <p className="text-xl font-bold">{stats?.orders?.total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-amber-500" />
              <div>
                <p className="text-xs text-gray-500">Items Sold</p>
                <p className="text-xl font-bold">{stats?.products?.items_sold || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-[#6e2ea8]" />
              <div>
                <p className="text-xs text-gray-500">Customers</p>
                <p className="text-xl font-bold">{stats?.customers?.total || 0}</p>
                <p className="text-xs text-gray-400">{stats?.customers?.new || 0} new</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-teal-500" />
              <div>
                <p className="text-xs text-gray-500">Avg Order</p>
                <p className="text-xl font-bold">{formatCurrency(stats?.revenue?.average_order)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Status Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
        {/* Order Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-500" />
              Orders by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="font-medium">Paid</span>
                </div>
                <div className="text-right">
                  <span className="font-bold">{stats?.orders?.paid || 0}</span>
                  <span className="text-gray-500 ml-2 text-sm">{formatCurrency(ordersBreakdown?.by_status?.paid?.total)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-purple-500" />
                  <span className="font-medium">Shipped</span>
                </div>
                <div className="text-right">
                  <span className="font-bold">{stats?.orders?.shipped || 0}</span>
                  <span className="text-gray-500 ml-2 text-sm">{formatCurrency(ordersBreakdown?.by_status?.shipped?.total)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="font-medium">Pending</span>
                </div>
                <span className="font-bold">{stats?.orders?.pending || 0}</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-red-500" />
                  <span className="font-medium">Cancelled / Refunded</span>
                </div>
                <span className="font-bold">{(stats?.orders?.cancelled || 0) + (stats?.orders?.refunded || 0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-teal-500" />
              Revenue by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {ordersBreakdown?.by_payment_method && Object.entries(ordersBreakdown.by_payment_method).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      method === 'card' ? 'bg-[#6e2ea8]' :
                      method === 'cashapp' ? 'bg-green-500' :
                      method === 'venmo' ? 'bg-purple-500' :
                      'bg-gray-400'
                    }`} />
                    <span className="font-medium capitalize">{method}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold">{data.count}</span>
                    <span className="text-gray-500 ml-2 text-sm">{formatCurrency(data.total)}</span>
                  </div>
                </div>
              ))}
              
              {/* Source breakdown */}
              <div className="pt-3 border-t mt-4">
                <p className="text-sm text-gray-500 mb-2">By Source</p>
                <div className="flex gap-4">
                  <div className="flex-1 p-2 bg-blue-50 rounded text-center">
                    <p className="text-xs text-gray-500">Web</p>
                    <p className="font-bold">{ordersBreakdown?.by_source?.web?.count || 0}</p>
                  </div>
                  <div className="flex-1 p-2 bg-amber-50 rounded text-center">
                    <p className="text-xs text-gray-500">POS</p>
                    <p className="font-bold">{ordersBreakdown?.by_source?.pos?.count || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue Chart */}
      <Card className="print:break-before-page">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#6e2ea8]" />
            Daily Revenue & Profit
          </CardTitle>
          <CardDescription>Revenue (blue) and Profit (green) breakdown by day</CardDescription>
        </CardHeader>
        <CardContent>
          {dailyData.length > 0 ? (
            <div className="space-y-2">
              {dailyData.slice(-14).map((day, index) => (
                <div key={day.date} className="flex items-center gap-4">
                  <div className="w-24 text-sm text-gray-500 shrink-0">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 flex gap-1">
                    {/* Revenue bar */}
                    <div 
                      className="h-6 bg-[#6e2ea8] rounded-l transition-all"
                      style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                      title={`Revenue: ${formatCurrency(day.revenue)}`}
                    />
                    {/* Profit bar overlay */}
                    <div 
                      className="h-6 bg-green-500 rounded-r transition-all"
                      style={{ width: `${Math.max((day.profit / maxRevenue) * 100, 0)}%` }}
                      title={`Profit: ${formatCurrency(day.profit)}`}
                    />
                  </div>
                  <div className="w-32 text-right text-sm shrink-0">
                    <span className="text-[#6e2ea8] font-medium">{formatCurrency(day.revenue)}</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-green-600 font-medium">{formatCurrency(day.profit)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No sales data for this period</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#6e2ea8] rounded" />
              <span className="text-sm text-gray-600">Revenue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-sm text-gray-600">Profit</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Top Products by Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          {productsData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-semibold text-gray-600">Product</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">Units</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">Revenue</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">Cost</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">Profit</th>
                    <th className="text-right py-3 px-2 font-semibold text-gray-600">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {productsData.map((product, index) => (
                    <tr key={product.product_id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          {product.sku && <p className="text-xs text-gray-400">{product.sku}</p>}
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-mono">{product.units_sold}</td>
                      <td className="text-right py-3 px-2 font-mono text-[#6e2ea8]">{formatCurrency(product.revenue)}</td>
                      <td className="text-right py-3 px-2 font-mono text-orange-600">{formatCurrency(product.cost)}</td>
                      <td className="text-right py-3 px-2 font-mono text-green-600">{formatCurrency(product.profit)}</td>
                      <td className="text-right py-3 px-2">
                        <Badge className={`${product.margin >= 50 ? 'bg-green-100 text-green-700' : product.margin >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {formatPercent(product.margin)}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-3 px-2">Total</td>
                    <td className="text-right py-3 px-2 font-mono">{productsData.reduce((sum, p) => sum + p.units_sold, 0)}</td>
                    <td className="text-right py-3 px-2 font-mono text-[#6e2ea8]">{formatCurrency(productsData.reduce((sum, p) => sum + p.revenue, 0))}</td>
                    <td className="text-right py-3 px-2 font-mono text-orange-600">{formatCurrency(productsData.reduce((sum, p) => sum + p.cost, 0))}</td>
                    <td className="text-right py-3 px-2 font-mono text-green-600">{formatCurrency(productsData.reduce((sum, p) => sum + p.profit, 0))}</td>
                    <td className="text-right py-3 px-2">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>No product sales data for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:break-before-page { break-before: page; }
        }
      `}</style>
    </div>
  );
};

export default AdminAccountingDashboard;
