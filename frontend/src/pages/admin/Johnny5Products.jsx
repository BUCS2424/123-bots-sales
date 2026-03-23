import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import {
  Package, Search, RefreshCw, Filter, ChevronDown, ChevronUp,
  CheckCircle, XCircle, AlertTriangle, Box, DollarSign, Download
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Johnny5Products = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [total, setTotal] = useState(0);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter && categoryFilter !== 'all') params.append('category', categoryFilter);
      if (stockFilter === 'in_stock') params.append('in_stock', 'true');
      if (stockFilter === 'out_of_stock') params.append('in_stock', 'false');
      params.append('limit', '100');

      const response = await axios.get(`${BACKEND_URL}/api/johnny5/products?${params.toString()}`);
      setProducts(response.data.products || []);
      setCategories(response.data.categories || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, stockFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      // First sync products to pricing sheet, then export
      await axios.post(`${BACKEND_URL}/api/johnny5/pricing-stock/sync-from-products`);
      
      const response = await axios.get(`${BACKEND_URL}/api/johnny5/pricing-stock/export.csv`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `johnny5_pricing_stock_${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast({ title: 'Export Complete', description: 'Products synced and CSV downloaded.' });
    } catch (error) {
      toast({ title: 'Export Failed', description: 'Unable to export CSV.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleSyncToSheet = async () => {
    setSyncing(true);
    try {
      const response = await axios.post(`${BACKEND_URL}/api/johnny5/pricing-stock/sync-from-products`);
      toast({
        title: 'Sync Complete',
        description: `${response.data.synced} product rows synced (${response.data.created} new, ${response.data.updated} updated)`,
      });
      fetchProducts();
    } catch (error) {
      toast({ title: 'Sync Failed', description: 'Unable to sync products to pricing sheet', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  // Stats
  const stats = useMemo(() => {
    const inStock = products.filter(p => p.in_stock).length;
    const outOfStock = products.filter(p => !p.in_stock).length;
    const totalStock = products.reduce((acc, p) => acc + (p.total_stock || 0), 0);
    const withOptions = products.filter(p => p.has_options).length;
    return { inStock, outOfStock, totalStock, withOptions };
  }, [products]);

  const toggleExpand = (productId) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  return (
    <div className="space-y-6" data-testid="johnny5-products-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Johnny 5 Products</h1>
          <p className="text-gray-500">View all store products with option-level inventory</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={fetchProducts} variant="outline" disabled={loading} data-testid="products-refresh-btn">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button onClick={handleExportCSV} variant="outline" disabled={exporting} data-testid="export-csv-btn">
            <Download className={`w-4 h-4 mr-2 ${exporting ? 'animate-pulse' : ''}`} /> {exporting ? 'Exporting...' : 'Export CSV'}
          </Button>
          <Button onClick={handleSyncToSheet} disabled={syncing} className="bg-purple-600 hover:bg-purple-700" data-testid="sync-to-sheet-btn">
            <Package className="w-4 h-4 mr-2" /> {syncing ? 'Syncing...' : 'Sync to Price Sheet'}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="stat-total-products">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-bold">{total}</p>
              </div>
              <Box className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-in-stock">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-2xl font-bold text-green-600">{stats.inStock}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-out-of-stock">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card data-testid="stat-total-units">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Units</p>
                <p className="text-2xl font-bold">{stats.totalStock.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card data-testid="products-filters-card">
        <CardContent className="pt-4">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products by name, SKU, or category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                  data-testid="products-search-input"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48" data-testid="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-full md:w-40" data-testid="stock-filter">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="out_of_stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" data-testid="products-search-btn">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Products List */}
      <Card data-testid="products-list-card">
        <CardHeader>
          <CardTitle>Products ({products.length})</CardTitle>
          <CardDescription>Click on a product row to see option-level inventory breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No products found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg overflow-hidden"
                  data-testid={`product-row-${product.id}`}
                >
                  {/* Product Row */}
                  <button
                    onClick={() => toggleExpand(product.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                  >
                    {/* Image */}
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image.startsWith('/') ? `${BACKEND_URL}${product.image}` : product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 m-3 text-gray-400" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        {product.has_options && (
                          <Badge variant="outline" className="text-xs">
                            {product.strength_options?.length || 0} × {product.package_options?.length || 0} options
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="font-mono">{product.sku || '—'}</span>
                        <span>•</span>
                        <span>{product.category}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right hidden md:block">
                      <p className="font-semibold text-gray-900">${product.price?.toFixed(2)}</p>
                      {product.cost_price > 0 && (
                        <p className="text-xs text-gray-500">Cost: ${product.cost_price?.toFixed(2)}</p>
                      )}
                    </div>

                    {/* Stock */}
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        {product.in_stock ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={`font-semibold ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                          {product.total_stock}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">units</p>
                    </div>

                    {/* Expand Icon */}
                    <div className="text-gray-400">
                      {expandedProduct === product.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Options */}
                  {expandedProduct === product.id && product.has_options && product.options_breakdown?.length > 0 && (
                    <div className="bg-gray-50 border-t px-4 py-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Option-Level Inventory:</p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500 border-b">
                              <th className="pb-2 pr-4">Strength</th>
                              <th className="pb-2 pr-4">Package</th>
                              <th className="pb-2 pr-4 text-right">Price</th>
                              <th className="pb-2 pr-4 text-right">Stock</th>
                              <th className="pb-2 pr-4 text-center">Status</th>
                              <th className="pb-2 text-left">Restock ETA</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.options_breakdown.map((opt, idx) => (
                              <tr key={idx} className="border-b last:border-0" data-testid={`option-row-${idx}`}>
                                <td className="py-2 pr-4 font-medium">{opt.strength}</td>
                                <td className="py-2 pr-4">{opt.package}</td>
                                <td className="py-2 pr-4 text-right font-mono">${opt.price?.toFixed(2)}</td>
                                <td className="py-2 pr-4 text-right font-semibold">{opt.stock_quantity}</td>
                                <td className="py-2 pr-4 text-center">
                                  {opt.in_stock ? (
                                    <Badge className="bg-green-100 text-green-700">In Stock</Badge>
                                  ) : opt.allow_preorder ? (
                                    <Badge className="bg-amber-100 text-amber-700">Pre-order</Badge>
                                  ) : (
                                    <Badge className="bg-red-100 text-red-700">Out</Badge>
                                  )}
                                </td>
                                <td className="py-2 text-gray-500">{opt.estimated_restock || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Expanded - No Options */}
                  {expandedProduct === product.id && !product.has_options && (
                    <div className="bg-gray-50 border-t px-4 py-3">
                      <p className="text-sm text-gray-500">
                        This product has no option variants. Stock quantity: <strong>{product.total_stock}</strong>
                      </p>
                    </div>
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

export default Johnny5Products;
