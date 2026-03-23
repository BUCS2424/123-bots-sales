import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Search, Filter, Plus, User, Mail, Phone, Package,
  ChevronDown, MoreHorizontal, Eye, Edit, Trash2, Loader2,
  CheckCircle, AlertTriangle, Calendar, DollarSign
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { toast } from '../../hooks/use-toast';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StorageCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [customersRes, rentalsRes] = await Promise.all([
        axios.get(`${API}/storage-rentals/customers`, { headers }),
        axios.get(`${API}/storage-rentals/rentals`, { headers })
      ]);

      setCustomers(customersRes.data || []);
      setRentals(rentalsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast({ title: 'Error', description: 'Failed to load customers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // Get rental count and status for each customer
  const getCustomerRentalInfo = (customerId) => {
    const customerRentals = rentals.filter(r => r.customer_id === customerId);
    const activeRentals = customerRentals.filter(r => r.status === 'active');
    const hasDelinquent = customerRentals.some(r => r.balance_due > 0);
    return { 
      totalRentals: customerRentals.length, 
      activeRentals: activeRentals.length,
      hasDelinquent 
    };
  };

  // Filter and sort customers
  const filteredCustomers = customers
    .filter(customer => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(searchQuery) ||
        customer.id?.toLowerCase().includes(searchLower);

      // Status filter
      const rentalInfo = getCustomerRentalInfo(customer.id);
      if (statusFilter === 'active' && rentalInfo.activeRentals === 0) return false;
      if (statusFilter === 'delinquent' && !rentalInfo.hasDelinquent) return false;
      if (statusFilter === 'no-rental' && rentalInfo.activeRentals > 0) return false;

      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        case 'created':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });

  // Stats
  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => getCustomerRentalInfo(c.id).activeRentals > 0).length;
  const delinquentCustomers = customers.filter(c => getCustomerRentalInfo(c.id).hasDelinquent).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#6e2ea8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="storage-customers-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-[#6e2ea8]" />
            Storage Customers
          </h1>
          <p className="text-gray-500 mt-1">Manage your storage unit customers</p>
        </div>
        <Button className="bg-[#6e2ea8] hover:bg-[#a01830]">
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-[#6e2ea8]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                <p className="text-sm text-gray-500">Total Customers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('active')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{activeCustomers}</p>
                <p className="text-sm text-gray-500">Active Renters</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('delinquent')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{delinquentCustomers}</p>
                <p className="text-sm text-gray-500">Delinquent</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter('no-rental')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{totalCustomers - activeCustomers}</p>
                <p className="text-sm text-gray-500">No Active Rental</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, phone, or account number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="customer-search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="active">Active Renters</SelectItem>
                <SelectItem value="delinquent">Delinquent</SelectItem>
                <SelectItem value="no-rental">No Active Rental</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="created">Date Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card>
        <CardContent className="p-0">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">No customers found</h3>
              <p className="text-gray-500 mt-1">
                {searchQuery || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'Add your first customer to get started'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rentals
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => {
                    const rentalInfo = getCustomerRentalInfo(customer.id);
                    return (
                      <tr 
                        key={customer.id} 
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => navigate(`/admin/storage/customers/${customer.id}`)}
                        data-testid={`customer-row-${customer.id}`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#6e2ea8] to-[#e63950] rounded-full flex items-center justify-center text-white font-medium shadow">
                              {customer.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{customer.name}</p>
                              <p className="text-xs text-gray-500">#{customer.id?.slice(-8).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {customer.email}
                            </p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {customer.phone || '—'}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {rentalInfo.activeRentals} active
                              {rentalInfo.totalRentals > rentalInfo.activeRentals && (
                                <span className="text-gray-400"> / {rentalInfo.totalRentals} total</span>
                              )}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {rentalInfo.hasDelinquent ? (
                            <Badge className="bg-red-100 text-red-700">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Delinquent
                            </Badge>
                          ) : rentalInfo.activeRentals > 0 ? (
                            <Badge className="bg-green-100 text-green-700">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-600">
                              No Rental
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/admin/storage/customers/${customer.id}`); }}>
                                <Eye className="w-4 h-4 mr-2" /> View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                                <Edit className="w-4 h-4 mr-2" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600" onClick={(e) => e.stopPropagation()}>
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageCustomers;
