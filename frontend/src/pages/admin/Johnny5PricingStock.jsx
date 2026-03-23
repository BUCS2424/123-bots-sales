import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Upload, Download, RefreshCw, AlertCircle, Percent, PlusCircle, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const emptyNewRow = {
  sku: '',
  product_id: '',
  product_name: '',
  option_strength: '',
  option_package: '',
  price: 0,
  cost_price: 0,
  stock_quantity: 0,
  in_stock: false,
  estimated_restock: '',
  allow_preorder: false,
};

const Johnny5PricingStock = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [savingMarkup, setSavingMarkup] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [creatingRow, setCreatingRow] = useState(false);
  const [savingRowId, setSavingRowId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [globalMarkupPercent, setGlobalMarkupPercent] = useState(0);
  const [newRow, setNewRow] = useState(emptyNewRow);

  const lowStockCount = useMemo(
    () => rows.filter((row) => !row.in_stock || Number(row.stock_quantity || 0) <= 0).length,
    [rows]
  );

  const fetchAll = async () => {
    try {
      const [rowsRes, settingsRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/johnny5/pricing-stock/rows`),
        axios.get(`${BACKEND_URL}/api/johnny5/pricing-stock/settings`),
      ]);
      setRows(rowsRes.data.rows || []);
      setGlobalMarkupPercent(settingsRes.data?.settings?.global_markup_percent ?? 0);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load pricing/stock sheet.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleSaveMarkup = async () => {
    setSavingMarkup(true);
    try {
      await axios.put(`${BACKEND_URL}/api/johnny5/pricing-stock/settings`, {
        global_markup_percent: Number(globalMarkupPercent || 0),
      });
      toast({ title: 'Saved', description: 'Global connected-store markup updated.' });
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save global markup.', variant: 'destructive' });
    } finally {
      setSavingMarkup(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({ title: 'No file selected', description: 'Please choose a CSV file first.', variant: 'destructive' });
      return;
    }

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      await axios.post(`${BACKEND_URL}/api/johnny5/pricing-stock/import.csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast({ title: 'Import complete', description: 'Pricing + stock sheet uploaded and synced.' });
      setSelectedFile(null);
      fetchAll();
    } catch (error) {
      const detail = error?.response?.data?.detail;
      const message = typeof detail === 'string' ? detail : (detail?.message || 'Import failed');
      toast({ title: 'Import failed', description: message, variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
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
      toast({ title: 'Export ready', description: 'Pricing + stock CSV downloaded.' });
    } catch (error) {
      toast({ title: 'Export failed', description: 'Unable to export CSV. Please try again.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const updateRowField = (rowId, field, value) => {
    setRows((prev) => prev.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const handleSaveRow = async (row) => {
    setSavingRowId(row.id);
    try {
      await axios.put(`${BACKEND_URL}/api/johnny5/pricing-stock/rows/${row.id}`, {
        stock_quantity: Number(row.stock_quantity || 0),
        in_stock: Boolean(row.in_stock),
        estimated_restock: row.estimated_restock || '',
        allow_preorder: Boolean(row.allow_preorder),
        price: Number(row.price || 0),
        cost_price: Number(row.cost_price || 0),
      });
      toast({ title: 'Row saved', description: `${row.sku || row.product_id} updated.` });
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save row changes.', variant: 'destructive' });
    } finally {
      setSavingRowId(null);
    }
  };

  const handleCreateRow = async () => {
    if (!newRow.sku && !newRow.product_id) {
      toast({ title: 'Missing key', description: 'Enter SKU or Product ID.', variant: 'destructive' });
      return;
    }
    setCreatingRow(true);
    try {
      await axios.post(`${BACKEND_URL}/api/johnny5/pricing-stock/rows`, {
        ...newRow,
        price: Number(newRow.price || 0),
        cost_price: Number(newRow.cost_price || 0),
        stock_quantity: Number(newRow.stock_quantity || 0),
      });
      toast({ title: 'Row added', description: 'Manual stock row created.' });
      setNewRow(emptyNewRow);
      fetchAll();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create row.', variant: 'destructive' });
    } finally {
      setCreatingRow(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><RefreshCw className="w-6 h-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6" data-testid="johnny5-pricing-stock-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Johnny 5 Pricing + Stock Sheet</h1>
          <p className="text-gray-500">CSV import/export + per-option stock control for connected carts and local checkout.</p>
        </div>
        <Button onClick={fetchAll} variant="outline" data-testid="pricing-stock-refresh-button">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      <Card data-testid="pricing-stock-controls-card">
        <CardHeader>
          <CardTitle>Sheet Controls</CardTitle>
          <CardDescription>Upload and download in the same CSV format each time.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <Label htmlFor="pricing-stock-upload-file">Upload CSV</Label>
              <Input
                id="pricing-stock-upload-file"
                type="file"
                accept=".csv"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                data-testid="pricing-stock-upload-input"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={handleImport} disabled={importing} className="flex-1" data-testid="pricing-stock-import-button">
                <Upload className="w-4 h-4 mr-2" /> {importing ? 'Importing...' : 'Import CSV'}
              </Button>
              <Button onClick={handleExport} variant="outline" disabled={exporting} data-testid="pricing-stock-export-button">
                <Download className="w-4 h-4 mr-2" /> {exporting ? 'Exporting...' : 'Export'}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="global-markup-input">Global Connected-Store Markup (%)</Label>
              <Input
                id="global-markup-input"
                type="number"
                step="0.01"
                value={globalMarkupPercent}
                onChange={(e) => setGlobalMarkupPercent(e.target.value)}
                data-testid="pricing-stock-global-markup-input"
              />
            </div>
            <div>
              <Button onClick={handleSaveMarkup} disabled={savingMarkup} data-testid="pricing-stock-save-markup-button">
                <Percent className="w-4 h-4 mr-2" /> {savingMarkup ? 'Saving...' : 'Save Markup'}
              </Button>
            </div>
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2" data-testid="pricing-stock-preorder-message">
              <AlertCircle className="w-4 h-4 inline mr-1" /> If out of stock, connected carts can prompt pre-order without exact restock date.
            </div>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="pricing-stock-manual-add-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><PlusCircle className="w-4 h-4" /> Manual Row Input</CardTitle>
          <CardDescription>Create stock rows manually if needed.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <Input placeholder="SKU" value={newRow.sku} onChange={(e) => setNewRow({ ...newRow, sku: e.target.value })} data-testid="manual-row-sku-input" />
            <Input placeholder="Product ID" value={newRow.product_id} onChange={(e) => setNewRow({ ...newRow, product_id: e.target.value })} data-testid="manual-row-product-id-input" />
            <Input placeholder="Strength" value={newRow.option_strength} onChange={(e) => setNewRow({ ...newRow, option_strength: e.target.value })} data-testid="manual-row-strength-input" />
            <Input placeholder="Package" value={newRow.option_package} onChange={(e) => setNewRow({ ...newRow, option_package: e.target.value })} data-testid="manual-row-package-input" />
            <Input type="number" placeholder="Stock Qty" value={newRow.stock_quantity} onChange={(e) => setNewRow({ ...newRow, stock_quantity: e.target.value })} data-testid="manual-row-stock-input" />
            <Button onClick={handleCreateRow} disabled={creatingRow} data-testid="manual-row-create-button">{creatingRow ? 'Adding...' : 'Add Row'}</Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="pricing-stock-table-card">
        <CardHeader>
          <CardTitle>Rows ({rows.length})</CardTitle>
          <CardDescription>{lowStockCount} rows currently out of stock / red X.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm" data-testid="pricing-stock-table">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-2">SKU</th>
                  <th className="py-2 pr-2">Product/Option</th>
                  <th className="py-2 pr-2">Price</th>
                  <th className="py-2 pr-2">Cost</th>
                  <th className="py-2 pr-2">Connected Cost</th>
                  <th className="py-2 pr-2">Stock</th>
                  <th className="py-2 pr-2">In Stock</th>
                  <th className="py-2 pr-2">ETA</th>
                  <th className="py-2 pr-2">Pre-order</th>
                  <th className="py-2 pr-2">Save</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b align-top" data-testid={`pricing-stock-row-${row.id}`}>
                    <td className="py-2 pr-2 font-mono text-xs">{row.sku || '—'}</td>
                    <td className="py-2 pr-2">
                      <div className="font-medium">{row.product_name || row.product_id || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{row.option_strength || 'Default'} • {row.option_package || 'Default'}</div>
                    </td>
                    <td className="py-2 pr-2"><Input type="number" step="0.01" value={row.price ?? 0} onChange={(e) => updateRowField(row.id, 'price', e.target.value)} data-testid={`row-price-${row.id}`} /></td>
                    <td className="py-2 pr-2"><Input type="number" step="0.01" value={row.cost_price ?? 0} onChange={(e) => updateRowField(row.id, 'cost_price', e.target.value)} data-testid={`row-cost-${row.id}`} /></td>
                    <td className="py-2 pr-2 font-semibold text-indigo-700" data-testid={`row-connected-cost-${row.id}`}>${Number(row.connected_store_cost || 0).toFixed(2)}</td>
                    <td className="py-2 pr-2"><Input type="number" value={row.stock_quantity ?? 0} onChange={(e) => updateRowField(row.id, 'stock_quantity', e.target.value)} data-testid={`row-stock-${row.id}`} /></td>
                    <td className="py-2 pr-2">
                      <label className="inline-flex items-center gap-2" data-testid={`row-in-stock-wrap-${row.id}`}>
                        <input type="checkbox" checked={Boolean(row.in_stock)} onChange={(e) => updateRowField(row.id, 'in_stock', e.target.checked)} data-testid={`row-in-stock-${row.id}`} />
                        <span className={`text-xs font-semibold ${row.in_stock ? 'text-green-700' : 'text-red-600'}`}>{row.in_stock ? '✓' : '✕ red X'}</span>
                      </label>
                    </td>
                    <td className="py-2 pr-2"><Input value={row.estimated_restock || ''} onChange={(e) => updateRowField(row.id, 'estimated_restock', e.target.value)} placeholder="e.g. 2-3 weeks" data-testid={`row-eta-${row.id}`} /></td>
                    <td className="py-2 pr-2">
                      <label className="inline-flex items-center gap-2" data-testid={`row-preorder-wrap-${row.id}`}>
                        <input type="checkbox" checked={Boolean(row.allow_preorder)} onChange={(e) => updateRowField(row.id, 'allow_preorder', e.target.checked)} data-testid={`row-preorder-${row.id}`} />
                        <span className="text-xs">Allow</span>
                      </label>
                    </td>
                    <td className="py-2 pr-2">
                      <Button size="sm" onClick={() => handleSaveRow(row)} disabled={savingRowId === row.id} data-testid={`row-save-${row.id}`}>
                        <Save className="w-4 h-4 mr-1" /> {savingRowId === row.id ? 'Saving...' : 'Save'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Johnny5PricingStock;