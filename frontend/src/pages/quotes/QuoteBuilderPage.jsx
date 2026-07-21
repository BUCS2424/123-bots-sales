import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSiteFeatureFlags } from '../../hooks/useSiteFeatureFlags';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, RefreshCw, Plus, Trash2, Package, Wrench, FileText, Eye, ScrollText, Shield, FileCheck, FilePlus, GripVertical, Settings, Search, ShoppingCart, ExternalLink, Truck, Loader2 } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DOCUMENT_TYPE_ICONS = {
  service_agreement: FileText,
  nda: Shield,
  hipaa_baa: FileCheck,
  addendum: FilePlus,
  terms_of_service: ScrollText,
  product_agreement: Package,
  custom: FileText
};

const DOCUMENT_TYPE_COLORS = {
  service_agreement: 'bg-blue-100 text-blue-700',
  nda: 'bg-purple-100 text-purple-700',
  hipaa_baa: 'bg-green-100 text-green-700',
  addendum: 'bg-orange-100 text-orange-700',
  terms_of_service: 'bg-gray-100 text-gray-700',
  product_agreement: 'bg-teal-100 text-teal-700',
  custom: 'bg-slate-100 text-slate-700'
};


const SortablePreviewRow = ({ item, formatCurrency }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item._id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  const hasBoth = item.price_monthly > 0 && item.price_yearly > 0;
  const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
  const suffix = item.billing_type === 'monthly' ? '/mo' : item.billing_type === 'yearly' ? '/yr' : '';
  return (
    <div ref={setNodeRef} style={style} className="grid grid-cols-12 gap-2 px-4 py-3 items-center border-b border-gray-100 hover:bg-gray-50 bg-white">
      <div className="col-span-1 cursor-grab text-gray-300" {...attributes} {...listeners}>
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="col-span-3">
        <p className="font-medium text-gray-900 text-sm">{item.description}</p>
      </div>
      <div className="col-span-3">
        {hasBoth ? (
          <div className="space-y-1">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${item.billing_type === 'monthly' ? 'bg-blue-50 border border-blue-300 text-blue-700 font-semibold' : 'bg-gray-50 border border-gray-200 text-gray-500'}`}>
              <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${item.billing_type === 'monthly' ? 'border-blue-500' : 'border-gray-300'}`}>
                {item.billing_type === 'monthly' && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
              </div>
              {formatCurrency(item.price_monthly)}/mo
            </div>
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs ${item.billing_type === 'yearly' ? 'bg-purple-50 border border-purple-300 text-purple-700 font-semibold' : 'bg-gray-50 border border-gray-200 text-gray-500'}`}>
              <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${item.billing_type === 'yearly' ? 'border-purple-500' : 'border-gray-300'}`}>
                {item.billing_type === 'yearly' && <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />}
              </div>
              {formatCurrency(item.price_yearly)}/yr
            </div>
          </div>
        ) : item.billing_type !== 'onetime' ? (
          <span className="text-xs text-blue-600 font-medium">{item.billing_type === 'monthly' ? 'Monthly' : 'Yearly'}</span>
        ) : (
          <span className="text-xs text-gray-500">One-Time</span>
        )}
      </div>
      <div className="col-span-2 text-center text-gray-600 text-sm">{item.quantity}</div>
      <div className="col-span-3 text-right font-semibold text-gray-900 text-sm">{formatCurrency(lineTotal)}{suffix}</div>
    </div>
  );
};

const SortableLineItem = ({ id, item, index, products, services, onItemChange, onCatalogSelect, onRemove, canRemove, formatCurrency }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  return (
    <div ref={setNodeRef} style={style}>
      <LineItemRow
        item={item}
        index={index}
        products={products}
        services={services}
        onItemChange={onItemChange}
        onCatalogSelect={onCatalogSelect}
        onRemove={onRemove}
        canRemove={canRemove}
        formatCurrency={formatCurrency}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
};

function CatalogPickerModal({ open, onClose, products, services, onAddItem, formatCurrency, navigate }) {
  const [tab, setTab] = useState('products');
  const [search, setSearch] = useState('');

  const filtered = (tab === 'products' ? products : services).filter(item => {
    const q = search.toLowerCase();
    return !q || [item.name, item.description, item.category, item.sku].some(v => String(v || '').toLowerCase().includes(q));
  });

  const grouped = filtered.reduce((acc, item) => {
    const cat = item.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const handleAdd = (item) => {
    const type = tab === 'products' ? 'product' : 'service';
    const billingType = item.price_monthly > 0 ? 'monthly' : item.price_yearly > 0 ? 'yearly' : 'onetime';
    const price = item.price_onetime || item.price_monthly || item.hourly_rate || 0;
    onAddItem({
      item_type: type,
      item_id: item.id,
      description: item.name,
      quantity: 1,
      unit_price: price,
      billing_type: billingType,
      price_onetime: item.price_onetime || 0,
      price_monthly: item.price_monthly || 0,
      price_yearly: item.price_yearly || 0,
      sku: item.sku || '',
      category: item.category || '',
    });
    toast.success(`"${item.name}" added to quote`);
  };

  const isEmpty = products.length === 0 && services.length === 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col" data-testid="catalog-picker-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-[#014DB7]" />
            Add from Catalog
          </DialogTitle>
        </DialogHeader>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
            <Package className="w-12 h-12 text-gray-300" />
            <div>
              <p className="font-semibold text-gray-700 mb-1">Your catalog is empty</p>
              <p className="text-sm text-gray-500 mb-4">Add products and services to your catalog first, then they'll appear here.</p>
              <Button
                variant="outline"
                onClick={() => { onClose(); navigate('/admin/quotes/settings'); }}
                data-testid="catalog-picker-go-to-catalog"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Go to Catalog Settings
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex gap-2 border-b pb-3">
              <button
                onClick={() => setTab('products')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'products' ? 'bg-[#014DB7] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                data-testid="catalog-picker-products-tab"
              >
                <Package className="w-4 h-4" /> Products ({products.length})
              </button>
              <button
                onClick={() => setTab('services')}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'services' ? 'bg-[#014DB7] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                data-testid="catalog-picker-services-tab"
              >
                <Wrench className="w-4 h-4" /> Services ({services.length})
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${tab}...`}
                className="pl-9"
                data-testid="catalog-picker-search"
              />
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 pr-1">
              {Object.keys(grouped).length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">No {tab} match your search</p>
              ) : (
                Object.entries(grouped).map(([cat, items]) => (
                  <div key={cat}>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">{cat}</div>
                    <div className="space-y-1">
                      {items.map((item) => {
                        const displayPrice = item.price_onetime || item.price_monthly || item.hourly_rate || 0;
                        const billingLabel = item.price_monthly > 0 && !item.price_onetime ? '/mo' : item.price_yearly > 0 && !item.price_onetime ? '/yr' : '';
                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:border-[#014DB7] hover:bg-blue-50/50 transition-colors group"
                            data-testid={`catalog-picker-item-${item.id}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                              {item.description && (
                                <p className="text-xs text-gray-500 truncate">{item.description}</p>
                              )}
                              {item.sku && <p className="text-xs text-gray-400">SKU: {item.sku}</p>}
                            </div>
                            <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                              <div className="text-right">
                                <p className="font-semibold text-gray-900 text-sm">{formatCurrency(displayPrice)}{billingLabel}</p>
                                {item.price_monthly > 0 && item.price_onetime > 0 && (
                                  <p className="text-xs text-blue-500">{formatCurrency(item.price_monthly)}/mo available</p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAdd(item)}
                                className="bg-[#014DB7] hover:bg-[#0140a0] text-white h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                data-testid={`catalog-picker-add-${item.id}`}
                              >
                                <Plus className="w-3 h-3 mr-1" /> Add
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t pt-3 flex justify-between items-center text-xs text-gray-500">
              <span>Click "Add" on any item to add it as a line item</span>
              <Button variant="outline" size="sm" onClick={onClose}>Done</Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function QuoteBuilderPage({ leadId: propLeadId, quoteId: propQuoteId }) {
  const { leadId: routeLeadId, quoteId: routeQuoteId } = useParams();
  const leadId = propLeadId || routeLeadId;
  const quoteId = propQuoteId || routeQuoteId;
  const navigate = useNavigate();
  const { quotes_enabled: quotesEnabled } = useSiteFeatureFlags();
  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lead, setLead] = useState(null);
  const [products, setProducts] = useState([]);
  const [services, setServices] = useState([]);
  const [contractTemplates, setContractTemplates] = useState([]);
  const [companySettings, setCompanySettings] = useState({});
  const [quoteFormConfig, setQuoteFormConfig] = useState({
    show_from_business_name: true,
    show_from_address: true,
    show_from_city_state_zip: true,
    show_from_phone: false,
    show_from_email: false,
    charge_stripe_fees: true,
    deposit_value: 65,
    deposit_type: 'percent',
  });
  const [quoteFlowConfig, setQuoteFlowConfig] = useState({
    allow_save_draft: true,
    allow_send_email: true,
  });
  const [quoteBusinessInfo, setQuoteBusinessInfo] = useState({
    business_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    phone: '',
    email: '',
    logo_url: '',
  });
  
  const [quoteName, setQuoteName] = useState('');
  const [notes, setNotes] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [contractTemplateId, setContractTemplateId] = useState('');
  const [selectedDocumentIds, setSelectedDocumentIds] = useState([]);
  let _itemIdCounter = 1;
  const genItemId = () => `item-${Date.now()}-${_itemIdCounter++}`;

  const [items, setItems] = useState([{ _id: genItemId(), description: '', quantity: 1, unit_price: 0, item_type: 'custom', billing_type: 'onetime' }]);
  const [previewTab, setPreviewTab] = useState('quote');
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);
  const [taxRatePercent, setTaxRatePercent] = useState(0);
  const [quoteTaxExempt, setQuoteTaxExempt] = useState(false);
  const [shippingCost, setShippingCost] = useState('');
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [shipAddress, setShipAddress] = useState({ street1: '', city: '', state: '', zip_code: '' });
  const [shippingRates, setShippingRates] = useState([]);
  const [calcLoadingShipping, setCalcLoadingShipping] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex(i => i._id === active.id);
      const newIndex = prev.findIndex(i => i._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const isNewQuote = !quoteId || quoteId === 'new';

  useEffect(() => {
    fetchData();
  }, [leadId, quoteId]);

  const fetchData = async () => {
    try {
      const results = await Promise.all([
        api.get('/api/leads/' + leadId),
        api.get('/api/store/products?limit=500&include_hidden=true').catch(() => ({ data: { products: [] } })),
        api.get('/api/quotes/catalog/services').catch(() => ({ data: { services: [] } })),
        api.get('/api/contract-templates').catch(() => ({ data: { templates: [] } })),
        api.get('/api/settings/general').catch(() => ({ data: {} })),
        api.get('/api/quotes/config').catch(() => ({ data: { config: {}, business_info: {} } })),
        api.get('/api/quotes/flow-config').catch(() => ({ data: { config: {} } })),
        api.get('/api/admin-settings/tax').catch(() => ({ data: {} })),
        api.get('/api/quotes/catalog/products').catch(() => ({ data: { products: [] } })),
      ]);
      
      setLead(results[0].data);
      const leadData = results[0].data || {};
      // Combined active sales tax rate (%)
      const taxData = results[7]?.data || {};
      const combinedRate = (taxData.tax_enabled === false ? [] : (taxData.tax_rates || []))
        .filter(r => r.active !== false)
        .reduce((sum, r) => sum + (parseFloat(r.rate) || 0), 0);
      setTaxRatePercent(combinedRate);
      // Map store products (price, sku, category, shipping dims) to quote catalog format
      const storeProducts = (results[1].data.products || results[1].data || []).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        category: p.category || 'Products',
        sku: p.sku || '',
        price_onetime: p.price || 0,
        price_monthly: 0,
        price_yearly: 0,
        is_active: p.is_visible !== false,
        image: p.image || '',
        shipping_weight: p.shipping_weight || 0,
      })).filter(p => p.name);
      // Merge in curated Quote Products catalog entries not already covered by SKU match
      const storeSkus = new Set(storeProducts.map(p => p.sku).filter(Boolean));
      const quoteCatalogProducts = (results[8].data.products || []).filter(p => !(p.sku && storeSkus.has(p.sku))).map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || '',
        category: p.category || 'General',
        sku: p.sku || '',
        price_onetime: p.price_onetime || 0,
        price_monthly: p.price_monthly || 0,
        price_yearly: p.price_yearly || 0,
        is_active: p.is_active !== false,
        shipping_weight: p.shipping_weight || 0,
      }));
      setProducts([...storeProducts, ...quoteCatalogProducts]);
      setServices(results[2].data.services || []);
      setContractTemplates(results[3].data.templates || []);
      setCompanySettings(results[4].data || {});
      setQuoteFormConfig((prev) => ({ ...prev, ...(results[5].data?.config || {}) }));
      setQuoteBusinessInfo(results[5].data?.business_info || {});
      setQuoteFlowConfig((prev) => ({ ...prev, ...(results[6].data?.config || {}) }));
      
      if (!isNewQuote) {
        const quotesRes = await api.get('/api/leads/' + leadId + '/quotes');
        const existingQuote = quotesRes.data.quotes?.find(q => q.id === quoteId);
        if (existingQuote) {
          setQuoteName(existingQuote.name || '');
          setNotes(existingQuote.notes || '');
          setValidUntil(existingQuote.valid_until || '');
          setContractTemplateId(existingQuote.contract_template_id || '');
          setSelectedDocumentIds(existingQuote.contract_document_ids || []);
          setItems(existingQuote.items?.length > 0 ? existingQuote.items.map((it, i) => ({ ...it, _id: it._id || `item-load-${i}` })) : [{ _id: genItemId(), description: '', quantity: 1, unit_price: 0, item_type: 'custom', billing_type: 'onetime' }]);
          setQuoteTaxExempt(existingQuote.tax_exempt ?? Boolean(leadData.tax_exempt));
          setShippingCost(existingQuote.shipping_cost != null ? String(existingQuote.shipping_cost) : '');
        }
      } else {
        setQuoteTaxExempt(Boolean(leadData.tax_exempt));
        const defaultTemplate = (results[3].data.templates || []).find(t => t.is_default);
        if (defaultTemplate) {
          setContractTemplateId(defaultTemplate.id);
        }
        // Auto-select required documents
        const requiredDocs = (results[3].data.templates || []).filter(t => t.is_required).map(t => t.id);
        setSelectedDocumentIds(requiredDocs);
      }
      setShipAddress({
        street1: leadData.address || '',
        city: leadData.city || '',
        state: leadData.state || '',
        zip_code: leadData.zip_code || '',
      });
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = () => {
    const totals = { onetime: 0, monthly: 0, yearly: 0, combined: 0 };
    items.forEach(item => {
      const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
      const billingType = item.billing_type || 'onetime';
      totals[billingType] += lineTotal;
      totals.combined += lineTotal;
    });
    return totals;
  };

  const totals = calculateTotals();
  const taxAmount = quoteTaxExempt ? 0 : totals.combined * (taxRatePercent / 100);
  const shippingAmount = shippingCost === '' || shippingCost === null || isNaN(parseFloat(shippingCost)) ? 0 : parseFloat(shippingCost);
  const STRIPE_RATE = 0.029;
  const STRIPE_FLAT = 0.30;
  const ccFee = (amount) => amount > 0 ? (amount * STRIPE_RATE) + STRIPE_FLAT : 0;
  const stripeFeesEnabled = quoteFormConfig.charge_stripe_fees !== false;
  const stripeFeeAmount = stripeFeesEnabled ? ccFee(totals.combined) : 0;
  const totalWithFees = totals.combined + taxAmount + shippingAmount + stripeFeeAmount;
  const depositType = quoteFormConfig.deposit_type === 'flat' ? 'flat' : 'percent';
  const rawDepositValue = Number(quoteFormConfig.deposit_value || 0);
  const depositAmount = Math.min(
    Math.max(depositType === 'flat' ? rawDepositValue : (totalWithFees * rawDepositValue) / 100, 0),
    totalWithFees,
  );
  const balanceAmount = Math.max(totalWithFees - depositAmount, 0);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (field === 'description' || field === 'item_type' || field === 'item_id') {
      newItems[index] = { ...newItems[index], [field]: value };
    } else if (field === 'billing_type') {
      const item = newItems[index];
      let newPrice = item.unit_price;
      if (value === 'monthly' && item.price_monthly > 0) newPrice = item.price_monthly;
      else if (value === 'yearly' && item.price_yearly > 0) newPrice = item.price_yearly;
      else if (value === 'onetime' && item.price_onetime > 0) newPrice = item.price_onetime;
      newItems[index] = { ...item, billing_type: value, unit_price: newPrice };
    } else {
      newItems[index] = { ...newItems[index], [field]: parseFloat(value) || 0 };
    }
    setItems(newItems);
  };

  const handleCatalogSelect = (index, itemId, type) => {
    const catalog = type === 'product' ? products : services;
    const selectedItem = catalog.find(p => p.id === itemId);
    if (!selectedItem) return;
    
    const billingType = selectedItem.price_monthly ? 'monthly' : selectedItem.price_yearly ? 'yearly' : 'onetime';
    const price = selectedItem.price_onetime || selectedItem.price_monthly || selectedItem.hourly_rate || 0;
    
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      item_type: type,
      item_id: itemId,
      description: selectedItem.name,
      unit_price: price,
      billing_type: billingType,
      price_onetime: selectedItem.price_onetime || 0,
      price_monthly: selectedItem.price_monthly || 0,
      price_yearly: selectedItem.price_yearly || 0,
      sku: selectedItem.sku || '',
      category: selectedItem.category || ''
    };
    setItems(newItems);
  };

  const addLineItem = (type) => {
    setItems([...items, { _id: genItemId(), description: '', quantity: 1, unit_price: 0, item_type: type, billing_type: 'onetime' }]);
  };

  const addFromCatalogItem = (catalogItem) => {
    setItems(prev => [...prev, { _id: genItemId(), ...catalogItem }]);
  };

  const removeLineItem = (index) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!quoteName.trim()) {
      toast.error('Please enter a quote name');
      return;
    }
    if (!items.some(i => i.description)) {
      toast.error('Please add at least one line item');
      return;
    }
    
    setSaving(true);
    try {
      const template = contractTemplates.find(t => t.id === contractTemplateId);
      
      // Combine main contract with additional documents
      const allDocumentIds = contractTemplateId 
        ? [contractTemplateId, ...selectedDocumentIds.filter(id => id !== contractTemplateId)]
        : selectedDocumentIds;
      
      const payload = {
        name: quoteName,
        notes,
        valid_until: validUntil,
        contract_template_id: contractTemplateId,
        contract_template_name: template?.name || '',
        contract_document_ids: allDocumentIds,
        items,
        subtotal: totals.combined,
        tax_exempt: quoteTaxExempt,
        tax_rate: quoteTaxExempt ? 0 : taxRatePercent,
        tax_amount: taxAmount,
        shipping_cost: shippingCost === '' ? null : shippingAmount,
        total: totals.combined + taxAmount + shippingAmount,
        total_onetime: totals.onetime,
        total_monthly: totals.monthly,
        total_yearly: totals.yearly
      };

      if (isNewQuote) {
        await api.post('/api/leads/' + leadId + '/quotes', payload);
        toast.success('Quote created');
      } else {
        await api.put('/api/leads/' + leadId + '/quotes/' + quoteId, payload);
        toast.success('Quote updated');
      }
      navigate('/admin/leads');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save quote');
    } finally {
      setSaving(false);
    }
  };

  const handleCalculateShipping = async () => {
    if (!shipAddress.street1 || !shipAddress.city || !shipAddress.state || !shipAddress.zip_code) {
      toast.error('Please enter a complete destination address');
      return;
    }
    setCalcLoadingShipping(true);
    setShippingRates([]);
    try {
      const shipItems = items
        .filter(i => i.item_type === 'product' && i.item_id)
        .map(i => ({ product_id: i.item_id, quantity: i.quantity || 1 }));
      const res = await api.post('/api/shipping/rates/checkout', {
        to_address: {
          name: clientName || 'Customer',
          street1: shipAddress.street1,
          city: shipAddress.city,
          state: shipAddress.state,
          zip_code: shipAddress.zip_code,
          country: 'US',
        },
        items: shipItems,
        order_subtotal: totals.combined,
      });
      const rates = res.data?.rates || [];
      setShippingRates(rates);
      if (rates.length === 0) {
        toast.error('No carrier rates returned. Enter shipping manually or check Shipping Settings.');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to calculate shipping rates');
    } finally {
      setCalcLoadingShipping(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
  };

  const mergeContractFields = (content) => {
    if (!content) return '';
    let merged = content;
    const clientFullName = lead ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim() : 'Client';
    const clientBusiness = lead?.company_name || lead?.company || '';
    const providerName = quoteBusinessInfo?.business_name || companySettings?.business_name || companySettings?.company_name || '123Bots';
    merged = merged.replace(/\{\{client_name\}\}/g, clientFullName);
    merged = merged.replace(/\{\{company_name\}\}/g, clientBusiness);
    merged = merged.replace(/\{\{business_name\}\}/g, providerName);
    merged = merged.replace(/\{\{provider_name\}\}/g, providerName);
    merged = merged.replace(/\{\{email\}\}/g, lead?.email || '');
    merged = merged.replace(/\{\{quote_name\}\}/g, quoteName || '');
    merged = merged.replace(/\{\{quote_total\}\}/g, formatCurrency(totals.combined));
    merged = merged.replace(/\{\{date\}\}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
    merged = merged.replace(/\{\{valid_until\}\}/g, validUntil || '');
    return merged;
  };

  const selectedContract = contractTemplates.find(t => t.id === contractTemplateId);
  const clientName = ((lead?.first_name || '') + ' ' + (lead?.last_name || '')).trim() || 'Client';
  const clientBusinessName = lead?.company_name || lead?.company || '';
  const companyName = quoteBusinessInfo?.business_name || companySettings?.business_name || companySettings?.company_name || 'Business Name';
  const companyAddress = quoteBusinessInfo?.address || companySettings?.address || '';
  const companyCity = quoteBusinessInfo?.city || companySettings?.city || '';
  const companyState = quoteBusinessInfo?.state || companySettings?.state || '';
  const companyZip = quoteBusinessInfo?.zip_code || companySettings?.zip_code || companySettings?.zip || '';
  const companyPhone = quoteBusinessInfo?.phone || companySettings?.phone || '';
  const companyEmail = quoteBusinessInfo?.email || companySettings?.email || '';
  const companyLogoUrl = quoteBusinessInfo?.logo_url || companySettings?.logo_url || '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!quotesEnabled) {
    return <div className="p-6 text-sm text-gray-500" data-testid="quote-builder-feature-disabled">Quotes feature is disabled.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100" data-testid="quote-builder-page">
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/admin/leads')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-xl font-bold text-gray-900">
              {isNewQuote ? 'Create Quote' : 'Edit Quote'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate('/admin/quotes/settings')} data-testid="quote-builder-settings-cog-button">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={saving || quoteFlowConfig.allow_save_draft === false} data-testid="quote-builder-save-draft-button">
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button className="bg-[#014DB7]" onClick={handleSave} disabled={saving || quoteFlowConfig.allow_send_email === false} data-testid="quote-builder-save-continue-button">
              <Send className="w-4 h-4 mr-2" /> Save & Continue
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-2 gap-8">
          
          {/* LEFT: Quote Preview */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Preview Tabs */}
            <div className="bg-gradient-to-r from-[#014DB7] to-[#0066FF] p-4">
              <div className="flex items-center justify-between text-white mb-3">
                <span className="text-sm font-medium">Document Preview</span>
                <Eye className="w-4 h-4" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPreviewTab('quote')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    previewTab === 'quote' ? 'bg-white text-[#014DB7]' : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Quote
                </button>
                {contractTemplateId && (
                  <button
                    onClick={() => setPreviewTab('contract')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      previewTab === 'contract' ? 'bg-white text-[#014DB7]' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Primary Contract
                  </button>
                )}
                {selectedDocumentIds.filter(id => id !== contractTemplateId).length > 0 && (
                  <button
                    onClick={() => setPreviewTab('documents')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      previewTab === 'documents' ? 'bg-white text-[#014DB7]' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    +{selectedDocumentIds.filter(id => id !== contractTemplateId).length} Documents
                  </button>
                )}
              </div>
            </div>
            
            <div className="p-8">
              {/* Quote Preview Tab */}
              {previewTab === 'quote' && (
                <>
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-1">QUOTE</h2>
                  <p className="text-[#014DB7] font-medium">#QT-{Date.now().toString().slice(-6)}</p>
                </div>
                <div className="text-right">
                  {companyLogoUrl ? (
                    <img src={companyLogoUrl} alt="Business logo" className="h-14 object-contain ml-auto" data-testid="quote-preview-business-logo" />
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="bg-[#E8F4FF] rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">From</p>
                  {quoteFormConfig.show_from_business_name !== false && (
                    <p className="font-semibold text-gray-900">{companyName}</p>
                  )}
                  {quoteFormConfig.show_from_address !== false && companyAddress && (
                    <p className="text-sm text-gray-600">{companyAddress}</p>
                  )}
                  {quoteFormConfig.show_from_city_state_zip !== false && (companyCity || companyState || companyZip) && (
                    <p className="text-sm text-gray-600">{[companyCity, companyState, companyZip].filter(Boolean).join(', ')}</p>
                  )}
                  {quoteFormConfig.show_from_phone && companyPhone && (
                    <p className="text-sm text-gray-600">{companyPhone}</p>
                  )}
                  {quoteFormConfig.show_from_email && companyEmail && (
                    <p className="text-sm text-gray-600">{companyEmail}</p>
                  )}
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Bill To</p>
                  {clientBusinessName && (
                    <p className="font-bold text-gray-900">{clientBusinessName}</p>
                  )}
                  <p className={`${clientBusinessName ? 'text-sm text-gray-700' : 'font-semibold text-gray-900'}`}>{clientName}</p>
                  <p className="text-sm text-gray-600">{lead?.address || 'Address'}</p>
                  <p className="text-sm text-gray-600">{lead?.city || 'City'}, {lead?.state || 'ST'} {lead?.zip_code || ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
                <div>
                  <span className="text-gray-500">Quote Name:</span>
                  <span className="ml-2 font-medium">{quoteName || 'Untitled Quote'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Valid Until:</span>
                  <span className="ml-2 font-medium">{validUntil || 'No expiration'}</span>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border rounded-xl overflow-hidden mb-6">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase border-b">
                  <div className="col-span-1"></div>
                  <div className="col-span-3">Deliverable</div>
                  <div className="col-span-3">Billing</div>
                  <div className="col-span-2 text-center">Qty</div>
                  <div className="col-span-3 text-right">Amount</div>
                </div>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={items.filter(i => i.description).map(i => i._id)} strategy={verticalListSortingStrategy}>
                    {items.filter(i => i.description).map((item) => (
                      <SortablePreviewRow key={item._id} item={item} formatCurrency={formatCurrency} />
                    ))}
                  </SortableContext>
                </DndContext>
                {!items.some(i => i.description) && (
                  <div className="px-4 py-8 text-center text-gray-400">No line items yet</div>
                )}
              </div>

              {/* Totals */}
              <div className="flex justify-end mb-8">
                <div className="w-72 space-y-2">
                  {totals.onetime > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">One-Time</span>
                      <span className="font-medium">{formatCurrency(totals.onetime)}</span>
                    </div>
                  )}
                  {totals.monthly > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">Monthly</span>
                      <span className="font-medium text-blue-700">{formatCurrency(totals.monthly)}/mo</span>
                    </div>
                  )}
                  {totals.yearly > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-600">Yearly</span>
                      <span className="font-medium text-purple-700">{formatCurrency(totals.yearly)}/yr</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium">{formatCurrency(totals.combined)}</span>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm" data-testid="quote-preview-tax-line">
                    <span className="text-gray-500">
                      {quoteTaxExempt ? 'Sales Tax (Exempt)' : `Sales Tax${taxRatePercent > 0 ? ` (${taxRatePercent.toFixed(2)}%)` : ''}`}
                    </span>
                    <span className={`font-medium ${quoteTaxExempt ? 'text-emerald-600' : 'text-gray-600'}`}>
                      {quoteTaxExempt ? '$0.00' : formatCurrency(taxAmount)}
                    </span>
                  </div>
                  {shippingAmount > 0 && (
                    <div className="flex justify-between text-sm" data-testid="quote-preview-shipping-line">
                      <span className="text-gray-500">Shipping</span>
                      <span className="font-medium text-gray-600">{formatCurrency(shippingAmount)}</span>
                    </div>
                  )}
                  {stripeFeesEnabled && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Credit Card Processing Fee (2.9% + $0.30)</span>
                      <span className="font-medium text-gray-600">{formatCurrency(stripeFeeAmount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-700">Total</span>
                      <span className="font-bold text-xl text-[#014DB7]">{formatCurrency(totalWithFees)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {notes && (
                <div className="bg-yellow-50 rounded-xl p-4 mb-6">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Notes</p>
                  <p className="text-sm text-gray-700">{notes}</p>
                </div>
              )}

              <div className="bg-[#014DB7] text-white rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm opacity-80">Payment Terms</p>
                    <p className="text-xs opacity-60 mt-1">
                      {depositType === 'flat'
                        ? `${formatCurrency(rawDepositValue)} deposit due upon signing`
                        : `${rawDepositValue}% deposit due upon signing`}
                    </p>
                    <p className="text-xs opacity-60">Balance due at project go-live</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-80">First Payment</p>
                    <p className="text-3xl font-bold">{formatCurrency(depositAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Document count summary */}
              {(contractTemplateId || selectedDocumentIds.length > 0) && (
                <div className="border rounded-xl p-4 bg-gray-50">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Documents Requiring Signature</p>
                  <p className="text-sm text-gray-700">
                    {(contractTemplateId ? 1 : 0) + selectedDocumentIds.filter(id => id !== contractTemplateId).length} document(s) attached
                  </p>
                </div>
              )}
              </>
              )}

              {/* Contract Preview Tab */}
              {previewTab === 'contract' && selectedContract && (
                <div className="contract-preview">
                  <div className="border-b-2 border-gray-200 pb-4 mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedContract.name}</h2>
                    <p className="text-sm text-gray-500 capitalize mt-1">{selectedContract.document_type?.replace(/_/g, ' ') || 'Service Agreement'}</p>
                  </div>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: mergeContractFields(selectedContract.content || '') 
                    }}
                  />
                  <div className="mt-8 pt-6 border-t-2 border-gray-200">
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                      <p className="text-sm font-semibold text-blue-900 mb-2">Signature Required</p>
                      <p className="text-xs text-blue-700">Client will sign this document electronically</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Documents Preview Tab */}
              {previewTab === 'documents' && (
                <div className="space-y-8">
                  {selectedDocumentIds
                    .filter(id => id !== contractTemplateId)
                    .map((docId, idx) => {
                      const doc = contractTemplates.find(t => t.id === docId);
                      if (!doc) return null;
                      const DocIcon = DOCUMENT_TYPE_ICONS[doc.document_type] || FileText;
                      return (
                        <div key={docId} className="document-preview">
                          {idx > 0 && (
                            <div className="border-t-4 border-dashed border-gray-300 my-8 relative">
                              <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-gray-400">
                                NEW PAGE
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-gray-200">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${DOCUMENT_TYPE_COLORS[doc.document_type] || 'bg-gray-100 text-gray-600'}`}>
                              <DocIcon className="w-5 h-5" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-900">{doc.name}</h2>
                              <p className="text-sm text-gray-500 capitalize">{doc.document_type?.replace(/_/g, ' ')}</p>
                            </div>
                          </div>
                          <div 
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ 
                              __html: mergeContractFields(doc.content || '') 
                            }}
                          />
                          <div className="mt-6 pt-4 border-t">
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                              <p className="text-sm font-semibold text-amber-900 mb-1">Signature Required</p>
                              <p className="text-xs text-amber-700">Document {idx + 1} of {selectedDocumentIds.filter(id => id !== contractTemplateId).length}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Form */}
          <div className="space-y-6">
            
            {/* Quote Info Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Information</h3>
              <div className="space-y-4">
                <div>
                  <Label>Quote Name *</Label>
                  <Input
                    value={quoteName}
                    onChange={(e) => setQuoteName(e.target.value)}
                    placeholder="e.g., Complete DME Package"
                    className="mt-1"
                    data-testid="quote-name-input"
                  />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-emerald-200 bg-emerald-50" data-testid="quote-tax-exempt-row">
                  <div>
                    <Label className="text-sm font-semibold text-emerald-800">Tax Exempt</Label>
                    <p className="text-xs text-emerald-700/80 mt-0.5">
                      {quoteTaxExempt
                        ? 'No sales tax will be charged on this quote.'
                        : taxRatePercent > 0
                          ? `Sales tax of ${taxRatePercent.toFixed(2)}% applies. Toggle on to exempt.`
                          : 'No tax rate configured.'}
                    </p>
                  </div>
                  <Switch checked={quoteTaxExempt} onCheckedChange={setQuoteTaxExempt} data-testid="quote-tax-exempt-toggle" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Valid Until</Label>
                    <Input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Primary Contract</Label>
                    <Select value={contractTemplateId || 'none'} onValueChange={(v) => setContractTemplateId(v === 'none' ? '' : v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select contract..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Contract</SelectItem>
                        {contractTemplates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name} {t.is_default ? '(Default)' : ''}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Card (admin-only; hidden from customer preview when empty) */}
            <div className="bg-white rounded-2xl shadow-lg p-6" data-testid="quote-shipping-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Truck className="w-5 h-5 text-[#014DB7]" /> Shipping
                </h3>
              </div>
              <p className="text-xs text-gray-500 mb-3">Admin-only entry. Added to the total after tax. Leave blank to hide this line from the client.</p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                    placeholder="Not set"
                    className="pl-6"
                    data-testid="quote-shipping-cost-input"
                  />
                </div>
                <Button type="button" variant="outline" onClick={() => setShippingDialogOpen(true)} data-testid="quote-shipping-calculate-button">
                  <Truck className="w-4 h-4 mr-1.5" /> Calculate
                </Button>
              </div>
            </div>

            {/* Contract Documents Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contract Documents</h3>
              <p className="text-sm text-gray-500 mb-4">Select additional documents to include. Each will require a separate signature.</p>
              
              {contractTemplates.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No contract templates available</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {contractTemplates
                    .filter(t => t.id !== contractTemplateId)
                    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                    .map((template) => {
                      const DocIcon = DOCUMENT_TYPE_ICONS[template.document_type] || FileText;
                      const isSelected = selectedDocumentIds.includes(template.id);
                      const isRequired = template.is_required;
                      return (
                        <div
                          key={template.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                            isSelected ? 'border-[#84CC16] bg-[#84CC16]/5' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            disabled={isRequired}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedDocumentIds([...selectedDocumentIds, template.id]);
                              } else {
                                setSelectedDocumentIds(selectedDocumentIds.filter(id => id !== template.id));
                              }
                            }}
                          />
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${DOCUMENT_TYPE_COLORS[template.document_type] || 'bg-gray-100 text-gray-600'}`}>
                            <DocIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900 truncate">{template.name}</p>
                              {isRequired && (
                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Required</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 capitalize">{template.document_type?.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
              
              {(contractTemplateId || selectedDocumentIds.length > 0) && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700">
                    Documents to sign: {(contractTemplateId ? 1 : 0) + selectedDocumentIds.filter(id => id !== contractTemplateId).length}
                  </p>
                </div>
              )}
            </div>

            {/* Line Items Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-[#014DB7] hover:bg-[#0140a0] text-white"
                    onClick={() => setShowCatalogPicker(true)}
                    data-testid="add-from-catalog-button"
                  >
                    <ShoppingCart className="w-3 h-3 mr-1.5" /> Browse Catalog
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addLineItem('custom')}>
                    <FileText className="w-3 h-3 mr-1" /> Custom
                  </Button>
                </div>
              </div>

              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i._id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-4">
                    {items.map((item, idx) => (
                      <SortableLineItem
                        key={item._id}
                        id={item._id}
                        item={item}
                        index={idx}
                        products={products}
                        services={services}
                        onItemChange={handleItemChange}
                        onCatalogSelect={handleCatalogSelect}
                        onRemove={removeLineItem}
                        canRemove={items.length > 1}
                        formatCurrency={formatCurrency}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Notes Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes & Terms</h3>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes, terms, or conditions..."
                rows={4}
              />
            </div>

            {/* Summary Card */}
            <div className="bg-gradient-to-r from-[#014DB7] to-[#0066FF] rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Quote Summary</h3>
              <div className="space-y-2">
                {totals.onetime > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-80">One-Time Charges</span>
                    <span className="font-semibold">{formatCurrency(totals.onetime)}</span>
                  </div>
                )}
                {totals.monthly > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-80">Monthly Recurring</span>
                    <span className="font-semibold">{formatCurrency(totals.monthly)}/mo</span>
                  </div>
                )}
                {totals.yearly > 0 && (
                  <div className="flex justify-between">
                    <span className="opacity-80">Yearly Recurring</span>
                    <span className="font-semibold">{formatCurrency(totals.yearly)}/yr</span>
                  </div>
                )}
                <div className="border-t border-white/20 pt-3 mt-3">
                  <div className="flex justify-between text-sm">
                    <span className="opacity-80">Subtotal</span>
                    <span className="font-medium">{formatCurrency(totals.combined)}</span>
                  </div>
                  {shippingAmount > 0 && (
                    <div className="flex justify-between text-sm mt-1" data-testid="quote-summary-shipping-line">
                      <span className="opacity-70">Shipping</span>
                      <span className="font-medium">{formatCurrency(shippingAmount)}</span>
                    </div>
                  )}
                  {stripeFeesEnabled && (
                    <div className="flex justify-between text-sm mt-1">
                      <span className="opacity-70">CC Processing Fee (2.9% + $0.30)</span>
                      <span className="font-medium">{formatCurrency(stripeFeeAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/20">
                    <span className="font-semibold">Total</span>
                    <span className="text-3xl font-bold">{formatCurrency(totalWithFees)}</span>
                  </div>
                </div>
                <div className="pt-2 text-sm opacity-70">
                  <p>{depositType === 'flat' ? 'Deposit ($): ' : `Deposit (${rawDepositValue}%): `}{formatCurrency(depositAmount)}</p>
                  <p>Balance at Go-Live: {formatCurrency(balanceAmount)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CatalogPickerModal
        open={showCatalogPicker}
        onClose={() => setShowCatalogPicker(false)}
        products={products}
        services={services}
        onAddItem={addFromCatalogItem}
        formatCurrency={formatCurrency}
        navigate={navigate}
      />

      <Dialog open={shippingDialogOpen} onOpenChange={setShippingDialogOpen}>
        <DialogContent data-testid="quote-shipping-calc-dialog">
          <DialogHeader>
            <DialogTitle>Calculate Shipping</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-xs text-gray-500">
              Pulls live carrier rates using the weight/dimensions of the products in this quote. Services and custom line items are ignored.
            </p>
            <div>
              <Label>Destination Street Address</Label>
              <Input
                value={shipAddress.street1}
                onChange={(e) => setShipAddress({ ...shipAddress, street1: e.target.value })}
                data-testid="quote-shipping-street-input"
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>City</Label>
                <Input value={shipAddress.city} onChange={(e) => setShipAddress({ ...shipAddress, city: e.target.value })} data-testid="quote-shipping-city-input" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={shipAddress.state} onChange={(e) => setShipAddress({ ...shipAddress, state: e.target.value })} data-testid="quote-shipping-state-input" />
              </div>
              <div>
                <Label>Zip</Label>
                <Input value={shipAddress.zip_code} onChange={(e) => setShipAddress({ ...shipAddress, zip_code: e.target.value })} data-testid="quote-shipping-zip-input" />
              </div>
            </div>
            <Button type="button" onClick={handleCalculateShipping} disabled={calcLoadingShipping} className="w-full bg-[#014DB7]" data-testid="quote-shipping-get-rates-button">
              {calcLoadingShipping ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Truck className="w-4 h-4 mr-2" />}
              Get Rates
            </Button>

            {shippingRates.length > 0 && (
              <div className="border rounded-lg divide-y max-h-56 overflow-y-auto" data-testid="quote-shipping-rate-options">
                {shippingRates.map((rate, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setShippingCost(String(Number(rate.rate_with_upcharge ?? rate.rate).toFixed(2)));
                      setShippingDialogOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-gray-50 text-left"
                    data-testid={`quote-shipping-rate-option-${idx}`}
                  >
                    <span>
                      <span className="font-medium text-gray-900">{rate.carrier} {rate.service}</span>
                      {rate.estimated_days && <span className="text-xs text-gray-400 ml-1">({rate.estimated_days}d)</span>}
                    </span>
                    <span className="font-semibold text-[#014DB7]">{formatCurrency(rate.rate_with_upcharge ?? rate.rate)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShippingDialogOpen(false)} data-testid="quote-shipping-dialog-close-button">Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Separate component to keep JSX simpler
function LineItemRow({ item, index, products, services, onItemChange, onCatalogSelect, onRemove, canRemove, formatCurrency, dragHandleProps }) {
  const lineTotal = (item.quantity || 0) * (item.unit_price || 0);
  
  const productsByCategory = products.reduce((acc, p) => {
    const cat = p.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const servicesByCategory = services.reduce((acc, s) => {
    const cat = s.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <div className="border rounded-xl p-4 bg-gray-50" data-testid={'line-item-' + index}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <div className="cursor-grab text-gray-300 hover:text-gray-500" {...dragHandleProps}>
              <GripVertical className="w-5 h-5" />
            </div>
          )}
          <span className={'text-xs font-medium px-2 py-1 rounded ' + 
            (item.item_type === 'product' ? 'bg-blue-100 text-blue-700' :
            item.item_type === 'service' ? 'bg-green-100 text-green-700' :
            'bg-gray-200 text-gray-700')}>
            {item.item_type === 'product' ? 'Product' : item.item_type === 'service' ? 'Service' : 'Custom'}
          </span>
        </div>
        <Button size="sm" variant="ghost" onClick={() => onRemove(index)} disabled={!canRemove} className="text-red-500 hover:text-red-700 h-8 w-8 p-0">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {item.item_type === 'product' && (
        <Select value={item.item_id || ''} onValueChange={(v) => onCatalogSelect(index, v, 'product')}>
          <SelectTrigger className="mb-3"><SelectValue placeholder="Select product..." /></SelectTrigger>
          <SelectContent>
            {Object.entries(productsByCategory).map(([cat, prods]) => (
              <div key={cat}>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100">{cat}</div>
                {prods.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} - {formatCurrency(p.price_onetime || p.price_monthly || 0)}</SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      )}

      {item.item_type === 'service' && (
        <Select value={item.item_id || ''} onValueChange={(v) => onCatalogSelect(index, v, 'service')}>
          <SelectTrigger className="mb-3"><SelectValue placeholder="Select service..." /></SelectTrigger>
          <SelectContent>
            {Object.entries(servicesByCategory).map(([cat, servs]) => (
              <div key={cat}>
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100">{cat}</div>
                {servs.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} - {formatCurrency(s.hourly_rate || s.price_monthly || 0)}</SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      )}

      {item.item_type === 'custom' && (
        <Input
          value={item.description}
          onChange={(e) => onItemChange(index, 'description', e.target.value)}
          placeholder="Item description"
          className="mb-3"
        />
      )}

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Billing</Label>
          <Select value={item.billing_type || 'onetime'} onValueChange={(v) => onItemChange(index, 'billing_type', v)}>
            <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="onetime">One-Time</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Quantity</Label>
          <Input type="number" min="1" value={item.quantity} onChange={(e) => onItemChange(index, 'quantity', e.target.value)} className="mt-1 h-9" />
        </div>
        <div>
          <Label className="text-xs">Unit Price</Label>
          <div className="relative mt-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">$</span>
            <Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => onItemChange(index, 'unit_price', e.target.value)} className="h-9 pl-6" />
          </div>
        </div>
      </div>

      {/* Monthly & Yearly price fields — client will choose between these on the signing page */}
      {item.billing_type !== 'onetime' && (
        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-xs font-semibold text-blue-800 mb-2">Client Billing Options (both required for client to choose)</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-blue-700">Monthly Price</Label>
              <div className="relative mt-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input type="number" min="0" step="0.01" value={item.price_monthly || ''} onChange={(e) => onItemChange(index, 'price_monthly', e.target.value)} className="h-9 pl-6" placeholder="0.00" />
              </div>
              <p className="text-[10px] text-blue-500 mt-0.5">/month</p>
            </div>
            <div>
              <Label className="text-xs text-purple-700">Yearly Price</Label>
              <div className="relative mt-1">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <Input type="number" min="0" step="0.01" value={item.price_yearly || ''} onChange={(e) => onItemChange(index, 'price_yearly', e.target.value)} className="h-9 pl-6" placeholder="0.00" />
              </div>
              <p className="text-[10px] text-purple-500 mt-0.5">/year</p>
            </div>
          </div>
          <p className="text-[10px] text-blue-600 mt-2">If both prices are set, the client can choose their preferred billing on the signing page.</p>
        </div>
      )}

      <div className="mt-3 text-right">
        <span className="text-sm text-gray-500">Line Total: </span>
        <span className="font-semibold text-gray-900">
          {formatCurrency(lineTotal)}
          {item.billing_type === 'monthly' && '/mo'}
          {item.billing_type === 'yearly' && '/yr'}
        </span>
      </div>
    </div>
  );
}

export default QuoteBuilderPage;
