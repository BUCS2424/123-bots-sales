import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { toast } from '../../hooks/use-toast';
import { Receipt, CheckCircle2 } from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

const Johnny5Billing = () => {
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [storesRes, ordersRes, invoicesRes] = await Promise.all([
        axios.get(`${API}/api/johnny5/stores`),
        axios.get(`${API}/api/johnny5/billing/orders?billing_status=unbilled${selectedStoreId !== 'all' ? `&store_id=${selectedStoreId}` : ''}`),
        axios.get(`${API}/api/johnny5/billing/invoices${selectedStoreId !== 'all' ? `?store_id=${selectedStoreId}` : ''}`),
      ]);

      setStores(storesRes.data?.stores || []);
      setOrders(ordersRes.data?.orders || []);
      setInvoices(invoicesRes.data?.invoices || []);
      setSelectedOrderIds([]);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load Johnny 5 billing data.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStoreId]);

  const selectedOrders = useMemo(
    () => orders.filter((order) => selectedOrderIds.includes(order.id)),
    [orders, selectedOrderIds]
  );

  const selectedTotals = useMemo(() => {
    return selectedOrders.reduce(
      (acc, order) => {
        const breakdown = order.billing_breakdown || {};
        acc.product += Number(breakdown.product_cost || 0);
        acc.markup += Number(breakdown.markup || 0);
        acc.shipping += Number(breakdown.shipping_cost || 0);
        acc.total += Number(breakdown.invoice_total || 0);
        return acc;
      },
      { product: 0, markup: 0, shipping: 0, total: 0 }
    );
  }, [selectedOrders]);

  const toggleOrder = (orderId, checked) => {
    setSelectedOrderIds((prev) => {
      if (checked) return Array.from(new Set([...prev, orderId]));
      return prev.filter((id) => id !== orderId);
    });
  };

  const toggleAll = (checked) => {
    if (checked) {
      setSelectedOrderIds(orders.map((order) => order.id));
      return;
    }
    setSelectedOrderIds([]);
  };

  const createInvoice = async () => {
    if (selectedOrderIds.length === 0) {
      toast({ title: 'No Orders Selected', description: 'Select order checkboxes first.' });
      return;
    }

    const storeIds = Array.from(new Set(selectedOrders.map((order) => order.store_id)));
    if (storeIds.length !== 1) {
      toast({
        title: 'Mixed Stores Selected',
        description: 'Select orders from one connected store per invoice.',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);
    try {
      await axios.post(`${API}/api/johnny5/billing/invoices`, {
        store_id: storeIds[0],
        order_ids: selectedOrderIds,
        notes: note || null,
      });

      toast({ title: 'Invoice Created', description: 'Combined invoice generated for selected orders.' });
      setNote('');
      await loadData();
    } catch (error) {
      toast({
        title: 'Invoice Failed',
        description: error.response?.data?.detail || 'Could not create invoice.',
        variant: 'destructive'
      });
    }
    setCreating(false);
  };

  const markPaid = async (invoiceId) => {
    try {
      await axios.put(`${API}/api/johnny5/billing/invoices/${invoiceId}/mark-paid`);
      toast({ title: 'Marked Paid', description: 'Invoice marked paid in one click.' });
      await loadData();
    } catch (error) {
      toast({ title: 'Update Failed', description: 'Could not mark invoice paid.', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6" data-testid="johnny5-billing-page">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" data-testid="johnny5-billing-title">
            <Receipt className="w-6 h-6 text-purple-600" /> Connected Store Billing
          </h1>
          <p className="text-sm text-gray-500">Invoices sent to connected store owners are cost-price only.</p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-[260px_1fr_auto] gap-3 items-end" data-testid="johnny5-billing-controls">
          <div>
            <Label>Connected Store</Label>
            <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
              <SelectTrigger data-testid="billing-store-filter-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Invoice Notes</Label>
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional notes for connected store owner" data-testid="billing-invoice-note-input" />
          </div>

          <Button onClick={createInvoice} disabled={creating || loading} className="bg-purple-600 hover:bg-purple-700" data-testid="create-combined-invoice-button">
            {creating ? 'Creating...' : 'Create Combined Invoice'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unbilled Orders</CardTitle>
          <CardDescription>Select multiple orders and combine them for one connected-store cost-only invoice.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-gray-500" data-testid="billing-loading-state">Loading billing data...</div>
          ) : orders.length === 0 ? (
            <div className="py-8 text-center text-gray-500" data-testid="billing-no-orders">No unbilled orders found.</div>
          ) : (
            <div className="space-y-2" data-testid="billing-orders-list">
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox checked={selectedOrderIds.length === orders.length && orders.length > 0} onCheckedChange={(checked) => toggleAll(Boolean(checked))} data-testid="billing-select-all-orders-checkbox" />
                <span className="text-sm text-gray-600">Select all</span>
              </div>
              {orders.map((order) => (
                <div key={order.id} className="grid grid-cols-1 md:grid-cols-[auto_1fr_auto_auto] gap-3 items-center rounded border px-3 py-2" data-testid={`billing-order-row-${order.id}`}>
                  <Checkbox checked={selectedOrderIds.includes(order.id)} onCheckedChange={(checked) => toggleOrder(order.id, Boolean(checked))} data-testid={`billing-order-checkbox-${order.id}`} />
                  <div>
                    <p className="text-sm font-semibold">{order.store_name || order.store_id} • {order.store_order_number || order.store_order_id}</p>
                    <p className="text-xs text-gray-500">{new Date(order.received_at).toLocaleString()}</p>
                  </div>
                  <Badge variant="outline" data-testid={`billing-order-cost-only-${order.id}`}>Cost-Only Billing</Badge>
                  <p className="text-sm font-semibold" data-testid={`billing-order-total-${order.id}`}>${Number(order.billing_breakdown?.invoice_total || 0).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 rounded border bg-slate-50 p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm" data-testid="billing-selection-summary">
            <div>Product Cost: <strong>${selectedTotals.product.toFixed(2)}</strong></div>
            <div>Invoice Total (Cost Only): <strong>${selectedTotals.total.toFixed(2)}</strong></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Mark connected-store invoices as paid in one click.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="py-6 text-center text-gray-500" data-testid="billing-no-invoices">No invoices yet.</div>
          ) : (
            <div className="space-y-2" data-testid="billing-invoices-list">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-center border rounded px-3 py-2" data-testid={`billing-invoice-row-${invoice.id}`}>
                  <div>
                    <p className="text-sm font-semibold">{invoice.invoice_number} • {invoice.store_name}</p>
                    <p className="text-xs text-gray-500">{invoice.order_ids?.length || 0} orders • {new Date(invoice.created_at).toLocaleString()}</p>
                  </div>
                  <p className="text-sm font-semibold" data-testid={`billing-invoice-total-${invoice.id}`}>${Number(invoice.totals?.invoice_total || 0).toFixed(2)}</p>
                  {invoice.status === 'paid' ? (
                    <Badge className="bg-emerald-100 text-emerald-700" data-testid={`billing-invoice-paid-badge-${invoice.id}`}>
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Paid
                    </Badge>
                  ) : (
                    <Button size="sm" onClick={() => markPaid(invoice.id)} data-testid={`mark-invoice-paid-button-${invoice.id}`}>
                      Mark Paid
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Johnny5Billing;
