import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Wrench, TrendingUp, Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const emptyItem = {
  name: '',
  description: '',
  category: 'General',
  sku: '',
  price_onetime: 0,
  price_monthly: 0,
  price_yearly: 0,
  is_active: true,
};

export default function QuoteCatalogSettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [leadSales, setLeadSales] = useState([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyItem);

  const token = localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const loadData = async () => {
    const [productsRes, servicesRes, salesRes] = await Promise.all([
      axios.get(`${API}/quotes/catalog/products`, { headers }),
      axios.get(`${API}/quotes/catalog/services`, { headers }),
      axios.get(`${API}/quotes/catalog/lead-sales`, { headers }),
    ]);
    setProducts(productsRes.data?.products || []);
    setServices(servicesRes.data?.services || []);
    setLeadSales(salesRes.data?.sales || []);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProducts = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return products;
    return products.filter((item) => [item.name, item.description, item.category, item.sku].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [products, query]);

  const filteredServices = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return services;
    return services.filter((item) => [item.name, item.description, item.category].some((v) => String(v || '').toLowerCase().includes(q)));
  }, [services, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyItem);
    setOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'General',
      sku: item.sku || '',
      price_onetime: Number(item.price_onetime || 0),
      price_monthly: Number(item.price_monthly || 0),
      price_yearly: Number(item.price_yearly || 0),
      is_active: item.is_active !== false,
    });
    setOpen(true);
  };

  const saveItem = async () => {
    const basePath = activeTab === 'products' ? 'products' : 'services';
    if (editing?.id) {
      await axios.put(`${API}/quotes/catalog/${basePath}/${editing.id}`, form, { headers });
    } else {
      await axios.post(`${API}/quotes/catalog/${basePath}`, form, { headers });
    }
    setOpen(false);
    await loadData();
  };

  const deleteItem = async (id) => {
    const basePath = activeTab === 'products' ? 'products' : 'services';
    await axios.delete(`${API}/quotes/catalog/${basePath}/${id}`, { headers });
    await loadData();
  };

  return (
    <div className="space-y-6" data-testid="quotes-catalog-settings-page">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate('/admin/quotes-contracts-esign')} data-testid="quotes-catalog-back-button">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quotes
          </Button>
          <h1 className="text-2xl font-bold" data-testid="quotes-catalog-heading">Quote Products & Services</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border p-4 bg-white" data-testid="quotes-products-stat-card">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Package className="w-4 h-4" /> Products</div>
          <p className="text-3xl font-bold mt-2">{products.length}</p>
        </div>
        <div className="rounded-xl border p-4 bg-white" data-testid="quotes-services-stat-card">
          <div className="flex items-center gap-2 text-sm text-gray-500"><Wrench className="w-4 h-4" /> Services</div>
          <p className="text-3xl font-bold mt-2">{services.length}</p>
        </div>
        <div className="rounded-xl border p-4 bg-white" data-testid="quotes-lead-sales-stat-card">
          <div className="flex items-center gap-2 text-sm text-gray-500"><TrendingUp className="w-4 h-4" /> Lead Sales</div>
          <p className="text-3xl font-bold mt-2">{leadSales.length}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList data-testid="quotes-catalog-tabs-list">
          <TabsTrigger value="products" data-testid="quotes-catalog-products-tab">Products</TabsTrigger>
          <TabsTrigger value="services" data-testid="quotes-catalog-services-tab">Services</TabsTrigger>
          <TabsTrigger value="lead-sales" data-testid="quotes-catalog-lead-sales-tab">Lead Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9" placeholder="Search products" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="quotes-products-search-input" />
            </div>
            <Button onClick={openCreate} data-testid="quotes-products-add-button"><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
          </div>
          <div className="rounded-xl border bg-white overflow-hidden" data-testid="quotes-products-table-wrap">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">One-time</th>
                  <th className="px-4 py-3">Monthly</th>
                  <th className="px-4 py-3">Yearly</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((item) => (
                  <tr key={item.id} className="border-t" data-testid={`quotes-product-row-${item.id}`}>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">${Number(item.price_onetime || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">${Number(item.price_monthly || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">${Number(item.price_yearly || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)} data-testid={`quotes-product-edit-${item.id}`}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteItem(item.id)} data-testid={`quotes-product-delete-${item.id}`}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-full max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input className="pl-9" placeholder="Search services" value={query} onChange={(e) => setQuery(e.target.value)} data-testid="quotes-services-search-input" />
            </div>
            <Button onClick={openCreate} data-testid="quotes-services-add-button"><Plus className="w-4 h-4 mr-2" /> Add Service</Button>
          </div>
          <div className="rounded-xl border bg-white overflow-hidden" data-testid="quotes-services-table-wrap">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">One-time</th>
                  <th className="px-4 py-3">Monthly</th>
                  <th className="px-4 py-3">Yearly</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.map((item) => (
                  <tr key={item.id} className="border-t" data-testid={`quotes-service-row-${item.id}`}>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">${Number(item.price_onetime || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">${Number(item.price_monthly || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">${Number(item.price_yearly || 0).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(item)} data-testid={`quotes-service-edit-${item.id}`}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteItem(item.id)} data-testid={`quotes-service-delete-${item.id}`}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="lead-sales" className="space-y-4" data-testid="quotes-lead-sales-tab-content">
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Quote</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody>
                {leadSales.map((sale) => (
                  <tr key={sale.id} className="border-t" data-testid={`quotes-lead-sale-row-${sale.id}`}>
                    <td className="px-4 py-3">{sale.lead_name || sale.lead_email || 'Lead'}</td>
                    <td className="px-4 py-3">{sale.quote_name}</td>
                    <td className="px-4 py-3">{sale.status}</td>
                    <td className="px-4 py-3">${Number(sale.total || 0).toFixed(2)}</td>
                    <td className="px-4 py-3">{sale.updated_at ? new Date(sale.updated_at).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="quotes-catalog-item-dialog">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Item' : activeTab === 'products' ? 'Add Product' : 'Add Service'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="quotes-catalog-item-name-input" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} data-testid="quotes-catalog-item-description-input" />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="quotes-catalog-item-category-input" />
            </div>
            <div>
              <Label>SKU (products optional)</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} data-testid="quotes-catalog-item-sku-input" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>One-time</Label>
                <Input type="number" value={form.price_onetime} onChange={(e) => setForm({ ...form, price_onetime: Number(e.target.value || 0) })} data-testid="quotes-catalog-item-onetime-input" />
              </div>
              <div>
                <Label>Monthly</Label>
                <Input type="number" value={form.price_monthly} onChange={(e) => setForm({ ...form, price_monthly: Number(e.target.value || 0) })} data-testid="quotes-catalog-item-monthly-input" />
              </div>
              <div>
                <Label>Yearly</Label>
                <Input type="number" value={form.price_yearly} onChange={(e) => setForm({ ...form, price_yearly: Number(e.target.value || 0) })} data-testid="quotes-catalog-item-yearly-input" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} data-testid="quotes-catalog-item-cancel-button">Cancel</Button>
              <Button onClick={saveItem} data-testid="quotes-catalog-item-save-button">Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
