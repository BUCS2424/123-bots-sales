import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Search, Package, AlertTriangle, CheckCircle, Edit2, Save, X
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Switch } from '../../components/ui/switch';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editQuantity, setEditQuantity] = useState('');

  useEffect(() => {
    fetchInventory();
  }, [showLowStock]);

  const fetchInventory = async () => {
    try {
      const params = showLowStock ? '?low_stock_only=true' : '';
      const response = await axios.get(`${API}/store/inventory${params}`);
      setInventory(response.data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    }
    setLoading(false);
  };

  const handleUpdateQuantity = async (productId) => {
    try {
      await axios.put(`${API}/store/inventory/${productId}?quantity=${editQuantity}`);
      toast({ title: 'Inventory Updated', description: 'Product quantity has been updated.' });
      setEditingId(null);
      fetchInventory();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to update inventory', variant: 'destructive' });
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { label: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    if (quantity <= 3) return { label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { label: 'In Stock', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const filteredInventory = inventory.filter(item => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return item.name.toLowerCase().includes(query) ||
             item.sku?.toLowerCase().includes(query);
    }
    return true;
  });

  const totalValue = inventory.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const lowStockCount = inventory.filter(item => item.quantity <= 3 && item.quantity > 0).length;
  const outOfStockCount = inventory.filter(item => item.quantity === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <p className="text-gray-500">Track and manage your product stock levels</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Total Products</p>
            <p className="text-2xl font-bold">{inventory.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Inventory Value</p>
            <p className="text-2xl font-bold text-green-600">${totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className={lowStockCount > 0 ? 'border-yellow-300' : ''}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
          </CardContent>
        </Card>
        <Card className={outOfStockCount > 0 ? 'border-red-300' : ''}>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by product name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Switch checked={showLowStock} onCheckedChange={setShowLowStock} />
              <span className="text-sm">Show Low Stock Only</span>
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-[#6e2ea8] border-t-transparent rounded-full" />
            </div>
          ) : filteredInventory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">SKU</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Category</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Price</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Quantity</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-500">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => {
                    const status = getStockStatus(item.quantity);
                    const isEditing = editingId === item.id;
                    return (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <span className="font-medium">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm text-gray-500">{item.sku}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{item.category}</Badge>
                        </td>
                        <td className="py-3 px-4">${item.price}</td>
                        <td className="py-3 px-4">
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                min="0"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                className="w-20 h-8"
                              />
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleUpdateQuantity(item.id)}>
                                <Save className="w-4 h-4 text-green-600" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                                <X className="w-4 h-4 text-red-600" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={item.quantity <= 3 ? 'text-red-600 font-semibold' : ''}>
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={() => { setEditingId(item.id); setEditQuantity(item.quantity.toString()); }}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={status.color}>
                            <status.icon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          ${(item.price * item.quantity).toLocaleString()}
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
              <p className="text-gray-500">No inventory items found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInventory;
