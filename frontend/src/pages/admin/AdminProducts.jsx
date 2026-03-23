import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Plus, Search, Package, Filter, ChevronDown, ChevronRight, RefreshCw,
  Copy, ImagePlus, SlidersHorizontal, FileUp, Truck, Receipt, Pencil, Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Checkbox } from '../../components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../../components/ui/dropdown-menu';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkAction, setBulkAction] = useState('none');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [importingCsv, setImportingCsv] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const importCsvInputRef = useRef(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setLoading(true);
    await Promise.all([fetchProducts(), fetchCategories()]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/store/products?limit=1000`);
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API}/store/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProducts(), fetchCategories()]);
    setRefreshing(false);
  };

  const handleDelete = async (product, silent = false) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) return;

    try {
      await axios.delete(`${API}/store/products/${product.id}`, { headers: getAuthHeaders() });
      if (!silent) {
        toast({ title: 'Product Deleted', description: 'Product has been deleted.' });
      }
      fetchProducts();
      fetchCategories();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete product', variant: 'destructive' });
    }
  };

  const handleEdit = (product) => {
    navigate(`/admin/products/${product.id}`);
  };

  const handleTabEdit = (product, tab, focus = null) => {
    const query = new URLSearchParams({ tab });
    if (focus) {
      query.set('focus', focus);
    }
    navigate(`/admin/products/${product.id}?${query.toString()}`);
  };

  const handleDuplicate = async (product) => {
    try {
      const duplicatePayload = {
        name: `${product.name} Copy`,
        description: product.description || 'Duplicated product',
        category: product.category || 'General',
        categories: Array.isArray(product.categories) && product.categories.length > 0
          ? product.categories
          : [product.category || 'General'],
        price: Number(product.price || 0),
        original_price: product.original_price ? Number(product.original_price) : null,
        image: product.image || '',
        images: Array.isArray(product.images) && product.images.length > 0
          ? product.images
          : (product.image ? [product.image] : []),
        condition: product.condition || 'Good',
        in_stock: Boolean(product.in_stock),
        is_visible: product.is_visible !== false,
        quantity: Number(product.quantity || 1),
        sku: `${product.sku || 'SKU'}-COPY-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        weight: product.weight ?? null,
        tags: Array.isArray(product.tags) ? product.tags : [],
        location: product.location || 'alabama_pawn_storage',
        brand: product.brand || null,
        manufacturer: product.manufacturer || null,
        upc: null,  // UPC should be unique
        mpn: product.mpn || null,
        cost_price: product.cost_price ?? null,
        track_quantity: Boolean(product.track_quantity),
        requires_shipping: product.requires_shipping ?? true,
        free_shipping: Boolean(product.free_shipping),
        shipping_weight: product.shipping_weight ?? null,
        shipping_length: product.shipping_length ?? null,
        shipping_width: product.shipping_width ?? null,
        shipping_height: product.shipping_height ?? null,
        seo_title: null,
        seo_description: null,
        seo_url: null,
        related_products: Array.isArray(product.related_products) ? product.related_products : [],
        has_options: Boolean(product.has_options),
        custom_fields_data: product.custom_fields_data || null
      };

      const response = await axios.post(`${API}/store/products`, duplicatePayload, { headers: getAuthHeaders() });
      
      toast({ title: 'Product Duplicated', description: `Created a copy of ${product.name}.` });
      fetchProducts();
      fetchCategories();
    } catch (error) {
      console.error('Duplicate error:', error.response?.data || error);
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to duplicate product', 
        variant: 'destructive' 
      });
    }
  };

  const handleAddProduct = () => {
    navigate('/admin/products/new');
  };

  const handleImportProductsClick = () => {
    if (importingCsv) return;
    importCsvInputRef.current?.click();
  };

  const handleImportCsvFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({ title: 'Invalid File', description: 'Please select a .csv file.', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setImportingCsv(true);
    try {
      const response = await axios.post(`${API}/store/products/import/csv`, formData, {
        headers: {
          ...getAuthHeaders(),
        },
      });

      setImportSummary(response.data);
      await Promise.all([fetchProducts(), fetchCategories()]);

      toast({
        title: 'CSV Import Completed',
        description: `Created ${response.data?.created_count || 0} product(s). Skipped ${response.data?.skipped_count || 0}.`,
      });
    } catch (error) {
      const detail = error.response?.data?.detail;
      setImportSummary(null);
      toast({
        title: 'CSV Import Failed',
        description: typeof detail === 'string' ? detail : 'Failed to import products CSV.',
        variant: 'destructive',
      });
    } finally {
      setImportingCsv(false);
    }
  };

  const downloadImportErrorsCsv = () => {
    if (!importSummary?.errors?.length) {
      return;
    }

    const escapeCsv = (value) => {
      const text = value == null ? '' : String(value);
      if (/[,"\n]/.test(text)) {
        return `"${text.replace(/"/g, '""')}"`;
      }
      return text;
    };

    const headers = ['row', 'name', 'sku', 'error', 'row_data'];
    const lines = [headers.join(',')];

    importSummary.errors.forEach((item) => {
      lines.push([
        escapeCsv(item.row),
        escapeCsv(item.name),
        escapeCsv(item.sku),
        escapeCsv(item.error),
        escapeCsv(JSON.stringify(item.row_data || {})),
      ].join(','));
    });

    const csvContent = lines.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `product-import-errors-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const filteredProducts = products.filter(product => {
    if (selectedCategory !== 'all') {
      const productCategories = Array.isArray(product.categories) && product.categories.length > 0
        ? product.categories
        : [product.category].filter(Boolean);
      const belongsToSelectedCategory = productCategories.some((categoryName) => categoryName === selectedCategory);
      if (!belongsToSelectedCategory) return false;
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return product.name.toLowerCase().includes(query) ||
             product.sku?.toLowerCase().includes(query) ||
             product.description?.toLowerCase().includes(query);
    }
    return true;
  });

  const allFilteredSelected = filteredProducts.length > 0 &&
    filteredProducts.every((product) => selectedProductIds.includes(product.id));

  const toggleSelectAllFiltered = (checked) => {
    if (checked) {
      setSelectedProductIds(Array.from(new Set([...selectedProductIds, ...filteredProducts.map((p) => p.id)])));
      return;
    }

    setSelectedProductIds((prev) => prev.filter((id) => !filteredProducts.some((p) => p.id === id)));
  };

  const toggleProductSelection = (productId, checked) => {
    setSelectedProductIds((prev) => {
      if (checked) {
        return Array.from(new Set([...prev, productId]));
      }
      return prev.filter((id) => id !== productId);
    });
  };

  const applyBulkAction = async () => {
    if (bulkAction === 'none' || selectedProductIds.length === 0) {
      toast({ title: 'No Action Applied', description: 'Select products and a mass update action first.' });
      return;
    }

    if (bulkAction === 'delete') {
      const confirmed = window.confirm(`Delete ${selectedProductIds.length} selected products?`);
      if (!confirmed) return;
    }

    setBulkProcessing(true);

    try {
      if (bulkAction === 'delete') {
        const selectedProducts = products.filter((product) => selectedProductIds.includes(product.id));
        await Promise.all(selectedProducts.map((product) => handleDelete(product, true)));
      } else {
        const updatePayload =
          bulkAction === 'mark-in-stock' || bulkAction === 'enable'
            ? { in_stock: true }
            : { in_stock: false };

        await Promise.all(
          selectedProductIds.map((productId) =>
            axios.put(`${API}/store/products/${productId}`, updatePayload, { headers: getAuthHeaders() })
          )
        );
      }

      setSelectedProductIds([]);
      setBulkAction('none');
      await Promise.all([fetchProducts(), fetchCategories()]);
      toast({ title: 'Mass Update Applied', description: 'Selected products were updated successfully.' });
    } catch (error) {
      toast({ title: 'Bulk Update Failed', description: 'Could not apply the selected bulk action.', variant: 'destructive' });
    }

    setBulkProcessing(false);
  };

  return (
    <div className="space-y-6" data-testid="admin-products-page">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500">Manage your product catalog inventory</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={importCsvInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImportCsvFile}
            data-testid="import-products-csv-input"
          />

          <Button
            onClick={handleAddProduct}
            className="bg-[#6e2ea8] hover:bg-[#552483] text-white"
            data-testid="add-product-btn"
          >
            <Plus className="w-4 h-4 mr-2" /> Add New Product
          </Button>

          <Button
            variant="outline"
            onClick={() => toggleSelectAllFiltered(!allFilteredSelected)}
            data-testid="bulk-edit-all-btn"
          >
            Bulk Edit All
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" data-testid="import-export-menu-btn">
                Import or Export Products <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuItem onClick={handleImportProductsClick} data-testid="import-products-option">
                {importingCsv ? 'Importing Products CSV...' : 'Import Products CSV'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast({ title: 'Export', description: 'Export flow can be wired next.' })} data-testid="export-products-option">
                Export Products CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {importSummary && (
        <Card data-testid="products-import-summary-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-gray-900" data-testid="products-import-summary-title">CSV Import Summary</h2>
                <p className="text-sm text-gray-500" data-testid="products-import-summary-message">{importSummary.message || 'Import completed.'}</p>
              </div>
              {importSummary.errors?.length > 0 && (
                <Button
                  variant="outline"
                  onClick={downloadImportErrorsCsv}
                  data-testid="download-import-errors-csv-btn"
                >
                  Download Error CSV ({importSummary.errors.length})
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="rounded-md border p-3" data-testid="products-import-total-rows">Total Rows: {importSummary.total_rows || 0}</div>
              <div className="rounded-md border p-3 text-emerald-700" data-testid="products-import-created-count">Created: {importSummary.created_count || 0}</div>
              <div className="rounded-md border p-3 text-amber-700" data-testid="products-import-skipped-count">Skipped: {importSummary.skipped_count || 0}</div>
            </div>

            <p className="text-xs text-gray-500" data-testid="products-import-required-columns">
              Required CSV columns: name, price, category. Optional multi-category: categories (comma or pipe separated).
            </p>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="w-full sm:w-auto" data-testid="products-filter-btn">
              <Filter className="w-4 h-4 mr-2" /> Filter
            </Button>

            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Product name, SKU, UPC"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="product-search-input"
              />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-60" data-testid="category-filter">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name} ({cat.product_count})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 border rounded-md px-2 py-1.5" data-testid="select-all-control">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={(checked) => toggleSelectAllFiltered(Boolean(checked))}
                data-testid="select-all-products-checkbox"
              />
              <span className="text-sm text-gray-700">Select All</span>
            </div>

            <Select value={bulkAction} onValueChange={setBulkAction}>
              <SelectTrigger className="w-60" data-testid="mass-update-select">
                <SelectValue placeholder="Mass Update" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Mass Update</SelectItem>
                <SelectItem value="mark-in-stock">Mark In Stock</SelectItem>
                <SelectItem value="mark-out-of-stock">Mark Out of Stock</SelectItem>
                <SelectItem value="enable">Enable Products</SelectItem>
                <SelectItem value="disable">Disable Products</SelectItem>
                <SelectItem value="delete">Delete Selected</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={applyBulkAction}
              disabled={bulkProcessing}
              data-testid="apply-mass-update-btn"
            >
              {bulkProcessing ? 'Applying...' : 'Apply'}
            </Button>

            <p className="text-sm text-gray-500" data-testid="products-viewing-count">
              VIEWING ALL PRODUCTS <button className="text-[#6e2ea8] hover:underline ml-1" onClick={handleRefresh} data-testid="refresh-products-btn">{refreshing ? 'REFRESHING...' : 'REFRESH'}</button>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Product Rows */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-[#6e2ea8] border-t-transparent rounded-full" />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="divide-y" data-testid="admin-products-list">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`grid grid-cols-1 md:grid-cols-[auto_72px_1fr_auto_auto] items-center gap-4 px-4 py-4 hover:bg-purple-50/40 transition-colors cursor-pointer ${selectedProductIds.includes(product.id) ? 'bg-purple-50/60' : 'bg-white'}`}
                  onClick={() => handleEdit(product)}
                  data-testid={`product-row-${product.id}`}
                >
                  <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedProductIds.includes(product.id)}
                      onCheckedChange={(checked) => toggleProductSelection(product.id, Boolean(checked))}
                      data-testid={`select-product-checkbox-${product.id}`}
                    />
                  </div>

                  <img
                    src={product.image || 'https://images.unsplash.com/photo-1609993203638-ac38dad890b1?w=200'}
                    alt={product.name}
                    className="w-[64px] h-[64px] rounded-md object-cover border"
                    data-testid={`product-thumbnail-${product.id}`}
                  />

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900" data-testid={`product-name-${product.id}`}>{product.name}</h3>
                      <span className="text-gray-400 text-sm font-mono" data-testid={`product-sku-${product.id}`}>{product.sku || 'NO-SKU'}</span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge className={product.in_stock ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'} data-testid={`product-enabled-badge-${product.id}`}>
                        {product.in_stock ? 'Enabled' : 'Disabled'}
                      </Badge>
                      <Badge variant="outline" data-testid={`product-stock-badge-${product.id}`}>
                        {product.in_stock ? 'In stock' : 'Out of stock'}
                      </Badge>
                      {(Array.isArray(product.categories) && product.categories.length > 0 ? product.categories : [product.category])
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((categoryName, index) => (
                          <Badge
                            key={`${product.id}-${categoryName}-${index}`}
                            variant="outline"
                            data-testid={index === 0 ? `product-category-badge-${product.id}` : `product-category-badge-${product.id}-${index}`}
                          >
                            {categoryName}{index === 0 ? ' (Primary)' : ''}
                          </Badge>
                        ))}
                      {Array.isArray(product.categories) && product.categories.length > 3 && (
                        <Badge variant="outline" data-testid={`product-category-badge-more-${product.id}`}>
                          +{product.categories.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-semibold text-gray-900" data-testid={`product-price-${product.id}`}>
                      ${Number(product.price || 0).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="border-gray-300" data-testid={`edit-product-dropdown-trigger-${product.id}`}>
                          Edit Product <ChevronDown className="w-4 h-4 ml-2" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-64" data-testid={`edit-product-dropdown-menu-${product.id}`}>
                        <DropdownMenuItem onClick={() => handleTabEdit(product, 'options')} data-testid={`edit-product-option-${product.id}`}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit Options
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTabEdit(product, 'attributes')} data-testid={`edit-attributes-option-${product.id}`}>
                          <SlidersHorizontal className="w-4 h-4 mr-2" /> Edit Attributes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTabEdit(product, 'general', 'images')} data-testid={`add-images-option-${product.id}`}>
                          <ImagePlus className="w-4 h-4 mr-2" /> Add Images
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTabEdit(product, 'files')} data-testid={`upload-files-option-${product.id}`}>
                          <FileUp className="w-4 h-4 mr-2" /> Upload Files
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTabEdit(product, 'shipping')} data-testid={`define-shipping-option-${product.id}`}>
                          <Truck className="w-4 h-4 mr-2" /> Define Shipping & Pickup
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleTabEdit(product, 'taxes')} data-testid={`define-taxes-option-${product.id}`}>
                          <Receipt className="w-4 h-4 mr-2" /> Define Taxes
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDuplicate(product)} data-testid={`duplicate-product-option-${product.id}`}>
                          <Copy className="w-4 h-4 mr-2" /> Duplicate Product
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDelete(product)} className="text-red-600" data-testid={`delete-product-option-${product.id}`}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No products found</p>
              <Button 
                onClick={handleAddProduct}
                className="mt-4 bg-[#6e2ea8] hover:bg-[#a01830]"
                data-testid="add-first-product-btn"
              >
                <Plus className="w-4 h-4 mr-2" /> Add Your First Product
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProducts;
