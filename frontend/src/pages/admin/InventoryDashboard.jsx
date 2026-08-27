import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Package, AlertTriangle, TrendingUp, Truck, Factory, 
  ArrowRight, RefreshCw, DollarSign, Clock
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const InventoryDashboard = () => {
  const [dashboard, setDashboard] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dashboardRes, recsRes] = await Promise.all([
        axios.get(`${API}/inventory/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API}/inventory/recommendations`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);
      setDashboard(dashboardRes.data);
      setRecommendations(recsRes.data);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
      toast({ title: 'Error', description: 'Failed to load inventory dashboard', variant: 'destructive' });
    }
    setLoading(false);
  };

  const handleSyncProducts = async () => {
    try {
      const response = await axios.post(`${API}/inventory/sync-products`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Sync Complete', description: response.data.message });
      fetchData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to sync products', variant: 'destructive' });
    }
  };

  const handleSendTestReport = async () => {
    try {
      await axios.post(`${API}/inventory/send-test-report`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast({ title: 'Report Sent', description: 'Test inventory report has been sent' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send test report', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const summary = dashboard?.summary || {};
  const lowStockAlerts = dashboard?.low_stock_alerts || [];
  const recentTransactions = dashboard?.recent_transactions || [];
  const recSummary = recommendations?.summary || {};

  return (
    <div className="min-h-screen bg-gray-900 p-6" data-testid="inventory-dashboard">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Inventory Management</h1>
            <p className="text-gray-400 mt-1">Monitor stock levels, manage manufacturers, and track orders</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleSyncProducts} data-testid="sync-products-btn">
              <RefreshCw className="w-4 h-4 mr-2" />
              Sync Products
            </Button>
            <Button variant="outline" onClick={handleSendTestReport}>
              Send Test Report
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Package className="w-8 h-8 text-blue-500" />
                <span className="text-2xl font-bold text-white">{summary.total_items || 0}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Total Items</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <span className="text-2xl font-bold text-yellow-500">{summary.low_stock_items || 0}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Low Stock</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <span className="text-2xl font-bold text-red-500">{summary.out_of_stock || 0}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Out of Stock</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Factory className="w-8 h-8 text-purple-500" />
                <span className="text-2xl font-bold text-white">{summary.total_manufacturers || 0}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Manufacturers</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <Truck className="w-8 h-8 text-green-500" />
                <span className="text-2xl font-bold text-white">{summary.pending_purchase_orders || 0}</span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Pending POs</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold text-white">
                  ${(summary.inventory_value || 0).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-400 text-sm mt-2">Inventory Value</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Order Recommendations Summary */}
          <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                Weekly Order Recommendations
              </CardTitle>
              <Link to="/admin/inventory/recommendations">
                <Button variant="ghost" size="sm" className="text-blue-400">
                  View All <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {recommendations?.recommendations?.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 bg-gray-900 rounded-lg">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-white">{recSummary.total_manufacturers || 0}</p>
                      <p className="text-sm text-gray-400">Manufacturers</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-400">{recSummary.total_items_to_order || 0}</p>
                      <p className="text-sm text-gray-400">Items to Order</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-400">
                        ${(recSummary.total_estimated_cost || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">Est. Cost</p>
                    </div>
                  </div>
                  
                  {recommendations.recommendations.slice(0, 3).map((rec, idx) => (
                    <div key={idx} className="p-4 bg-gray-900 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-white">{rec.manufacturer?.name || 'Unknown'}</span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-400">{rec.lead_time_days} days lead time</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">{rec.items?.length || 0} items</span>
                        <span className="text-green-400">${(rec.total_estimated_cost || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No order recommendations at this time</p>
                  <p className="text-sm mt-2">All inventory levels are healthy</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/inventory/items" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Package className="w-4 h-4 mr-2" />
                  Manage Inventory Items
                </Button>
              </Link>
              <Link to="/admin/inventory/manufacturers" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Factory className="w-4 h-4 mr-2" />
                  Manage Manufacturers
                </Button>
              </Link>
              <Link to="/admin/inventory/purchase-orders" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Truck className="w-4 h-4 mr-2" />
                  Purchase Orders
                </Button>
              </Link>
              <Link to="/admin/inventory/recommendations" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Recommendations
                </Button>
              </Link>
              <Link to="/admin/inventory/settings" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alerts & Recent Transactions */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Low Stock Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockAlerts.length > 0 ? (
                <div className="space-y-3">
                  {lowStockAlerts.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{item.product_name}</p>
                        <p className="text-sm text-gray-400">SKU: {item.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={item.current_stock <= 0 ? 'destructive' : 'warning'}>
                          {item.current_stock} in stock
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">Reorder at: {item.reorder_point}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-400">No low stock alerts</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length > 0 ? (
                <div className="space-y-3">
                  {recentTransactions.map((tx, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{tx.product_name}</p>
                        <p className="text-sm text-gray-400">{tx.reason || tx.adjustment_type}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={tx.adjustment_type === 'add' || tx.adjustment_type === 'received' ? 'success' : 'secondary'}>
                          {tx.adjustment_type === 'add' || tx.adjustment_type === 'received' ? '+' : '-'}{tx.quantity}
                        </Badge>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-8 text-gray-400">No recent transactions</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboard;
