import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ArrowLeft, Trash2, RotateCcw, Package, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminOrdersTrash = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [processing, setProcessing] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchTrashedOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/payments/orders/trash`, { headers: getAuthHeaders() });
      setOrders(response.data?.orders || []);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load trashed orders', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTrashedOrders();
  }, []);

  const toggleSelectOrder = (orderId) => {
    setSelectedOrderIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === orders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(orders.map((o) => o.id));
    }
  };

  const handleRestore = async (orderIds) => {
    if (!orderIds || orderIds.length === 0) return;
    setProcessing(true);
    try {
      const response = await axios.post(`${API}/payments/orders/bulk-restore`, { order_ids: orderIds }, { headers: getAuthHeaders() });
      toast({ title: 'Restored', description: `${response.data.restored_count} order(s) restored to Orders.` });
      setSelectedOrderIds([]);
      fetchTrashedOrders();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to restore orders', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handlePermanentDelete = async (orderIds) => {
    if (!orderIds || orderIds.length === 0) return;
    if (!window.confirm(`Permanently delete ${orderIds.length} order(s)? This CANNOT be undone.`)) return;
    setProcessing(true);
    try {
      const response = await axios.post(`${API}/payments/orders/bulk-permanent-delete`, { order_ids: orderIds }, { headers: getAuthHeaders() });
      toast({ title: 'Permanently Deleted', description: `${response.data.deleted_count} order(s) permanently deleted.` });
      setSelectedOrderIds([]);
      fetchTrashedOrders();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to delete orders', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleEmptyTrash = async () => {
    if (orders.length === 0) return;
    if (!window.confirm(`Permanently delete ALL ${orders.length} order(s) in the trash? This CANNOT be undone.`)) return;
    setProcessing(true);
    try {
      const response = await axios.post(`${API}/payments/orders/trash/empty`, {}, { headers: getAuthHeaders() });
      toast({ title: 'Trash Emptied', description: `${response.data.deleted_count} order(s) permanently deleted.` });
      setSelectedOrderIds([]);
      fetchTrashedOrders();
    } catch (error) {
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to empty trash', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/admin/orders" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-800 mb-1" data-testid="orders-trash-back-link">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trash2 className="w-6 h-6 text-red-500" /> Orders Trash Can
          </h1>
          <p className="text-gray-500">Deleted orders live here until restored or permanently removed</p>
        </div>
        <Button
          variant="destructive"
          onClick={handleEmptyTrash}
          disabled={processing || orders.length === 0}
          data-testid="orders-empty-trash-button"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Empty Trash
        </Button>
      </div>

      {selectedOrderIds.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg" data-testid="orders-trash-bulk-actions-bar">
          <span className="text-sm font-medium text-amber-800">{selectedOrderIds.length} order(s) selected</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedOrderIds([])} data-testid="orders-trash-clear-selection-button">
              Clear
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              onClick={() => handleRestore(selectedOrderIds)}
              disabled={processing}
              data-testid="orders-trash-bulk-restore-button"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Restore
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handlePermanentDelete(selectedOrderIds)}
              disabled={processing}
              data-testid="orders-trash-bulk-delete-button"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete Permanently
            </Button>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-red-400 border-t-transparent rounded-full" />
            </div>
          ) : orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4">
                      <Checkbox
                        checked={orders.length > 0 && selectedOrderIds.length === orders.length}
                        onCheckedChange={toggleSelectAll}
                        data-testid="orders-trash-select-all-checkbox"
                      />
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Order</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Total</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Deleted By</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Deleted At</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50" data-testid={`orders-trash-row-${order.id}`}>
                      <td className="py-3 px-4">
                        <Checkbox
                          checked={selectedOrderIds.includes(order.id)}
                          onCheckedChange={() => toggleSelectOrder(order.id)}
                          data-testid={`orders-trash-select-checkbox-${order.id}`}
                        />
                      </td>
                      <td className="py-3 px-4 font-bold text-gray-900">{order.order_number}</td>
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-800">{order.customer_name}</p>
                        <p className="text-sm text-gray-500">{order.customer_email}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">${order.total?.toFixed(2)}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{order.deleted_by || '—'}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {order.deleted_at ? new Date(order.deleted_at).toLocaleString() : '—'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            onClick={() => handleRestore([order.id])}
                            disabled={processing}
                            data-testid={`orders-trash-restore-button-${order.id}`}
                          >
                            <RotateCcw className="w-4 h-4 mr-1" /> Restore
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => handlePermanentDelete([order.id])}
                            disabled={processing}
                            data-testid={`orders-trash-delete-button-${order.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
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
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Trash is empty</p>
              <p className="text-sm text-gray-400 mt-1">Orders you delete will show up here first, before being permanently removed</p>
            </div>
          )}
        </CardContent>
      </Card>

      {orders.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Trashed orders are excluded from all reports, accounting totals, and dashboards. Use "Restore" to bring an order back, or "Delete Permanently" / "Empty Trash" to remove it for good.</p>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersTrash;
