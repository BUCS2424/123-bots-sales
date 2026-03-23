import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Grid, LayoutList, X, ChevronDown, BadgePercent } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import LeftMenuAccordion from '../components/LeftMenuAccordion';
import ButterflyIcon from '../components/icons/ButterflyIcon';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSiteFeatureFlags } from '../hooks/useSiteFeatureFlags';
import { toast } from '../hooks/use-toast';
import { setSeoMetadata } from '../lib/seo';
import { getDefaultProductInventory, getDefaultProductPrice } from '../lib/productOptions';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/store`;
const USERS_API = `${BACKEND_URL}/api/users`;

const PeptidesShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated, user, isWholesale, customerTier } = useAuth();
  const { left_menu_enabled } = useSiteFeatureFlags();

  // Set SEO metadata based on category
  useEffect(() => {
    const categoryText = selectedCategory !== 'All' ? `${selectedCategory} - ` : '';
    setSeoMetadata({
      title: `${categoryText}Shop Custom Products`,
      description: `Browse our collection of ${selectedCategory !== 'All' ? selectedCategory.toLowerCase() : 'custom printables and personalized products'}. T-shirts, mugs, tumblers, canvas art, and more at 123Bots!`,
      keywords: `${selectedCategory !== 'All' ? selectedCategory + ', ' : ''}custom products, personalized gifts, t-shirts, mugs, tumblers, sublimation, 123Bots shop`,
      canonicalPath: selectedCategory !== 'All' ? `/shop?category=${selectedCategory.toLowerCase().replace(/\s+/g, '-')}` : '/shop',
      ogType: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `123Bots Shop${selectedCategory !== 'All' ? ` - ${selectedCategory}` : ''}`,
        description: 'Browse custom printables and personalized products',
        numberOfItems: products.length,
      },
    });
  }, [selectedCategory, products.length]);

  // Handle URL category parameter
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    if (urlCategory && categories.length > 0) {
      // Try to find matching category by slug or name
      const matchedCategory = categories.find(cat => {
        if (cat === 'All') return false;
        const catSlug = cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        return catSlug === urlCategory.toLowerCase() || 
               cat.toLowerCase() === urlCategory.toLowerCase().replace(/-/g, ' ');
      });
      if (matchedCategory) {
        setSelectedCategory(matchedCategory);
      } else {
        // Try partial match
        const partialMatch = categories.find(cat => 
          cat !== 'All' && urlCategory.toLowerCase().includes(cat.toLowerCase().replace(/\s+/g, '-'))
        );
        if (partialMatch) {
          setSelectedCategory(partialMatch);
        }
      }
    }
  }, [searchParams, categories]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products with tier-based pricing if user is logged in
        let productsRes;
        if (isAuthenticated && user?.id) {
          // Use priced endpoint for tier-based pricing
          productsRes = await axios.get(`${API}/products/priced`, {
            params: { customer_id: user.id }
          });
        } else {
          productsRes = await axios.get(`${API}/products`);
        }
        
        const categoriesRes = await axios.get(`${API}/categories`);
        
        // Handle both response formats (array or {products: [...], customer_type: ...})
        const productsData = productsRes.data.products || productsRes.data;
        
        const transformedProducts = productsData.map((p) => {
          const defaultInventory = getDefaultProductInventory(p);

          return {
            id: p.id,
            name: p.name,
            description: p.description,
            price: p.display_price ?? getDefaultProductPrice(p),
            retail_price: p.retail_price || null,
            savings_percentage: p.savings_percentage || null,
            original_price: p.original_price || p.price * 1.3,
            image: p.image || 'https://images.unsplash.com/photo-1609993203638-ac38dad890b1?w=400',
            category: p.category,
            categories: Array.isArray(p.categories) && p.categories.length > 0
              ? p.categories
              : [p.category].filter(Boolean),
            condition: p.condition || 'Premium Quality',
            in_stock: defaultInventory.inStock,
            quantity: defaultInventory.quantity,
            estimated_restock: defaultInventory.estimatedRestock,
            allow_preorder: defaultInventory.allowPreorder,
            sku: p.sku,
            has_options: p.has_options,
            custom_fields_data: p.custom_fields_data,
            customer_type: p.customer_type || 'retail',
          };
        });
        
        setProducts(transformedProducts);
        setCategories(['All', ...categoriesRes.data.map(c => c.name)]);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load products.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, user?.id]);

  const filteredProducts = products
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const itemCategories = Array.isArray(item.categories) && item.categories.length > 0
        ? item.categories
        : [item.category].filter(Boolean);
      const matchesCategory = selectedCategory === 'All' || itemCategories.includes(selectedCategory);
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price;
        case 'price-high': return b.price - a.price;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

  const sortOptions = [
    { value: 'featured', label: 'Featured' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A-Z' },
  ];

  return (
    <div className="min-h-screen bg-bots-dark pt-28 pb-32" data-testid="shop-page">
      {/* Wholesale Banner */}
      {isAuthenticated && isWholesale && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3"
        >
          <div className="max-w-7xl mx-auto px-6 lg:px-8 flex items-center justify-center gap-3">
            <BadgePercent className="w-5 h-5" />
            <span className="font-semibold">Wholesale Pricing Active</span>
            <span className="text-green-100">•</span>
            <span className="text-green-100">
              {customerTier?.custom_discount_percentage 
                ? `${customerTier.custom_discount_percentage}% Custom Discount`
                : 'Exclusive wholesale rates applied'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Hero banner */}
      <section className="relative py-16 mb-8 bg-gradient-to-b from-bots-surface to-bots-dark">
        <div className="absolute inset-0 grid-bg opacity-30" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-semibold tracking-wider mb-6">
              <ButterflyIcon className="w-4 h-4" />
              PRE-PRINTED AND CUSTOM SUBLIMATION
            </span>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
              123Bots
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Browse our collection of custom printables, unique gifts, and personalized treasures. Made with care, just for you.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className={`flex gap-8 ${left_menu_enabled ? '' : ''}`}>
          {/* Left Menu Sidebar */}
          {left_menu_enabled && (
            <aside className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24">
                <LeftMenuAccordion 
                  onCategorySelect={(cat) => setSelectedCategory(cat)}
                  currentCategory={selectedCategory}
                  categories={categories}
                />
              </div>
            </aside>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search and filters bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between p-4 bg-bots-surface border border-gray-700 rounded-2xl shadow-sm">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-bots-dark border border-gray-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                data-testid="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-3 items-center">
              {/* Category filter */}
              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none px-4 py-3 pr-10 bg-bots-dark border border-gray-700 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  data-testid="category-filter"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* Sort */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-3 pr-10 bg-bots-dark border border-gray-700 rounded-xl text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
                  data-testid="sort-filter"
                >
                  {sortOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>

              {/* View toggle */}
              <div className="flex items-center gap-1 p-1 bg-bots-dark border border-gray-700 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#6e2ea8] text-white' : 'text-gray-500 hover:text-gray-400'}`}
                  data-testid="view-grid-btn"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#6e2ea8] text-white' : 'text-gray-500 hover:text-gray-400'}`}
                  data-testid="view-list-btn"
                >
                  <LayoutList className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-slate-500 font-mono text-sm">
            Showing <span className="text-cyan-600 font-semibold">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
          {selectedCategory !== 'All' && (
            <button
              onClick={() => setSelectedCategory('All')}
              className="flex items-center gap-2 px-3 py-1 bg-[#f4e4bc]/40 border border-[#d6a85a] rounded-full text-[#7a4d00] text-sm hover:bg-[#f4e4bc]/70 transition-all"
            >
              {selectedCategory}
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Products grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-100 border border-gray-700 flex items-center justify-center">
              <ButterflyIcon className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="font-heading text-xl text-white mb-2">No products found</h3>
            <p className="text-slate-500 mb-6">Try adjusting your search or filter criteria</p>
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
              className="px-6 py-3 bg-blue-500/10 border border-[#ff8c42] text-blue-400 rounded-full hover:bg-[#ff8c42]/20 transition-all font-semibold"
            >
              Clear Filters
            </button>
          </motion.div>
        ) : (
          <motion.div
            layout
            className={`grid gap-6 ${
              viewMode === 'grid' 
                ? left_menu_enabled 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                : 'grid-cols-1'
            }`}
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PeptidesShopPage;
