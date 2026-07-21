import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Eye, Package, Truck, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, MapPin, Mail, Phone, DollarSign, CreditCard,
  Wallet, RefreshCw, Send, Repeat, Printer, Copy, ExternalLink, AlertTriangle
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';
import { getDisplayOptionSummary } from '../../lib/productOptions';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const orderStatuses = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'awaiting_payment', label: 'Awaiting Payment', icon: Wallet, color: 'bg-orange-100 text-orange-800' },
  { value: 'paid', label: 'Paid', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
  { value: 'processing', label: 'Processing', icon: Package, color: 'bg-blue-100 text-blue-800' },
  { value: 'shipment_pending', label: 'Shipment Pending', icon: AlertTriangle, color: 'bg-amber-100 text-amber-800' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-100 text-purple-800' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-100 text-red-800' },
  { value: 'refunded', label: 'Refunded', icon: XCircle, color: 'bg-gray-100 text-gray-800' },
];

const paymentMethodIcons = {
  card: CreditCard,
  cashapp: DollarSign,
  venmo: Wallet,
  demo: Clock
};

const paymentMethodLabels = {
  card: 'Credit Card',
  cashapp: 'CashApp',
  venmo: 'Venmo',
  demo: 'Demo'
};

const paymentMethodColors = {
  card: 'bg-slate-100 text-slate-700',
  cashapp: 'bg-green-100 text-green-700',
  venmo: 'bg-blue-100 text-blue-700',
  demo: 'bg-gray-100 text-gray-500'
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [sendingToShippo, setSendingToShippo] = useState(false);
  const [printfulEligibilityByOrder, setPrintfulEligibilityByOrder] = useState({});
  const [printfulEligibilityLoading, setPrintfulEligibilityLoading] = useState(false);
  const [sendingPrintfulOrderId, setSendingPrintfulOrderId] = useState('');
  const [editingShipping, setEditingShipping] = useState(false);
  const [shippingInput, setShippingInput] = useState('');
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingRateOptions, setShippingRateOptions] = useState([]);
  const [savingShipping, setSavingShipping] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      // Fetch from payments orders endpoint (where checkout orders are stored)
      const response = await axios.get(`${API}/payments/orders`);
      let allOrders = response.data?.orders || [];
      
      // Filter by status if needed
      if (statusFilter !== 'all') {
        allOrders = allOrders.filter(o => o.status === statusFilter);
      }
      
      setOrders(allOrders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.tracking_number || '');
    setIsDetailOpen(true);
    fetchPrintfulEligibility(order.id);
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchPrintfulEligibility = async (orderId) => {
    if (!orderId) return;
    setPrintfulEligibilityLoading(true);
    try {
      const response = await axios.get(`${API}/printful/orders/${orderId}/eligibility`, {
        headers: getAuthHeaders()
      });
      setPrintfulEligibilityByOrder((prev) => ({
        ...prev,
        [orderId]: response.data || {}
      }));
    } catch (error) {
      setPrintfulEligibilityByOrder((prev) => ({
        ...prev,
        [orderId]: {
          eligible: false,
          unresolved_items: [error.response?.data?.detail || 'Could not determine Printful eligibility'],
          already_submitted: false,
          sendable_items_count: 0
        }
      }));
    } finally {
      setPrintfulEligibilityLoading(false);
    }
  };

  const handleSendToPrintful = async (order) => {
    if (!order?.id) return;
    setSendingPrintfulOrderId(order.id);
    try {
      const response = await axios.post(
        `${API}/printful/orders/${order.id}/submit`,
        {},
        { headers: getAuthHeaders() }
      );

      const data = response.data || {};
      toast({
        title: data.already_submitted ? 'Already sent' : 'Sent to Printful',
        description: data.message || 'Order submitted to Printful successfully.'
      });

      await fetchOrders();
      await fetchPrintfulEligibility(order.id);

      const refreshedOrder = await axios.get(`${API}/payments/orders/${order.id}`);
      if (refreshedOrder.data) {
        setSelectedOrder(refreshedOrder.data);
      }
    } catch (error) {
      toast({
        title: 'Send to Printful failed',
        description: error.response?.data?.detail || 'Could not send this order to Printful.',
        variant: 'destructive'
      });
      await fetchPrintfulEligibility(order.id);
    } finally {
      setSendingPrintfulOrderId('');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    try {
      await axios.patch(`${API}/payments/orders/${selectedOrder.id}/status?status=${newStatus}`);
      toast({ title: 'Order Updated', description: `Order status changed to ${newStatus}` });
      fetchOrders();
      setIsDetailOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' });
    }
  };

  const handleSendToShippo = async () => {
    if (!selectedOrder) return;
    setSendingToShippo(true);
    try {
      const response = await axios.post(`${API}/shipping/orders/${selectedOrder.id}/create-label`, {}, { headers: getAuthHeaders() });
      const d = response.data;
      if (d.success === false || d.shipment_pending) {
        toast({
          title: 'Shipment Pending — Review Needed',
          description: d.error || 'Label purchase failed. Order set to Shipment Pending.',
          variant: 'destructive'
        });
      } else if (d.already_shipped) {
        toast({ title: 'Already Shipped', description: `Tracking: ${d.tracking_number}` });
      } else {
        toast({ title: 'Label Purchased', description: `${d.carrier} ${d.service} • Tracking ${d.tracking_number}` });
      }
      setTrackingNumber(d.tracking_number || '');
      const refreshed = await axios.get(`${API}/payments/orders/${selectedOrder.id}`);
      setSelectedOrder(refreshed.data);
      fetchOrders();
    } catch (error) {
      toast({ title: 'Shipping Failed', description: error.response?.data?.detail || 'Could not create label. Check the provider is enabled & funded.', variant: 'destructive' });
    } finally {
      setSendingToShippo(false);
    }
  };

  const handleEditShippingClick = () => {
    setShippingInput(String(Number(selectedOrder?.shipping_cost || 0)));
    setShippingRateOptions([]);
    setEditingShipping(true);
  };

  const handleCancelEditShipping = () => {
    setEditingShipping(false);
    setShippingRateOptions([]);
  };

  const handleCalculateShippingRates = async () => {
    if (!selectedOrder) return;
    setCalculatingShipping(true);
    setShippingRateOptions([]);
    try {
      const shipTo = selectedOrder.shipping || {};
      const shipAddr = selectedOrder.shipping_address || {};
      const res = await axios.post(`${API}/shipping/rates/checkout`, {
        to_address: {
          name: selectedOrder.customer_name || 'Customer',
          street1: shipTo.address1 || shipAddr.address || '',
          street2: shipTo.address2 || '',
          city: shipTo.city || shipAddr.city || '',
          state: shipTo.state || shipAddr.state || '',
          zip_code: shipTo.zipCode || shipAddr.zip_code || '',
          country: 'US',
        },
        items: (selectedOrder.items || []).map(i => ({ product_id: i.product_id, quantity: i.quantity || 1 })),
        order_subtotal: selectedOrder.subtotal || 0,
      }, { headers: getAuthHeaders() });
      const rates = res.data?.rates || [];
      setShippingRateOptions(rates);
      if (rates.length === 0) {
        toast({ title: 'No rates found', description: 'Enter a shipping amount manually.', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Calculation Failed', description: error.response?.data?.detail || 'Could not fetch carrier rates.', variant: 'destructive' });
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleSaveShipping = async () => {
    if (!selectedOrder) return;
    const cost = parseFloat(shippingInput);
    if (isNaN(cost) || cost < 0) {
      toast({ title: 'Invalid amount', description: 'Enter a valid shipping cost.', variant: 'destructive' });
      return;
    }
    setSavingShipping(true);
    try {
      const res = await axios.patch(`${API}/payments/orders/${selectedOrder.id}/shipping`, { shipping_cost: cost }, { headers: getAuthHeaders() });
      setSelectedOrder(res.data);
      setEditingShipping(false);
      setShippingRateOptions([]);
      toast({ title: 'Shipping Updated', description: `Shipping set to $${cost.toFixed(2)}. Total recalculated.` });
      fetchOrders();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to update shipping', variant: 'destructive' });
    } finally {
      setSavingShipping(false);
    }
  };

  const handleToggleRecurring = async (order, isRecurring) => {
    try {
      await axios.put(`${API}/store/orders/${order.id}/recurring?is_recurring=${isRecurring}&interval_days=30`);
      toast({
        title: isRecurring ? 'Recurring Enabled' : 'Recurring Disabled',
        description: isRecurring ? 'Customer will receive invoices for this order' : 'Recurring invoices disabled' 
      });
      fetchOrders();
    } catch (error) {
      console.error('Failed to toggle recurring:', error);
      toast({ title: 'Error', description: 'Failed to update recurring status', variant: 'destructive' });
    }
  };

  const handleSendRecurringInvoice = async (order) => {
    if (!window.confirm(`Send a recurring invoice to ${order.customer_name} for ${order.total?.toFixed(2) || '0.00'}?`)) return;
    try {
      const response = await axios.post(`${API}/store/orders/${order.id}/send-recurring-invoice`);
      toast({ 
        title: 'Invoice Sent', 
        description: `New order ${response.data.new_order?.order_number} created awaiting payment` 
      });
      fetchOrders();
    } catch (error) {
      console.error('Failed to send invoice:', error);
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to send invoice', variant: 'destructive' });
    }
  };

  const getStatusInfo = (status) => {
    return orderStatuses.find(s => s.value === status) || orderStatuses[0];
  };

  const copyPaymentRef = async (value, label) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      toast({ title: 'Copied', description: `${label} copied to clipboard.` });
    } catch (error) {
      toast({ title: 'Copy Failed', description: 'Could not copy to clipboard.', variant: 'destructive' });
    }
  };

  const filteredOrders = orders.filter(order => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return order.order_number.toLowerCase().includes(query) ||
             order.customer_name.toLowerCase().includes(query) ||
             order.customer_email.toLowerCase().includes(query);
    }
    return true;
  });

  const orderCounts = {
    all: orders.length,
    awaiting_payment: orders.filter(o => o.status === 'awaiting_payment').length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    processing: orders.filter(o => o.status === 'processing').length,
    shipment_pending: orders.filter(o => o.status === 'shipment_pending').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  const tabLabels = {
    all: 'All',
    awaiting_payment: 'Awaiting Payment',
    paid: 'Paid',
    processing: 'Processing',
    shipment_pending: 'Shipment Pending',
    shipped: 'Shipped',
    delivered: 'Delivered',
  };

  // Get payment method icon
  const getPaymentIcon = (method) => {
    return paymentMethodIcons[method] || CreditCard;
  };

  const selectedOrderEligibility = selectedOrder ? (printfulEligibilityByOrder[selectedOrder.id] || null) : null;
  const canShowSendToPrintful = Boolean(selectedOrderEligibility?.eligible || selectedOrderEligibility?.already_submitted);
  const sendToPrintfulDisabled =
    !selectedOrder ||
    sendingPrintfulOrderId === selectedOrder?.id ||
    printfulEligibilityLoading ||
    Boolean(selectedOrderEligibility?.already_submitted) ||
    !selectedOrderEligibility?.eligible;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-gray-500">Manage and fulfill customer orders</p>
      </div>

      {/* Status Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'awaiting_payment', 'paid', 'processing', 'shipment_pending', 'shipped', 'delivered'].map((status) => {
          const isActive = statusFilter === status;
          const isPending = status === 'shipment_pending';
          return (
            <Button
              key={status}
              variant={isActive ? 'default' : 'outline'}
              onClick={() => setStatusFilter(status)}
              data-testid={`orders-filter-${status}`}
              className={isActive
                ? (isPending ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white')
                : (isPending && orderCounts.shipment_pending > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900')}
            >
              {isPending && <AlertTriangle className="w-4 h-4 mr-1" />}
              {tabLabels[status] || status}
              <Badge className={isActive
                ? 'ml-2 bg-white/20'
                : (isPending && orderCounts.shipment_pending > 0 ? 'ml-2 bg-amber-200 text-amber-900' : 'ml-2 bg-purple-100 text-purple-700')}>
                {orderCounts[status] || 0}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by order number, customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-[rgb(37, 99, 235)] border-t-transparent rounded-full" />
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Source</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Items</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Payment</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-500">Recurring</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Total</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => {
                    const statusInfo = getStatusInfo(order.status);
                    const PaymentIcon = getPaymentIcon(order.payment_method);
                    return (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-bold text-gray-900">{order.order_number}</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={order.source === 'pos' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}>
                            {order.source === 'pos' ? 'POS' : 'Web'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-800">{order.customer_name}</p>
                            <p className="text-sm text-gray-500">{order.customer_email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-gray-600">{order.items?.length || 0} items</span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={paymentMethodColors[order.payment_method] || 'bg-gray-100 text-gray-600'}>
                            <PaymentIcon className="w-3 h-3 mr-1" />
                            {paymentMethodLabels[order.payment_method] || order.payment_method}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={statusInfo.color}>
                            <statusInfo.icon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <Switch
                              checked={order.is_recurring || false}
                              onCheckedChange={(checked) => handleToggleRecurring(order, checked)}
                              className="data-[state=checked]:bg-[rgb(37, 99, 235)]"
                            />
                            {order.is_recurring && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleSendRecurringInvoice(order)}
                                className="text-[rgb(37, 99, 235)] hover:text-[#5a2590] hover:bg-purple-50 p-1"
                                title="Send recurring invoice"
                              >
                                <Send className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-gray-900">
                          ${order.total?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="outline" size="sm" onClick={() => handleViewOrder(order)}>
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <DialogTitle data-testid="admin-order-dialog-title">Order {selectedOrder?.order_number}</DialogTitle>
              <DialogDescription className="sr-only">Order details, fulfillment and status</DialogDescription>
              {canShowSendToPrintful && (
                <Button
                  type="button"
                  onClick={() => handleSendToPrintful(selectedOrder)}
                  disabled={sendToPrintfulDisabled}
                  className="bg-[rgb(37, 99, 235)] hover:bg-[#5a238a]"
                  data-testid="admin-order-send-to-printful-button"
                >
                  {sendingPrintfulOrderId === selectedOrder?.id ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4 mr-2" />
                  )}
                  {selectedOrderEligibility?.already_submitted ? 'Already Sent to Printful' : 'Send to Printful'}
                </Button>
              )}
            </div>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {selectedOrderEligibility && selectedOrderEligibility.unresolved_items?.length > 0 && (
                <Card data-testid="admin-order-printful-unresolved-card" className="border-amber-300 bg-amber-50">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold text-amber-900">Printful sync requirements not met:</p>
                    <ul className="mt-2 list-disc pl-5 text-sm text-amber-800 space-y-1" data-testid="admin-order-printful-unresolved-list">
                      {selectedOrderEligibility.unresolved_items.slice(0, 5).map((issue, index) => (
                        <li key={`${issue}-${index}`}>{issue}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Order Status */}
              <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">Current Status</p>
                  <Badge className={getStatusInfo(selectedOrder.status).color + " text-lg px-3 py-1"}>
                    {getStatusInfo(selectedOrder.status).label}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <Badge className={paymentMethodColors[selectedOrder.payment_method] + " text-lg px-3 py-1"}>
                    {paymentMethodLabels[selectedOrder.payment_method] || selectedOrder.payment_method}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-xl font-bold text-purple-600">${selectedOrder.total?.toFixed(2)}</p>
                </div>
              </div>

              {/* Payment Reference (Stripe cross-reference) */}
              {(selectedOrder.stripe_payment_intent_id || selectedOrder.stripe_session_id || selectedOrder.payment_transaction_id) && (
                <Card data-testid="admin-order-payment-reference-card" className="border-blue-200 bg-blue-50/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-600" /> Payment Reference
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectedOrder.stripe_payment_intent_id && (
                      <div data-testid="admin-order-stripe-payment-intent-row">
                        <p className="text-xs text-gray-500 mb-1">Stripe Payment ID (PaymentIntent)</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-mono bg-white border border-gray-200 rounded px-2 py-1 text-gray-800 break-all" data-testid="admin-order-stripe-payment-intent-value">
                            {selectedOrder.stripe_payment_intent_id}
                          </code>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => copyPaymentRef(selectedOrder.stripe_payment_intent_id, 'Payment ID')}
                            data-testid="copy-stripe-payment-intent-button"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                          </Button>
                          <a
                            href={`https://dashboard.stripe.com/payments/${selectedOrder.stripe_payment_intent_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            data-testid="view-in-stripe-link"
                          >
                            <Button type="button" size="sm" variant="outline" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-50">
                              <ExternalLink className="w-3.5 h-3.5 mr-1" /> View in Stripe
                            </Button>
                          </a>
                        </div>
                      </div>
                    )}
                    {(selectedOrder.stripe_session_id || selectedOrder.payment_transaction_id) && (
                      <div data-testid="admin-order-stripe-session-row">
                        <p className="text-xs text-gray-500 mb-1">{selectedOrder.stripe_session_id ? 'Checkout Session ID (Stripe)' : 'Transaction ID'}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <code className="text-sm font-mono bg-white border border-gray-200 rounded px-2 py-1 text-gray-800 break-all" data-testid="admin-order-stripe-session-value">
                            {selectedOrder.stripe_session_id || selectedOrder.payment_transaction_id}
                          </code>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8"
                            onClick={() => copyPaymentRef(selectedOrder.stripe_session_id || selectedOrder.payment_transaction_id, 'Session ID')}
                            data-testid="copy-stripe-session-button"
                          >
                            <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" /> {selectedOrder.customer_email}
                    </p>
                    {(selectedOrder.shipping?.phone || selectedOrder.shipping_address?.phone) && (
                      <p className="text-sm text-gray-500 flex items-center gap-2">
                        <Phone className="w-4 h-4" /> {selectedOrder.shipping?.phone || selectedOrder.shipping_address?.phone}
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span>
                        {selectedOrder.shipping?.address1 || selectedOrder.shipping_address?.address}<br />
                        {selectedOrder.shipping?.address2 && <>{selectedOrder.shipping.address2}<br /></>}
                        {selectedOrder.shipping?.city || selectedOrder.shipping_address?.city}, {selectedOrder.shipping?.state || selectedOrder.shipping_address?.state} {selectedOrder.shipping?.zipCode || selectedOrder.shipping_address?.zip_code}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Order Items</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="divide-y">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="py-3 flex items-center gap-4">
                        {item.image && (
                          <img src={item.image} alt={item.name || item.product_name} className="w-12 h-12 rounded object-cover" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium">{item.name || item.product_name}</p>
                          {getDisplayOptionSummary(item) && (
                            <p className="text-sm text-purple-600">{getDisplayOptionSummary(item)}</p>
                          )}
                          {item.custom_notes && <p className="text-xs text-gray-500 line-clamp-2">Notes: {item.custom_notes}</p>}
                          {item.custom_image_url && <p className="text-xs text-gray-500">Custom image attached</p>}
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t pt-4 mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span>${selectedOrder.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm" data-testid="order-shipping-row">
                      <span className="text-gray-500">Shipping</span>
                      {!editingShipping ? (
                        <div className="flex items-center gap-2">
                          <span>{selectedOrder.shipping_cost === 0 ? 'FREE' : `$${Number(selectedOrder.shipping_cost || 0).toFixed(2)}`}</span>
                          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-blue-600" onClick={handleEditShippingClick} data-testid="edit-order-shipping-button">Edit</Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                            <Input type="number" step="0.01" value={shippingInput} onChange={(e) => setShippingInput(e.target.value)} className="w-24 h-8 text-sm pl-5" data-testid="order-shipping-input" />
                          </div>
                          <Button variant="outline" size="sm" className="h-8" disabled={calculatingShipping} onClick={handleCalculateShippingRates} data-testid="calculate-order-shipping-button">
                            {calculatingShipping ? 'Calculating…' : 'Calculate'}
                          </Button>
                          <Button size="sm" className="h-8 bg-purple-600 hover:bg-purple-700" disabled={savingShipping} onClick={handleSaveShipping} data-testid="save-order-shipping-button">
                            {savingShipping ? 'Saving…' : 'Save'}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8" onClick={handleCancelEditShipping} data-testid="cancel-order-shipping-button">Cancel</Button>
                        </div>
                      )}
                    </div>
                    {editingShipping && shippingRateOptions.length > 0 && (
                      <div className="p-2 rounded-lg border bg-gray-50 space-y-1" data-testid="order-shipping-rate-options">
                        {shippingRateOptions.map((rate, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setShippingInput(String(Number(rate.rate_with_upcharge ?? rate.rate).toFixed(2)))}
                            className="w-full flex justify-between text-xs px-2 py-1.5 rounded hover:bg-white border border-transparent hover:border-gray-200"
                            data-testid={`order-shipping-rate-option-${idx}`}
                          >
                            <span>{rate.carrier} {rate.service}</span>
                            <span className="font-medium">${Number(rate.rate_with_upcharge ?? rate.rate).toFixed(2)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Tax</span>
                      <span>${selectedOrder.tax?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-purple-600">${selectedOrder.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Fulfillment / Send to Shippo */}
              <Card data-testid="order-fulfillment-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Fulfillment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Customer's chosen shipping</span>
                    <span className="font-medium text-right">
                      {selectedOrder.selected_shipping
                        ? `${selectedOrder.selected_shipping.carrier || ''} ${selectedOrder.selected_shipping.service || ''}`.trim() || '—'
                        : '—'}
                      {selectedOrder.selected_shipping?.rate != null && (
                        <span className="text-gray-500"> (${Number(selectedOrder.selected_shipping.rate).toFixed(2)})</span>
                      )}
                    </span>
                  </div>
                  {selectedOrder.tracking_number ? (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm">
                      <p className="text-green-800 font-medium">Shipped via {selectedOrder.shipping_carrier} {selectedOrder.shipping_service}</p>
                      <p className="text-green-700">Tracking: {selectedOrder.tracking_number}</p>
                      {selectedOrder.shipping_label_url && (
                        <a href={selectedOrder.shipping_label_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View / Print Label</a>
                      )}
                    </div>
                  ) : (
                    <>
                      {selectedOrder.shipping_error && (
                        <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-sm" data-testid="order-shipment-error-banner">
                          <p className="text-amber-900 font-semibold flex items-center gap-1.5">
                            <AlertTriangle className="w-4 h-4" /> Shipment Pending — label not purchased
                          </p>
                          <p className="text-amber-800 mt-1" data-testid="order-shipment-error-message">{selectedOrder.shipping_error}</p>
                          <p className="text-amber-700/80 text-xs mt-1">Order was NOT marked shipped. Review the error, fund/fix the provider, then retry below.</p>
                        </div>
                      )}
                      <Button
                        onClick={handleSendToShippo}
                        disabled={sendingToShippo}
                        className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                        data-testid="send-to-shippo-button"
                      >
                        {sendingToShippo
                          ? 'Buying label…'
                          : selectedOrder.shipping_error
                            ? 'Retry — Buy Label'
                            : 'Send to Shippo (buy label & get tracking)'}
                      </Button>
                    </>
                  )}
                  <p className="text-xs text-gray-400">Buys the label with the customer's chosen service (or cheapest available), then writes the tracking number back to this order.</p>
                </CardContent>
              </Card>

              {/* Update Status */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Update Order Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {orderStatuses.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tracking Number</Label>
                      <Input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </div>
                  </div>
                  <Button onClick={handleUpdateStatus} className="bg-purple-600 hover:bg-purple-700">
                    Update Order
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminOrders;
