import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Zap, Store, Package, Truck, Clock, CheckCircle, AlertCircle,
  ArrowRight, RefreshCw, Plus, ExternalLink, TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Johnny5Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/johnny5/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="johnny5-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Johnny 5 Portal</h1>
            <p className="text-gray-500">Multi-Store Fulfillment Hub</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Connected Stores</p>
                <p className="text-3xl font-bold text-blue-700">{stats?.stores?.active || 0}</p>
                <p className="text-xs text-blue-500">{stats?.stores?.total || 0} total</p>
              </div>
              <Store className="w-10 h-10 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Pending Orders</p>
                <p className="text-3xl font-bold text-amber-700">{stats?.orders?.pending || 0}</p>
                <p className="text-xs text-amber-500">Awaiting fulfillment</p>
              </div>
              <Clock className="w-10 h-10 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Processing</p>
                <p className="text-3xl font-bold text-purple-700">{stats?.orders?.processing || 0}</p>
                <p className="text-xs text-purple-500">In progress</p>
              </div>
              <Package className="w-10 h-10 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Shipped Today</p>
                <p className="text-3xl font-bold text-green-700">{stats?.today?.shipped || 0}</p>
                <p className="text-xs text-green-500">{stats?.today?.received || 0} received</p>
              </div>
              <Truck className="w-10 h-10 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-300"
          onClick={() => navigate('/admin/johnny5/stores')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Manage Stores</h3>
                <p className="text-sm text-gray-500">Connect & configure stores</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-amber-300"
          onClick={() => navigate('/admin/johnny5/orders')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">View Orders</h3>
                <p className="text-sm text-gray-500">All orders from all stores</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-300"
          onClick={() => navigate('/admin/johnny5/fulfillment')}
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                <Truck className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Fulfillment Center</h3>
                <p className="text-sm text-gray-500">Ship & push tracking</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-indigo-300"
          onClick={() => navigate('/admin/johnny5/pricing-stock')}
          data-testid="johnny5-pricing-stock-card"
        >
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Pricing & Stock</h3>
                <p className="text-sm text-gray-500">Import/export sheet + options stock</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest orders from connected stores</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/johnny5/orders')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recent_orders && stats.recent_orders.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  onClick={() => navigate(`/admin/johnny5/orders/${order.id}`)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      order.status === 'pending' ? 'bg-amber-100' :
                      order.status === 'processing' ? 'bg-blue-100' :
                      order.status === 'shipped' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {order.status === 'pending' && <Clock className="w-5 h-5 text-amber-600" />}
                      {order.status === 'processing' && <Package className="w-5 h-5 text-blue-600" />}
                      {order.status === 'shipped' && <CheckCircle className="w-5 h-5 text-green-600" />}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Order #{order.store_order_number || order.store_order_id?.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.store_name} • {order.customer?.name}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.totals?.total?.toFixed(2)}</p>
                    <Badge variant={
                      order.status === 'pending' ? 'secondary' :
                      order.status === 'processing' ? 'default' :
                      order.status === 'shipped' ? 'success' : 'outline'
                    }>
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No orders yet</p>
              <p className="text-sm text-gray-400">Connect a store to start receiving orders</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            How Johnny 5 Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Connect Store</h4>
              <p className="text-sm text-gray-500">Add API keys to your cloned stores</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-amber-600">2</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Orders Flow In</h4>
              <p className="text-sm text-gray-500">Orders automatically sync here</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Ship Orders</h4>
              <p className="text-sm text-gray-500">Purchase labels & fulfill</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-xl font-bold text-green-600">4</span>
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Push Tracking</h4>
              <p className="text-sm text-gray-500">One-click tracking sync back</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Johnny5Dashboard;
