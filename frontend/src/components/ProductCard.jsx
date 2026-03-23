import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Eye, Lock, BadgePercent } from 'lucide-react';
import ButterflyIcon from './icons/ButterflyIcon';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteFeatureFlags } from '../hooks/useSiteFeatureFlags';
import {
  getDefaultManualCombination,
  getDefaultOptionSelections,
  getManualOptionGroups,
  getProductCustomizationSettings,
} from '../lib/productOptions';

const ProductCard = ({ product, index = 0, cardContext = 'default' }) => {
  const { addToCart } = useCart();
  const { isAuthenticated, isWholesale } = useAuth();
  const { require_account_for_checkout } = useSiteFeatureFlags();
  const navigate = useNavigate();

  const getDefaultOptionPayload = () => {
    const groups = getManualOptionGroups(product);
    const selections = getDefaultOptionSelections(product);
    const defaultCombination = getDefaultManualCombination(product);
    const resolvedPrice = defaultCombination?.price != null ? Number(defaultCombination.price) : product.price;
    const selectedOptions = groups.map((group) => {
      const chosenValue = (group.values || []).find((value) => value.id === selections[group.id]);
      return chosenValue ? {
        group_id: group.id,
        group_name: group.name,
        value_id: chosenValue.id,
        value_label: chosenValue.label,
      } : null;
    }).filter(Boolean);

    return {
      ...product,
      price: resolvedPrice,
      selected_options: selectedOptions,
      cart_key: `product:${product.id}:${defaultCombination?.key || 'default-option'}`,
    };
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.in_stock) return;
    if (!isAuthenticated && require_account_for_checkout) return;
    const customizationSettings = getProductCustomizationSettings(product);
    if (product.has_options || customizationSettings.enabled) {
      navigate(product.seo_url ? `/shop/${product.seo_url}` : `/product/${product.id}`);
      return;
    }
    addToCart(getDefaultOptionPayload());
  };

  const showPricing = isAuthenticated || !require_account_for_checkout;
  const isHomeCard = cardContext === 'homepage';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative"
      data-testid={`product-card-${product.id}`}
    >
      <Link
        to={product.seo_url ? `/shop/${product.seo_url}` : `/product/${product.id}`}
        data-testid={`product-seo-link-${product.id}`}
      >
        {/* Card container with luxury styling */}
        <div className="relative bg-white border border-purple-100 rounded-xl overflow-hidden transition-all duration-500 hover:border-gold-400/50 hover:shadow-2xl hover:shadow-purple-200/30 hover:-translate-y-2">
          {/* Gold corner accents on hover */}
          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-400 rounded-tl-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-400 rounded-br-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Image container */}
          <div className={`relative overflow-hidden bg-gradient-to-br from-purple-50 to-slate-50 ${isHomeCard ? 'aspect-[5/6]' : 'aspect-square'}`}>
            <div
              className={`absolute rounded-xl bg-white/90 border border-purple-100 shadow-[0_10px_30px_rgba(15,23,42,0.12)] flex items-center justify-center ${
                isHomeCard ? 'inset-1.5 p-1.5' : 'inset-3 p-3'
              }`}
            >
              <img
                src={product.image || 'https://images.unsplash.com/photo-1609993203638-ac38dad890b1?w=400'}
                alt={product.name}
                className="w-full h-full object-contain transition-opacity duration-500 group-hover:opacity-95"
                data-testid={`product-card-image-${product.id}`}
              />
            </div>
            
            {/* Overlay gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent" />

            {/* Wholesale badge */}
            {isWholesale && isAuthenticated && (
              <div className="absolute top-3 left-3 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-sm shadow-lg flex items-center gap-1.5">
                <BadgePercent className="w-3 h-3" />
                <span className="text-xs font-bold tracking-wider">WHOLESALE</span>
              </div>
            )}

            {/* Quick actions overlay */}
            <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-white/70 backdrop-blur-sm">
              {showPricing ? (
                <button
                  onClick={handleAddToCart}
                  data-testid={`add-to-cart-${product.id}`}
                  className="p-3.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:shadow-xl hover:shadow-purple-300/50 transition-all transform hover:scale-110"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    navigate('/register');
                  }}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-gold-500 text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:shadow-xl hover:shadow-gold-300/30 transition-all"
                  data-testid={`register-to-buy-${product.id}`}
                >
                  Register to Buy
                </button>
              )}
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  navigate(product.seo_url ? `/shop/${product.seo_url}` : `/product/${product.id}`);
                }}
                data-testid={`view-product-${product.id}`}
                className="p-3.5 bg-white text-purple-700 rounded-lg border border-purple-200 hover:border-gold-400 hover:text-gold-600 transition-all transform hover:scale-110 shadow-sm"
              >
                <Eye className="w-5 h-5" />
              </button>
            </div>

            {/* Stock status */}
            {!product.in_stock && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-center">
                  <span className="font-mono text-red-600 text-sm font-bold tracking-wider" data-testid={`product-stock-red-x-${product.id}`}>
                    ✕ OUT OF STOCK
                  </span>
                  {product.estimated_restock && (
                    <p className="text-xs text-red-700 mt-1" data-testid={`product-restock-eta-${product.id}`}>
                      ETA: {product.estimated_restock}
                    </p>
                  )}
                  {product.allow_preorder && (
                    <p className="text-xs text-amber-700 mt-1" data-testid={`product-preorder-available-${product.id}`}>
                      Pre-order available
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-5">
            {/* Category tag */}
            <div className="flex items-center gap-2 mb-3">
              <ButterflyIcon className="w-3.5 h-3.5 text-[#ff8c42]" />
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                {product.category || product.categories?.[0] || 'Custom Print'}
              </span>
            </div>

            {/* Product name */}
            <h3 className="font-heading font-semibold text-slate-800 text-lg mb-2 group-hover:text-purple-700 transition-colors line-clamp-1">
              {product.name}
            </h3>

            {product.has_options && (
              <p className="text-xs text-purple-600 font-semibold mb-2" data-testid={`product-options-available-${product.id}`}>
                Custom options available
              </p>
            )}

            {/* Description */}
            <p className="text-slate-500 text-sm mb-4 line-clamp-2">
              {product.description || 'Custom printed product made with care.'}
            </p>

            {/* Price and condition */}
            <div className="flex items-end justify-between pt-3 border-t border-purple-100">
              {showPricing ? (
                <div>
                  <p className="font-heading text-2xl font-bold text-purple-800">
                    ${product.price?.toFixed(2) || '0.00'}
                  </p>
                  {/* Show retail price crossed out for wholesale customers */}
                  {isWholesale && product.retail_price && product.retail_price > product.price && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-mono text-sm text-slate-400 line-through">
                        ${product.retail_price.toFixed(2)}
                      </p>
                      {product.savings_percentage && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-sm text-xs font-bold">
                          <BadgePercent className="w-3 h-3" />
                          {product.savings_percentage}% OFF
                        </span>
                      )}
                    </div>
                  )}
                  {/* Show original price for retail customers if exists */}
                  {!isWholesale && product.original_price && product.original_price > product.price && (
                    <p className="font-mono text-sm text-slate-400 line-through">
                      ${product.original_price.toFixed(2)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gold-600">
                  <Lock className="w-4 h-4" />
                  <span className="font-semibold text-sm">Register to see price</span>
                </div>
              )}
              
              {/* Condition badge */}
              <div className="px-3 py-1.5 bg-purple-50 rounded-sm">
                <span className="text-xs font-mono text-purple-600 font-medium">
                  {product.condition || 'Lab Grade'}
                </span>
              </div>
            </div>
          </div>

          {/* Bottom accent line - Gold gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-500 via-gold-400 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-center duration-500" />
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
