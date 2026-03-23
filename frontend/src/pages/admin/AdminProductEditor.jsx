import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  ChevronLeft, ChevronRight, Plus, Image as ImageIcon, Video, X, Upload,
  Bold, Italic, Underline, Strikethrough, Link2, List, ListOrdered,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Table, Code,
  Heading1, Heading2, Quote, Minus, Maximize2, Info, Loader2, Truck,
  FileText, Search as SearchIcon, Tag, Package, GripVertical, Sparkles, Wand2, Trash2, Copy
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Switch } from '../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { toast } from '../../hooks/use-toast';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const optionId = () => `opt_${Math.random().toString(36).slice(2, 10)}`;
const valueId = () => `val_${Math.random().toString(36).slice(2, 10)}`;

const parseNum = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const buildOptionCombinations = (groups = [], basePrice = 0) => {
  const validGroups = groups.filter((g) => g.name?.trim() && (g.values || []).length > 0);
  if (validGroups.length === 0) return [];

  const walk = (index, selected) => {
    if (index >= validGroups.length) return [selected];
    const group = validGroups[index];
    const variants = [];
    (group.values || []).forEach((v) => {
      if (!v.label?.trim()) return;
      variants.push(...walk(index + 1, [...selected, { groupId: group.id, groupName: group.name, valueId: v.id, valueLabel: v.label, mode: v.price_mode || '+', amount: parseNum(v.price_value, 0) }]));
    });
    return variants;
  };

  const raw = walk(0, []);
  return raw.map((parts) => {
    let computedPrice = parseNum(basePrice, 0);
    parts.forEach((p) => {
      if (p.mode === '=') computedPrice = parseNum(p.amount, computedPrice);
      if (p.mode === '+') computedPrice += parseNum(p.amount, 0);
      if (p.mode === '-') computedPrice -= parseNum(p.amount, 0);
    });
    computedPrice = Math.max(0, Math.round(computedPrice * 100) / 100);

    const key = parts.map((p) => `${p.groupId}:${p.valueId}`).join('|');
    return {
      key,
      label: parts.map((p) => `${p.groupName}: ${p.valueLabel}`).join(' • '),
      parts,
      computedPrice,
    };
  });
};

// AI Product Lookup Component
const AIProductLookup = ({ onProductFound, isEditing }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [modelNumber, setModelNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleAILookup = async () => {
    if (!searchQuery.trim() && !modelNumber.trim()) {
      toast({
        title: 'Input Required',
        description: 'Please enter a product name or model number',
        variant: 'destructive'
      });
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/ai/product-lookup`, {
        query: searchQuery || modelNumber,
        manufacturer: manufacturer || null,
        model_number: modelNumber || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onProductFound(response.data);
      toast({
        title: '✨ Product Found!',
        description: `Auto-filled data for "${response.data.name}"`,
      });
    } catch (error) {
      toast({
        title: 'AI Lookup Failed',
        description: error.response?.data?.detail?.includes('Budget') 
          ? 'AI budget exceeded. Please add balance in Profile → Universal Key → Add Balance, or fill the product manually.'
          : (error.response?.data?.detail || 'Could not find product information. Please fill manually.'),
        variant: 'destructive'
      });
    }
    setIsSearching(false);
  };

  if (isEditing) return null; // Don't show for editing existing products

  return (
    <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 mb-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Wand2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              AI Product Generator
              <Badge className="bg-purple-100 text-purple-700 text-xs">GPT-5.2</Badge>
            </h3>
            <p className="text-sm text-gray-600">Enter product details and let AI auto-fill everything</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Main Search Input */}
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Enter product name, brand, or model (e.g., 'Sony WH-1000XM5 Headphones')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-purple-200 focus:border-purple-400"
                data-testid="ai-search-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isSearching) {
                    handleAILookup();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleAILookup}
              disabled={isSearching}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6"
              data-testid="ai-lookup-btn"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate
                </>
              )}
            </Button>
          </div>

          {/* Advanced Options Toggle */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            {showAdvanced ? '− Hide' : '+ Show'} advanced options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">Manufacturer / Brand</Label>
                <Input
                  placeholder="e.g., Sony, Apple, DeWalt"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  className="bg-white border-purple-200"
                />
              </div>
              <div>
                <Label className="text-sm text-gray-600 mb-1 block">Model Number</Label>
                <Input
                  placeholder="e.g., WH-1000XM5, A2345"
                  value={modelNumber}
                  onChange={(e) => setModelNumber(e.target.value)}
                  className="bg-white border-purple-200"
                />
              </div>
            </div>
          )}

          {/* Info Text */}
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <Info className="w-3 h-3" />
            AI will auto-fill: name, description, category, weight, dimensions, SEO metadata, and more. Just add your photos!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Drag and Drop Image Upload Component
const ImageDropZone = ({ 
  image, 
  onUpload, 
  onRemove, 
  onUrlAdd, 
  isUploading, 
  storageConfigured,
  isDraggingOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onImageReorder,
  onImageDragState,
  isBeingDragged
}) => {
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragLeave();

    const slotDragSource = e.dataTransfer.getData('application/x-admin-image-slot');
    if (slotDragSource) {
      onImageReorder(Number(slotDragSource), image.id);
      return;
    }
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onDrop(files[0]);
    }
  };

  const handleDragEnterLocal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragEnter();
  };

  const handleDragLeaveLocal = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onDragLeave();
  };

  return (
    <div className="flex-shrink-0">
      <input
        type="file"
        ref={inputRef}
        onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
        accept="image/*"
        className="hidden"
      />
      <div
        className={`w-24 h-24 border-2 rounded-lg overflow-hidden relative group transition-all ${
          isDraggingOver 
            ? 'border-[#0066cc] bg-blue-100 border-solid scale-105' 
            : image.url 
              ? 'border-gray-200' 
              : 'border-dashed border-gray-300 hover:border-[#0066cc] hover:bg-blue-50'
        } ${image.url ? 'cursor-move' : 'cursor-pointer'} ${isBeingDragged ? 'opacity-50' : ''}`}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnterLocal}
        onDragLeave={handleDragLeaveLocal}
        onDrop={handleDrop}
        draggable={Boolean(image.url)}
        onDragStart={(e) => {
          if (!image.url) return;
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('application/x-admin-image-slot', String(image.id));
          onImageDragState(image.id);
        }}
        onDragEnd={() => onImageDragState(null)}
        onClick={() => {
          if (!image.url && !isUploading) {
            // Always allow file upload (local storage fallback available)
            inputRef.current?.click();
          }
        }}
        data-testid={`product-image-slot-${image.id}`}
      >
        {isUploading ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-blue-50">
            <Loader2 className="w-6 h-6 text-[#0066cc] animate-spin" />
            <span className="text-xs text-[#0066cc] mt-1">Uploading...</span>
          </div>
        ) : image.url ? (
          <>
            <img
              src={image.url}
              alt={image.label}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px]" data-testid={`product-image-drag-hint-${image.id}`}>
                Drag
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Always allow file upload (local storage fallback available)
                  inputRef.current?.click();
                }}
                className="w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-gray-100"
                title="Replace image"
                data-testid={`replace-product-image-${image.id}`}
              >
                <Upload className="w-3.5 h-3.5 text-gray-700" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600"
                title="Remove image"
                data-testid={`remove-product-image-${image.id}`}
              >
                <X className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            {isDraggingOver ? (
              <Upload className="w-8 h-8 text-[#0066cc]" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-300" />
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 text-center mt-1 truncate max-w-24">{image.label}</p>
    </div>
  );
};

const AdminProductEditor = ({ productId: propProductId }) => {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const productId = propProductId || params.productId;
  const isEditing = !!productId;
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [storageConfigured, setStorageConfigured] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    weight: '',
    description: '',
    price: '0.00',
    wholesale_price: '',
    compare_at_price: '',
    cost_price: '',
    in_stock: true,
    is_visible: true,
    track_quantity: false,
    quantity: '',
    requires_shipping: true,
    category: '',
    categories: [],
    condition: 'Good',
    tags: '',
    location: 'alabama_pawn_storage', // New field for store location
    // Attributes tab
    brand: '',
    manufacturer: '',
    upc: '',
    mpn: '',
    // Shipping tab
    shipping_weight: '',
    shipping_length: '',
    shipping_width: '',
    shipping_height: '',
    free_shipping: false,
    // SEO tab
    seo_title: '',
    seo_description: '',
    seo_url: '',
    // Options
    has_options: false,
  });

  // Image gallery state
  const [images, setImages] = useState([
    { id: 1, url: '', label: 'Main Image' },
    { id: 2, url: '', label: 'Angle 2' },
    { id: 3, url: '', label: 'Angle 3' },
    { id: 4, url: '', label: 'Angle 4' },
    { id: 5, url: '', label: 'Angle 5' },
  ]);
  const [showImageInput, setShowImageInput] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [uploadingImageId, setUploadingImageId] = useState(null);
  const [dragOverImageId, setDragOverImageId] = useState(null);
  const [globalDragOver, setGlobalDragOver] = useState(false);
  const [draggingImageId, setDraggingImageId] = useState(null);

  // Related products
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);

  // Category custom fields
  const [categoryCustomFields, setCategoryCustomFields] = useState([]);
  const [customFieldsData, setCustomFieldsData] = useState({});
  const [loadingCustomFields, setLoadingCustomFields] = useState(false);

  // Manual options tab state
  const [manualOptionGroups, setManualOptionGroups] = useState([]);
  const [manualOptionStock, setManualOptionStock] = useState({});
  const [allowCustomerCustomization, setAllowCustomerCustomization] = useState(false);

  // Pricing section expanded state
  const [showPricingOptions, setShowPricingOptions] = useState(false);
  const [showStockControl, setShowStockControl] = useState(false);

  const optionCombinations = useMemo(
    () => buildOptionCombinations(manualOptionGroups, parseNum(formData.price, 0)),
    [manualOptionGroups, formData.price]
  );

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'attributes', label: 'Attributes' },
    { id: 'options', label: 'Options' },
    { id: 'files', label: 'Files' },
    { id: 'shipping', label: 'Shipping & Pickup' },
    { id: 'taxes', label: 'Taxes' },
    { id: 'seo', label: 'SEO' },
    { id: 'related', label: 'Related Products' },
    { id: 'buynow', label: '"Buy Now" Button' },
  ];

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    if (requestedTab && tabs.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab);
    }
  }, [searchParams]);

  useEffect(() => {
    const focus = searchParams.get('focus');
    if (activeTab === 'general' && focus === 'images') {
      const element = document.getElementById('product-gallery-section');
      if (!element) return;

      setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 120);
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    fetchCategories();
    checkStorageConfig();
    fetchAllProducts();
    if (isEditing) {
      fetchProduct();
    }
  }, [productId]);

  // Fetch category custom fields when category changes
  useEffect(() => {
    if (formData.category && categories.length > 0) {
      const selectedCategory = categories.find(c => c.name === formData.category);
      if (selectedCategory?.custom_fields?.length > 0) {
        setCategoryCustomFields(selectedCategory.custom_fields);
      } else {
        setCategoryCustomFields([]);
      }
    } else {
      setCategoryCustomFields([]);
    }
  }, [formData.category, categories]);

  const selectedCategoryNames = useMemo(() => {
    const source = Array.isArray(formData.categories) ? formData.categories : [];
    const deduped = source
      .map((name) => (name || '').trim())
      .filter((name, index, arr) => name && arr.findIndex((item) => item.toLowerCase() === name.toLowerCase()) === index);

    if (deduped.length > 0) {
      return deduped;
    }

    return formData.category ? [formData.category] : [];
  }, [formData.categories, formData.category]);

  const toggleCategorySelection = (categoryName) => {
    let didPrimaryCategoryChange = false;

    setFormData((prev) => {
      const current = Array.isArray(prev.categories) ? [...prev.categories] : (prev.category ? [prev.category] : []);
      const normalizedCurrent = current
        .map((name) => (name || '').trim())
        .filter((name, index, arr) => name && arr.findIndex((item) => item.toLowerCase() === name.toLowerCase()) === index);

      const alreadySelected = normalizedCurrent.some((name) => name.toLowerCase() === categoryName.toLowerCase());
      const nextCategories = alreadySelected
        ? normalizedCurrent.filter((name) => name.toLowerCase() !== categoryName.toLowerCase())
        : [...normalizedCurrent, categoryName];

      const nextPrimary = nextCategories[0] || '';
      didPrimaryCategoryChange = nextPrimary !== (prev.category || '');

      return {
        ...prev,
        category: nextPrimary,
        categories: nextCategories,
      };
    });

    if (didPrimaryCategoryChange) {
      setCustomFieldsData({});
    }
  };

  useEffect(() => {
    if (!formData.has_options) return;
    setManualOptionStock((prev) => {
      const next = {};
      optionCombinations.forEach((combo) => {
        next[combo.key] = prev[combo.key] || {
          stock_quantity: 0,
          in_stock: false,
          estimated_restock: '',
          allow_preorder: false,
        };
      });
      return next;
    });
  }, [optionCombinations, formData.has_options]);

  const checkStorageConfig = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/storage/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStorageConfigured(response.data.is_configured);
    } catch (error) {
      setStorageConfigured(false);
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

  const fetchAllProducts = async () => {
    try {
      const response = await axios.get(`${API}/store/products`);
      setAllProducts(response.data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/store/products/${productId}`);
      const product = response.data;
      const normalizedCategories = Array.isArray(product.categories) && product.categories.length > 0
        ? product.categories.filter(Boolean)
        : (product.category ? [product.category] : []);
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        weight: product.weight?.toString() || '',
        description: product.description || '',
        price: product.price?.toString() || '0.00',
        wholesale_price: product.wholesale_price?.toString() || '',
        compare_at_price: product.original_price?.toString() || '',
        cost_price: product.cost_price?.toString() || '',
        in_stock: product.in_stock ?? true,
        is_visible: product.is_visible ?? true,
        track_quantity: product.track_quantity ?? false,
        quantity: product.quantity?.toString() || '',
        requires_shipping: product.requires_shipping ?? true,
        category: normalizedCategories[0] || product.category || '',
        categories: normalizedCategories,
        condition: product.condition || 'Good',
        tags: product.tags?.join(', ') || '',
        location: product.location || 'alabama_pawn_storage',
        brand: product.brand || '',
        manufacturer: product.manufacturer || '',
        upc: product.upc || '',
        mpn: product.mpn || '',
        shipping_weight: product.shipping_weight?.toString() || '',
        shipping_length: product.shipping_length?.toString() || '',
        shipping_width: product.shipping_width?.toString() || '',
        shipping_height: product.shipping_height?.toString() || '',
        free_shipping: product.free_shipping ?? false,
        seo_title: product.seo_title || '',
        seo_description: product.seo_description || '',
        seo_url: product.seo_url || '',
        has_options: product.has_options ?? false,
      });
      
      // Load all images if available
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        setImages(prev => prev.map((img, idx) => ({
          ...img,
          url: product.images[idx] || ''
        })));
      } else if (product.image) {
        // Fall back to single image
        setImages(prev => prev.map((img, idx) => 
          idx === 0 ? { ...img, url: product.image } : img
        ));
      }
      
      if (product.related_products) {
        setRelatedProducts(product.related_products);
      }
      
      // Load custom fields data
      if (product.custom_fields_data) {
        setCustomFieldsData(product.custom_fields_data);
        hydrateManualOptionsFromCustomData(product.custom_fields_data);
        setAllowCustomerCustomization(Boolean(product.custom_fields_data.customer_customization?.allow_image_upload));
      } else {
        setCustomFieldsData({});
        setManualOptionGroups([]);
        setManualOptionStock({});
        setAllowCustomerCustomization(false);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load product', variant: 'destructive' });
      navigate('/admin/products');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Product name is required', variant: 'destructive' });
      return;
    }

    const normalizedSelectedCategories = selectedCategoryNames;
    const primaryCategory = normalizedSelectedCategories[0] || '';
    if (!primaryCategory) {
      toast({ title: 'Error', description: 'Select at least one category', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const mainImage = images.find(img => img.url)?.url || '';
      const allImages = images.filter(img => img.url).map(img => img.url);

      const mergedCustomFields = { ...(customFieldsData || {}) };

      if (formData.has_options && manualOptionGroups.length > 0) {
        mergedCustomFields.manual_option_groups = manualOptionGroups;
        mergedCustomFields.manual_option_stock = manualOptionStock;
        mergedCustomFields.manual_option_combinations = optionCombinations.map((combo) => {
          const stockRow = manualOptionStock[combo.key] || {};
          return {
            key: combo.key,
            label: combo.label,
            price: combo.computedPrice,
            stock_quantity: parseNum(stockRow.stock_quantity, 0),
            in_stock: Boolean(stockRow.in_stock),
            estimated_restock: stockRow.estimated_restock || '',
            allow_preorder: Boolean(stockRow.allow_preorder),
          };
        });
      } else {
        delete mergedCustomFields.manual_option_groups;
        delete mergedCustomFields.manual_option_stock;
        delete mergedCustomFields.manual_option_combinations;
      }

      mergedCustomFields.customer_customization = allowCustomerCustomization
        ? { allow_image_upload: true, allow_notes: true }
        : { allow_image_upload: false, allow_notes: false };
      delete mergedCustomFields.strength_options;
      delete mergedCustomFields.package_options;
      delete mergedCustomFields.pricing_matrix;
      delete mergedCustomFields.option_stock;
      delete mergedCustomFields.default_strength;
      delete mergedCustomFields.default_package;

      const totalOptionStock = optionCombinations.reduce((sum, combo) => {
        const stock = manualOptionStock[combo.key];
        return sum + parseNum(stock?.stock_quantity, 0);
      }, 0);
      const optionsHasStock = optionCombinations.some((combo) => {
        const stock = manualOptionStock[combo.key];
        const qty = parseNum(stock?.stock_quantity, 0);
        return Boolean(stock?.in_stock) && qty > 0;
      });
      
      const data = {
        name: formData.name,
        description: formData.description,
        category: primaryCategory,
        categories: normalizedSelectedCategories,
        price: parseFloat(formData.price) || 0,
        wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : null,
        original_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        image: mainImage,
        images: allImages, // Store all images
        condition: formData.condition,
        quantity: (formData.has_options && optionCombinations.length > 0) ? totalOptionStock : (parseInt(formData.quantity) || 1),
        in_stock: (formData.has_options && optionCombinations.length > 0) ? optionsHasStock : formData.in_stock,
        is_visible: formData.is_visible,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        sku: formData.sku,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        requires_shipping: formData.requires_shipping,
        location: formData.location,
        brand: formData.brand,
        manufacturer: formData.manufacturer,
        upc: formData.upc,
        mpn: formData.mpn,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        track_quantity: formData.track_quantity,
        shipping_weight: formData.shipping_weight ? parseFloat(formData.shipping_weight) : null,
        shipping_length: formData.shipping_length ? parseFloat(formData.shipping_length) : null,
        shipping_width: formData.shipping_width ? parseFloat(formData.shipping_width) : null,
        shipping_height: formData.shipping_height ? parseFloat(formData.shipping_height) : null,
        free_shipping: formData.free_shipping,
        seo_title: formData.seo_title,
        seo_description: formData.seo_description,
        seo_url: formData.seo_url,
        related_products: relatedProducts,
        has_options: formData.has_options,
        custom_fields_data: Object.keys(mergedCustomFields).length > 0 ? mergedCustomFields : null,
      };

      if (isEditing) {
        await axios.put(`${API}/store/products/${productId}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Success', description: 'Product updated successfully' });
      } else {
        await axios.post(`${API}/store/products`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast({ title: 'Success', description: 'Product created successfully' });
      }
      navigate('/admin/products');
    } catch (error) {
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to save product',
        variant: 'destructive'
      });
    }
    setSaving(false);
  };

  const handleDuplicate = async () => {
    if (!productId) return;
    
    try {
      const token = localStorage.getItem('token');
      const mainImage = images.find(img => img.url)?.url || '';
      const allImages = images.filter(img => img.url).map(img => img.url);
      
      const duplicatePayload = {
        category: selectedCategoryNames[0] || formData.category || 'General',
        categories: selectedCategoryNames.length > 0 ? selectedCategoryNames : (formData.category ? [formData.category] : ['General']),
        name: `${formData.name} (Copy)`,
        description: formData.description || '',
        price: parseFloat(formData.price) || 0,
        wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : null,
        original_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        image: mainImage,
        images: allImages.length > 0 ? allImages : (mainImage ? [mainImage] : []),
        condition: formData.condition || 'Good',
        in_stock: formData.in_stock,
        is_visible: formData.is_visible,
        quantity: parseInt(formData.quantity) || 1,
        sku: `${formData.sku || 'SKU'}-COPY-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
        location: formData.location || 'alabama_pawn_storage',
        brand: formData.brand || null,
        manufacturer: formData.manufacturer || null,
        upc: null, // UPC should be unique
        mpn: formData.mpn || null,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : null,
        track_quantity: formData.track_quantity,
        requires_shipping: formData.requires_shipping,
        free_shipping: formData.free_shipping,
        shipping_weight: formData.shipping_weight ? parseFloat(formData.shipping_weight) : null,
        shipping_length: formData.shipping_length ? parseFloat(formData.shipping_length) : null,
        shipping_width: formData.shipping_width ? parseFloat(formData.shipping_width) : null,
        shipping_height: formData.shipping_height ? parseFloat(formData.shipping_height) : null,
        seo_title: null, // SEO should be unique
        seo_description: null,
        seo_url: null,
        related_products: relatedProducts,
        has_options: formData.has_options,
        custom_fields_data: Object.keys(customFieldsData).length > 0 ? customFieldsData : null,
      };

      const response = await axios.post(`${API}/store/products`, duplicatePayload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast({ 
        title: 'Product Duplicated', 
        description: `Created a copy of "${formData.name}". Redirecting to edit...` 
      });
      
      // Navigate to the new product for editing
      if (response.data?.id) {
        navigate(`/admin/products/${response.data.id}`);
      } else {
        navigate('/admin/products');
      }
    } catch (error) {
      toast({ 
        title: 'Error', 
        description: error.response?.data?.detail || 'Failed to duplicate product', 
        variant: 'destructive' 
      });
    }
  };

  const handleFileUpload = async (file, imageId) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please upload an image file (JPG, PNG, GIF, etc.)',
        variant: 'destructive'
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive'
      });
      return;
    }

    // Upload works with either cloud storage or local fallback
    setUploadingImageId(imageId);
    setUploading(true);

    try {
      const token = localStorage.getItem('token');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'products');

      const response = await axios.post(`${API}/storage/upload`, formDataUpload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, url: response.data.url } : img
      ));
      toast({ title: 'Success', description: 'Image uploaded successfully' });
    } catch (error) {
      toast({
        title: 'Upload Failed',
        description: error.response?.data?.detail || 'Failed to upload image. Try using URL input instead.',
        variant: 'destructive'
      });
      // Fall back to URL input
      setShowImageInput(imageId);
    }

    setUploading(false);
    setUploadingImageId(null);
  };

  const uploadFilesToSlots = (files, preferredImageId = null) => {
    const validFiles = Array.from(files || []).filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      toast({
        title: 'Invalid Files',
        description: 'Please select image files only',
        variant: 'destructive'
      });
      return;
    }

    const usedSlotIds = new Set();
    const targetIds = [];

    if (preferredImageId !== null && preferredImageId !== undefined) {
      targetIds.push(preferredImageId);
      usedSlotIds.add(preferredImageId);
    }

    const emptySlots = images.filter((img) => !img.url && !usedSlotIds.has(img.id));
    for (const slot of emptySlots) {
      if (targetIds.length >= validFiles.length) break;
      targetIds.push(slot.id);
      usedSlotIds.add(slot.id);
    }

    if (targetIds.length < validFiles.length && images[0] && !usedSlotIds.has(images[0].id)) {
      targetIds.push(images[0].id);
    }

    validFiles.slice(0, targetIds.length).forEach((file, index) => {
      setTimeout(() => handleFileUpload(file, targetIds[index]), index * 250);
    });
  };

  // Handle drag & drop for the entire gallery area
  const handleGlobalDragEnter = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer?.types?.includes('application/x-admin-image-slot')) {
      return;
    }
    setGlobalDragOver(true);
  }, []);

  const handleGlobalDragLeave = useCallback((e) => {
    e.preventDefault();
    // Only set to false if leaving the entire drop zone
    if (e.currentTarget === e.target) {
      setGlobalDragOver(false);
    }
  }, []);

  const handleGlobalDragOver = useCallback((e) => {
    e.preventDefault();
    if (e.dataTransfer?.types?.includes('application/x-admin-image-slot')) {
      return;
    }
  }, []);

  const handleGlobalDrop = useCallback((e) => {
    e.preventDefault();
    setGlobalDragOver(false);
    setDragOverImageId(null);

    if (e.dataTransfer?.types?.includes('application/x-admin-image-slot')) {
      return;
    }
    
    uploadFilesToSlots(e.dataTransfer.files);
  }, [images]);

  const handleImageAdd = (imageId) => {
    if (newImageUrl.trim()) {
      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, url: newImageUrl.trim() } : img
      ));
      setNewImageUrl('');
      setShowImageInput(null);
    }
  };

  const handleImageRemove = (imageId) => {
    setImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, url: '' } : img
    ));
  };

  const handleImageReorder = (sourceId, targetId) => {
    if (!sourceId || !targetId || sourceId === targetId) return;

    setImages((prev) => {
      const source = prev.find((img) => img.id === sourceId);
      const target = prev.find((img) => img.id === targetId);
      if (!source || !target) return prev;

      return prev.map((img) => {
        if (img.id === sourceId) return { ...img, url: target.url };
        if (img.id === targetId) return { ...img, url: source.url };
        return img;
      });
    });
  };

  const toggleRelatedProduct = (productIdToToggle) => {
    setRelatedProducts(prev => 
      prev.includes(productIdToToggle)
        ? prev.filter(id => id !== productIdToToggle)
        : [...prev, productIdToToggle]
    );
  };

  const hydrateManualOptionsFromCustomData = (data = {}) => {
    const groups = Array.isArray(data.manual_option_groups) ? data.manual_option_groups : [];
    const stockMap = data.manual_option_stock && typeof data.manual_option_stock === 'object' ? data.manual_option_stock : {};

    if (groups.length > 0) {
      setManualOptionGroups(groups.map((g) => ({
        id: g.id || optionId(),
        name: g.name || '',
        values: (g.values || []).map((v) => ({
          id: v.id || valueId(),
          label: v.label || '',
          price_mode: v.price_mode || '+',
          price_value: v.price_value ?? 0,
        })),
      })));
      setManualOptionStock(stockMap);
      return;
    }

    setManualOptionGroups([]);
    setManualOptionStock({});
  };

  const addOptionGroup = () => {
    setManualOptionGroups((prev) => ([
      ...prev,
      {
        id: optionId(),
        name: '',
        values: [{ id: valueId(), label: '', price_mode: '+', price_value: 0 }],
      },
    ]));
  };

  const updateOptionGroupName = (groupId, name) => {
    setManualOptionGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, name } : g)));
  };

  const removeOptionGroup = (groupId) => {
    setManualOptionGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const addOptionValue = (groupId) => {
    setManualOptionGroups((prev) => prev.map((g) => (
      g.id === groupId
        ? { ...g, values: [...(g.values || []), { id: valueId(), label: '', price_mode: '+', price_value: 0 }] }
        : g
    )));
  };

  const updateOptionValue = (groupId, valId, field, value) => {
    setManualOptionGroups((prev) => prev.map((g) => (
      g.id === groupId
        ? {
            ...g,
            values: (g.values || []).map((v) => (v.id === valId ? { ...v, [field]: value } : v)),
          }
        : g
    )));
  };

  const removeOptionValue = (groupId, valId) => {
    setManualOptionGroups((prev) => prev.map((g) => (
      g.id === groupId
        ? { ...g, values: (g.values || []).filter((v) => v.id !== valId) }
        : g
    )));
  };

  const updateComboStock = (comboKey, patch) => {
    setManualOptionStock((prev) => {
      const existing = prev[comboKey] || { stock_quantity: 0, in_stock: false, estimated_restock: '', allow_preorder: false, wholesale_price: '' };
      return {
        ...prev,
        [comboKey]: { ...existing, ...patch },
      };
    });
  };

  // Handle AI product lookup results
  const handleAIProductFound = (aiData) => {
    // Parse weight from string like "2.5 lbs" or "1.2 kg"
    const parseWeight = (weightStr) => {
      if (!weightStr) return '';
      const match = weightStr.match(/[\d.]+/);
      return match ? match[0] : '';
    };

    // Parse MSRP price
    const parseMSRP = (msrp) => {
      if (!msrp) return '';
      return msrp.toString();
    };

    // Update form data with AI results
    setFormData(prev => {
      const suggestedCategory = (aiData.category || '').trim();
      const existingCategories = Array.isArray(prev.categories) ? [...prev.categories] : (prev.category ? [prev.category] : []);
      const deduped = existingCategories.filter((name, index, arr) => {
        if (!name) return false;
        return arr.findIndex((item) => item?.toLowerCase() === name.toLowerCase()) === index;
      });

      const nextCategories = suggestedCategory
        ? [
            suggestedCategory,
            ...deduped.filter((name) => name.toLowerCase() !== suggestedCategory.toLowerCase()),
          ]
        : deduped;

      return {
        ...prev,
        name: aiData.name || prev.name,
        description: aiData.description || prev.description,
        category: nextCategories[0] || prev.category,
        categories: nextCategories,
        brand: aiData.brand || prev.brand,
        manufacturer: aiData.manufacturer || prev.manufacturer,
        weight: parseWeight(aiData.weight) || prev.weight,
        compare_at_price: parseMSRP(aiData.msrp) || prev.compare_at_price,
        upc: aiData.upc || prev.upc,
        seo_title: aiData.seo_title || prev.seo_title,
        seo_description: aiData.seo_description || prev.seo_description,
        tags: aiData.seo_keywords?.join(', ') || prev.tags,
      };
    });

    // Store additional AI data for reference
    if (aiData.key_features?.length > 0) {
      const featuresText = aiData.key_features.map(f => `• ${f}`).join('\n');
      setFormData(prev => ({
        ...prev,
        description: `${aiData.description}\n\nKey Features:\n${featuresText}`
      }));
    }

    // Show condition tips if available
    if (aiData.condition_tips) {
      toast({
        title: '💡 Condition Tips',
        description: aiData.condition_tips,
        duration: 8000
      });
    }

    // Show suggested price range
    if (aiData.suggested_price_range) {
      toast({
        title: '💰 Suggested Price Range',
        description: `For used/custom items: ${aiData.suggested_price_range}`,
        duration: 6000
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[rgb(37, 99, 235)] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" data-testid="product-editor">
      {/* Top Header */}
      <div className="bg-white border-b sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate('/admin/products')}
            className="flex items-center gap-2 text-[#0066cc] hover:text-[#004499] font-medium"
            data-testid="back-btn"
          >
            <ChevronLeft className="w-5 h-5" />
            BACK
          </button>
          <div className="flex items-center gap-3">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 text-sm flex items-center gap-1"
            >
              View Store Name Here
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <div className="w-10 h-10 bg-[rgb(37, 99, 235)] rounded-full flex items-center justify-center text-white font-medium">
              CG
            </div>
          </div>
        </div>
      </div>

      {/* Title Bar */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-light text-gray-800" style={{ fontFamily: 'Georgia, serif' }}>
            {isEditing ? 'Edit Product' : 'Add New Product'}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              onClick={handleSave}
              disabled={saving}
              className="bg-[#0066cc] hover:bg-[#0052a3]"
              data-testid="save-product-btn"
            >
              {saving ? 'Saving...' : isEditing ? 'Save Product' : 'Add New Product'}
            </Button>
            <Button 
              variant="outline" 
              disabled={!isEditing}
              onClick={handleDuplicate}
              data-testid="duplicate-product-btn"
            >
              <Copy className="w-4 h-4 mr-2" />
              Duplicate Product
            </Button>
            <Button variant="outline" size="icon" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" disabled>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b px-4">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#0066cc] text-[#0066cc]'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 sm:p-6 overflow-x-hidden">
        <div className="flex flex-col xl:flex-row gap-6 max-w-7xl mx-auto w-full">
          {/* Left Column - Main Form */}
          <div className="flex-1 space-y-6">
            {/* AI Product Lookup - Only show for new products on General tab */}
            {activeTab === 'general' && (
              <AIProductLookup 
                onProductFound={handleAIProductFound} 
                isEditing={isEditing} 
              />
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <>
                {/* Product Gallery */}
                <Card id="product-gallery-section" data-testid="product-gallery-section">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium text-gray-700">Product gallery</h3>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">
                          {images.filter(img => img.url).length} of {images.length} images
                        </span>
                        <button className="text-[#0066cc] text-sm flex items-center gap-1 hover:underline">
                          Add Video <Video className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Main Drop Zone */}
                    <div
                      className={`relative rounded-xl p-4 transition-all ${
                        globalDragOver 
                          ? 'bg-blue-50 border-2 border-dashed border-[#0066cc]' 
                          : 'bg-gray-50 border-2 border-dashed border-transparent'
                      }`}
                      onDragEnter={handleGlobalDragEnter}
                      onDragLeave={handleGlobalDragLeave}
                      onDragOver={handleGlobalDragOver}
                      onDrop={handleGlobalDrop}
                    >
                      {globalDragOver && (
                        <div className="absolute inset-0 flex items-center justify-center bg-blue-50/90 rounded-xl z-10">
                          <div className="text-center">
                            <Upload className="w-12 h-12 text-[#0066cc] mx-auto mb-2" />
                            <p className="text-[#0066cc] font-medium">Drop images here</p>
                            <p className="text-sm text-gray-500">Supports JPG, PNG, GIF up to 10MB</p>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {/* Upload Button */}
                        <div className="flex-shrink-0">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={(e) => {
                              if (e.target.files?.length) {
                                uploadFilesToSlots(e.target.files);
                              }
                              e.target.value = '';
                            }}
                            accept="image/*"
                            multiple
                            className="hidden"
                          />
                          <div
                            className="w-24 h-24 border-2 border-dashed border-[#0066cc] rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors"
                            onClick={() => {
                              // Always allow file upload (local storage fallback available)
                              fileInputRef.current?.click();
                            }}
                            data-testid="upload-image-btn"
                          >
                            <Plus className="w-8 h-8 text-[#0066cc]" />
                          </div>
                          <p className="text-xs text-[#0066cc] text-center mt-1">Add Image</p>
                        </div>

                        {/* Image Slots */}
                        {images.map((image) => (
                          <ImageDropZone
                            key={image.id}
                            image={image}
                            onUpload={(file) => handleFileUpload(file, image.id)}
                            onRemove={() => handleImageRemove(image.id)}
                            onUrlAdd={() => setShowImageInput(image.id)}
                            isUploading={uploading && uploadingImageId === image.id}
                            storageConfigured={storageConfigured}
                            isDraggingOver={dragOverImageId === image.id}
                            onDragEnter={() => setDragOverImageId(image.id)}
                            onDragLeave={() => setDragOverImageId(null)}
                            onDrop={(file) => handleFileUpload(file, image.id)}
                            onImageReorder={handleImageReorder}
                            onImageDragState={setDraggingImageId}
                            isBeingDragged={draggingImageId === image.id}
                          />
                        ))}
                      </div>
                      
                      {/* Drag hint */}
                      <p className="text-xs text-gray-400 text-center mt-3">
                        Drag and drop images here, click to browse, and drag existing images to reorder
                      </p>
                    </div>

                    {/* Storage notice - now just informational since local storage works */}
                    {!storageConfigured && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>Tip:</strong> Images are stored locally. For permanent cloud storage,{' '}
                          <a href="/admin/settings/storage" className="text-[rgb(37, 99, 235)] hover:underline font-medium">
                            configure iDrive E2
                          </a>.
                        </p>
                      </div>
                    )}

                    {/* Image URL Input Modal */}
                    {showImageInput !== null && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                        <Label className="text-sm font-medium">Enter Image URL</Label>
                        <p className="text-xs text-gray-500 mb-2">Paste a direct link to an image</p>
                        <div className="flex gap-2 mt-2">
                          <Input
                            value={newImageUrl}
                            onChange={(e) => setNewImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            data-testid="image-url-input"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleImageAdd(showImageInput);
                              }
                            }}
                          />
                          <Button
                            onClick={() => handleImageAdd(showImageInput)}
                            className="bg-[#0066cc]"
                          >
                            Add
                          </Button>
                          <Button variant="outline" onClick={() => { setShowImageInput(null); setNewImageUrl(''); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Product Details */}
                <Card>
                  <CardContent className="p-6 space-y-6">
                    {/* Name, SKU, Weight Row */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="border-gray-300"
                          data-testid="product-name-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">SKU</Label>
                        <Input
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                          className="border-gray-300"
                          data-testid="product-sku-input"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Weight, lbs</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.weight}
                          onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                          className="border-gray-300 text-right"
                          placeholder="0"
                          data-testid="product-weight-input"
                        />
                        <div className="flex items-center gap-2 mt-2">
                          <Checkbox
                            id="requires-shipping"
                            checked={formData.requires_shipping}
                            onCheckedChange={(checked) => setFormData({ ...formData, requires_shipping: checked })}
                          />
                          <label htmlFor="requires-shipping" className="text-sm text-gray-600 flex items-center gap-1">
                            Requires shipping or pickup
                            <Info className="w-4 h-4 text-gray-400" />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Description</Label>
                      {/* Rich Text Toolbar */}
                      <div className="border border-gray-300 rounded-t-lg bg-gray-50 px-2 py-1 flex items-center gap-1 flex-wrap">
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Quote className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Bold className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Italic className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Underline className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Strikethrough className="w-4 h-4 text-gray-600" /></button>
                        <div className="w-px h-5 bg-gray-300 mx-1" />
                        <button className="p-1.5 hover:bg-gray-200 rounded"><ImageIcon className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Video className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Link2 className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Table className="w-4 h-4 text-gray-600" /></button>
                        <div className="w-px h-5 bg-gray-300 mx-1" />
                        <button className="p-1.5 hover:bg-gray-200 rounded text-sm font-medium text-gray-600">A</button>
                        <button className="p-1.5 hover:bg-gray-200 rounded text-sm font-bold text-gray-600 bg-yellow-200">A</button>
                        <button className="p-1.5 hover:bg-gray-200 rounded text-sm text-gray-600">a↕</button>
                        <button className="p-1.5 hover:bg-gray-200 rounded text-sm text-gray-600">Aa</button>
                        <div className="w-px h-5 bg-gray-300 mx-1" />
                        <button className="p-1.5 hover:bg-gray-200 rounded"><AlignLeft className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Minus className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><List className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><ListOrdered className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><AlignJustify className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><AlignRight className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><AlignCenter className="w-4 h-4 text-gray-600" /></button>
                        <div className="flex-1" />
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Code className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 hover:bg-gray-200 rounded"><Maximize2 className="w-4 h-4 text-gray-600" /></button>
                      </div>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="border-gray-300 rounded-t-none min-h-[200px] resize-y"
                        placeholder="What makes this product so great? Use this area to type in a description of your product. Include images, videos, and/or testimonials to help new customers learn more about the product."
                        data-testid="product-description-input"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Category Assignment */}
                <Card>
                  <CardContent className="p-6">
                    <button type="button" className="text-[#0066cc] hover:underline flex items-center gap-1" data-testid="assign-product-categories-heading-button">
                      Assign categories to this product
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="mt-4 flex flex-col gap-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full sm:w-72 justify-between"
                            data-testid="product-categories-multiselect-trigger"
                          >
                            <span className="truncate">
                              {selectedCategoryNames.length > 0
                                ? `${selectedCategoryNames.length} categor${selectedCategoryNames.length === 1 ? 'y' : 'ies'} selected`
                                : 'Select categories'}
                            </span>
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-72" data-testid="product-categories-multiselect-content">
                          {categories.map((cat) => {
                            const isChecked = selectedCategoryNames.some((name) => name.toLowerCase() === cat.name.toLowerCase());
                            return (
                              <DropdownMenuCheckboxItem
                                key={cat.id}
                                checked={isChecked}
                                onCheckedChange={() => toggleCategorySelection(cat.name)}
                                onSelect={(event) => event.preventDefault()}
                                data-testid={`product-category-option-${cat.id}`}
                              >
                                {cat.name}
                              </DropdownMenuCheckboxItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      {selectedCategoryNames.length > 0 && (
                        <div className="flex flex-wrap gap-2" data-testid="selected-product-categories-list">
                          {selectedCategoryNames.map((name, index) => (
                            <Badge key={`${name}-${index}`} variant="outline" data-testid={`selected-product-category-badge-${index}`}>
                              {name}{index === 0 ? ' (Primary)' : ''}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Category Custom Fields */}
                {categoryCustomFields.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        {formData.category} Details
                      </CardTitle>
                      <CardDescription>
                        Fill in the category-specific fields below to provide detailed product information
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {categoryCustomFields.map((field) => (
                          <div key={field.id || field.name} className="space-y-2">
                            <Label className="flex items-center gap-1">
                              {field.label}
                              {field.required && <span className="text-red-500">*</span>}
                            </Label>
                            
                            {/* Text Input */}
                            {field.field_type === 'text' && (
                              <Input
                                value={customFieldsData[field.name] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({
                                  ...prev,
                                  [field.name]: e.target.value
                                }))}
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                data-testid={`custom-field-${field.name}`}
                              />
                            )}
                            
                            {/* Number Input */}
                            {field.field_type === 'number' && (
                              <Input
                                type="number"
                                value={customFieldsData[field.name] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({
                                  ...prev,
                                  [field.name]: e.target.value
                                }))}
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                data-testid={`custom-field-${field.name}`}
                              />
                            )}
                            
                            {/* Textarea */}
                            {field.field_type === 'textarea' && (
                              <Textarea
                                value={customFieldsData[field.name] || ''}
                                onChange={(e) => setCustomFieldsData(prev => ({
                                  ...prev,
                                  [field.name]: e.target.value
                                }))}
                                placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                                rows={3}
                                data-testid={`custom-field-${field.name}`}
                              />
                            )}
                            
                            {/* Select Dropdown */}
                            {field.field_type === 'select' && (
                              <Select
                                value={customFieldsData[field.name] || ''}
                                onValueChange={(value) => setCustomFieldsData(prev => ({
                                  ...prev,
                                  [field.name]: value
                                }))}
                              >
                                <SelectTrigger data-testid={`custom-field-${field.name}`}>
                                  <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {(field.options || []).map((option, idx) => (
                                    <SelectItem key={idx} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {/* Multi-Select (simplified as comma-separated for now) */}
                            {field.field_type === 'multi_select' && (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2">
                                  {(field.options || []).map((option, idx) => {
                                    const selectedValues = (customFieldsData[field.name] || '').split(',').filter(Boolean);
                                    const isSelected = selectedValues.includes(option.value);
                                    return (
                                      <button
                                        key={idx}
                                        type="button"
                                        onClick={() => {
                                          const newValues = isSelected
                                            ? selectedValues.filter(v => v !== option.value)
                                            : [...selectedValues, option.value];
                                          setCustomFieldsData(prev => ({
                                            ...prev,
                                            [field.name]: newValues.join(',')
                                          }));
                                        }}
                                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                                          isSelected
                                            ? 'bg-[rgb(37, 99, 235)] text-white border-[rgb(37, 99, 235)]'
                                            : 'bg-white text-gray-700 border-gray-300 hover:border-[rgb(37, 99, 235)]'
                                        }`}
                                      >
                                        {option.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Help Text */}
                            {field.help_text && (
                              <p className="text-xs text-gray-500">{field.help_text}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Attributes Tab */}
            {activeTab === 'attributes' && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Attributes</CardTitle>
                  <CardDescription>Additional product information and identifiers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Brand</Label>
                      <Input
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        placeholder="e.g., Gibson, Rolex"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Manufacturer</Label>
                      <Input
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        placeholder="Manufacturer name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>UPC/Barcode</Label>
                      <Input
                        value={formData.upc}
                        onChange={(e) => setFormData({ ...formData, upc: e.target.value })}
                        placeholder="Universal Product Code"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>MPN (Manufacturer Part Number)</Label>
                      <Input
                        value={formData.mpn}
                        onChange={(e) => setFormData({ ...formData, mpn: e.target.value })}
                        placeholder="Part number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Condition</Label>
                      <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="New">New</SelectItem>
                          <SelectItem value="Like New">Like New</SelectItem>
                          <SelectItem value="Excellent">Excellent</SelectItem>
                          <SelectItem value="Good">Good</SelectItem>
                          <SelectItem value="Fair">Fair</SelectItem>
                          <SelectItem value="Poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tags (comma separated)</Label>
                      <Input
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="guitar, electric, vintage"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Options Tab */}
            {activeTab === 'options' && (
              <Card>
                <CardHeader>
                  <CardTitle>Manual Options Builder</CardTitle>
                  <CardDescription>Build option groups, price rules (+ / - / =), and per-combination stock</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Switch
                      checked={formData.has_options}
                      onCheckedChange={(checked) => setFormData({ ...formData, has_options: checked })}
                      data-testid="manual-options-enabled-toggle"
                    />
                    <span className="text-sm" data-testid="manual-options-enabled-label">This product has options</span>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4" data-testid="manual-options-price-rule-note">
                    <p className="text-sm text-blue-900 font-medium">Price Rules</p>
                    <p className="text-xs text-blue-700 mt-1">
                      <strong>+</strong> add to base price, <strong>-</strong> subtract from base, <strong>=</strong> override with exact combo price.
                    </p>
                  </div>

                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-3" data-testid="customer-customization-settings-card">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-amber-900">Customer customization upload</p>
                        <p className="text-xs text-amber-700 mt-1">Enable this to let shoppers upload a custom image and add notes on the product page.</p>
                      </div>
                      <Switch
                        checked={allowCustomerCustomization}
                        onCheckedChange={setAllowCustomerCustomization}
                        data-testid="customer-customization-toggle"
                      />
                    </div>
                  </div>

                  {!formData.has_options ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Enable options above to add product variations</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800" data-testid="manual-option-groups-heading">Option Groups</h3>
                        <Button type="button" variant="outline" onClick={addOptionGroup} data-testid="add-option-group-button">
                          <Plus className="w-4 h-4 mr-1" /> Add Group
                        </Button>
                      </div>

                      {manualOptionGroups.length === 0 ? (
                        <div className="text-sm text-gray-500 rounded-lg border border-dashed border-gray-300 p-4" data-testid="manual-option-groups-empty">
                          No option groups yet. Add a group (e.g., Size, Color, Finish, Style).
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {manualOptionGroups.map((group, groupIndex) => (
                            <div key={group.id} className="rounded-lg border border-gray-200 p-4 space-y-3" data-testid={`manual-option-group-${group.id}`}>
                              <div className="flex items-center gap-3">
                                <Input
                                  value={group.name}
                                  onChange={(e) => updateOptionGroupName(group.id, e.target.value)}
                                  placeholder={`Group name #${groupIndex + 1} (e.g., Size)`}
                                  data-testid={`manual-option-group-name-${group.id}`}
                                />
                                <Button type="button" variant="destructive" size="sm" onClick={() => removeOptionGroup(group.id)} data-testid={`remove-option-group-${group.id}`}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>

                              {(group.values || []).map((value) => (
                                <div key={value.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center" data-testid={`manual-option-value-row-${group.id}-${value.id}`}>
                                  <Input
                                    className="md:col-span-5 w-full min-w-0"
                                    value={value.label}
                                    onChange={(e) => updateOptionValue(group.id, value.id, 'label', e.target.value)}
                                    placeholder="Option value (e.g., Small, Blue, Glossy)"
                                    data-testid={`manual-option-value-label-${group.id}-${value.id}`}
                                  />
                                  <div className="md:col-span-2 w-full min-w-0">
                                    <Select
                                      value={value.price_mode || '+'}
                                      onValueChange={(mode) => updateOptionValue(group.id, value.id, 'price_mode', mode)}
                                    >
                                      <SelectTrigger data-testid={`manual-option-value-mode-${group.id}-${value.id}`}>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="+">+</SelectItem>
                                        <SelectItem value="-">-</SelectItem>
                                        <SelectItem value="=">=</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <Input
                                    className="md:col-span-4 w-full min-w-0"
                                    type="number"
                                    step="0.01"
                                    value={value.price_value ?? 0}
                                    onChange={(e) => updateOptionValue(group.id, value.id, 'price_value', e.target.value)}
                                    placeholder="Amount"
                                    data-testid={`manual-option-value-price-${group.id}-${value.id}`}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="md:col-span-1 justify-self-end"
                                    onClick={() => removeOptionValue(group.id, value.id)}
                                    data-testid={`manual-option-value-remove-${group.id}-${value.id}`}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </div>
                              ))}

                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => addOptionValue(group.id)}
                                data-testid={`add-option-value-${group.id}`}
                              >
                                <Plus className="w-4 h-4 mr-1" /> Add Value
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="rounded-lg border border-gray-200 p-4 max-w-full overflow-hidden" data-testid="manual-option-combinations-card">
                        <h4 className="font-semibold text-gray-800 mb-3">Generated Combinations ({optionCombinations.length})</h4>
                        {optionCombinations.length === 0 ? (
                          <p className="text-sm text-gray-500" data-testid="manual-option-combinations-empty">Add group names and values to generate combinations.</p>
                        ) : (
                          <>
                            <div
                              className="md:hidden space-y-3 max-w-full overflow-hidden -mx-4 px-4"
                              style={{ width: '100vw', maxWidth: '100vw' }}
                              data-testid="manual-option-combinations-mobile-list"
                            >
                              {optionCombinations.map((combo) => {
                                const stockRow = manualOptionStock[combo.key] || { stock_quantity: 0, in_stock: false, estimated_restock: '', allow_preorder: false, wholesale_price: '' };
                                return (
                                  <div
                                    key={`mobile-${combo.key}`}
                                    className="rounded-lg border border-gray-200 p-3 space-y-2 w-full min-w-0"
                                    style={{ width: '100%', maxWidth: '100%' }}
                                    data-testid={`manual-option-combo-mobile-${combo.key}`}
                                  >
                                    <p className="font-medium text-sm break-words">{combo.label}</p>
                                    <p className="text-sm text-cyan-700 font-semibold">${combo.computedPrice.toFixed(2)}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">Wholesale $</span>
                                      <Input
                                        className="w-24"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={stockRow.wholesale_price || ''}
                                        onChange={(e) => updateComboStock(combo.key, { wholesale_price: e.target.value })}
                                        placeholder="0.00"
                                        data-testid={`manual-option-combo-wholesale-mobile-${combo.key}`}
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 items-center min-w-0">
                                      <Input
                                        className="w-full"
                                        type="number"
                                        min="0"
                                        value={stockRow.stock_quantity}
                                        onChange={(e) => {
                                          const qty = Math.max(0, parseInt(e.target.value, 10) || 0);
                                          updateComboStock(combo.key, { stock_quantity: qty, in_stock: qty > 0 ? true : stockRow.in_stock });
                                        }}
                                        data-testid={`manual-option-combo-stock-${combo.key}`}
                                      />
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">In stock</span>
                                        <Switch
                                          checked={Boolean(stockRow.in_stock)}
                                          onCheckedChange={(checked) => updateComboStock(combo.key, { in_stock: checked })}
                                          data-testid={`manual-option-combo-instock-${combo.key}`}
                                        />
                                      </div>
                                    </div>
                                    <Input
                                      className="w-full"
                                      value={stockRow.estimated_restock || ''}
                                      onChange={(e) => updateComboStock(combo.key, { estimated_restock: e.target.value })}
                                      placeholder="ETA (e.g., 2-3 weeks)"
                                      data-testid={`manual-option-combo-eta-${combo.key}`}
                                    />
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-500">Allow pre-order</span>
                                      <Switch
                                        checked={Boolean(stockRow.allow_preorder)}
                                        onCheckedChange={(checked) => updateComboStock(combo.key, { allow_preorder: checked })}
                                        data-testid={`manual-option-combo-preorder-${combo.key}`}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="hidden md:block overflow-x-auto max-w-full">
                            <table className="w-full text-sm" data-testid="manual-option-combinations-table">
                              <thead>
                                <tr className="border-b text-left">
                                  <th className="py-2 pr-3">Combination</th>
                                  <th className="py-2 pr-3">Computed Price</th>
                                  <th className="py-2 pr-3">Wholesale Price</th>
                                  <th className="py-2 pr-3">Stock Qty</th>
                                  <th className="py-2 pr-3">In Stock</th>
                                  <th className="py-2 pr-3">ETA</th>
                                  <th className="py-2 pr-3">Pre-order</th>
                                </tr>
                              </thead>
                              <tbody>
                                {optionCombinations.map((combo) => {
                                  const stockRow = manualOptionStock[combo.key] || { stock_quantity: 0, in_stock: false, estimated_restock: '', allow_preorder: false, wholesale_price: '' };
                                  return (
                                    <tr key={combo.key} className="border-b" data-testid={`manual-option-combo-row-${combo.key}`}>
                                      <td className="py-2 pr-3 font-medium">{combo.label}</td>
                                      <td className="py-2 pr-3" data-testid={`manual-option-combo-price-${combo.key}`}>${combo.computedPrice.toFixed(2)}</td>
                                      <td className="py-2 pr-3">
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-400">$</span>
                                          <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            className="w-24"
                                            value={stockRow.wholesale_price || ''}
                                            onChange={(e) => updateComboStock(combo.key, { wholesale_price: e.target.value })}
                                            placeholder="0.00"
                                            data-testid={`manual-option-combo-wholesale-${combo.key}`}
                                          />
                                        </div>
                                      </td>
                                      <td className="py-2 pr-3">
                                        <Input
                                          type="number"
                                          min="0"
                                          value={stockRow.stock_quantity}
                                          onChange={(e) => {
                                            const qty = Math.max(0, parseInt(e.target.value, 10) || 0);
                                            updateComboStock(combo.key, { stock_quantity: qty, in_stock: qty > 0 ? true : stockRow.in_stock });
                                          }}
                                          data-testid={`manual-option-combo-stock-${combo.key}`}
                                        />
                                      </td>
                                      <td className="py-2 pr-3">
                                        <Switch
                                          checked={Boolean(stockRow.in_stock)}
                                          onCheckedChange={(checked) => updateComboStock(combo.key, { in_stock: checked })}
                                          data-testid={`manual-option-combo-instock-${combo.key}`}
                                        />
                                      </td>
                                      <td className="py-2 pr-3">
                                        <Input
                                          value={stockRow.estimated_restock || ''}
                                          onChange={(e) => updateComboStock(combo.key, { estimated_restock: e.target.value })}
                                          placeholder="e.g., 2-3 weeks"
                                          data-testid={`manual-option-combo-eta-${combo.key}`}
                                        />
                                      </td>
                                      <td className="py-2 pr-3">
                                        <Switch
                                          checked={Boolean(stockRow.allow_preorder)}
                                          onCheckedChange={(checked) => updateComboStock(combo.key, { allow_preorder: checked })}
                                          data-testid={`manual-option-combo-preorder-${combo.key}`}
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Files Tab */}
            {activeTab === 'files' && (
              <Card>
                <CardHeader>
                  <CardTitle>Downloadable Files</CardTitle>
                  <CardDescription>Add files that customers can download after purchase</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500 mb-4">No files attached to this product</p>
                    <Button variant="outline">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload File
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Shipping Tab */}
            {activeTab === 'shipping' && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping & Pickup</CardTitle>
                  <CardDescription>Configure shipping dimensions and options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="free-shipping"
                      checked={formData.free_shipping}
                      onCheckedChange={(checked) => setFormData({ ...formData, free_shipping: checked })}
                    />
                    <label htmlFor="free-shipping" className="text-sm">Free shipping on this product</label>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Shipping Weight (lbs)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.shipping_weight}
                        onChange={(e) => setFormData({ ...formData, shipping_weight: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-3 block">Package Dimensions (inches)</Label>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Length</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.shipping_length}
                          onChange={(e) => setFormData({ ...formData, shipping_length: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Width</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.shipping_width}
                          onChange={(e) => setFormData({ ...formData, shipping_width: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs text-gray-500">Height</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={formData.shipping_height}
                          onChange={(e) => setFormData({ ...formData, shipping_height: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Taxes Tab */}
            {activeTab === 'taxes' && (
              <Card>
                <CardHeader>
                  <CardTitle>Tax Settings</CardTitle>
                  <CardDescription>Configure tax rules for this product</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <p>Tax settings are managed at the store level.</p>
                    <p className="text-sm mt-2">Go to Settings → Taxes to configure tax rates.</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* SEO Tab */}
            {activeTab === 'seo' && (
              <Card>
                <CardHeader>
                  <CardTitle>Search Engine Optimization</CardTitle>
                  <CardDescription>Optimize how this product appears in search results</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Page Title</Label>
                    <Input
                      value={formData.seo_title}
                      onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                      placeholder={formData.name || 'Product name'}
                    />
                    <p className="text-xs text-gray-500">{(formData.seo_title || formData.name || '').length}/70 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta Description</Label>
                    <Textarea
                      value={formData.seo_description}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      placeholder="Brief description for search engines..."
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">{(formData.seo_description || '').length}/160 characters</p>
                  </div>
                  <div className="space-y-2">
                    <Label>URL Handle</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">/shop/</span>
                      <Input
                        value={formData.seo_url}
                        readOnly
                        className="bg-gray-50"
                        placeholder="category/product-name"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Auto-generated SEO path (category/product-name). It updates when product title/category changes.
                    </p>
                  </div>
                  
                  {/* Preview */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500 mb-2">Search Result Preview</p>
                    <div className="space-y-1">
                      <p className="text-[#1a0dab] text-lg hover:underline cursor-pointer">
                        {formData.seo_title || formData.name || 'Product Title'}
                      </p>
                      <p className="text-[#006621] text-sm">
                        yourdomain.com/shop/{formData.seo_url || 'category/product-name'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {formData.seo_description || formData.description?.slice(0, 160) || 'Product description will appear here...'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Related Products Tab */}
            {activeTab === 'related' && (
              <Card>
                <CardHeader>
                  <CardTitle>Related Products</CardTitle>
                  <CardDescription>Select products to show as recommendations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allProducts.filter(p => p.id !== productId).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No other products available</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        {allProducts.filter(p => p.id !== productId).map((product) => (
                          <div
                            key={product.id}
                            onClick={() => toggleRelatedProduct(product.id)}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                              relatedProducts.includes(product.id)
                                ? 'border-[#0066cc] bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <Checkbox checked={relatedProducts.includes(product.id)} />
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-10 h-10 rounded object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{product.name}</p>
                              <p className="text-xs text-gray-500">${product.price}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Buy Now Button Tab */}
            {activeTab === 'buynow' && (
              <Card>
                <CardHeader>
                  <CardTitle>"Buy Now" Button</CardTitle>
                  <CardDescription>Get embeddable button code for external websites</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Copy this code to embed a "Buy Now" button on external websites or blogs.
                    </p>
                    {isEditing ? (
                      <div className="p-4 bg-gray-900 rounded-lg">
                        <code className="text-sm text-green-400 break-all">
                          {`<a href="${window.location.origin}/shop?add=${productId}" class="buy-now-btn">Buy Now</a>`}
                        </code>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Save the product first to get the embed code.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="w-full xl:w-80 space-y-4">
            {/* Pricing */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 mb-4">Pricing</h3>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-gray-500">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="text-lg"
                    data-testid="product-price-input"
                  />
                </div>
                <button
                  onClick={() => setShowPricingOptions(!showPricingOptions)}
                  className="text-[#0066cc] text-sm flex items-center justify-between w-full hover:underline"
                >
                  Manage pricing options
                  <ChevronRight className={`w-4 h-4 transition-transform ${showPricingOptions ? 'rotate-90' : ''}`} />
                </button>
                {showPricingOptions && (
                  <div className="mt-4 space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Wholesale price</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.wholesale_price}
                          onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-gray-400">Price for wholesale customers</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Compare at price</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.compare_at_price}
                          onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Cost price</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.cost_price}
                          onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Product Availability */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 mb-4">Product availability</h3>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.in_stock}
                    onCheckedChange={(checked) => setFormData({ ...formData, in_stock: checked })}
                    data-testid="product-availability-toggle"
                  />
                  <span className={formData.in_stock ? 'text-green-600 font-medium' : 'text-gray-500'}>
                    {formData.in_stock ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Product Visibility */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 mb-2">Visibility on Live Site</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Hidden products are only visible to logged-in users
                </p>
                <div className="flex items-center gap-3">
                  <Switch
                    checked={formData.is_visible}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_visible: checked })}
                    data-testid="product-visibility-toggle"
                  />
                  <span className={formData.is_visible ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                    {formData.is_visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Stock Control */}
            <Card>
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-800 mb-4">Stock Control</h3>
                <p className="text-[#0066cc] mb-4">
                  In Stock {formData.track_quantity ? `(${formData.quantity || 0})` : '(∞)'}
                </p>
                <button
                  onClick={() => setShowStockControl(!showStockControl)}
                  className="text-[#0066cc] text-sm flex items-center justify-between w-full hover:underline"
                >
                  Manage stock control
                  <ChevronRight className={`w-4 h-4 transition-transform ${showStockControl ? 'rotate-90' : ''}`} />
                </button>
                {showStockControl && (
                  <div className="mt-4 space-y-4 pt-4 border-t">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="track-quantity"
                        checked={formData.track_quantity}
                        onCheckedChange={(checked) => setFormData({ ...formData, track_quantity: checked })}
                      />
                      <label htmlFor="track-quantity" className="text-sm text-gray-600">
                        Track quantity
                      </label>
                    </div>
                    {formData.track_quantity && (
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Quantity in stock</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          data-testid="product-quantity-input"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preview Product */}
            <Card>
              <CardContent className="p-4">
                {isEditing && productId ? (
                  <button 
                    className="text-[#0066cc] hover:underline flex items-center gap-2"
                    onClick={() => window.open(formData.seo_url ? `/shop/${formData.seo_url}` : `/product/${productId}`, '_blank')}
                  >
                    <Maximize2 className="w-4 h-4" />
                    Preview product
                  </button>
                ) : (
                  <span className="text-gray-400 text-sm">
                    Save product first to preview
                  </span>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductEditor;
