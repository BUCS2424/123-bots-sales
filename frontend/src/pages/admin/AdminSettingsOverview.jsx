import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  BarChart3,
  Calendar,
  Loader2,
  Package,
  ShoppingBag,
  CreditCard,
  Receipt,
  Users,
  Timer,
  Warehouse,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatMoney = (value = 0) =>
  Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MetricCard = ({ title, value, subtitle, icon: Icon, testId }) => (
  <Card data-testid={testId}>
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle ? <p className="text-xs text-gray-500 mt-1">{subtitle}</p> : null}
        </div>
        <div className="p-2 rounded-lg bg-amber-50">
          <Icon className="w-5 h-5 text-amber-600" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const AdminSettingsDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    totalOrders: 0,
    inStockProducts: 0,
    pendingOrders: 0,
  });

  const [inactivityTimeout, setInactivityTimeout] = useState('3');
  const [screensaverTimeout, setScreensaverTimeout] = useState('2');

  const loadSessionSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/admin-settings/session`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const inactivity = response.data.inactivity_timeout?.toString() || '3';
      const screensaver = response.data.screensaver_timeout?.toString() || '2';
      setInactivityTimeout(inactivity);
      setScreensaverTimeout(screensaver);
      localStorage.setItem('admin_inactivity_timeout', inactivity);
      localStorage.setItem('admin_screensaver_timeout', screensaver);
    } catch (error) {
      const fallbackInactivity = localStorage.getItem('admin_inactivity_timeout');
      const fallbackScreensaver = localStorage.getItem('admin_screensaver_timeout');
      if (fallbackInactivity) setInactivityTimeout(fallbackInactivity);
      if (fallbackScreensaver) setScreensaverTimeout(fallbackScreensaver);
    }
  };

  const saveSessionSettings = async (inactivity, screensaver) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/admin-settings/session`,
        {
          inactivity_timeout: parseInt(inactivity, 10),
          screensaver_timeout: parseInt(screensaver, 10),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      localStorage.setItem('admin_inactivity_timeout', inactivity);
      localStorage.setItem('admin_screensaver_timeout', screensaver);
      toast({ title: 'Settings Saved', description: 'Session timeout settings updated.' });
    } catch (error) {
      localStorage.setItem('admin_inactivity_timeout', inactivity);
      localStorage.setItem('admin_screensaver_timeout', screensaver);
      toast({ title: 'Saved Locally', description: 'Unable to sync to server, kept local values.', variant: 'destructive' });
    }
  };

  const handleInactivityChange = (value) => {
    setInactivityTimeout(value);
    saveSessionSettings(value, screensaverTimeout);
  };

  const handleScreensaverChange = (value) => {
    setScreensaverTimeout(value);
    saveSessionSettings(inactivityTimeout, value);
  };

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [analyticsRes, productsRes, ordersRes] = await Promise.all([
        axios.get(`${API}/store/analytics/stats`, { headers }).catch(() => ({ data: {} })),
        axios.get(`${API}/store/products`, { headers }).catch(() => ({ data: [] })),
        axios.get(`${API}/store/orders`, { headers }).catch(() => ({ data: [] })),
      ]);

      const orders = ordersRes.data || [];
      const totalRevenue = orders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
      const monthlyRevenue = orders
        .filter((order) => new Date(order.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, order) => sum + (order.total_amount || 0), 0);

      setStats({
        totalRevenue,
        monthlyRevenue,
        totalOrders: orders.length,
        inStockProducts: (productsRes.data || []).filter((product) => product.in_stock).length,
        pendingOrders: orders.filter((order) => order.status === 'pending').length,
      });

      if (analyticsRes.data?.warning) {
        toast({ title: 'Notice', description: analyticsRes.data.warning });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load catalog metrics.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadSessionSettings();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="admin-settings-dashboard-loading">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(37, 99, 235)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="admin-settings-dashboard">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-[rgb(37, 99, 235)]" />
            Admin Settings Dashboard
          </h1>
          <p className="text-gray-500">Catalog operations overview</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>

      <Card className="bg-gradient-to-r from-[rgb(37, 99, 235)] to-[#2d5a8f] text-white">
        <CardContent className="py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-white/70 text-sm uppercase tracking-wider mb-1">Total Revenue</p>
              <p className="text-4xl font-bold">${formatMoney(stats.totalRevenue)}</p>
            </div>
            <div className="md:border-x md:border-white/20">
              <p className="text-white/70 text-sm uppercase tracking-wider mb-1">This Month</p>
              <p className="text-4xl font-bold">${formatMoney(stats.monthlyRevenue)}</p>
            </div>
            <div>
              <p className="text-white/70 text-sm uppercase tracking-wider mb-1">Total Orders</p>
              <p className="text-4xl font-bold">{stats.totalOrders}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="In-Stock Products" value={stats.inStockProducts} subtitle="catalog items" icon={Package} testId="metric-in-stock-products" />
        <MetricCard title="Pending Orders" value={stats.pendingOrders} subtitle="needs action" icon={AlertCircle} testId="metric-pending-orders" />
        <MetricCard title="Orders (30d)" value={stats.totalOrders} subtitle="all statuses" icon={Receipt} testId="metric-orders-30d" />
        <MetricCard title="Active Catalog" value={stats.inStockProducts} subtitle="product inventory" icon={ShoppingBag} testId="metric-active-catalog" />
      </div>

      <Card data-testid="session-settings-card">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Timer className="w-5 h-5 text-[rgb(37, 99, 235)]" />
            Session Settings
          </CardTitle>
          <CardDescription>Configure admin inactivity behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="inactivity-timeout" className="text-sm font-medium text-gray-700">Inactivity Timeout</Label>
              <select
                id="inactivity-timeout"
                value={inactivityTimeout}
                onChange={(event) => handleInactivityChange(event.target.value)}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-testid="inactivity-timeout-select"
              >
                <option value="0">Disabled</option>
                <option value="1">1 minute</option>
                <option value="2">2 minutes</option>
                <option value="3">3 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
              </select>
            </div>

            <div>
              <Label htmlFor="screensaver-timeout" className="text-sm font-medium text-gray-700">Screensaver Timeout</Label>
              <select
                id="screensaver-timeout"
                value={screensaverTimeout}
                onChange={(event) => handleScreensaverChange(event.target.value)}
                className="mt-2 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                data-testid="screensaver-timeout-select"
              >
                <option value="0">Disabled</option>
                <option value="1">1 minute</option>
                <option value="2">2 minutes</option>
                <option value="3">3 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
          <CardDescription>Common administration tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/products/new">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2" data-testid="quick-action-add-product">
                <Package className="w-6 h-6 text-[rgb(37, 99, 235)]" />
                <span>Add Product</span>
              </Button>
            </Link>
            <Link to="/admin/cart/pos">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2" data-testid="quick-action-open-pos">
                <CreditCard className="w-6 h-6 text-[rgb(37, 99, 235)]" />
                <span>Open POS</span>
              </Button>
            </Link>
            <Link to="/admin/orders">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2" data-testid="quick-action-view-orders">
                <Receipt className="w-6 h-6 text-purple-600" />
                <span>View Orders</span>
              </Button>
            </Link>
            <Link to="/admin/customers">
              <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2" data-testid="quick-action-customers">
                <Users className="w-6 h-6 text-amber-600" />
                <span>Customers</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Settings</CardTitle>
          <CardDescription>Configuration relevant to catalog operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link to="/admin/settings" className="block">
              <div className="p-4 border rounded-lg hover:border-[rgb(37, 99, 235)] hover:bg-red-50 transition-all">
                <h3 className="font-medium flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  Profile Settings
                </h3>
                <p className="text-sm text-gray-500 mt-1">Manage your account and preferences</p>
              </div>
            </Link>

            <Link to="/admin/settings/storage" className="block">
              <div className="p-4 border rounded-lg hover:border-[rgb(37, 99, 235)] hover:bg-red-50 transition-all">
                <h3 className="font-medium flex items-center gap-2">
                  <Warehouse className="w-5 h-5 text-gray-600" />
                  Cloud Storage
                </h3>
                <p className="text-sm text-gray-500 mt-1">Configure iDrive E2 asset storage</p>
              </div>
            </Link>

            <Link to="/admin/settings/payments" className="block">
              <div className="p-4 border rounded-lg hover:border-[rgb(37, 99, 235)] hover:bg-red-50 transition-all">
                <h3 className="font-medium flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-gray-600" />
                  Payment Settings
                </h3>
                <p className="text-sm text-gray-500 mt-1">Configure Stripe and payment methods</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsDashboard;
