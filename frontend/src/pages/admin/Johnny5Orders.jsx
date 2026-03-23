import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, Clock, Truck, CheckCircle, Search, Filter, 
  RefreshCw, ExternalLink, Store, User, MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Johnny5Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    store_id: '',
    status: '',
    search: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchStores();
  }, [filters.store_id, filters.status]);

  const fetchOrders = async () => {
    try {
      let url = `${BACKEND_URL}/api/johnny5/orders?limit=50`;
      if (filters.store_id) url += `&store_id=${filters.store_id}`;
      if (filters.status) url += `&status=${filters.status}`;
      
      const response = await axios.get(url);
      setOrders(response.data.orders || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
    setLoading(false);
  };

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/johnny5/stores`);
      setStores(response.data.stores || []);
    } catch (error) {
      console.error('Failed to fetch stores:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'processing': return <Package className="w-4 h-4 text-blue-500" />;
      case 'shipped': return <Truck className="w-4 h-4 text-green-500" />;
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />;
      default: return <Package className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      pending: 'bg-amber-100 text-amber-700',
      processing: 'bg-blue-100 text-blue-700',
      shipped: 'bg-green-100 text-green-700',
      delivered: 'bg-green-200 text-green-800',
      cancelled: 'bg-red-100 text-red-700'
    };
    return variants[status] || 'bg-gray-100 text-gray-700';
  };

  const filteredOrders = orders.filter(order => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      order.customer?.name?.toLowerCase().includes(searchLower) ||
      order.customer?.email?.toLowerCase().includes(searchLower) ||
      order.store_order_id?.toLowerCase().includes(searchLower) ||
      order.store_order_number?.toString().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="johnny5-orders">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="w-8 h-8 text-amber-600" />
            All Orders
          </h1>
          <p className="text-gray-500 mt-1">{total} orders from {stores.length} connected stores</p>
        </div>
        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search orders..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={filters.store_id || "all"}
              onValueChange={(value) => setFilters({ ...filters, store_id: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? "" : value })}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="py-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Found</h3>
            <p className="text-gray-500">
              {filters.search || filters.store_id || filters.status 
                ? 'Try adjusting your filters' 
                : 'Orders from connected stores will appear here'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <Card 
              key={order.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/johnny5/invoice/${order.id}`)}
              data-testid={`johnny5-order-row-${order.id}`}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      order.status === 'pending' ? 'bg-amber-100' :
                      order.status === 'processing' ? 'bg-blue-100' :
                      order.status === 'shipped' ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      {getStatusIcon(order.status)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          #{order.store_order_number || order.store_order_id?.slice(0, 8)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Store className="w-3 h-3" />
                          {order.store_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {order.customer?.name}
                        </span>
                        {order.shipping_address?.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.shipping_address.city}, {order.shipping_address.state}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      ${order.totals?.total?.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(order.received_at).toLocaleDateString()}
                    </p>
                    {order.tracking && (
                      <p className="text-xs text-green-600 mt-1">
                        Tracking: {order.tracking.tracking_number?.slice(0, 12)}...
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Johnny5Orders;
