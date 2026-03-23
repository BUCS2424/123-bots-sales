import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Search, Users, Mail, Phone, MapPin, ShoppingBag,
  DollarSign, Calendar, ChevronRight, UserPlus, LogIn
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../context/AuthContext';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminCustomers = () => {
  const navigate = useNavigate();
  const { startImpersonation } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [creatingTestCustomer, setCreatingTestCustomer] = useState(false);
  const [impersonatingCustomerId, setImpersonatingCustomerId] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await axios.get(`${API}/store/customers`);
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
    setLoading(false);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleCreateTestCustomer = async () => {
    setCreatingTestCustomer(true);
    try {
      const response = await axios.post(`${API}/admin/customers/create-test`, {}, {
        headers: getAuthHeaders(),
      });

      toast({
        title: response.data?.created ? 'Test customer created' : 'Test customer already exists',
        description: `${response.data?.email} / ${response.data?.password}`,
      });

      await fetchCustomers();
    } catch (error) {
      toast({
        title: 'Failed to create test customer',
        description: error.response?.data?.detail || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setCreatingTestCustomer(false);
    }
  };

  const handleImpersonateCustomer = async (customer) => {
    setImpersonatingCustomerId(customer.id);
    try {
      const response = await axios.post(
        `${API}/admin/customers/${customer.id}/impersonate`,
        {},
        { headers: getAuthHeaders() }
      );

      const { access_token, user } = response.data;
      const result = await startImpersonation(access_token, user);
      if (!result.success) {
        throw new Error(result.error || 'Could not start impersonation');
      }

      toast({
        title: 'Impersonation active',
        description: `Now signed in as ${user?.email || customer.email}`,
      });
      window.location.assign('/account');
    } catch (error) {
      toast({
        title: 'Impersonation failed',
        description: error.response?.data?.detail || error.message || 'Unable to impersonate this customer.',
        variant: 'destructive',
      });
    } finally {
      setImpersonatingCustomerId('');
    }
  };

  const handleViewCustomer = (customer) => {
    navigate(`/admin/customers/${customer.id}`);
  };

  const filteredCustomers = customers.filter(customer => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return customer.name.toLowerCase().includes(query) ||
             customer.email.toLowerCase().includes(query);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
        <p className="text-gray-500">View and manage your customer base</p>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleCreateTestCustomer}
          disabled={creatingTestCustomer}
          className="bg-[rgb(37, 99, 235)] hover:bg-[#5c2591] text-white"
          data-testid="create-test-customer-button"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {creatingTestCustomer ? 'Creating Test Customer...' : 'Create Test Customer'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-2xl font-bold">{customers.length}</p>
              </div>
              <Users className="w-10 h-10 text-[rgb(37, 99, 235)]/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold">
                  ${customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-10 h-10 text-[rgb(37, 99, 235)]/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">
                  {customers.reduce((sum, c) => sum + (c.total_orders || 0), 0)}
                </p>
              </div>
              <ShoppingBag className="w-10 h-10 text-[rgb(37, 99, 235)]/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search customers by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-[rgb(37, 99, 235)] border-t-transparent rounded-full" />
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Orders</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Total Spent</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[rgb(37, 99, 235)] rounded-full flex items-center justify-center text-white font-medium">
                            {customer.name?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{customer.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <p className="text-sm flex items-center gap-1">
                            <Mail className="w-3 h-3 text-gray-400" /> {customer.email}
                          </p>
                          {customer.phone && (
                            <p className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {customer.phone}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {customer.city && customer.state ? (
                          <span className="text-sm text-gray-500">
                            {customer.city}, {customer.state}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{customer.total_orders || 0} orders</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-green-600">
                          ${customer.total_spent?.toFixed(2) || '0.00'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleImpersonateCustomer(customer)}
                            disabled={impersonatingCustomerId === customer.id}
                            data-testid={`impersonate-customer-button-${customer.id}`}
                          >
                            <LogIn className="w-4 h-4 mr-1" />
                            {impersonatingCustomerId === customer.id ? 'Impersonating...' : 'Impersonate'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewCustomer(customer)}
                            data-testid={`view-customer-button-${customer.id}`}
                          >
                            View <ChevronRight className="w-4 h-4 ml-1" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No customers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCustomers;
