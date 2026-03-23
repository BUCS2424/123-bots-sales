import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowLeft, Edit, User, Mail, Phone, MapPin, AlertCircle,
  Briefcase, DollarSign, Clock, TrendingUp, CalendarDays,
  ChevronLeft, ChevronRight, Upload, Loader2, Save, X
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminEmployeeDetail = ({ employeeId: propId }) => {
  const employeeId = propId;
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeOffRequests, setTimeOffRequests] = useState([]);
  const [hrSettings, setHrSettings] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const [perfDate, setPerfDate] = useState(new Date());
  const [leaveDate, setLeaveDate] = useState(new Date());

  const fetchEmployee = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/hr/employees/${employeeId}`);
      setEmployee(res.data);
      setForm(res.data);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load employee', variant: 'destructive' });
      navigate('/admin/hr/employees');
    }
  }, [employeeId, navigate]);

  const fetchTimeOff = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/hr/time-off`, { params: { employee_id: employeeId } });
      setTimeOffRequests(res.data);
    } catch (err) { console.error('Failed to fetch time off:', err); }
  }, [employeeId]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await axios.get(`${API}/hr/settings`);
      setHrSettings(res.data);
    } catch (err) { console.error('Failed to fetch settings:', err); }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchEmployee(), fetchTimeOff(), fetchSettings()]);
      setLoading(false);
    };
    load();
  }, [fetchEmployee, fetchTimeOff, fetchSettings]);

  const startEditing = () => {
    setForm({ ...employee });
    setEditing(true);
  };

  const cancelEditing = () => {
    setForm({ ...employee });
    setEditing(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/hr/employees/${employeeId}`, {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        state: form.state,
        zip_code: form.zip_code,
        date_of_birth: form.date_of_birth,
        department: form.department,
        position: form.position,
        hourly_rate: form.hourly_rate,
        employment_type: form.employment_type,
        emergency_contact: form.emergency_contact,
        status: form.status
      });
      toast({ title: 'Success', description: 'Employee updated' });
      setEditing(false);
      fetchEmployee();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update employee', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const setEC = (key, val) => setForm(prev => ({
    ...prev,
    emergency_contact: { ...(prev.emergency_contact || {}), [key]: val }
  }));

  const navMonth = (setter, date, delta) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + delta);
    setter(d);
  };
  const formatMonth = (d) => d.toLocaleString('default', { month: 'long', year: 'numeric' });

  const totalLeave = 20;
  const usedLeave = timeOffRequests.filter(r => r.status === 'approved').length * 2;
  const leftLeave = totalLeave - usedLeave;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }
  if (!employee) return null;

  const data = editing ? form : employee;
  const fullAddress = [data.address, data.city, data.state, data.zip_code].filter(Boolean).join(', ') || 'Not provided';
  const statusColor = data.status === 'active' ? 'bg-green-500' : data.status === 'on_leave' ? 'bg-amber-500' : 'bg-red-500';

  return (
    <div className="space-y-6" data-testid="employee-detail-page">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/admin/hr/employees')}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm"
          data-testid="back-to-employees-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Employees
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          {editing ? (
            <div className="flex items-center gap-2">
              <Input className="text-xl font-bold w-40" value={form.first_name || ''} onChange={e => set('first_name', e.target.value)} data-testid="edit-first-name" />
              <Input className="text-xl font-bold w-40" value={form.last_name || ''} onChange={e => set('last_name', e.target.value)} data-testid="edit-last-name" />
            </div>
          ) : (
            <h1 className="text-2xl font-bold text-gray-900" data-testid="employee-name-header">
              {employee.first_name} {employee.last_name}
            </h1>
          )}
          <p className="text-gray-500 text-sm">{data.position || 'No position'} &bull; {data.department}</p>
        </div>
        <div className="flex items-center gap-3">
          {editing ? (
            <>
              <Button variant="outline" onClick={cancelEditing} data-testid="cancel-edit-btn">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving} className="bg-green-600 hover:bg-green-700" data-testid="save-employee-btn">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </>
          ) : (
            <Button onClick={startEditing} className="bg-[#6e2ea8] hover:bg-[#5a2589]" data-testid="edit-employee-btn">
              <Edit className="w-4 h-4 mr-2" />
              Edit Employee
            </Button>
          )}
          {editing ? (
            <select value={form.status || 'active'} onChange={e => set('status', e.target.value)} className="h-9 px-3 text-sm font-semibold rounded-full border uppercase" data-testid="edit-status">
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
            </select>
          ) : (
            <Badge className={`${statusColor} text-white px-3 py-1 text-sm uppercase`} data-testid="employee-status-badge">
              {employee.status?.replace('_', ' ')}
            </Badge>
          )}
        </div>
      </div>

      {editing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
          Editing mode — make your changes and click <strong>Save</strong> to apply.
        </div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card data-testid="personal-info-card">
            <CardContent className="p-6">
              <CardSectionHeader icon={<User className="w-5 h-5 text-[#6e2ea8]" />} bg="bg-blue-100" title="Personal Information" />
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <EditField label="First Name" value={form.first_name} onChange={v => set('first_name', v)} />
                  <EditField label="Last Name" value={form.last_name} onChange={v => set('last_name', v)} />
                  <EditField label="Date of Birth" value={form.date_of_birth} onChange={v => set('date_of_birth', v)} type="date" />
                  <ViewField label="Employee ID" value={employee.id?.substring(0, 8)} />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <ViewField label="Full Name" value={`${employee.first_name} ${employee.last_name}`} />
                  <ViewField label="Gender" value="—" />
                  <ViewField label="Date of Birth" value={employee.date_of_birth || 'Not provided'} />
                  <ViewField label="Employee ID" value={employee.id?.substring(0, 8)} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card data-testid="contact-info-card">
            <CardContent className="p-6">
              <CardSectionHeader icon={<Mail className="w-5 h-5 text-[#6e2ea8]" />} bg="bg-blue-100" title="Contact Information" />
              {editing ? (
                <div className="space-y-3">
                  <EditField label="Email" value={form.email} onChange={v => set('email', v)} type="email" />
                  <EditField label="Phone" value={form.phone} onChange={v => set('phone', v)} type="tel" />
                  <EditField label="Address" value={form.address} onChange={v => set('address', v)} />
                  <div className="grid grid-cols-3 gap-3">
                    <EditField label="City" value={form.city} onChange={v => set('city', v)} />
                    <EditField label="State" value={form.state} onChange={v => set('state', v)} />
                    <EditField label="ZIP" value={form.zip_code} onChange={v => set('zip_code', v)} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <IconRow icon={<Mail className="w-4 h-4 text-gray-400" />} label="Email" value={employee.email} />
                  <IconRow icon={<Phone className="w-4 h-4 text-gray-400" />} label="Phone" value={employee.phone || 'Not provided'} />
                  <IconRow icon={<MapPin className="w-4 h-4 text-gray-400" />} label="Address" value={fullAddress} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card data-testid="emergency-contact-card">
            <CardContent className="p-6">
              <CardSectionHeader icon={<AlertCircle className="w-5 h-5 text-red-600" />} bg="bg-red-100" title="Emergency Contact" />
              {editing ? (
                <div className="space-y-3">
                  <EditField label="Contact Name" value={form.emergency_contact?.name} onChange={v => setEC('name', v)} />
                  <EditField label="Contact Phone" value={form.emergency_contact?.phone} onChange={v => setEC('phone', v)} type="tel" />
                  <EditField label="Relationship" value={form.emergency_contact?.relationship} onChange={v => setEC('relationship', v)} />
                </div>
              ) : (
                <div className="space-y-3">
                  <ViewField label="Contact Name" value={employee.emergency_contact?.name || 'Not provided'} />
                  <ViewField label="Contact Phone" value={employee.emergency_contact?.phone || 'Not provided'} />
                  {employee.emergency_contact?.relationship && (
                    <ViewField label="Relationship" value={employee.emergency_contact.relationship} />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Drivers License Upload */}
          <Card data-testid="drivers-license-card">
            <CardContent className="p-6">
              <CardSectionHeader icon={<Upload className="w-5 h-5 text-gray-600" />} bg="bg-gray-100" title="Drivers License" />
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Click or drag to upload driver's license</p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF up to 10MB</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Job Information */}
          <Card data-testid="job-info-card">
            <CardContent className="p-6">
              <CardSectionHeader icon={<Briefcase className="w-5 h-5 text-[#6e2ea8]" />} bg="bg-blue-100" title="Job Information" />
              {editing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Department</p>
                    <select value={form.department || ''} onChange={e => set('department', e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md" data-testid="edit-department">
                      {hrSettings?.departments?.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Position</p>
                    <select value={form.position || ''} onChange={e => set('position', e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md" data-testid="edit-position">
                      <option value="">Select</option>
                      {hrSettings?.positions?.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Employment Type</p>
                    <select value={form.employment_type || 'full_time'} onChange={e => set('employment_type', e.target.value)} className="w-full h-9 px-3 text-sm border rounded-md" data-testid="edit-employment-type">
                      <option value="full_time">Full Time</option>
                      <option value="part_time">Part Time</option>
                      <option value="contractor">Contractor</option>
                    </select>
                  </div>
                  <EditField label="Join Date" value={form.hire_date} onChange={v => set('hire_date', v)} type="date" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <ViewField label="Department" value={employee.department} />
                  <ViewField label="Position" value={employee.position || 'Not set'} />
                  <ViewField label="Employment Type" value={employee.employment_type?.replace('_', ' ')} />
                  <ViewField label="Join Date" value={employee.hire_date || 'Not set'} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compensation */}
          <Card data-testid="compensation-card">
            <CardContent className="p-6">
              <CardSectionHeader icon={<DollarSign className="w-5 h-5 text-green-600" />} bg="bg-green-100" title="Compensation" />
              {editing ? (
                <EditField label="Hourly Rate ($)" value={form.hourly_rate} onChange={v => set('hourly_rate', parseFloat(v) || 0)} type="number" step="0.01" />
              ) : (
                <ViewField label="Hourly Rate" value={`$${employee.hourly_rate?.toFixed(2)}/hr`} />
              )}
            </CardContent>
          </Card>

          {/* Work Schedule */}
          <Card data-testid="work-schedule-card">
            <CardContent className="p-6">
              <CardSectionHeader icon={<Clock className="w-5 h-5 text-purple-600" />} bg="bg-purple-100" title="Work Schedule" />
              <div className="space-y-2">
                <ViewField label="Monday - Friday" value={data.employment_type === 'full_time' ? '9:00 AM - 5:00 PM' : 'Varies'} />
                <ViewField label="Working Hours" value={data.employment_type === 'full_time' ? '40 hrs/week' : '20 hrs/week'} />
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card data-testid="performance-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg"><TrendingUp className="w-5 h-5 text-[#6e2ea8]" /></div>
                  <h3 className="text-base font-semibold text-gray-900">Performance</h3>
                </div>
                <div className="flex items-center gap-1">
                  <TabPill active>Month</TabPill>
                  <TabPill>Year</TabPill>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => navMonth(setPerfDate, perfDate, -1)} className="p-1 hover:bg-gray-100 rounded" data-testid="perf-prev-month"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-medium">{formatMonth(perfDate)}</span>
                <button onClick={() => navMonth(setPerfDate, perfDate, 1)} className="p-1 hover:bg-gray-100 rounded" data-testid="perf-next-month"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-gray-900">4.5<span className="text-lg text-gray-400">/5</span></p>
                <p className="text-xs text-gray-500">Overall Rating</p>
              </div>
              <div className="flex items-end justify-between h-20 gap-1 mb-4">
                {[3, 4, 4.5, 3.5, 4, 5, 4.5, 4, 3, 4.5, 5, 4].map((v, i) => (
                  <div key={i} className="flex-1 bg-indigo-200 rounded-t" style={{ height: `${(v / 5) * 100}%` }} />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Last Review: Oct 2024</span>
                <span>Next Review: Jan 2025</span>
              </div>
            </CardContent>
          </Card>

          {/* Leave */}
          <Card data-testid="leave-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-teal-100 rounded-lg"><CalendarDays className="w-5 h-5 text-teal-600" /></div>
                  <h3 className="text-base font-semibold text-gray-900">Leave</h3>
                </div>
                <div className="flex items-center gap-1">
                  <TabPill active>Month</TabPill>
                  <TabPill>Year</TabPill>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => navMonth(setLeaveDate, leaveDate, -1)} className="p-1 hover:bg-gray-100 rounded" data-testid="leave-prev-month"><ChevronLeft className="w-4 h-4" /></button>
                <span className="text-sm font-medium">{formatMonth(leaveDate)}</span>
                <button onClick={() => navMonth(setLeaveDate, leaveDate, 1)} className="p-1 hover:bg-gray-100 rounded" data-testid="leave-next-month"><ChevronRight className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold">{totalLeave}</p>
                  <p className="text-xs text-gray-500">Total</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-red-600">{usedLeave}</p>
                  <p className="text-xs text-gray-500">Used</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-green-600">{Math.max(0, leftLeave)}</p>
                  <p className="text-xs text-gray-500">Left</p>
                </div>
              </div>
              <div className="flex items-end justify-between h-16 gap-1 mb-4">
                {[2, 0, 1, 0, 3, 0, 1, 2, 0, 0, 1, 0].map((v, i) => (
                  <div key={i} className="flex-1 rounded-t" style={{ height: v > 0 ? `${(v / 3) * 100}%` : '4px', background: v > 0 ? '#14b8a6' : '#e5e7eb' }} />
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Applied Leave</p>
                {timeOffRequests.length > 0 ? (
                  timeOffRequests.slice(0, 3).map((req) => (
                    <div key={req.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-700">
                        {new Date(req.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        {req.start_date !== req.end_date && ` - ${new Date(req.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                      </span>
                      <LeaveStatusBadge status={req.status} />
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-400">No leave requests</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const CardSectionHeader = ({ icon, bg, title }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className={`p-2 ${bg} rounded-lg`}>{icon}</div>
    <h3 className="text-base font-semibold text-gray-900">{title}</h3>
  </div>
);

const ViewField = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-500">{label}</p>
    <p className="text-sm font-medium text-gray-900 capitalize">{value}</p>
  </div>
);

const EditField = ({ label, value, onChange, type = 'text', step }) => (
  <div>
    <p className="text-xs text-gray-500 mb-1">{label}</p>
    <Input
      type={type}
      step={step}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="h-9 text-sm"
    />
  </div>
);

const IconRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-3">
    {icon}
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  </div>
);

const TabPill = ({ children, active }) => (
  <span className={`px-3 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors ${active ? 'bg-[#6e2ea8] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
    {children}
  </span>
);

const LeaveStatusBadge = ({ status }) => {
  const colors = {
    pending: 'bg-blue-100 text-blue-700',
    approved: 'bg-yellow-100 text-yellow-700',
    denied: 'bg-red-100 text-red-700'
  };
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

export default AdminEmployeeDetail;
