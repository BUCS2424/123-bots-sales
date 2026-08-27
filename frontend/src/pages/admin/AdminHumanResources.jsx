import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Users, Plus, Edit, Trash2, UserCheck, User, Search,
  Loader2, MoreVertical, Mail, Calendar, Phone, Clock, Briefcase,
  FileText, DollarSign, MapPin, CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Download, Printer, Save, X, Upload,
  PlayCircle, StopCircle, CalendarDays, UserPlus, Settings, Building2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminHumanResources = ({ initialTab = 'employees' }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Employee state
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  // Time Clock state
  const [clockStatus, setClockStatus] = useState({});
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  
  // Schedule state
  const [schedules, setSchedules] = useState([]);
  const [scheduleWeekStart, setScheduleWeekStart] = useState(getWeekStart(new Date()));
  const [isAddShiftOpen, setIsAddShiftOpen] = useState(false);
  
  // Time Off state
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [isAddTimeOffOpen, setIsAddTimeOffOpen] = useState(false);
  
  // Payroll state
  const [payPeriods, setPayPeriods] = useState([]);
  const [selectedPayPeriod, setSelectedPayPeriod] = useState(null);
  const [payrollData, setPayrollData] = useState(null);
  
  // Documents state
  const [documents, setDocuments] = useState([]);
  
  // Settings state
  const [hrSettings, setHrSettings] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    address: '', city: '', state: '', zip_code: '',
    department: 'General', position: '', hourly_rate: 15,
    employment_type: 'full_time', emergency_contact: { name: '', phone: '', relationship: '' }
  });
  
  const [shiftForm, setShiftForm] = useState({
    employee_id: '', date: '', start_time: '09:00', end_time: '17:00', department: ''
  });
  
  const [timeOffForm, setTimeOffForm] = useState({
    employee_id: '', start_date: '', end_date: '', request_type: 'vacation', notes: ''
  });

  // Helper functions
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  }

  function getWeekDays(startDate) {
    const days = [];
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day.toISOString().split('T')[0]);
    }
    return days;
  }

  // Fetch data
  const fetchEmployees = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/hr/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  }, []);

  const fetchSchedules = useCallback(async () => {
    const weekEnd = new Date(scheduleWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    try {
      const response = await axios.get(`${API}/hr/schedules`, {
        params: { start_date: scheduleWeekStart, end_date: weekEnd.toISOString().split('T')[0] }
      });
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  }, [scheduleWeekStart]);

  const fetchTimeOffRequests = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/hr/time-off`);
      setTimeOffRequests(response.data);
    } catch (error) {
      console.error('Failed to fetch time off requests:', error);
    }
  }, []);

  const fetchPayPeriods = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/hr/payroll/periods`);
      setPayPeriods(response.data);
    } catch (error) {
      console.error('Failed to fetch pay periods:', error);
    }
  }, []);

  const fetchHRSettings = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/hr/settings`);
      setHrSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch HR settings:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchEmployees(),
        fetchSchedules(),
        fetchTimeOffRequests(),
        fetchPayPeriods(),
        fetchHRSettings()
      ]);
      setLoading(false);
    };
    loadData();
  }, [fetchEmployees, fetchSchedules, fetchTimeOffRequests, fetchPayPeriods, fetchHRSettings]);

  useEffect(() => {
    fetchSchedules();
  }, [scheduleWeekStart, fetchSchedules]);

  // Get current location for time clock
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError('Unable to get your location. Please enable location services.');
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
    }
  };

  // Employee handlers
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/hr/employees`, employeeForm);
      toast({ title: 'Success', description: 'Employee created successfully' });
      setIsAddEmployeeOpen(false);
      resetEmployeeForm();
      fetchEmployees();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create employee', variant: 'destructive' });
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/hr/employees/${selectedEmployee.id}`, employeeForm);
      toast({ title: 'Success', description: 'Employee updated successfully' });
      setIsEditEmployeeOpen(false);
      setSelectedEmployee(null);
      resetEmployeeForm();
      fetchEmployees();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to update employee', variant: 'destructive' });
    }
  };

  const handleDeleteEmployee = async (employeeId) => {
    if (!window.confirm('Are you sure you want to terminate this employee?')) return;
    try {
      await axios.delete(`${API}/hr/employees/${employeeId}`);
      toast({ title: 'Success', description: 'Employee terminated' });
      fetchEmployees();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to terminate employee', variant: 'destructive' });
    }
  };

  const openEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setEmployeeForm({
      first_name: employee.first_name || '',
      last_name: employee.last_name || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      city: employee.city || '',
      state: employee.state || '',
      zip_code: employee.zip_code || '',
      department: employee.department || 'General',
      position: employee.position || '',
      hourly_rate: employee.hourly_rate || 15,
      employment_type: employee.employment_type || 'full_time',
      emergency_contact: employee.emergency_contact || { name: '', phone: '', relationship: '' }
    });
    setIsEditEmployeeOpen(true);
  };

  const resetEmployeeForm = () => {
    setEmployeeForm({
      first_name: '', last_name: '', email: '', phone: '',
      address: '', city: '', state: '', zip_code: '',
      department: 'General', position: '', hourly_rate: 15,
      employment_type: 'full_time', emergency_contact: { name: '', phone: '', relationship: '' }
    });
  };

  // Time Clock handlers
  const handleClockAction = async (employeeId, action) => {
    if (!currentLocation) {
      toast({ title: 'Location Required', description: 'Please enable location services to clock in/out', variant: 'destructive' });
      getCurrentLocation();
      return;
    }

    try {
      await axios.post(`${API}/hr/time/clock`, {
        employee_id: employeeId,
        entry_type: action,
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      });
      toast({ title: 'Success', description: `Successfully clocked ${action === 'clock_in' ? 'in' : 'out'}` });
      fetchClockStatus(employeeId);
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || `Failed to clock ${action === 'clock_in' ? 'in' : 'out'}`, 
        variant: 'destructive' 
      });
    }
  };

  const fetchClockStatus = async (employeeId) => {
    try {
      const response = await axios.get(`${API}/hr/time/status/${employeeId}`);
      setClockStatus(prev => ({ ...prev, [employeeId]: response.data }));
    } catch (error) {
      console.error('Failed to fetch clock status:', error);
    }
  };

  // Schedule handlers
  const handleCreateShift = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/hr/schedules`, shiftForm);
      toast({ title: 'Success', description: 'Shift created successfully' });
      setIsAddShiftOpen(false);
      setShiftForm({ employee_id: '', date: '', start_time: '09:00', end_time: '17:00', department: '' });
      fetchSchedules();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create shift', variant: 'destructive' });
    }
  };

  const handleDeleteShift = async (shiftId) => {
    try {
      await axios.delete(`${API}/hr/schedules/${shiftId}`);
      toast({ title: 'Success', description: 'Shift deleted' });
      fetchSchedules();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete shift', variant: 'destructive' });
    }
  };

  // Time Off handlers
  const handleCreateTimeOff = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/hr/time-off`, timeOffForm);
      toast({ title: 'Success', description: 'Time off request submitted' });
      setIsAddTimeOffOpen(false);
      setTimeOffForm({ employee_id: '', start_date: '', end_date: '', request_type: 'vacation', notes: '' });
      fetchTimeOffRequests();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to submit time off request', variant: 'destructive' });
    }
  };

  const handleApproveTimeOff = async (requestId) => {
    try {
      await axios.put(`${API}/hr/time-off/${requestId}/approve?reviewer_id=${currentUser?.id}`);
      toast({ title: 'Success', description: 'Time off approved' });
      fetchTimeOffRequests();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve time off', variant: 'destructive' });
    }
  };

  const handleDenyTimeOff = async (requestId) => {
    try {
      await axios.put(`${API}/hr/time-off/${requestId}/deny?reviewer_id=${currentUser?.id}`);
      toast({ title: 'Success', description: 'Time off denied' });
      fetchTimeOffRequests();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to deny time off', variant: 'destructive' });
    }
  };

  // Payroll handlers
  const handleCalculatePayroll = async (periodId) => {
    try {
      const response = await axios.get(`${API}/hr/payroll/calculate/${periodId}`);
      setPayrollData(response.data);
      setSelectedPayPeriod(periodId);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to calculate payroll', variant: 'destructive' });
    }
  };

  const handleCreatePayPeriod = async () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay()); // Start of current week
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 13); // Two weeks
    const payDate = new Date(endDate);
    payDate.setDate(endDate.getDate() + 5); // Pay 5 days after period ends

    try {
      await axios.post(`${API}/hr/payroll/periods`, {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        pay_date: payDate.toISOString().split('T')[0],
        status: 'open'
      });
      toast({ title: 'Success', description: 'Pay period created' });
      fetchPayPeriods();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create pay period', variant: 'destructive' });
    }
  };

  // Settings handlers
  const handleSaveSettings = async () => {
    try {
      await axios.put(`${API}/hr/settings`, hrSettings);
      toast({ title: 'Success', description: 'Settings saved' });
      setIsSettingsOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(emp =>
    `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'on_leave': return <Badge className="bg-amber-100 text-amber-800">On Leave</Badge>;
      case 'terminated': return <Badge className="bg-red-100 text-red-800">Terminated</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTimeOffStatusBadge = (status) => {
    switch (status) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      case 'approved': return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'denied': return <Badge className="bg-red-100 text-red-800">Denied</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-hr-page">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-purple-600" />
            Human Resources
          </h1>
          <p className="text-gray-500">Manage employees, schedules, payroll & more</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSettingsOpen(true)} data-testid="hr-settings-btn">
            <Settings className="w-4 h-4 mr-2" />
            HR Settings
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Employees</p>
                <p className="text-2xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold">{employees.filter(e => e.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-xl">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">On Leave</p>
                <p className="text-2xl font-bold">{employees.filter(e => e.status === 'on_leave').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <CalendarDays className="w-6 h-6 text-[rgb(37, 99, 235)]" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Time Off Pending</p>
                <p className="text-2xl font-bold">{timeOffRequests.filter(r => r.status === 'pending').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Departments</p>
                <p className="text-2xl font-bold">{new Set(employees.map(e => e.department)).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 w-full max-w-4xl h-auto">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="timeclock">Time Clock</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="timeoff">Time Off</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* ============ EMPLOYEES TAB ============ */}
        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Employee Directory</CardTitle>
                  <CardDescription>Manage all staff members</CardDescription>
                </div>
                <div className="flex gap-2 items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(`${API}/hr/employees/export/csv`, '_blank');
                    }}
                    data-testid="export-csv-btn"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('csv-import-input').click()}
                    data-testid="import-csv-btn"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                  <input
                    id="csv-import-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const formData = new FormData();
                      formData.append('file', file);
                      try {
                        const res = await axios.post(`${API}/hr/employees/import/csv`, formData);
                        const { created, skipped, errors } = res.data;
                        toast({ title: 'Import Complete', description: `${created} created, ${skipped} skipped${errors.length ? '. ' + errors[0] : ''}` });
                        fetchEmployees();
                      } catch (err) {
                        toast({ title: 'Import Failed', description: err.response?.data?.detail || 'Failed to import CSV', variant: 'destructive' });
                      }
                      e.target.value = '';
                    }}
                  />
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search employees..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700" data-testid="add-employee-btn">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Employee
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Add New Employee</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateEmployee} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>First Name *</Label>
                            <Input
                              value={employeeForm.first_name}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name *</Label>
                            <Input
                              value={employeeForm.last_name}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Email *</Label>
                            <Input
                              type="email"
                              value={employeeForm.email}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                              type="tel"
                              value={employeeForm.phone}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Address</Label>
                          <Input
                            value={employeeForm.address}
                            onChange={(e) => setEmployeeForm({ ...employeeForm, address: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Input
                              value={employeeForm.city}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, city: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>State</Label>
                            <Input
                              value={employeeForm.state}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, state: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>ZIP</Label>
                            <Input
                              value={employeeForm.zip_code}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, zip_code: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Department</Label>
                            <select
                              value={employeeForm.department}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                              className="w-full h-10 px-3 border rounded-md"
                            >
                              {hrSettings?.departments?.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-2">
                            <Label>Position</Label>
                            <select
                              value={employeeForm.position}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                              className="w-full h-10 px-3 border rounded-md"
                            >
                              <option value="">Select Position</option>
                              {hrSettings?.positions?.map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Hourly Rate ($)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={employeeForm.hourly_rate}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, hourly_rate: parseFloat(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Employment Type</Label>
                            <select
                              value={employeeForm.employment_type}
                              onChange={(e) => setEmployeeForm({ ...employeeForm, employment_type: e.target.value })}
                              className="w-full h-10 px-3 border rounded-md"
                            >
                              <option value="full_time">Full Time</option>
                              <option value="part_time">Part Time</option>
                              <option value="contractor">Contractor</option>
                            </select>
                          </div>
                        </div>
                        <div className="border-t pt-4">
                          <Label className="text-base font-semibold">Emergency Contact</Label>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                            <Input
                              placeholder="Name"
                              value={employeeForm.emergency_contact?.name || ''}
                              onChange={(e) => setEmployeeForm({
                                ...employeeForm,
                                emergency_contact: { ...employeeForm.emergency_contact, name: e.target.value }
                              })}
                            />
                            <Input
                              placeholder="Phone"
                              value={employeeForm.emergency_contact?.phone || ''}
                              onChange={(e) => setEmployeeForm({
                                ...employeeForm,
                                emergency_contact: { ...employeeForm.emergency_contact, phone: e.target.value }
                              })}
                            />
                            <Input
                              placeholder="Relationship"
                              value={employeeForm.emergency_contact?.relationship || ''}
                              onChange={(e) => setEmployeeForm({
                                ...employeeForm,
                                emergency_contact: { ...employeeForm.emergency_contact, relationship: e.target.value }
                              })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsAddEmployeeOpen(false)}>Cancel</Button>
                          <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Add Employee</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployees.map((employee) => (
                    <TableRow key={employee.id} data-testid={`employee-row-${employee.id}`} className="cursor-pointer hover:bg-gray-50" onClick={() => navigate(`/admin/hr/employees/${employee.id}`)}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-purple-600 text-white text-sm">
                              {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-[rgb(37, 99, 235)] hover:underline">{employee.first_name} {employee.last_name}</p>
                            <p className="text-sm text-gray-500">{employee.employment_type?.replace('_', ' ')}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{employee.department}</Badge></TableCell>
                      <TableCell>{employee.position || '-'}</TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1"><Mail className="w-3 h-3" /> {employee.email}</div>
                          {employee.phone && <div className="flex items-center gap-1 text-gray-500"><Phone className="w-3 h-3" /> {employee.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>${employee.hourly_rate?.toFixed(2)}/hr</TableCell>
                      <TableCell>{getStatusBadge(employee.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/hr/employees/${employee.id}`); }}>
                              <User className="w-4 h-4 mr-2" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEditEmployee(employee); }}>
                              <Edit className="w-4 h-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDeleteEmployee(employee.id); }} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" /> Terminate
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        No employees found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ TIME CLOCK TAB ============ */}
        <TabsContent value="timeclock">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Time Clock
                  </CardTitle>
                  <CardDescription>Clock in/out from the business location</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  {currentLocation ? (
                    <Badge className="bg-green-100 text-green-800">
                      <MapPin className="w-3 h-3 mr-1" />
                      Location Enabled
                    </Badge>
                  ) : (
                    <Button variant="outline" onClick={getCurrentLocation}>
                      <MapPin className="w-4 h-4 mr-2" />
                      Enable Location
                    </Button>
                  )}
                </div>
              </div>
              {locationError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  {locationError}
                </div>
              )}
              {hrSettings && (
                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm">
                  <Building2 className="w-4 h-4 inline mr-2" />
                  Business Location: {hrSettings.business_address}, {hrSettings.business_city}, {hrSettings.business_state} {hrSettings.business_zip}
                  <span className="ml-2 text-xs">(Must be within {hrSettings.geo_fence_radius_meters}m to clock in/out)</span>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees.filter(e => e.status === 'active').map((employee) => {
                  const status = clockStatus[employee.id];
                  const isClockedIn = status?.clocked_in;
                  
                  // Fetch clock status if not loaded
                  if (!status) {
                    fetchClockStatus(employee.id);
                  }
                  
                  return (
                    <Card key={employee.id} className="border-2">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-purple-600 text-white">
                              {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-semibold">{employee.first_name} {employee.last_name}</p>
                            <p className="text-sm text-gray-500">{employee.department}</p>
                          </div>
                          {isClockedIn ? (
                            <Badge className="bg-green-100 text-green-800">Clocked In</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600">Clocked Out</Badge>
                          )}
                        </div>
                        {status?.last_entry && (
                          <p className="text-xs text-gray-500 mb-3">
                            Last: {status.last_entry.entry_type.replace('_', ' ')} at {new Date(status.last_entry.timestamp).toLocaleTimeString()}
                          </p>
                        )}
                        <div className="flex gap-2">
                          <Button
                            className="flex-1 bg-green-600 hover:bg-green-700"
                            disabled={isClockedIn || !currentLocation}
                            onClick={() => handleClockAction(employee.id, 'clock_in')}
                          >
                            <PlayCircle className="w-4 h-4 mr-2" />
                            Clock In
                          </Button>
                          <Button
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            disabled={!isClockedIn || !currentLocation}
                            onClick={() => handleClockAction(employee.id, 'clock_out')}
                          >
                            <StopCircle className="w-4 h-4 mr-2" />
                            Clock Out
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SCHEDULE TAB ============ */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Weekly Schedule</CardTitle>
                  <CardDescription>Manage employee shifts</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => {
                    const newStart = new Date(scheduleWeekStart);
                    newStart.setDate(newStart.getDate() - 7);
                    setScheduleWeekStart(newStart.toISOString().split('T')[0]);
                  }}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="font-medium px-4">
                    Week of {new Date(scheduleWeekStart).toLocaleDateString()}
                  </span>
                  <Button variant="outline" onClick={() => {
                    const newStart = new Date(scheduleWeekStart);
                    newStart.setDate(newStart.getDate() + 7);
                    setScheduleWeekStart(newStart.toISOString().split('T')[0]);
                  }}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                  <Dialog open={isAddShiftOpen} onOpenChange={setIsAddShiftOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Shift
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Shift</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleCreateShift} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Employee *</Label>
                          <select
                            value={shiftForm.employee_id}
                            onChange={(e) => setShiftForm({ ...shiftForm, employee_id: e.target.value })}
                            className="w-full h-10 px-3 border rounded-md"
                            required
                          >
                            <option value="">Select Employee</option>
                            {employees.filter(e => e.status === 'active').map(emp => (
                              <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label>Date *</Label>
                          <Input
                            type="date"
                            value={shiftForm.date}
                            onChange={(e) => setShiftForm({ ...shiftForm, date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Start Time *</Label>
                            <Input
                              type="time"
                              value={shiftForm.start_time}
                              onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>End Time *</Label>
                            <Input
                              type="time"
                              value={shiftForm.end_time}
                              onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Department</Label>
                          <select
                            value={shiftForm.department}
                            onChange={(e) => setShiftForm({ ...shiftForm, department: e.target.value })}
                            className="w-full h-10 px-3 border rounded-md"
                          >
                            <option value="">Any Department</option>
                            {hrSettings?.departments?.map(dept => (
                              <option key={dept} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsAddShiftOpen(false)}>Cancel</Button>
                          <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Add Shift</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40">Employee</TableHead>
                      {getWeekDays(scheduleWeekStart).map(day => (
                        <TableHead key={day} className="text-center min-w-[120px]">
                          {new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.filter(e => e.status === 'active').map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </TableCell>
                        {getWeekDays(scheduleWeekStart).map(day => {
                          const dayShifts = schedules.filter(s => s.employee_id === employee.id && s.date === day);
                          return (
                            <TableCell key={day} className="text-center p-2">
                              {dayShifts.length > 0 ? (
                                dayShifts.map(shift => (
                                  <div key={shift.id} className="bg-purple-100 text-purple-800 text-xs rounded px-2 py-1 mb-1 group relative">
                                    {shift.start_time} - {shift.end_time}
                                    <button
                                      onClick={() => handleDeleteShift(shift.id)}
                                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ TIME OFF TAB ============ */}
        <TabsContent value="timeoff">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Time Off Requests</CardTitle>
                  <CardDescription>Manage vacation, sick leave & personal time</CardDescription>
                </div>
                <Dialog open={isAddTimeOffOpen} onOpenChange={setIsAddTimeOffOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-2" />
                      New Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Time Off Request</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateTimeOff} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Employee *</Label>
                        <select
                          value={timeOffForm.employee_id}
                          onChange={(e) => setTimeOffForm({ ...timeOffForm, employee_id: e.target.value })}
                          className="w-full h-10 px-3 border rounded-md"
                          required
                        >
                          <option value="">Select Employee</option>
                          {employees.filter(e => e.status === 'active').map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Request Type *</Label>
                        <select
                          value={timeOffForm.request_type}
                          onChange={(e) => setTimeOffForm({ ...timeOffForm, request_type: e.target.value })}
                          className="w-full h-10 px-3 border rounded-md"
                          required
                        >
                          <option value="vacation">Vacation</option>
                          <option value="sick">Sick Leave</option>
                          <option value="personal">Personal</option>
                          <option value="bereavement">Bereavement</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Start Date *</Label>
                          <Input
                            type="date"
                            value={timeOffForm.start_date}
                            onChange={(e) => setTimeOffForm({ ...timeOffForm, start_date: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>End Date *</Label>
                          <Input
                            type="date"
                            value={timeOffForm.end_date}
                            onChange={(e) => setTimeOffForm({ ...timeOffForm, end_date: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={timeOffForm.notes}
                          onChange={(e) => setTimeOffForm({ ...timeOffForm, notes: e.target.value })}
                          placeholder="Additional details..."
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsAddTimeOffOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Submit Request</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {timeOffRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.employee_name}</TableCell>
                      <TableCell className="capitalize">{request.request_type?.replace('_', ' ')}</TableCell>
                      <TableCell>
                        {new Date(request.start_date).toLocaleDateString()} - {new Date(request.end_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{getTimeOffStatusBadge(request.status)}</TableCell>
                      <TableCell className="max-w-xs truncate">{request.notes || '-'}</TableCell>
                      <TableCell className="text-right">
                        {request.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleApproveTimeOff(request.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDenyTimeOff(request.id)}
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {timeOffRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        No time off requests
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ PAYROLL TAB ============ */}
        <TabsContent value="payroll">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pay Periods List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Pay Periods</CardTitle>
                  <Button size="sm" onClick={handleCreatePayPeriod} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {payPeriods.map((period) => (
                  <button
                    key={period.id}
                    onClick={() => handleCalculatePayroll(period.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedPayPeriod === period.id ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">
                          {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">Pay Date: {new Date(period.pay_date).toLocaleDateString()}</p>
                      </div>
                      <Badge className={period.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {period.status}
                      </Badge>
                    </div>
                  </button>
                ))}
                {payPeriods.length === 0 && (
                  <p className="text-center text-gray-500 py-4">No pay periods yet</p>
                )}
              </CardContent>
            </Card>

            {/* Payroll Summary */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Payroll Summary</CardTitle>
                  {payrollData && (
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4 mr-2" />
                      Print Report
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {payrollData ? (
                  <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total Employees</p>
                        <p className="text-2xl font-bold">{payrollData.total_employees}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm text-gray-500">Total Hours</p>
                        <p className="text-2xl font-bold">{payrollData.total_regular_hours + payrollData.total_overtime_hours}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-sm text-purple-600">Total Payroll</p>
                        <p className="text-2xl font-bold text-purple-700">${payrollData.total_gross_pay.toFixed(2)}</p>
                      </div>
                    </div>

                    {/* Employee Breakdown */}
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead className="text-right">Regular Hrs</TableHead>
                          <TableHead className="text-right">OT Hrs</TableHead>
                          <TableHead className="text-right">Rate</TableHead>
                          <TableHead className="text-right">Gross Pay</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payrollData.entries.map((entry) => (
                          <TableRow key={entry.employee_id}>
                            <TableCell className="font-medium">{entry.employee_name}</TableCell>
                            <TableCell className="text-right">{entry.regular_hours}</TableCell>
                            <TableCell className="text-right">{entry.overtime_hours}</TableCell>
                            <TableCell className="text-right">${entry.hourly_rate.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-medium">${entry.gross_pay.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>Select a pay period to view payroll details</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ============ DOCUMENTS TAB ============ */}
        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle>Employee Documents</CardTitle>
                  <CardDescription>Manage W4s, contracts, certifications & more</CardDescription>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">Document Management</h3>
                <p>Upload and manage employee documents, W4s, I-9s, contracts, and certifications.</p>
                <p className="text-sm mt-2">Select an employee to view their documents.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateEmployee} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={employeeForm.first_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, first_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={employeeForm.last_name}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, last_name: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={employeeForm.email}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={employeeForm.phone}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <select
                  value={employeeForm.department}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  {hrSettings?.departments?.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Position</Label>
                <select
                  value={employeeForm.position}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="">Select Position</option>
                  {hrSettings?.positions?.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hourly Rate ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={employeeForm.hourly_rate}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, hourly_rate: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <select
                  value={employeeForm.employment_type}
                  onChange={(e) => setEmployeeForm({ ...employeeForm, employment_type: e.target.value })}
                  className="w-full h-10 px-3 border rounded-md"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditEmployeeOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* HR Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>HR Settings</DialogTitle>
          </DialogHeader>
          {hrSettings && (
            <div className="space-y-6">
              {/* Business Location */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Business Location (for Time Clock)
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 space-y-2">
                    <Label>Business Address</Label>
                    <Input
                      value={hrSettings.business_address || ''}
                      onChange={(e) => setHrSettings({ ...hrSettings, business_address: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={hrSettings.business_city || ''}
                      onChange={(e) => setHrSettings({ ...hrSettings, business_city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State</Label>
                    <Input
                      value={hrSettings.business_state || ''}
                      onChange={(e) => setHrSettings({ ...hrSettings, business_state: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP Code</Label>
                    <Input
                      value={hrSettings.business_zip || ''}
                      onChange={(e) => setHrSettings({ ...hrSettings, business_zip: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Geo-Fence Radius (meters)</Label>
                    <Input
                      type="number"
                      value={hrSettings.geo_fence_radius_meters || 150}
                      onChange={(e) => setHrSettings({ ...hrSettings, geo_fence_radius_meters: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Latitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={hrSettings.business_latitude || ''}
                      onChange={(e) => setHrSettings({ ...hrSettings, business_latitude: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Longitude</Label>
                    <Input
                      type="number"
                      step="0.0001"
                      value={hrSettings.business_longitude || ''}
                      onChange={(e) => setHrSettings({ ...hrSettings, business_longitude: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Payroll Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Payroll Settings
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Pay Period Type</Label>
                    <select
                      value={hrSettings.pay_period_type || 'bi_weekly'}
                      onChange={(e) => setHrSettings({ ...hrSettings, pay_period_type: e.target.value })}
                      className="w-full h-10 px-3 border rounded-md"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="bi_weekly">Bi-Weekly</option>
                      <option value="semi_monthly">Semi-Monthly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Overtime Rate Multiplier</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={hrSettings.overtime_rate_multiplier || 1.5}
                      onChange={(e) => setHrSettings({ ...hrSettings, overtime_rate_multiplier: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Daily OT Threshold (hours)</Label>
                    <Input
                      type="number"
                      value={hrSettings.overtime_threshold_daily || 8}
                      onChange={(e) => setHrSettings({ ...hrSettings, overtime_threshold_daily: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Weekly OT Threshold (hours)</Label>
                    <Input
                      type="number"
                      value={hrSettings.overtime_threshold_weekly || 40}
                      onChange={(e) => setHrSettings({ ...hrSettings, overtime_threshold_weekly: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
              </div>

              {/* Application Email */}
              <div className="space-y-2">
                <Label>Job Application Notification Email</Label>
                <Input
                  type="email"
                  value={hrSettings.application_email || ''}
                  onChange={(e) => setHrSettings({ ...hrSettings, application_email: e.target.value })}
                  placeholder="hr@yourcompany.com"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveSettings} className="bg-purple-600 hover:bg-purple-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHumanResources;
