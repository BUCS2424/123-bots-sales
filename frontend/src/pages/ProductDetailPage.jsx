import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, ArrowLeft, ArrowRight, Shield, Truck, Minus, Plus, CheckCircle, Lock, BadgePercent, Heart, Upload } from 'lucide-react';
import ButterflyIcon from '../components/icons/ButterflyIcon';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteFeatureFlags } from '../hooks/useSiteFeatureFlags';
import { toast } from '../hooks/use-toast';
import { setSeoMetadata, generateProductSchema } from '../lib/seo';
import { Textarea } from '../components/ui/textarea';
import {
  buildManualOptionSelectionKey,
  getDefaultOptionSelections,
  getDisplayOptionSummary,
  getManualOptionGroups,
  getProductCustomizationSettings,
  getSelectedManualCombination,
  getSelectedOptionEntries,
} from '../lib/productOptions';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const ProductDetailPage = () => {
  const { categorySlug, productSlug } = useParams();
  const seoPath = `${categorySlug || ''}/${productSlug || ''}`;
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [customNotes, setCustomNotes] = useState('');
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [customImageUploading, setCustomImageUploading] = useState(false);
  const [wholesalePriceInfo, setWholesalePriceInfo] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated, user, isWholesale, customerTier } = useAuth();
  const { require_account_for_checkout } = useSiteFeatureFlags();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/store/products/seo/${seoPath}`);
        const normalizedProduct = {
          ...response.data,
          images: response.data.images || [response.data.image || 'https://images.unsplash.com/photo-1609993203638-ac38dad890b1?w=800']
        };

        setSelectedOptions(getDefaultOptionSelections(normalizedProduct));
        setCustomNotes('');
        setCustomImageUrl('');
        setProduct(normalizedProduct);

        if (normalizedProduct.seo_url && normalizedProduct.seo_url !== seoPath) {
          navigate(`/shop/${normalizedProduct.seo_url}`, { replace: true });
        }
        
        // Fetch wholesale price info if user is authenticated
        if (isAuthenticated && user?.id) {
          try {
            const priceResponse = await axios.post(
              `${BACKEND_URL}/api/users/calculate-price?product_id=${normalizedProduct.id}&customer_id=${user.id}&quantity=1`
            );
            setWholesalePriceInfo(priceResponse.data);
          } catch (err) {
            console.log('Could not fetch wholesale price info');
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast({
          title: 'Error',
          description: 'Failed to load product details.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [seoPath, isAuthenticated, user?.id]);

  // Set SEO metadata when product is loaded
  useEffect(() => {
    if (product) {
      setSeoMetadata({
        title: product.name,
        description: product.description?.substring(0, 160) || `Shop ${product.name} at GingerKare Custom Emporium. Custom made with care!`,
        keywords: [product.category, product.name, 'custom', 'personalized', 'GingerKare'].filter(Boolean).join(', '),
        canonicalPath: `/shop/${product.seo_url || seoPath}`,
        ogType: 'product',
        ogImage: product.images?.[0],
        jsonLd: generateProductSchema(product),
      });
    }
  }, [product, seoPath]);

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product?.id) return;
      setRelatedLoading(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/store/products/${product.id}/related?limit=5`);
        setRelatedProducts(response.data || []);
      } catch (error) {
        setRelatedProducts([]);
      } finally {
        setRelatedLoading(false);
      }
    };

    fetchRelatedProducts();
  }, [product?.id]);

  // Refetch price when quantity changes (for quantity tier discounts)
  useEffect(() => {
    const fetchPriceForQuantity = async () => {
      if (isAuthenticated && user?.id && isWholesale && product) {
        try {
          const priceResponse = await axios.post(
            `${BACKEND_URL}/api/users/calculate-price?product_id=${product.id}&customer_id=${user.id}&quantity=${quantity}`
          );
          setWholesalePriceInfo(priceResponse.data);
        } catch (err) {
          console.log('Could not fetch price for quantity');
        }
      }
    };
    fetchPriceForQuantity();
  }, [quantity, isAuthenticated, user?.id, isWholesale, product]);

  const manualOptionGroups = getManualOptionGroups(product);
  const customizationSettings = getProductCustomizationSettings(product);
  const selectedOptionEntries = getSelectedOptionEntries(manualOptionGroups, selectedOptions);
  const selectedCombination = getSelectedManualCombination(product, selectedOptions);
  const manualOptionKey = buildManualOptionSelectionKey(manualOptionGroups, selectedOptions);

  // Use wholesale price if available, otherwise use regular price
  const retailPrice = selectedCombination?.price ?? product?.price;
  const resolvedPrice = isWholesale && wholesalePriceInfo?.unit_price 
    ? wholesalePriceInfo.unit_price 
    : retailPrice;

  const selectedOptionQty = selectedCombination ? Number(selectedCombination.stock_quantity || 0) : Number(product?.quantity || 0);
  const selectedOptionInStock = selectedCombination
    ? Boolean(selectedCombination.in_stock) && selectedOptionQty > 0
    : Boolean(product?.in_stock);
  const selectedOptionEstimatedRestock = selectedCombination?.estimated_restock || '';
  const selectedOptionAllowPreorder = Boolean(selectedCombination?.allow_preorder);
  
  const selectedOptionLabel = getDisplayOptionSummary({ selected_options: selectedOptionEntries });

  const handleCustomizationUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please upload an image file.', variant: 'destructive' });
      return;
    }

    setCustomImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', `customer-customizations/${product?.id || 'general'}`);
      const response = await axios.post(`${BACKEND_URL}/api/storage/upload-customization`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCustomImageUrl(response.data.url);
      toast({ title: 'Image uploaded', description: 'Your custom image is attached to this product.' });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.response?.data?.detail || 'Could not upload your customization image.',
        variant: 'destructive',
      });
    } finally {
      setCustomImageUploading(false);
    }
  };

  const handleAddToCart = () => {
    if (!isAuthenticated && require_account_for_checkout) {
      navigate('/register');
      return;
    }

    if (!selectedOptionInStock && !selectedOptionAllowPreorder) {
      toast({
        title: 'Out of stock',
        description: selectedOptionEstimatedRestock
          ? `Estimated restock: ${selectedOptionEstimatedRestock}`
          : 'This option is currently unavailable.',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedOptionInStock && selectedOptionAllowPreorder && !selectedOptionEstimatedRestock) {
      const shouldPreorder = window.confirm(
        'This option is out of stock with no exact restock date. Would you like to place a pre-order?'
      );
      if (!shouldPreorder) return;
    }

    const payload = {
      ...product,
      price: resolvedPrice,
      selected_options: selectedOptionEntries.map((entry) => ({
        group_id: entry.groupId,
        group_name: entry.groupName,
        value_id: entry.valueId,
        value_label: entry.valueLabel,
      })),
      custom_image_url: customImageUrl || null,
      custom_notes: customNotes.trim() || null,
      is_preorder: !selectedOptionInStock && selectedOptionAllowPreorder,
      estimated_restock: selectedOptionEstimatedRestock || null,
      cart_key: `product:${product.id}:${manualOptionKey || 'default-option'}:${customImageUrl || 'no-image'}:${(customNotes || '').trim() || 'no-note'}`,
    };

    for (let i = 0; i < quantity; i++) {
      addToCart(payload);
    }

    toast({
      title: 'Added to Cart',
      description: `${quantity}x ${product.name}${selectedOptionLabel ? ` (${selectedOptionLabel})` : ''}${payload.is_preorder ? ' added as pre-order.' : ' added to your cart.'}`,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square bg-slate-100 rounded-2xl animate-pulse" />
            <div className="space-y-6">
              <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
              <div className="h-12 w-3/4 bg-slate-100 rounded animate-pulse" />
              <div className="h-24 bg-slate-100 rounded animate-pulse" />
              <div className="h-16 w-48 bg-slate-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50 pt-32 pb-32 flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-heading text-2xl text-slate-800 mb-4">Product not found</h2>
          <Link to="/shop" className="text-cyan-600 hover:text-cyan-700">
            ← Back to catalog
          </Link>
        </div>
      </div>
    );
  }

  const showPricing = isAuthenticated || !require_account_for_checkout;

  return (
    <div className="min-h-screen bg-slate-50 pt-32 pb-32" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Breadcrumb */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-slate-500 hover:text-[#ff8c42] transition-colors"
            data-testid="back-to-catalog"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shop
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image gallery */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-white to-slate-100 border border-slate-200 shadow-lg mb-4">
              <div className="absolute inset-5 rounded-xl bg-white border border-slate-100 shadow-[0_12px_28px_rgba(15,23,42,0.14)] flex items-center justify-center p-5">
                <img
                  src={product.images?.[selectedImage] || product.image}
                  alt={product.name}
                  className="w-full h-full object-contain drop-shadow-[0_14px_24px_rgba(15,23,42,0.2)]"
                  data-testid="product-detail-main-image"
                />
              </div>
            </div>

            {/* Thumbnail gallery */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === idx 
                        ? 'border-cyan-500 shadow-lg' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain bg-white" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product info */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Category */}
            <div className="flex items-center gap-2 mb-4">
              <ButterflyIcon className="w-4 h-4 text-[#ff8c42]" />
              <span className="font-mono text-sm text-slate-500 uppercase tracking-wider">
                {product.category || 'Custom Print'}
              </span>
            </div>

            {/* Name */}
            <h1 className="font-heading text-3xl md:text-4xl font-bold text-slate-800 mb-4" data-testid="product-name">
              {product.name}
            </h1>

            {/* Description */}
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              {product.description || 'Custom printed product made with premium materials and care. Perfect for gifts or personal use.'}
            </p>

            {/* Price */}
            {showPricing ? (
              <div className="mb-8">
                <div className="flex items-end gap-4">
                  <span className="font-mono text-4xl font-bold text-slate-800" data-testid="product-price">
                    ${resolvedPrice?.toFixed(2)}
                  </span>
                  {/* Show retail price for wholesale customers */}
                  {isWholesale && wholesalePriceInfo?.retail_price && wholesalePriceInfo.retail_price > resolvedPrice && (
                    <span className="font-mono text-xl text-slate-400 line-through">
                      ${wholesalePriceInfo.retail_price.toFixed(2)}
                    </span>
                  )}
                  {/* Show original price for retail customers */}
                  {!isWholesale && product.original_price && product.original_price > resolvedPrice && (
                    <span className="font-mono text-xl text-slate-400 line-through">
                      ${product.original_price.toFixed(2)}
                    </span>
                  )}
                </div>
                
                {/* Wholesale savings info */}
                {isWholesale && wholesalePriceInfo && (
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                      <BadgePercent className="w-4 h-4" />
                      {wholesalePriceInfo.discount_applied}% Wholesale Discount
                    </span>
                    {wholesalePriceInfo.savings > 0 && (
                      <span className="text-green-600 font-semibold">
                        You save ${wholesalePriceInfo.savings.toFixed(2)}
                      </span>
                    )}
                    {wholesalePriceInfo.discount_source?.startsWith('quantity_tier') && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                        Quantity tier pricing applied
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 mb-8 p-4 bg-purple-50 border border-purple-200 rounded-xl">
                <Lock className="w-6 h-6 text-purple-500" />
                <div>
                  <p className="font-heading font-semibold text-purple-700">Register to See Price</p>
                  <p className="text-purple-600 text-sm">Create a free account to view pricing and place orders</p>
                </div>
                <Link
                  to="/register"
                  className="ml-auto px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
                  data-testid="product-detail-register-button"
                >
                  Register
                </Link>
              </div>
            )}

            {product.has_options && manualOptionGroups.length > 0 && (
              <div className="grid sm:grid-cols-2 gap-4 mb-8" data-testid="product-options-panel">
                {manualOptionGroups.map((group) => (
                  <div key={group.id}>
                    <label className="block text-sm text-slate-600 mb-2" data-testid={`product-option-label-${group.id}`}>{group.name}</label>
                    <select
                      value={selectedOptions[group.id] || ''}
                      onChange={(event) => setSelectedOptions((prev) => ({ ...prev, [group.id]: event.target.value }))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-cyan-400"
                      data-testid={`product-option-select-${group.id}`}
                    >
                      {(group.values || []).filter((value) => value.label?.trim()).map((value) => (
                        <option key={value.id} value={value.id}>{value.label}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {customizationSettings.enabled && (
              <div className="mb-8 rounded-2xl border border-[#ff8c42]/25 bg-[#fff8f2] p-5 space-y-4" data-testid="product-customization-panel">
                <div>
                  <h2 className="font-heading text-xl font-semibold text-slate-800" data-testid="product-customization-heading">Customize this print</h2>
                  <p className="text-sm text-slate-500 mt-1" data-testid="product-customization-copy">Attach your own image and add notes before adding this product to cart.</p>
                </div>

                {customizationSettings.allowImageUpload && (
                  <div className="space-y-2">
                    <label className="block text-sm text-slate-600" data-testid="product-custom-image-label">Upload Image</label>
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => handleCustomizationUpload(event.target.files?.[0])}
                        data-testid="product-custom-image-input"
                      />
                      <div className="mt-3 flex items-center gap-3 text-sm text-slate-500">
                        <Upload className="w-4 h-4 text-[#ff8c42]" />
                        {customImageUploading ? 'Uploading image…' : customImageUrl ? 'Custom image attached' : 'PNG, JPG, WEBP up to 10MB'}
                      </div>
                      {customImageUrl && (
                        <div className="mt-3 rounded-xl overflow-hidden border border-slate-200 bg-white w-32 h-32">
                          <img src={customImageUrl} alt="Custom upload" className="w-full h-full object-cover" data-testid="product-custom-image-preview" />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {customizationSettings.allowNotes && (
                  <div className="space-y-2">
                    <label className="block text-sm text-slate-600" data-testid="product-custom-notes-label">Notes</label>
                    <Textarea
                      value={customNotes}
                      onChange={(event) => setCustomNotes(event.target.value)}
                      placeholder="Tell us placement, colors, wording, or any other print instructions."
                      className="min-h-[120px] bg-white"
                      data-testid="product-custom-notes-input"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Stock status */}
            <div className="flex items-center gap-2 mb-6">
              {selectedOptionInStock ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-600 font-semibold">In Stock</span>
                  <span className="text-slate-500">({selectedOptionQty || 'Limited'} available)</span>
                </>
              ) : (
                <>
                  <span className="text-red-600 font-semibold" data-testid="product-option-red-x">✕ Out of Stock</span>
                  {selectedOptionEstimatedRestock && (
                    <span className="text-slate-500" data-testid="product-option-restock-eta">ETA: {selectedOptionEstimatedRestock}</span>
                  )}
                  {selectedOptionAllowPreorder && (
                    <span className="text-amber-600 text-sm" data-testid="product-option-preorder">Pre-order available</span>
                  )}
                </>
              )}
            </div>

            {/* Quantity selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-slate-600">Quantity:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:border-cyan-400 transition-all flex items-center justify-center"
                  data-testid="quantity-decrease"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center font-mono text-xl text-slate-800" data-testid="quantity-value">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-600 hover:border-cyan-400 transition-all flex items-center justify-center"
                  data-testid="quantity-increase"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to cart button */}
            <button
              onClick={handleAddToCart}
              disabled={(!selectedOptionInStock && !selectedOptionAllowPreorder) || (!showPricing && require_account_for_checkout)}
              className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-heading font-bold text-lg uppercase tracking-wider transition-all ${
                (selectedOptionInStock || selectedOptionAllowPreorder) && (showPricing || !require_account_for_checkout)
                  ? 'bg-gradient-to-r from-[#6e2ea8] to-[#b9893d] text-white hover:shadow-xl hover:shadow-[#b9893d]/35'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
              data-testid="add-to-cart-btn"
            >
              <ShoppingCart className="w-5 h-5" />
              {!showPricing && require_account_for_checkout
                ? 'Register to Shop'
                : selectedOptionInStock
                ? 'Add to Cart'
                : selectedOptionAllowPreorder
                ? 'Pre-Order'
                : 'Out of Stock'}
            </button>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#ff8c42] to-[#b9893d] flex items-center justify-center mb-2 shadow-lg shadow-[#ff8c42]/30">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <p className="text-slate-500 text-xs">Quality Guaranteed</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#ff8c42] to-[#b9893d] flex items-center justify-center mb-2 shadow-lg shadow-[#ff8c42]/30">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <p className="text-slate-500 text-xs">Made with Care</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-br from-[#ff8c42] to-[#b9893d] flex items-center justify-center mb-2 shadow-lg shadow-[#ff8c42]/30">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <p className="text-slate-500 text-xs">Fast Shipping</p>
              </div>
            </div>
          </motion.div>
            </div>

            <section className="mt-16" data-testid="related-products-section">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading text-2xl font-bold text-slate-800" data-testid="related-products-heading">
              Related Products
            </h2>
            <Link
              to="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800"
              data-testid="related-products-view-all-link"
            >
              View all
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {relatedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" data-testid="related-products-loading-grid">
              {[...Array(5)].map((_, index) => (
                <div key={index} className="h-56 rounded-xl border border-slate-200 bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" data-testid="related-products-grid">
              {relatedProducts.map((item) => {
                const href = item.seo_url ? `/shop/${item.seo_url}` : `/product/${item.id}`;
                return (
                  <Link
                    key={item.id}
                    to={href}
                    className="group rounded-xl border border-slate-200 bg-white overflow-hidden hover:shadow-lg transition-shadow"
                    data-testid={`related-product-card-${item.id}`}
                  >
                    <div className="aspect-square bg-slate-50 border-b border-slate-100 p-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                        data-testid={`related-product-image-${item.id}`}
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs uppercase tracking-wider text-slate-500 mb-1" data-testid={`related-product-category-${item.id}`}>
                        {item.category}
                      </p>
                      <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 mb-2" data-testid={`related-product-name-${item.id}`}>
                        {item.name}
                      </h3>
                      <p className="font-mono font-bold text-cyan-700" data-testid={`related-product-price-${item.id}`}>
                        {showPricing ? `$${Number(item.price || 0).toFixed(2)}` : 'Login to view'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500" data-testid="related-products-empty-state">
              No related products found in this category yet.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProductDetailPage;
