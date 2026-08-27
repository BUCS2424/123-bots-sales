import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Package, AlertTriangle, Clock, DollarSign, Phone, Mail,
  GripVertical, User, Calendar, ChevronRight, Loader2, RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Tenant Card Component
const TenantCard = ({ tenant, onDragStart, onDragEnd, onClick }) => {
  const daysPastDue = tenant.days_past_due || 0;
  
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, tenant)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(tenant)}
      className="bg-white rounded-lg border shadow-sm p-3 mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
      data-testid={`tenant-card-${tenant.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-1 text-gray-300 group-hover:text-gray-400">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-gray-900 truncate">{tenant.name}</h4>
            <Badge 
              variant="outline" 
              className={`text-xs shrink-0 ${
                daysPastDue > 10 ? 'bg-red-100 text-red-700 border-red-200' :
                daysPastDue > 0 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                'bg-green-100 text-green-700 border-green-200'
              }`}
            >
              {tenant.unit_name || 'Unit'}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {tenant.size || '10x10'}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              ${tenant.monthly_rate?.toFixed(0) || '0'}/mo
            </span>
          </div>
          {daysPastDue > 0 && (
            <div className="mt-2 text-xs font-medium text-red-600">
              {daysPastDue} days past due • ${tenant.balance_due?.toFixed(2) || '0.00'} owed
            </div>
          )}
          {tenant.phone && (
            <div className="mt-1 text-xs text-gray-400 flex items-center gap-1">
              <Phone className="w-3 h-3" /> {tenant.phone}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 shrink-0" />
      </div>
    </div>
  );
};

// Droppable Column Component
const DroppableColumn = ({ 
  title, 
  subtitle,
  tenants, 
  columnId, 
  onDragOver, 
  onDrop, 
  onDragStart, 
  onDragEnd,
  onTenantClick,
  color = 'gray',
  icon: Icon = Users
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const colorClasses = {
    green: { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100', text: 'text-green-700', icon: 'text-green-600' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', header: 'bg-amber-100', text: 'text-amber-700', icon: 'text-amber-600' },
    red: { bg: 'bg-red-50', border: 'border-red-200', header: 'bg-red-100', text: 'text-red-700', icon: 'text-red-600' },
    gray: { bg: 'bg-gray-50', border: 'border-gray-200', header: 'bg-gray-100', text: 'text-gray-700', icon: 'text-gray-600' },
  };

  const colors = colorClasses[color] || colorClasses.gray;

  return (
    <div
      className={`rounded-xl border-2 transition-all ${colors.border} ${isDragOver ? 'ring-2 ring-offset-2 ring-blue-400' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
        onDragOver(e, columnId);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        setIsDragOver(false);
        onDrop(e, columnId);
      }}
      data-testid={`column-${columnId}`}
    >
      {/* Column Header */}
      <div className={`px-4 py-3 ${colors.header} rounded-t-lg border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${colors.icon}`} />
            <div>
              <h3 className={`font-semibold ${colors.text}`}>{title}</h3>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <Badge className={`${colors.bg} ${colors.text} border ${colors.border}`}>
            {tenants.length}
          </Badge>
        </div>
      </div>

      {/* Column Content */}
      <div className={`p-3 min-h-[200px] ${colors.bg} rounded-b-lg`}>
        {tenants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-400">
            <Icon className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No tenants</p>
            <p className="text-xs">Drag tenants here</p>
          </div>
        ) : (
          tenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onTenantClick}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Main Dashboard Component
const StorageRentalsDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rentals, setRentals] = useState([]);
  const [customers, setCustomers] = useState({});
  const [draggedTenant, setDraggedTenant] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [rentalsRes, customersRes] = await Promise.all([
        axios.get(`${API}/storage-rentals/rentals`, { headers }),
        axios.get(`${API}/storage-rentals/customers`, { headers })
      ]);

      // Create customer lookup map
      const customerMap = {};
      (customersRes.data || []).forEach(c => { customerMap[c.id] = c; });
      setCustomers(customerMap);

      // Enrich rentals with customer data and calculate days past due
      const enrichedRentals = (rentalsRes.data || [])
        .filter(r => r.status === 'active')
        .map(rental => {
          // Handle both customer_id reference and embedded customer object
          let customerName = 'Unknown Tenant';
          let customerEmail = '';
          let customerPhone = '';
          let customerId = rental.customer_id;

          if (rental.customer) {
            // Embedded customer object (from POS)
            customerName = rental.customer.first_name && rental.customer.last_name 
              ? `${rental.customer.first_name} ${rental.customer.last_name}`
              : rental.customer.name || 'Unknown Tenant';
            customerEmail = rental.customer.email;
            customerPhone = rental.customer.phone;
          } else if (rental.customer_id && customerMap[rental.customer_id]) {
            // Customer ID reference
            const customer = customerMap[rental.customer_id];
            customerName = customer.name || 'Unknown Tenant';
            customerEmail = customer.email;
            customerPhone = customer.phone;
            customerId = customer.id;
          }

          const dueDate = rental.next_due_date ? new Date(rental.next_due_date) : new Date();
          const today = new Date();
          const daysPastDue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
          
          // Determine payment status
          let paymentStatus = rental.payment_status || 'current';
          if (paymentStatus === 'paid') paymentStatus = 'current';
          const effectiveDaysPastDue = rental.days_past_due || daysPastDue;
          if (effectiveDaysPastDue > 10) paymentStatus = 'delinquent';
          else if (effectiveDaysPastDue > 0) paymentStatus = 'late';
          
          return {
            ...rental,
            customer_id: customerId,
            name: customerName,
            email: customerEmail,
            phone: customerPhone,
            days_past_due: effectiveDaysPastDue,
            balance_due: rental.balance_due || 0,
            payment_status: paymentStatus
          };
        });

      setRentals(enrichedRentals);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Error', description: 'Failed to load rental data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Categorize tenants
  const activeTenants = rentals.filter(r => r.payment_status === 'current');
  const lateTenants = rentals.filter(r => r.payment_status === 'late');
  const delinquentTenants = rentals.filter(r => r.payment_status === 'delinquent');

  // Drag handlers
  const handleDragStart = (e, tenant) => {
    setDraggedTenant(tenant);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tenant.id);
  };

  const handleDragEnd = () => {
    setDraggedTenant(null);
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
  };

  const handleDrop = async (e, targetColumn) => {
    e.preventDefault();
    if (!draggedTenant) return;

    const newStatus = targetColumn === 'active' ? 'current' : 
                      targetColumn === 'late' ? 'late' : 'delinquent';

    // Update local state immediately for smooth UX
    setRentals(prev => prev.map(r => 
      r.id === draggedTenant.id ? { ...r, payment_status: newStatus } : r
    ));

    // Update backend
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/storage-rentals/rentals/${draggedTenant.id}`, {
        payment_status: newStatus,
        days_past_due: newStatus === 'current' ? 0 : 
                       newStatus === 'late' ? draggedTenant.days_past_due || 5 :
                       draggedTenant.days_past_due || 15
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast({
        title: 'Status Updated',
        description: `${draggedTenant.name} moved to ${targetColumn.replace('_', ' ')}`,
      });
    } catch (error) {
      // Revert on error
      fetchData();
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }

    setDraggedTenant(null);
  };

  const handleTenantClick = (tenant) => {
    const customer = customers[tenant.customer_id];
    if (customer) {
      navigate(`/admin/storage/customers/${customer.id}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="storage-rentals-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Active Rentals Dashboard</h1>
          <p className="text-gray-500 mt-1">Drag and drop tenants to update their status</p>
        </div>
        <Button variant="outline" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-[rgb(37, 99, 235)]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{rentals.length}</p>
                <p className="text-sm text-gray-500">Total Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeTenants.length}</p>
                <p className="text-sm text-gray-500">Current</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{lateTenants.length}</p>
                <p className="text-sm text-gray-500">Past Due</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{delinquentTenants.length}</p>
                <p className="text-sm text-gray-500">Delinquent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Active Tenants - 60% (3 columns) */}
        <div className="col-span-3">
          <DroppableColumn
            title="Active Tenants"
            subtitle="Current on payments"
            tenants={activeTenants}
            columnId="active"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTenantClick={handleTenantClick}
            color="green"
            icon={Users}
          />
        </div>

        {/* Right side - 40% (2 columns) */}
        <div className="col-span-2 space-y-4">
          {/* Past Due / Late */}
          <DroppableColumn
            title="Past Due"
            subtitle="1-10 days late"
            tenants={lateTenants}
            columnId="late"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTenantClick={handleTenantClick}
            color="amber"
            icon={Clock}
          />

          {/* Delinquent */}
          <DroppableColumn
            title="Delinquent"
            subtitle="10+ days late"
            tenants={delinquentTenants}
            columnId="delinquent"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onTenantClick={handleTenantClick}
            color="red"
            icon={AlertTriangle}
          />
        </div>
      </div>

      {/* Empty State */}
      {rentals.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No Active Rentals</h3>
            <p className="text-gray-500 mt-1">Create a rental to see tenants on this dashboard</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StorageRentalsDashboard;
