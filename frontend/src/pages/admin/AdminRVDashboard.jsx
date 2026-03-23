import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
  Truck, Wrench, Users, DollarSign, Clock, Plus, Calendar as CalendarIcon, FileText,
  Search, Eye, Edit, Trash2, MoreVertical, Loader2, CheckCircle,
  XCircle, AlertCircle, Play, Pause, ChevronRight, Calculator,
  Send, Printer, Save, X, Package, User, Phone, Mail, MapPin,
  ChevronLeft, CalendarDays, Bell, Box, AlertTriangle, Receipt
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const RV_TYPES = ["Travel Trailer", "Fifth Wheel", "Class A", "Class B", "Class C", "Toy Hauler", "Pop-Up", "Truck Camper"];
const SERVICE_CATEGORIES = ["General", "Electrical", "Plumbing", "HVAC", "Exterior", "Interior", "Appliances", "Structural", "Flooring", "Windows & Doors"];
const INVENTORY_CATEGORIES = ["Electrical", "Plumbing", "HVAC Parts", "Sealants & Adhesives", "Hardware", "Flooring", "Appliance Parts", "Exterior", "Interior", "Safety", "Other"];

const AdminRVDashboard = ({ initialTab = 'dashboard' }) => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [stats, setStats] = useState({ activeJobs: 0, pendingEstimates: 0, completedThisMonth: 0, totalRevenue: 0 });
  
  // Data states
  const [jobs, setJobs] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [serviceCatalog, setServiceCatalog] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  
  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState('week'); // week, month
  
  // Dialog states
  const [isEstimateDialogOpen, setIsEstimateDialogOpen] = useState(false);
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isInventoryDialogOpen, setIsInventoryDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [scheduleJobId, setScheduleJobId] = useState(null);
  
  // Form states
  const [estimateForm, setEstimateForm] = useState({
    customer: { name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: '' },
    rv: { year: '', make: '', model: '', vin: '', license_plate: '', rv_type: 'Travel Trailer' },
    services: [],
    notes: '',
    discount_percent: 0,
    tax_rate: 9.0
  });
  
  const [newService, setNewService] = useState({
    name: '', description: '', category: 'General',
    labor_hours: 1, labor_rate: 75, parts_cost: 0, parts_description: ''
  });

  const [inventoryForm, setInventoryForm] = useState({
    name: '', sku: '', category: 'Other', description: '',
    quantity: 0, min_quantity: 5, cost_price: 0, sell_price: 0, location: '', supplier: ''
  });

  const [scheduleForm, setScheduleForm] = useState({
    start_date: '', start_time: '09:00', end_time: '17:00', notes: '',
    send_customer_reminder: true, send_admin_reminder: true
  });

  // Fetch data
  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/rv/stats`);
      setStats({
        activeJobs: response.data.active_jobs || 0,
        pendingEstimates: response.data.pending_estimates || 0,
        completedThisMonth: response.data.completed_this_month || 0,
        totalRevenue: response.data.total_revenue || 0
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/rv/jobs`);
      setJobs(response.data);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    }
  }, []);

  const fetchEstimates = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/rv/estimates`);
      setEstimates(response.data);
    } catch (error) {
      console.error('Failed to fetch estimates:', error);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/rv/invoices`);
      setInvoices(response.data);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  }, []);

  const fetchServiceCatalog = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/rv/services/catalog`);
      setServiceCatalog(response.data);
    } catch (error) {
      console.error('Failed to fetch service catalog:', error);
    }
  }, []);

  const fetchInventory = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/rv/inventory`);
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
  }, []);

  const fetchCalendarEvents = useCallback(async () => {
    // Get events for current week/month
    const start = new Date(calendarDate);
    start.setDate(start.getDate() - start.getDay()); // Start of week
    const end = new Date(start);
    end.setDate(end.getDate() + (calendarView === 'week' ? 6 : 30));
    
    try {
      const response = await axios.get(`${API}/rv/calendar/events`, {
        params: {
          start_date: start.toISOString().split('T')[0],
          end_date: end.toISOString().split('T')[0]
        }
      });
      setCalendarEvents(response.data);
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
    }
  }, [calendarDate, calendarView]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchStats(),
        fetchJobs(),
        fetchEstimates(),
        fetchInvoices(),
        fetchServiceCatalog(),
        fetchInventory(),
        fetchCalendarEvents()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchStats, fetchJobs, fetchEstimates, fetchInvoices, fetchServiceCatalog, fetchInventory, fetchCalendarEvents]);

  useEffect(() => {
    fetchCalendarEvents();
  }, [calendarDate, calendarView, fetchCalendarEvents]);

  // Calculate estimate totals
  const calculateTotals = (services, discountPercent, taxRate) => {
    const subtotal = services.reduce((sum, s) => {
      const laborTotal = (s.labor_hours || 0) * (s.labor_rate || 75);
      const partsTotal = s.parts_cost || 0;
      return sum + laborTotal + partsTotal;
    }, 0);
    const discountAmount = subtotal * (discountPercent / 100);
    const taxable = subtotal - discountAmount;
    const taxAmount = taxable * (taxRate / 100);
    const total = taxable + taxAmount;
    
    return { subtotal, discountAmount, taxAmount, total };
  };

  const totals = calculateTotals(estimateForm.services, estimateForm.discount_percent, estimateForm.tax_rate);

  // Service handlers
  const addServiceToEstimate = () => {
    if (!newService.name) return;
    
    const serviceWithTotal = {
      ...newService,
      id: Date.now().toString(),
      total: (newService.labor_hours * newService.labor_rate) + newService.parts_cost
    };
    
    setEstimateForm(prev => ({
      ...prev,
      services: [...prev.services, serviceWithTotal]
    }));
    
    setNewService({
      name: '', description: '', category: 'General',
      labor_hours: 1, labor_rate: 75, parts_cost: 0, parts_description: ''
    });
  };

  const addCatalogService = (catalogItem) => {
    const serviceWithTotal = {
      id: Date.now().toString(),
      name: catalogItem.name,
      description: catalogItem.description,
      category: catalogItem.category,
      labor_hours: catalogItem.default_labor_hours,
      labor_rate: catalogItem.default_labor_rate,
      parts_cost: catalogItem.default_parts_cost,
      parts_description: '',
      total: (catalogItem.default_labor_hours * catalogItem.default_labor_rate) + catalogItem.default_parts_cost
    };
    
    setEstimateForm(prev => ({
      ...prev,
      services: [...prev.services, serviceWithTotal]
    }));
  };

  const removeService = (serviceId) => {
    setEstimateForm(prev => ({
      ...prev,
      services: prev.services.filter(s => s.id !== serviceId)
    }));
  };

  const updateService = (serviceId, field, value) => {
    setEstimateForm(prev => ({
      ...prev,
      services: prev.services.map(s => {
        if (s.id !== serviceId) return s;
        const updated = { ...s, [field]: value };
        updated.total = (updated.labor_hours * updated.labor_rate) + updated.parts_cost;
        return updated;
      })
    }));
  };

  // Create estimate
  const handleCreateEstimate = async () => {
    if (!estimateForm.customer.name || !estimateForm.rv.make || estimateForm.services.length === 0) {
      toast({ title: 'Error', description: 'Please fill in customer name, RV make, and add at least one service', variant: 'destructive' });
      return;
    }
    
    try {
      const response = await axios.post(`${API}/rv/estimates`, estimateForm);
      toast({ title: 'Success', description: `Estimate ${response.data.estimate_number} created successfully` });
      setIsEstimateDialogOpen(false);
      resetEstimateForm();
      fetchEstimates();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create estimate', variant: 'destructive' });
    }
  };

  // Create job directly
  const handleCreateJob = async () => {
    if (!estimateForm.customer.name || !estimateForm.rv.make || estimateForm.services.length === 0) {
      toast({ title: 'Error', description: 'Please fill in customer name, RV make, and add at least one service', variant: 'destructive' });
      return;
    }
    
    try {
      const response = await axios.post(`${API}/rv/jobs`, {
        ...estimateForm,
        priority: 'normal'
      });
      toast({ title: 'Success', description: `Job ${response.data.job_number} created successfully` });
      setIsJobDialogOpen(false);
      resetEstimateForm();
      fetchJobs();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create job', variant: 'destructive' });
    }
  };

  // Convert estimate to job
  const handleConvertToJob = async (estimateId) => {
    try {
      const response = await axios.post(`${API}/rv/estimates/${estimateId}/convert-to-job`);
      toast({ title: 'Success', description: `Estimate converted to ${response.data.job_number}` });
      fetchEstimates();
      fetchJobs();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to convert estimate', variant: 'destructive' });
    }
  };

  // Convert estimate to invoice directly
  const handleConvertToInvoice = async (estimateId) => {
    try {
      const response = await axios.post(`${API}/rv/estimates/${estimateId}/create-invoice`);
      toast({ title: 'Success', description: `Invoice ${response.data.invoice_number} created` });
      fetchEstimates();
      fetchJobs();
      fetchInvoices();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create invoice', variant: 'destructive' });
    }
  };

  // Update job status
  const handleUpdateJobStatus = async (jobId, status) => {
    try {
      await axios.put(`${API}/rv/jobs/${jobId}`, { status });
      toast({ title: 'Success', description: `Job status updated to ${status}` });
      fetchJobs();
      fetchStats();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update job status', variant: 'destructive' });
    }
  };

  // Create invoice from job
  const handleCreateInvoice = async (jobId) => {
    try {
      const response = await axios.post(`${API}/rv/invoices`, { job_id: jobId });
      toast({ title: 'Success', description: `Invoice ${response.data.invoice_number} created` });
      fetchInvoices();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create invoice', variant: 'destructive' });
    }
  };

  // Schedule job
  const handleScheduleJob = async () => {
    if (!scheduleJobId || !scheduleForm.start_date) {
      toast({ title: 'Error', description: 'Please select a date', variant: 'destructive' });
      return;
    }

    const startDateTime = `${scheduleForm.start_date}T${scheduleForm.start_time}:00`;
    const endDateTime = `${scheduleForm.start_date}T${scheduleForm.end_time}:00`;

    try {
      await axios.post(`${API}/rv/jobs/${scheduleJobId}/schedule`, null, {
        params: {
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          notes: scheduleForm.notes
        }
      });
      toast({ title: 'Success', description: 'Job scheduled successfully' });
      setIsScheduleDialogOpen(false);
      setScheduleJobId(null);
      setScheduleForm({ start_date: '', start_time: '09:00', end_time: '17:00', notes: '', send_customer_reminder: true, send_admin_reminder: true });
      fetchJobs();
      fetchCalendarEvents();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to schedule job', variant: 'destructive' });
    }
  };

  // Add service to catalog
  const handleAddToCatalog = async () => {
    if (!newService.name) return;
    
    try {
      await axios.post(`${API}/rv/services/catalog`, {
        name: newService.name,
        description: newService.description,
        category: newService.category,
        default_labor_hours: newService.labor_hours,
        default_labor_rate: newService.labor_rate,
        default_parts_cost: newService.parts_cost
      });
      toast({ title: 'Success', description: 'Service added to catalog' });
      setIsServiceDialogOpen(false);
      setNewService({ name: '', description: '', category: 'General', labor_hours: 1, labor_rate: 75, parts_cost: 0, parts_description: '' });
      fetchServiceCatalog();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add service to catalog', variant: 'destructive' });
    }
  };

  // Add inventory item
  const handleAddInventory = async () => {
    if (!inventoryForm.name) return;
    
    try {
      await axios.post(`${API}/rv/inventory`, inventoryForm);
      toast({ title: 'Success', description: 'Inventory item added' });
      setIsInventoryDialogOpen(false);
      setInventoryForm({ name: '', sku: '', category: 'Other', description: '', quantity: 0, min_quantity: 5, cost_price: 0, sell_price: 0, location: '', supplier: '' });
      fetchInventory();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add inventory item', variant: 'destructive' });
    }
  };

  // Adjust inventory quantity
  const handleAdjustInventory = async (itemId, change, reason = 'Manual adjustment') => {
    try {
      await axios.put(`${API}/rv/inventory/${itemId}/adjust`, null, {
        params: { quantity_change: change, reason }
      });
      toast({ title: 'Success', description: `Quantity adjusted by ${change}` });
      fetchInventory();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to adjust inventory', variant: 'destructive' });
    }
  };

  const resetEstimateForm = () => {
    setEstimateForm({
      customer: { name: '', email: '', phone: '', address: '', city: '', state: '', zip_code: '' },
      rv: { year: '', make: '', model: '', vin: '', license_plate: '', rv_type: 'Travel Trailer' },
      services: [],
      notes: '',
      discount_percent: 0,
      tax_rate: 9.0
    });
  };

  // Calendar helpers
  const getWeekDays = () => {
    const days = [];
    const start = new Date(calendarDate);
    start.setDate(start.getDate() - start.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getEventsForDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return calendarEvents.filter(e => e.start_datetime?.startsWith(dateStr));
  };

  const navigateCalendar = (direction) => {
    const newDate = new Date(calendarDate);
    if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7));
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCalendarDate(newDate);
  };

  // Badge helpers
  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      sent: 'bg-blue-100 text-blue-800',
      approved: 'bg-green-100 text-green-800',
      declined: 'bg-red-100 text-red-800',
      converted: 'bg-purple-100 text-purple-800',
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      partial: 'bg-amber-100 text-amber-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status?.replace('_', ' ')}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      low: 'bg-gray-100 text-gray-600',
      normal: 'bg-blue-100 text-blue-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return <Badge className={colors[priority] || 'bg-gray-100'}>{priority}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="rv-dashboard">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-[rgb(37, 99, 235)]" />
            RV Restoration Center
          </h1>
          <p className="text-gray-500">Manage repairs, estimates, jobs & invoices</p>
        </div>
        
        <div className="flex gap-3">
          <Button className="bg-[rgb(37, 99, 235)] hover:bg-[#162d4a]" onClick={() => setIsJobDialogOpen(true)} data-testid="new-job-btn">
            <Plus className="w-4 h-4 mr-2" />
            New Job
          </Button>
          <Button variant="outline" onClick={() => setIsEstimateDialogOpen(true)} data-testid="create-estimate-btn">
            <Calculator className="w-4 h-4 mr-2" />
            Create Estimate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Jobs</p>
                <p className="text-2xl font-bold">{stats.activeJobs}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Wrench className="w-5 h-5 text-[rgb(37, 99, 235)]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Estimates</p>
                <p className="text-2xl font-bold">{stats.pendingEstimates}</p>
              </div>
              <div className="p-2 bg-yellow-100 rounded-full">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold">{stats.completedThisMonth}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-full">
                <DollarSign className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Low Stock Items</p>
                <p className="text-2xl font-bold">{inventory.filter(i => i.is_low_stock).length}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="jobs">Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="estimates">Estimates ({estimates.length})</TabsTrigger>
          <TabsTrigger value="invoices">Invoices ({invoices.length})</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="inventory">Inventory ({inventory.length})</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                {jobs.slice(0, 5).map(job => (
                  <div key={job.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium text-[rgb(37, 99, 235)]">{job.job_number}</p>
                      <p className="text-sm text-gray-500">{job.customer?.name} - {job.rv?.make} {job.rv?.model}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(job.status)}
                      <span className="font-medium">${job.total?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {jobs.length === 0 && <p className="text-gray-500 text-center py-4">No jobs yet</p>}
              </CardContent>
            </Card>

            {/* Recent Estimates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Estimates</CardTitle>
              </CardHeader>
              <CardContent>
                {estimates.slice(0, 5).map(estimate => (
                  <div key={estimate.id} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="font-medium text-[rgb(37, 99, 235)]">{estimate.estimate_number}</p>
                      <p className="text-sm text-gray-500">{estimate.customer?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(estimate.status)}
                      <span className="font-medium">${estimate.total?.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                {estimates.length === 0 && <p className="text-gray-500 text-center py-4">No estimates yet</p>}
              </CardContent>
            </Card>

            {/* Today's Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getEventsForDay(new Date()).length > 0 ? (
                  getEventsForDay(new Date()).map(event => (
                    <div key={event.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className="w-1 h-10 rounded" style={{ backgroundColor: event.color || 'rgb(37, 99, 235)' }}></div>
                      <div className="flex-1">
                        <p className="font-medium">{event.title}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {event.customer_name && ` - ${event.customer_name}`}
                        </p>
                      </div>
                      {getStatusBadge(event.status)}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No appointments today</p>
                )}
              </CardContent>
            </Card>

            {/* Low Stock Alerts */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Low Stock Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {inventory.filter(i => i.is_low_stock).slice(0, 5).map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-500">{item.sku} - {item.category}</p>
                    </div>
                    <Badge className="bg-red-100 text-red-700">{item.quantity} left</Badge>
                  </div>
                ))}
                {inventory.filter(i => i.is_low_stock).length === 0 && (
                  <p className="text-gray-500 text-center py-4">All items in stock</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Jobs</CardTitle>
                <Button className="bg-[rgb(37, 99, 235)]" onClick={() => setIsJobDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> New Job
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>RV</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map(job => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium text-[rgb(37, 99, 235)]">{job.job_number}</TableCell>
                      <TableCell>
                        <div>
                          <p>{job.customer?.name}</p>
                          <p className="text-xs text-gray-500">{job.customer?.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{job.rv?.year} {job.rv?.make} {job.rv?.model}</TableCell>
                      <TableCell>
                        {job.scheduled_date ? (
                          <span className="text-sm">{new Date(job.scheduled_date).toLocaleDateString()}</span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => { setScheduleJobId(job.id); setIsScheduleDialogOpen(true); }}
                          >
                            <CalendarIcon className="w-3 h-3 mr-1" /> Schedule
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{getPriorityBadge(job.priority)}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell className="text-right font-medium">${job.total?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!job.scheduled_date && (
                              <DropdownMenuItem onClick={() => { setScheduleJobId(job.id); setIsScheduleDialogOpen(true); }}>
                                <CalendarIcon className="w-4 h-4 mr-2" /> Schedule
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {job.status === 'pending' && (
                              <DropdownMenuItem onClick={() => handleUpdateJobStatus(job.id, 'in_progress')}>
                                <Play className="w-4 h-4 mr-2" /> Start Job
                              </DropdownMenuItem>
                            )}
                            {job.status === 'in_progress' && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateJobStatus(job.id, 'on_hold')}>
                                  <Pause className="w-4 h-4 mr-2" /> Put On Hold
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateJobStatus(job.id, 'completed')}>
                                  <CheckCircle className="w-4 h-4 mr-2" /> Mark Complete
                                </DropdownMenuItem>
                              </>
                            )}
                            {job.status === 'completed' && (
                              <DropdownMenuItem onClick={() => handleCreateInvoice(job.id)}>
                                <Receipt className="w-4 h-4 mr-2" /> Create Invoice
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => handleUpdateJobStatus(job.id, 'cancelled')}>
                              <XCircle className="w-4 h-4 mr-2" /> Cancel Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {jobs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">No jobs found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Estimates Tab */}
        <TabsContent value="estimates">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>All Estimates</CardTitle>
                <Button className="bg-[rgb(37, 99, 235)]" onClick={() => setIsEstimateDialogOpen(true)}>
                  <Calculator className="w-4 h-4 mr-2" /> New Estimate
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Estimate #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>RV</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimates.map(estimate => (
                    <TableRow key={estimate.id}>
                      <TableCell className="font-medium text-[rgb(37, 99, 235)]">{estimate.estimate_number}</TableCell>
                      <TableCell>
                        <div>
                          <p>{estimate.customer?.name}</p>
                          <p className="text-xs text-gray-500">{estimate.customer?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{estimate.rv?.year} {estimate.rv?.make} {estimate.rv?.model}</TableCell>
                      <TableCell>{getStatusBadge(estimate.status)}</TableCell>
                      <TableCell>{estimate.valid_until ? new Date(estimate.valid_until).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right font-medium">${estimate.total?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Printer className="w-4 h-4 mr-2" /> Print
                            </DropdownMenuItem>
                            {estimate.status !== 'converted' && estimate.status !== 'declined' && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleConvertToJob(estimate.id)}>
                                  <Wrench className="w-4 h-4 mr-2" /> Convert to Job
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleConvertToInvoice(estimate.id)}>
                                  <Receipt className="w-4 h-4 mr-2" /> Convert to Invoice
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {estimates.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">No estimates found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices">
          <Card>
            <CardHeader>
              <CardTitle>All Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Job #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium text-[rgb(37, 99, 235)]">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.job_number}</TableCell>
                      <TableCell>{invoice.customer?.name}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>{invoice.due_date ? new Date(invoice.due_date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell className="text-right">${invoice.total?.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-red-600">${invoice.balance_due?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" /> View
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Printer className="w-4 h-4 mr-2" /> Print
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <DollarSign className="w-4 h-4 mr-2" /> Record Payment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {invoices.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">No invoices found</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => navigateCalendar(-1)}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="text-lg font-semibold">
                    {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <Button variant="outline" size="icon" onClick={() => navigateCalendar(1)}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setCalendarDate(new Date())}>Today</Button>
                  <Button
                    variant={calendarView === 'week' ? 'default' : 'outline'}
                    onClick={() => setCalendarView('week')}
                    className={calendarView === 'week' ? 'bg-[rgb(37, 99, 235)]' : ''}
                  >
                    Week
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week View */}
              <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-7 bg-gray-50 border-b">
                  {getWeekDays().map((day, i) => (
                    <div key={i} className="p-3 text-center border-r last:border-r-0">
                      <p className="text-xs text-gray-500 uppercase">
                        {day.toLocaleDateString('en-US', { weekday: 'short' })}
                      </p>
                      <p className={`text-lg font-semibold ${
                        day.toDateString() === new Date().toDateString() ? 'text-[rgb(37, 99, 235)]' : ''
                      }`}>
                        {day.getDate()}
                      </p>
                    </div>
                  ))}
                </div>
                
                {/* Events Grid */}
                <div className="grid grid-cols-7 min-h-[400px]">
                  {getWeekDays().map((day, i) => {
                    const dayEvents = getEventsForDay(day);
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                      <div key={i} className={`border-r last:border-r-0 p-2 ${isToday ? 'bg-blue-50' : ''}`}>
                        {dayEvents.map(event => (
                          <div
                            key={event.id}
                            className="mb-2 p-2 rounded text-sm text-white cursor-pointer"
                            style={{ backgroundColor: event.color || 'rgb(37, 99, 235)' }}
                          >
                            <p className="font-medium truncate">{event.title}</p>
                            <p className="text-xs opacity-80">
                              {new Date(event.start_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Parts & Inventory</CardTitle>
                  <CardDescription>Track parts and supplies for RV repairs</CardDescription>
                </div>
                <Button className="bg-[rgb(37, 99, 235)]" onClick={() => setIsInventoryDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Sell Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventory.map(item => (
                    <TableRow key={item.id} className={item.is_low_stock ? 'bg-red-50' : ''}>
                      <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.name}</span>
                          {item.is_low_stock && (
                            <Badge className="bg-red-100 text-red-700 text-xs">Low Stock</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                      <TableCell>{item.location || '-'}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleAdjustInventory(item.id, -1)}>-</Button>
                          <span className={`w-12 text-center font-medium ${item.is_low_stock ? 'text-red-600' : ''}`}>
                            {item.quantity}
                          </span>
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleAdjustInventory(item.id, 1)}>+</Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">${item.cost_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.sell_price?.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {inventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        <Box className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>No inventory items yet</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Service Catalog</CardTitle>
                  <CardDescription>Pre-defined services for quick estimate creation</CardDescription>
                </div>
                <Button className="bg-[rgb(37, 99, 235)]" onClick={() => setIsServiceDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" /> Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {serviceCatalog.map(service => (
                  <Card key={service.id} className="border hover:border-[rgb(37, 99, 235)] transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{service.name}</h4>
                        <Badge variant="outline">{service.category}</Badge>
                      </div>
                      {service.description && (
                        <p className="text-sm text-gray-500 mb-3">{service.description}</p>
                      )}
                      <div className="text-sm space-y-1">
                        <p>Labor: {service.default_labor_hours}h @ ${service.default_labor_rate}/hr</p>
                        <p>Parts: ${service.default_parts_cost}</p>
                        <p className="font-medium text-[rgb(37, 99, 235)]">
                          Total: ${((service.default_labor_hours * service.default_labor_rate) + service.default_parts_cost).toFixed(2)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {serviceCatalog.length === 0 && (
                  <div className="col-span-3 text-center py-12 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No services in catalog yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Estimate/Job Creator Dialog - Same as before */}
      <Dialog open={isEstimateDialogOpen || isJobDialogOpen} onOpenChange={(open) => { setIsEstimateDialogOpen(false); setIsJobDialogOpen(false); if (!open) resetEstimateForm(); }}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              {isJobDialogOpen ? 'Create New Job' : 'Create Estimate'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Customer & RV Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" /> Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Customer Name *</Label>
                      <Input
                        value={estimateForm.customer.name}
                        onChange={(e) => setEstimateForm({
                          ...estimateForm,
                          customer: { ...estimateForm.customer, name: e.target.value }
                        })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone *</Label>
                      <Input
                        value={estimateForm.customer.phone}
                        onChange={(e) => setEstimateForm({
                          ...estimateForm,
                          customer: { ...estimateForm.customer, phone: e.target.value }
                        })}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={estimateForm.customer.email}
                      onChange={(e) => setEstimateForm({
                        ...estimateForm,
                        customer: { ...estimateForm.customer, email: e.target.value }
                      })}
                      placeholder="john@example.com"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* RV Information */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Truck className="w-4 h-4" /> RV Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Year</Label>
                      <Input
                        value={estimateForm.rv.year}
                        onChange={(e) => setEstimateForm({ ...estimateForm, rv: { ...estimateForm.rv, year: e.target.value } })}
                        placeholder="2020"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Make *</Label>
                      <Input
                        value={estimateForm.rv.make}
                        onChange={(e) => setEstimateForm({ ...estimateForm, rv: { ...estimateForm.rv, make: e.target.value } })}
                        placeholder="Keystone"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input
                        value={estimateForm.rv.model}
                        onChange={(e) => setEstimateForm({ ...estimateForm, rv: { ...estimateForm.rv, model: e.target.value } })}
                        placeholder="Cougar"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <select
                        value={estimateForm.rv.rv_type}
                        onChange={(e) => setEstimateForm({ ...estimateForm, rv: { ...estimateForm.rv, rv_type: e.target.value } })}
                        className="w-full h-10 px-3 border rounded-md"
                      >
                        {RV_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Services */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="w-4 h-4" /> Services & Labor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Quick Add from Catalog */}
                  {serviceCatalog.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-500 w-full mb-1">Quick Add:</span>
                      {serviceCatalog.slice(0, 6).map(service => (
                        <Button key={service.id} variant="outline" size="sm" onClick={() => addCatalogService(service)}>
                          <Plus className="w-3 h-3 mr-1" /> {service.name}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Add Custom Service */}
                  <div className="border rounded-lg p-4 space-y-3">
                    <Label className="font-medium">Add Custom Service</Label>
                    <div className="grid grid-cols-6 gap-2">
                      <div className="col-span-2">
                        <Input placeholder="Service name" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
                      </div>
                      <select value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })} className="h-10 px-2 border rounded-md text-sm">
                        {SERVICE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <Input type="number" placeholder="Hours" value={newService.labor_hours} onChange={(e) => setNewService({ ...newService, labor_hours: parseFloat(e.target.value) || 0 })} />
                      <Input type="number" placeholder="$/hr" value={newService.labor_rate} onChange={(e) => setNewService({ ...newService, labor_rate: parseFloat(e.target.value) || 0 })} />
                      <Input type="number" placeholder="Parts $" value={newService.parts_cost} onChange={(e) => setNewService({ ...newService, parts_cost: parseFloat(e.target.value) || 0 })} />
                    </div>
                    <Button variant="outline" className="w-full" onClick={addServiceToEstimate}>
                      <Plus className="w-4 h-4 mr-2" /> Add Service
                    </Button>
                  </div>

                  {/* Services List */}
                  {estimateForm.services.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead>Service</TableHead>
                            <TableHead className="text-center">Hours</TableHead>
                            <TableHead className="text-center">Rate</TableHead>
                            <TableHead className="text-center">Parts</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {estimateForm.services.map((service) => (
                            <TableRow key={service.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{service.name}</p>
                                  <Badge variant="outline" className="text-xs">{service.category}</Badge>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Input type="number" className="w-16 text-center" value={service.labor_hours} onChange={(e) => updateService(service.id, 'labor_hours', parseFloat(e.target.value) || 0)} />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input type="number" className="w-20 text-center" value={service.labor_rate} onChange={(e) => updateService(service.id, 'labor_rate', parseFloat(e.target.value) || 0)} />
                              </TableCell>
                              <TableCell className="text-center">
                                <Input type="number" className="w-20 text-center" value={service.parts_cost} onChange={(e) => updateService(service.id, 'parts_cost', parseFloat(e.target.value) || 0)} />
                              </TableCell>
                              <TableCell className="text-right font-medium">${service.total?.toFixed(2)}</TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm" onClick={() => removeService(service.id)}>
                                  <X className="w-4 h-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {estimateForm.services.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border rounded-lg">
                      <Wrench className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No services added yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Totals */}
            <div className="space-y-4">
              <Card className="sticky top-0 bg-[rgb(37, 99, 235)] text-white">
                <CardHeader>
                  <CardTitle className="text-lg">Estimate Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="flex-1">Discount</span>
                    <Input type="number" className="w-16 text-center text-black" value={estimateForm.discount_percent} onChange={(e) => setEstimateForm({ ...estimateForm, discount_percent: parseFloat(e.target.value) || 0 })} />
                    <span>%</span>
                  </div>
                  {totals.discountAmount > 0 && (
                    <div className="flex justify-between text-red-300">
                      <span>Discount Amount</span>
                      <span>-${totals.discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <span className="flex-1">Tax Rate</span>
                    <Input type="number" className="w-16 text-center text-black" value={estimateForm.tax_rate} onChange={(e) => setEstimateForm({ ...estimateForm, tax_rate: parseFloat(e.target.value) || 0 })} />
                    <span>%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>${totals.taxAmount.toFixed(2)}</span>
                  </div>
                  
                  <div className="border-t border-white/30 pt-4">
                    <div className="flex justify-between text-xl font-bold">
                      <span>TOTAL</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    {isEstimateDialogOpen && (
                      <Button className="w-full bg-white text-[rgb(37, 99, 235)] hover:bg-gray-100" onClick={handleCreateEstimate}>
                        <Save className="w-4 h-4 mr-2" /> Save Estimate
                      </Button>
                    )}
                    {isJobDialogOpen && (
                      <Button className="w-full bg-white text-[rgb(37, 99, 235)] hover:bg-gray-100" onClick={handleCreateJob}>
                        <Save className="w-4 h-4 mr-2" /> Create Job
                      </Button>
                    )}
                    <Button variant="outline" className="w-full text-white border-white/50 hover:bg-white/10" onClick={() => { setIsEstimateDialogOpen(false); setIsJobDialogOpen(false); resetEstimateForm(); }}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Schedule Job Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Schedule Job
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Date *</Label>
              <Input type="date" value={scheduleForm.start_date} onChange={(e) => setScheduleForm({ ...scheduleForm, start_date: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input type="time" value={scheduleForm.start_time} onChange={(e) => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>End Time</Label>
                <Input type="time" value={scheduleForm.end_time} onChange={(e) => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={scheduleForm.notes} onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} placeholder="Any special instructions..." />
            </div>
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-2">
                <Checkbox checked={scheduleForm.send_customer_reminder} onCheckedChange={(c) => setScheduleForm({ ...scheduleForm, send_customer_reminder: c })} />
                <span className="text-sm">Send reminder email to customer (24 hours before)</span>
              </label>
              <label className="flex items-center gap-2">
                <Checkbox checked={scheduleForm.send_admin_reminder} onCheckedChange={(c) => setScheduleForm({ ...scheduleForm, send_admin_reminder: c })} />
                <span className="text-sm">Send reminder email to admin</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[rgb(37, 99, 235)]" onClick={handleScheduleJob}>
              <CalendarIcon className="w-4 h-4 mr-2" /> Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Inventory Dialog */}
      <Dialog open={isInventoryDialogOpen} onOpenChange={setIsInventoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Item Name *</Label>
                <Input value={inventoryForm.name} onChange={(e) => setInventoryForm({ ...inventoryForm, name: e.target.value })} placeholder="e.g., RV Water Pump" />
              </div>
              <div className="space-y-2">
                <Label>SKU (auto-generated if blank)</Label>
                <Input value={inventoryForm.sku} onChange={(e) => setInventoryForm({ ...inventoryForm, sku: e.target.value })} placeholder="RV-1001" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select value={inventoryForm.category} onChange={(e) => setInventoryForm({ ...inventoryForm, category: e.target.value })} className="w-full h-10 px-3 border rounded-md">
                  {INVENTORY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={inventoryForm.location} onChange={(e) => setInventoryForm({ ...inventoryForm, location: e.target.value })} placeholder="Shelf A-3" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={inventoryForm.quantity} onChange={(e) => setInventoryForm({ ...inventoryForm, quantity: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Min Qty (Alert)</Label>
                <Input type="number" value={inventoryForm.min_quantity} onChange={(e) => setInventoryForm({ ...inventoryForm, min_quantity: parseInt(e.target.value) || 5 })} />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input value={inventoryForm.supplier} onChange={(e) => setInventoryForm({ ...inventoryForm, supplier: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cost Price ($)</Label>
                <Input type="number" step="0.01" value={inventoryForm.cost_price} onChange={(e) => setInventoryForm({ ...inventoryForm, cost_price: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Sell Price ($)</Label>
                <Input type="number" step="0.01" value={inventoryForm.sell_price} onChange={(e) => setInventoryForm({ ...inventoryForm, sell_price: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInventoryDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[rgb(37, 99, 235)]" onClick={handleAddInventory}>Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Service to Catalog Dialog */}
      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service to Catalog</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Service Name</Label>
              <Input value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} placeholder="e.g., AC System Recharge" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <select value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })} className="w-full h-10 px-3 border rounded-md">
                {SERVICE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Labor Hours</Label>
                <Input type="number" step="0.5" value={newService.labor_hours} onChange={(e) => setNewService({ ...newService, labor_hours: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Hourly Rate ($)</Label>
                <Input type="number" value={newService.labor_rate} onChange={(e) => setNewService({ ...newService, labor_rate: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Parts Cost ($)</Label>
                <Input type="number" value={newService.parts_cost} onChange={(e) => setNewService({ ...newService, parts_cost: parseFloat(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsServiceDialogOpen(false)}>Cancel</Button>
            <Button className="bg-[rgb(37, 99, 235)]" onClick={handleAddToCatalog}>Add to Catalog</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRVDashboard;
