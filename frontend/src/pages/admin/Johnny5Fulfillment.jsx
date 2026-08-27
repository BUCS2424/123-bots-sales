import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Truck, Package, Send, CheckCircle, Clock, RefreshCw,
  MapPin, User, Store, ExternalLink, Printer, Tag, ShoppingBag, FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Johnny5Fulfillment = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [processingAction, setProcessingAction] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(null);
  const [showLabelModal, setShowLabelModal] = useState(null);
  const [trackingForm, setTrackingForm] = useState({
    tracking_number: '',
    carrier: 'usps'
  });
  const [labelForm, setLabelForm] = useState({
    provider: 'shippo',
    service: 'usps_priority',
    weight_oz: 8
  });

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  const fetchPendingOrders = async () => {
    try {
      // Fetch orders that need fulfillment
      const response = await axios.get(`${BACKEND_URL}/api/johnny5/orders?status=pending&limit=100`);
      const pendingOrders = response.data.orders || [];
      
      // Also get processing orders
      const processingResponse = await axios.get(`${BACKEND_URL}/api/johnny5/orders?status=processing&limit=100`);
      const processingOrders = processingResponse.data.orders || [];
      
      // And shipped orders that haven't pushed tracking
      const shippedResponse = await axios.get(`${BACKEND_URL}/api/johnny5/orders?status=shipped&limit=100`);
      const shippedOrders = (shippedResponse.data.orders || []).filter(o => 
        o.tracking && !o.tracking.pushed_at
      );
      
      setOrders([...pendingOrders, ...processingOrders, ...shippedOrders]);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
    setLoading(false);
  };

  const handleSelectOrder = (orderId) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter(id => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o.id));
    }
  };

  const handleAddTracking = async () => {
    if (!showTrackingModal || !trackingForm.tracking_number) {
      toast({ title: 'Error', description: 'Tracking number is required', variant: 'destructive' });
      return;
    }

    setProcessingAction(true);
    try {
      await axios.post(`${BACKEND_URL}/api/johnny5/orders/${showTrackingModal}/add-tracking`, {
        order_id: showTrackingModal,
        tracking_number: trackingForm.tracking_number,
        carrier: trackingForm.carrier
      });
      
      toast({ title: 'Success', description: 'Tracking added successfully' });
      setShowTrackingModal(null);
      setTrackingForm({ tracking_number: '', carrier: 'usps' });
      fetchPendingOrders();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to add tracking', variant: 'destructive' });
    }
    setProcessingAction(false);
  };

  const handlePushTracking = async (orderId) => {
    setProcessingAction(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/johnny5/orders/${orderId}/push-tracking`);
      
      if (response.data.success) {
        toast({ title: 'Success', description: 'Tracking pushed to store' });
        fetchPendingOrders();
      } else {
        toast({ title: 'Warning', description: response.data.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to push tracking', variant: 'destructive' });
    }
    setProcessingAction(false);
  };

  const handleBatchPushTracking = async () => {
    const ordersWithTracking = selectedOrders.filter(id => {
      const order = orders.find(o => o.id === id);
      return order?.tracking && !order?.tracking?.pushed_at;
    });

    if (ordersWithTracking.length === 0) {
      toast({ title: 'No Orders', description: 'No selected orders have tracking to push', variant: 'destructive' });
      return;
    }

    setProcessingAction(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/johnny5/orders/batch-push-tracking`, ordersWithTracking);
      
      toast({ title: 'Batch Complete', description: response.data.message });
      setSelectedOrders([]);
      fetchPendingOrders();
    } catch (error) {
      toast({ title: 'Error', description: 'Batch push failed', variant: 'destructive' });
    }
    setProcessingAction(false);
  };

  const handleMarkProcessing = async (orderId) => {
    try {
      await axios.put(`${BACKEND_URL}/api/johnny5/orders/${orderId}/status?status=processing`);
      toast({ title: 'Success', description: 'Order marked as processing' });
      fetchPendingOrders();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handlePurchaseLabel = async (orderId) => {
    setProcessingAction(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/johnny5/orders/${orderId}/purchase-label`, {
        order_id: orderId,
        provider: labelForm.provider,
        service: labelForm.service,
        weight_oz: labelForm.weight_oz
      });
      
      toast({ title: 'Success', description: 'Label purchased! Tracking added automatically.' });
      setShowLabelModal(null);
      fetchPendingOrders();
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to purchase label', 
        variant: 'destructive' 
      });
    }
    setProcessingAction(false);
  };

  const handleBatchPurchaseLabels = async () => {
    const pendingOrders = selectedOrders.filter(id => {
      const order = orders.find(o => o.id === id);
      return order?.status === 'pending' || order?.status === 'processing';
    });

    if (pendingOrders.length === 0) {
      toast({ title: 'No Orders', description: 'No selected orders need labels', variant: 'destructive' });
      return;
    }

    setProcessingAction(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/johnny5/orders/batch-purchase-labels`, {
        order_ids: pendingOrders,
        provider: labelForm.provider,
        service: labelForm.service,
        weight_oz: labelForm.weight_oz
      });
      
      toast({ title: 'Batch Complete', description: response.data.message });
      setSelectedOrders([]);
      fetchPendingOrders();
    } catch (error) {
      toast({ title: 'Error', description: 'Batch label purchase failed', variant: 'destructive' });
    }
    setProcessingAction(false);
  };

  const handlePrintInvoice = (orderId) => {
    // Open invoice in new window for printing
    window.open(`/admin/johnny5/invoice/${orderId}`, '_blank');
  };

  const handleBatchPrintInvoices = () => {
    // Print invoices for all selected orders
    selectedOrders.forEach(orderId => {
      window.open(`/admin/johnny5/invoice/${orderId}`, '_blank');
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 border-amber-300';
      case 'processing': return 'bg-blue-100 border-blue-300';
      case 'shipped': return 'bg-green-100 border-green-300';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="johnny5-fulfillment">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-green-600" />
            Fulfillment Center
          </h1>
          <p className="text-gray-500 mt-1">Process orders, add tracking, and push to stores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPendingOrders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          {selectedOrders.length > 0 && (
            <>
              <Button 
                onClick={handleBatchPurchaseLabels}
                disabled={processingAction}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Buy Labels ({selectedOrders.length})
              </Button>
              <Button 
                onClick={handleBatchPrintInvoices}
                variant="outline"
              >
                <FileText className="w-4 h-4 mr-2" />
                Print Invoices
              </Button>
              <Button 
                onClick={handleBatchPushTracking}
                disabled={processingAction}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Push Tracking
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Pending</p>
                <p className="text-2xl font-bold text-amber-700">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Processing</p>
                <p className="text-2xl font-bold text-blue-700">
                  {orders.filter(o => o.status === 'processing').length}
                </p>
              </div>
              <Package className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Ready to Push</p>
                <p className="text-2xl font-bold text-green-700">
                  {orders.filter(o => o.tracking && !o.tracking.pushed_at).length}
                </p>
              </div>
              <Send className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add Tracking Modal */}
      {showTrackingModal && (
        <Card className="border-2 border-green-500">
          <CardHeader>
            <CardTitle>Add Tracking Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Carrier</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1"
                value={trackingForm.carrier}
                onChange={(e) => setTrackingForm({ ...trackingForm, carrier: e.target.value })}
              >
                <option value="usps">USPS</option>
                <option value="ups">UPS</option>
                <option value="fedex">FedEx</option>
                <option value="dhl">DHL</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <Label>Tracking Number</Label>
              <Input
                value={trackingForm.tracking_number}
                onChange={(e) => setTrackingForm({ ...trackingForm, tracking_number: e.target.value })}
                placeholder="Enter tracking number"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddTracking}
                disabled={processingAction}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {processingAction ? 'Adding...' : 'Add Tracking'}
              </Button>
              <Button variant="outline" onClick={() => setShowTrackingModal(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Purchase Label Modal */}
      {showLabelModal && (
        <Card className="border-2 border-purple-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-purple-600" />
              Purchase Shipping Label
            </CardTitle>
            <CardDescription>Buy a label and automatically add tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Shipping Provider</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1"
                value={labelForm.provider}
                onChange={(e) => setLabelForm({ ...labelForm, provider: e.target.value })}
              >
                <option value="shippo">Shippo</option>
                <option value="easypost">EasyPost</option>
                <option value="shipstation">ShipStation</option>
              </select>
            </div>
            <div>
              <Label>Service</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1"
                value={labelForm.service}
                onChange={(e) => setLabelForm({ ...labelForm, service: e.target.value })}
              >
                <option value="usps_first_class">USPS First Class</option>
                <option value="usps_priority">USPS Priority Mail</option>
                <option value="usps_express">USPS Express Mail</option>
                <option value="ups_ground">UPS Ground</option>
                <option value="fedex_ground">FedEx Ground</option>
              </select>
            </div>
            <div>
              <Label>Package Weight (oz)</Label>
              <Input
                type="number"
                value={labelForm.weight_oz}
                onChange={(e) => setLabelForm({ ...labelForm, weight_oz: parseFloat(e.target.value) || 8 })}
                min="1"
                step="0.5"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => handlePurchaseLabel(showLabelModal)}
                disabled={processingAction}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {processingAction ? 'Purchasing...' : 'Purchase Label'}
              </Button>
              <Button variant="outline" onClick={() => setShowLabelModal(null)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders Queue */}
      {orders.length === 0 ? (
        <Card className="bg-gray-50">
          <CardContent className="py-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">All Caught Up!</h3>
            <p className="text-gray-500">No orders need fulfillment at this time</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Fulfillment Queue ({orders.length})</CardTitle>
              <Button variant="ghost" size="sm" onClick={handleSelectAll}>
                {selectedOrders.length === orders.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`p-4 rounded-lg border-2 ${getStatusColor(order.status)} transition-all ${
                    selectedOrders.includes(order.id) ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => handleSelectOrder(order.id)}
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            #{order.store_order_number || order.store_order_id?.slice(0, 8)}
                          </span>
                          <Badge variant={
                            order.status === 'pending' ? 'secondary' :
                            order.status === 'processing' ? 'default' : 'success'
                          }>
                            {order.status}
                          </Badge>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Store className="w-3 h-3" />
                            {order.store_name}
                          </span>
                        </div>
                        <span className="font-bold text-lg">
                          ${order.totals?.total?.toFixed(2)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {order.customer?.name}
                          </p>
                          <p className="text-gray-500">{order.customer?.email}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.zip}
                          </p>
                          <p className="text-gray-500">{order.shipping_address?.address1}</p>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="mt-2 text-sm">
                        <span className="text-gray-500">
                          {order.items?.length || 0} item(s): {order.items?.map(i => i.name || i.title).join(', ').slice(0, 50)}...
                        </span>
                      </div>

                      {/* Tracking Info */}
                      {order.tracking && (
                        <div className="mt-2 p-2 bg-white rounded border">
                          <p className="text-sm">
                            <span className="font-medium">Tracking:</span>{' '}
                            {order.tracking.carrier?.toUpperCase()} - {order.tracking.tracking_number}
                            {order.tracking.pushed_at && (
                              <Badge className="ml-2 bg-green-100 text-green-700">Pushed</Badge>
                            )}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {order.status === 'pending' && (
                          <Button size="sm" variant="outline" onClick={() => handleMarkProcessing(order.id)}>
                            <Package className="w-3 h-3 mr-1" />
                            Mark Processing
                          </Button>
                        )}
                        
                        {!order.tracking && (
                          <>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700" onClick={() => setShowLabelModal(order.id)}>
                              <ShoppingBag className="w-3 h-3 mr-1" />
                              Buy Label
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setShowTrackingModal(order.id)}>
                              <Tag className="w-3 h-3 mr-1" />
                              Add Tracking
                            </Button>
                          </>
                        )}
                        
                        {order.tracking && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handlePrintInvoice(order.id)}>
                              <FileText className="w-3 h-3 mr-1" />
                              Print Invoice
                            </Button>
                            {!order.tracking.pushed_at && (
                              <Button 
                                size="sm" 
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handlePushTracking(order.id)}
                                disabled={processingAction}
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Push Tracking
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Johnny5Fulfillment;
