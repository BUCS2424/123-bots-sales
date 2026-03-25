import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSiteFeatureFlags } from '../../hooks/useSiteFeatureFlags';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { toast } from 'sonner';
import { ArrowLeft, Save, Send, RefreshCw, Plus, Trash2, Package, Wrench, FileText, Eye, ScrollText, Shield, FileCheck, FilePlus, GripVertical, Settings } from 'lucide-react';
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
        api.get('/api/quotes/catalog/products').catch(() => ({ data: { products: [] } })),
        api.get('/api/quotes/catalog/services').catch(() => ({ data: { services: [] } })),
        api.get('/api/contract-templates').catch(() => ({ data: { templates: [] } })),
        api.get('/api/settings/general').catch(() => ({ data: {} })),
        api.get('/api/quotes/config').catch(() => ({ data: { config: {}, business_info: {} } }))
      ]);
      
      setLead(results[0].data);
      setProducts(results[1].data.products || []);
      setServices(results[2].data.services || []);
      setContractTemplates(results[3].data.templates || []);
      setCompanySettings(results[4].data || {});
      setQuoteFormConfig((prev) => ({ ...prev, ...(results[5].data?.config || {}) }));
      setQuoteBusinessInfo(results[5].data?.business_info || {});
      
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
        }
      } else {
        const defaultTemplate = (results[3].data.templates || []).find(t => t.is_default);
        if (defaultTemplate) {
          setContractTemplateId(defaultTemplate.id);
        }
        // Auto-select required documents
        const requiredDocs = (results[3].data.templates || []).filter(t => t.is_required).map(t => t.id);
        setSelectedDocumentIds(requiredDocs);
      }
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
  const STRIPE_RATE = 0.029;
  const STRIPE_FLAT = 0.30;
  const ccFee = (amount) => amount > 0 ? (amount * STRIPE_RATE) + STRIPE_FLAT : 0;
  const stripeFeesEnabled = quoteFormConfig.charge_stripe_fees !== false;
  const stripeFeeAmount = stripeFeesEnabled ? ccFee(totals.combined) : 0;
  const totalWithFees = totals.combined + stripeFeeAmount;
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
        total: totals.combined,
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
            <Button variant="outline" onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" /> Save Draft
            </Button>
            <Button className="bg-[#014DB7]" onClick={handleSave} disabled={saving}>
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
                  <Button size="sm" variant="outline" onClick={() => addLineItem('product')} disabled={products.length === 0}>
                    <Package className="w-3 h-3 mr-1" /> Product
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => addLineItem('service')} disabled={services.length === 0}>
                    <Wrench className="w-3 h-3 mr-1" /> Service
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
