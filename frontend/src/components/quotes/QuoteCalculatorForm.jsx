import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Trash2, Save, X, AlertTriangle, Package, Wrench, FileText, RefreshCw, Calendar, DollarSign, ScrollText } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const BILLING_TYPES = [
  { id: 'onetime', label: 'One-Time', icon: DollarSign, color: 'bg-gray-100 text-gray-700' },
  { id: 'monthly', label: 'Monthly', icon: RefreshCw, color: 'bg-blue-100 text-blue-700' },
  { id: 'yearly', label: 'Yearly', icon: Calendar, color: 'bg-purple-100 text-purple-700' }
];

export const QuoteCalculatorForm = ({ quote, onChange, onSave, onCancel, isEditing }) => {
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [contractTemplates, setContractTemplates] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  
  const items = quote?.items || [{ description: '', quantity: 1, unit_price: 0, item_type: 'custom', billing_type: 'onetime' }];

  // Fetch products, services, and contract templates on mount
  useEffect(() => {
    const token = localStorage.getItem('crm_token');
    const headers = { Authorization: `Bearer ${token}` };
    
    Promise.all([
      axios.get(`${API_URL}/api/billing/products`, { headers }).catch(() => ({ data: { products: [] } })),
      axios.get(`${API_URL}/api/billing/services`, { headers }).catch(() => ({ data: { services: [] } })),
      axios.get(`${API_URL}/api/contract-templates`, { headers }).catch(() => ({ data: { templates: [] } }))
    ]).then(([productsRes, servicesRes, templatesRes]) => {
      setProducts(productsRes.data.products || []);
      setServices(servicesRes.data.services || []);
      setContractTemplates(templatesRes.data.templates || []);
      setLoadingCatalog(false);
      
      // Auto-select default contract template if not already set
      if (!quote?.contract_template_id) {
        const defaultTemplate = (templatesRes.data.templates || []).find(t => t.is_default);
        if (defaultTemplate) {
          onChange({ ...quote, contract_template_id: defaultTemplate.id, contract_template_name: defaultTemplate.name });
        }
      }
    });
  }, []);

  // Calculate totals by billing type
  const calculateTotals = (lineItems) => {
    const totals = { onetime: 0, monthly: 0, yearly: 0, combined: 0 };
    lineItems.forEach(item => {
      const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
      const billingType = item.billing_type || 'onetime';
      totals[billingType] += lineTotal;
      totals.combined += lineTotal;
    });
    return totals;
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (field === 'description' || field === 'item_type' || field === 'item_id' || field === 'billing_type') {
      newItems[index] = { ...newItems[index], [field]: value };
    } else {
      newItems[index] = { ...newItems[index], [field]: parseFloat(value) || 0 };
    }
    const totals = calculateTotals(newItems);
    onChange({ 
      ...quote, 
      items: newItems,
      total: totals.combined,
      total_onetime: totals.onetime,
      total_monthly: totals.monthly,
      total_yearly: totals.yearly
    });
  };

  // Determine best billing type based on product/service pricing
  const determineBillingType = (catalogItem) => {
    if (catalogItem.price_onetime && catalogItem.price_onetime > 0) return 'onetime';
    if (catalogItem.price_monthly && catalogItem.price_monthly > 0) return 'monthly';
    if (catalogItem.price_yearly && catalogItem.price_yearly > 0) return 'yearly';
    if (catalogItem.hourly_rate && catalogItem.hourly_rate > 0) return 'onetime';
    return 'onetime';
  };

  // Get price based on billing type
  const getPriceForBillingType = (catalogItem, billingType) => {
    switch (billingType) {
      case 'monthly': return catalogItem.price_monthly || 0;
      case 'yearly': return catalogItem.price_yearly || 0;
      case 'onetime': 
      default: return catalogItem.price_onetime || catalogItem.hourly_rate || 0;
    }
  };

  const handleCatalogSelect = (index, itemId, type) => {
    const catalog = type === 'product' ? products : services;
    const selectedItem = catalog.find(p => p.id === itemId);
    
    if (selectedItem) {
      const billingType = determineBillingType(selectedItem);
      const price = getPriceForBillingType(selectedItem, billingType);
      
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        item_type: type,
        item_id: itemId,
        description: selectedItem.name,
        unit_price: price,
        quantity: newItems[index].quantity || 1,
        billing_type: billingType,
        sku: selectedItem.sku || '',
        category: selectedItem.category || '',
        // Store all pricing options for flexibility
        price_onetime: selectedItem.price_onetime || 0,
        price_monthly: selectedItem.price_monthly || 0,
        price_yearly: selectedItem.price_yearly || 0
      };
      
      const totals = calculateTotals(newItems);
      onChange({ 
        ...quote, 
        items: newItems,
        total: totals.combined,
        total_onetime: totals.onetime,
        total_monthly: totals.monthly,
        total_yearly: totals.yearly
      });
    }
  };

  // Handle billing type change - update price accordingly
  const handleBillingTypeChange = (index, newBillingType) => {
    const newItems = [...items];
    const item = newItems[index];
    
    // If item has stored pricing options, update price
    if (item.price_onetime !== undefined || item.price_monthly !== undefined || item.price_yearly !== undefined) {
      let newPrice = item.unit_price;
      switch (newBillingType) {
        case 'monthly': newPrice = item.price_monthly || item.unit_price; break;
        case 'yearly': newPrice = item.price_yearly || item.unit_price; break;
        case 'onetime': newPrice = item.price_onetime || item.unit_price; break;
      }
      newItems[index] = { ...item, billing_type: newBillingType, unit_price: newPrice };
    } else {
      newItems[index] = { ...item, billing_type: newBillingType };
    }
    
    const totals = calculateTotals(newItems);
    onChange({ 
      ...quote, 
      items: newItems,
      total: totals.combined,
      total_onetime: totals.onetime,
      total_monthly: totals.monthly,
      total_yearly: totals.yearly
    });
  };

  const addLineItem = (type = 'custom') => {
    const newItem = { description: '', quantity: 1, unit_price: 0, item_type: type, billing_type: 'onetime' };
    const newItems = [...items, newItem];
    onChange({ ...quote, items: newItems });
  };

  const removeLineItem = (index) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    const totals = calculateTotals(newItems);
    onChange({ 
      ...quote, 
      items: newItems,
      total: totals.combined,
      total_onetime: totals.onetime,
      total_monthly: totals.monthly,
      total_yearly: totals.yearly
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };

  const totals = calculateTotals(items);

  // Group products by category
  const productsByCategory = products.reduce((acc, p) => {
    const cat = p.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  // Group services by category
  const servicesByCategory = services.reduce((acc, s) => {
    const cat = s.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  // Format price display for catalog item
  const formatCatalogPrice = (item) => {
    const prices = [];
    if (item.price_onetime) prices.push(`$${item.price_onetime.toFixed(0)}`);
    if (item.price_monthly) prices.push(`$${item.price_monthly.toFixed(0)}/mo`);
    if (item.price_yearly) prices.push(`$${item.price_yearly.toFixed(0)}/yr`);
    if (item.hourly_rate) prices.push(`$${item.hourly_rate.toFixed(0)}/hr`);
    return prices.length > 0 ? prices.join(' | ') : 'Contact';
  };

  return (
    <div className="space-y-6" data-testid="quote-calculator-form">
      {/* Quote Name */}
      <div>
        <Label className="text-sm font-medium">Quote Name *</Label>
        <Input
          value={quote?.name || ''}
          onChange={(e) => onChange({ ...quote, name: e.target.value })}
          placeholder="e.g., DME Pro Package, Basic Setup"
          className="mt-1"
          data-testid="quote-name-input"
        />
      </div>

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <Label className="text-sm font-medium">Line Items</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addLineItem('product')}
              className="h-8 text-xs"
              disabled={loadingCatalog || products.length === 0}
              data-testid="add-product-btn"
            >
              <Package className="w-3 h-3 mr-1" /> Add Product
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addLineItem('service')}
              className="h-8 text-xs"
              disabled={loadingCatalog || services.length === 0}
              data-testid="add-service-btn"
            >
              <Wrench className="w-3 h-3 mr-1" /> Add Service
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addLineItem('custom')}
              className="h-8 text-xs"
              data-testid="add-custom-btn"
            >
              <FileText className="w-3 h-3 mr-1" /> Add Custom
            </Button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-gray-50 border-b text-xs font-medium text-gray-500">
            <div className="col-span-3">Item</div>
            <div className="col-span-2">Billing</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          {/* Line Items */}
          <div className="divide-y">
            {items.map((item, index) => {
              const billingConfig = BILLING_TYPES.find(b => b.id === (item.billing_type || 'onetime')) || BILLING_TYPES[0];
              const BillingIcon = billingConfig.icon;
              
              return (
                <div 
                  key={index} 
                  className={`grid grid-cols-12 gap-2 px-3 py-2 items-center ${item.is_changed ? 'bg-yellow-50' : ''}`}
                  data-testid={`line-item-${index}`}
                >
                  {/* Item Type & Description */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      {item.item_type === 'product' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          <Package className="w-3 h-3 mr-0.5" /> Product
                        </span>
                      )}
                      {item.item_type === 'service' && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                          <Wrench className="w-3 h-3 mr-0.5" /> Service
                        </span>
                      )}
                      {(item.item_type === 'custom' || !item.item_type) && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                          <FileText className="w-3 h-3 mr-0.5" /> Custom
                        </span>
                      )}
                      {item.is_changed && (
                        <AlertTriangle className="w-3 h-3 text-yellow-500" title="Modified since last send" />
                      )}
                    </div>
                    
                    {/* Product Selector */}
                    {item.item_type === 'product' && (
                      <Select
                        value={item.item_id || ''}
                        onValueChange={(v) => handleCatalogSelect(index, v, 'product')}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select product..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(productsByCategory).map(([category, prods]) => (
                            <div key={category}>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">{category}</div>
                              {prods.map((p) => (
                                <SelectItem key={p.id} value={p.id}>
                                  <div className="flex flex-col">
                                    <span>{p.name}</span>
                                    <span className="text-xs text-gray-400">{formatCatalogPrice(p)}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Service Selector */}
                    {item.item_type === 'service' && (
                      <Select
                        value={item.item_id || ''}
                        onValueChange={(v) => handleCatalogSelect(index, v, 'service')}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Select service..." />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(servicesByCategory).map(([category, servs]) => (
                            <div key={category}>
                              <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-50">{category}</div>
                              {servs.map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  <div className="flex flex-col">
                                    <span>{s.name}</span>
                                    <span className="text-xs text-gray-400">{formatCatalogPrice(s)}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Custom Input */}
                    {(item.item_type === 'custom' || !item.item_type) && (
                      <Input
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Enter description..."
                        className="h-8 text-sm"
                        data-testid={`item-description-${index}`}
                      />
                    )}
                  </div>

                  {/* Billing Type Selector */}
                  <div className="col-span-2">
                    <Select
                      value={item.billing_type || 'onetime'}
                      onValueChange={(v) => handleBillingTypeChange(index, v)}
                    >
                      <SelectTrigger className={`h-8 text-xs ${billingConfig.color}`}>
                        <SelectValue>
                          <span className="flex items-center gap-1">
                            <BillingIcon className="w-3 h-3" />
                            {billingConfig.label}
                          </span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {BILLING_TYPES.map((bt) => {
                          const Icon = bt.icon;
                          return (
                            <SelectItem key={bt.id} value={bt.id}>
                              <span className="flex items-center gap-1">
                                <Icon className="w-3 h-3" />
                                {bt.label}
                              </span>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantity */}
                  <div className="col-span-2">
                    <Input
                      type="number"
                      min="1"
                      step="0.5"
                      value={item.quantity || 1}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      className="h-8 text-sm text-center"
                      data-testid={`item-quantity-${index}`}
                    />
                  </div>

                  {/* Unit Price */}
                  <div className="col-span-2">
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unit_price || 0}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        className="h-8 text-sm text-right pl-5"
                        data-testid={`item-price-${index}`}
                      />
                    </div>
                  </div>

                  {/* Line Total */}
                  <div className="col-span-2 text-right">
                    <span className="text-sm font-medium">
                      ${((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)).toFixed(2)}
                    </span>
                    {(item.billing_type === 'monthly' || item.billing_type === 'yearly') && (
                      <span className="text-xs text-gray-400 block">
                        /{item.billing_type === 'monthly' ? 'mo' : 'yr'}
                      </span>
                    )}
                  </div>

                  {/* Remove Button */}
                  <div className="col-span-1 text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLineItem(index)}
                      disabled={items.length <= 1}
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                      data-testid={`remove-item-${index}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Totals Section */}
          <div className="bg-gray-50 border-t px-3 py-3 space-y-2">
            {/* Breakdown by billing type */}
            {totals.onetime > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> One-Time Charges:
                </span>
                <span className="font-medium">${totals.onetime.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            {totals.monthly > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-blue-600 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Monthly Recurring:
                </span>
                <span className="font-medium text-blue-700">${totals.monthly.toLocaleString('en-US', { minimumFractionDigits: 2 })}/mo</span>
              </div>
            )}
            {totals.yearly > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-purple-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Yearly Recurring:
                </span>
                <span className="font-medium text-purple-700">${totals.yearly.toLocaleString('en-US', { minimumFractionDigits: 2 })}/yr</span>
              </div>
            )}
            
            {/* Divider if there are multiple types */}
            {((totals.onetime > 0 ? 1 : 0) + (totals.monthly > 0 ? 1 : 0) + (totals.yearly > 0 ? 1 : 0)) > 1 && (
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-700">First Invoice Total:</span>
                  <span className="font-bold text-lg text-[#014DB7]">
                    ${totals.combined.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recurring charges will auto-bill after first payment
                </p>
              </div>
            )}
            
            {/* Simple total if only one type */}
            {((totals.onetime > 0 ? 1 : 0) + (totals.monthly > 0 ? 1 : 0) + (totals.yearly > 0 ? 1 : 0)) <= 1 && (
              <div className="flex justify-between">
                <span className="font-semibold text-gray-700">Quote Total:</span>
                <span className="font-bold text-lg text-[#014DB7]" data-testid="quote-total">
                  ${totals.combined.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  {totals.monthly > 0 && '/mo'}
                  {totals.yearly > 0 && '/yr'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Catalog Status */}
        {loadingCatalog && (
          <p className="text-xs text-gray-500 mt-2">Loading product & service catalog...</p>
        )}
        {!loadingCatalog && products.length === 0 && services.length === 0 && (
          <p className="text-xs text-amber-600 mt-2">
            No products or services in catalog. Add them in Super Admin → Products to use quick-add.
          </p>
        )}
      </div>

      {/* Contract Template */}
      <div>
        <Label className="text-sm font-medium flex items-center gap-2">
          <ScrollText className="w-4 h-4" /> Contract Template
        </Label>
        <Select
          value={quote?.contract_template_id || ''}
          onValueChange={(v) => {
            const template = contractTemplates.find(t => t.id === v);
            onChange({ ...quote, contract_template_id: v, contract_template_name: template?.name });
          }}
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select a contract template..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Contract</SelectItem>
            {contractTemplates.map((template) => (
              <SelectItem key={template.id} value={template.id}>
                {template.name} {template.is_default ? '(Default)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          Contract will be included when quote is emailed for signing
        </p>
        {contractTemplates.length === 0 && !loadingCatalog && (
          <p className="text-xs text-amber-600 mt-1">
            No contract templates found. Create them in Super Admin.
          </p>
        )}
      </div>

      {/* Valid Until */}
      <div>
        <Label className="text-sm font-medium">Valid Until</Label>
        <Input
          type="date"
          value={quote?.valid_until || ''}
          onChange={(e) => onChange({ ...quote, valid_until: e.target.value })}
          className="mt-1 w-48"
          data-testid="quote-valid-until"
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty for no expiration</p>
      </div>

      {/* Notes */}
      <div>
        <Label className="text-sm font-medium">Notes / Terms</Label>
        <Textarea
          value={quote?.notes || ''}
          onChange={(e) => onChange({ ...quote, notes: e.target.value })}
          placeholder="Additional terms, conditions, or notes for the client..."
          rows={3}
          className="mt-1"
          data-testid="quote-notes"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="rounded-lg"
        >
          <X className="w-4 h-4 mr-1" /> Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !quote?.name?.trim() || items.length === 0 || !items.some(i => i.description)}
          className="bg-[#014DB7] rounded-lg"
          data-testid="save-quote-btn"
        >
          <Save className="w-4 h-4 mr-1" /> {saving ? 'Saving...' : isEditing ? 'Update Quote' : 'Create Quote'}
        </Button>
      </div>
    </div>
  );
};

export default QuoteCalculatorForm;
