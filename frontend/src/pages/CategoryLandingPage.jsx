import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { setSeoMetadata } from '../lib/seo';
import axios from 'axios';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/store`;

const slugify = (value = '') =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const normalizeCategory = (category) => ({
  ...category,
  parent_id: category.parent_id || null,
  product_info_url: category.product_info_url || '',
  shop_target_url: category.shop_target_url || '',
  seo_url: category.seo_url || slugify(category.name || ''),
});

export default function CategoryLandingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const parentId = searchParams.get('parent') || null;

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(`${API}/categories`);
        const enabledCategories = (response.data || [])
          .filter((category) => category.is_enabled !== false)
          .map(normalizeCategory);
        setCategories(enabledCategories);
      } catch (error) {
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const childrenByParent = useMemo(() => {
    const grouped = {};
    categories.forEach((category) => {
      const key = category.parent_id || 'root';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(category);
    });

    Object.keys(grouped).forEach((key) => {
      grouped[key].sort((a, b) => {
        if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        return (a.name || '').localeCompare(b.name || '');
      });
    });

    return grouped;
  }, [categories]);

  const currentParent = useMemo(
    () => categories.find((category) => category.id === parentId) || null,
    [categories, parentId]
  );

  const activeCategories = useMemo(() => {
    const key = parentId || 'root';
    return childrenByParent[key] || [];
  }, [childrenByParent, parentId]);

  useEffect(() => {
    if (!loading && parentId && currentParent && activeCategories.length === 0) {
      const categorySlug = currentParent.seo_url || slugify(currentParent.name || '');
      navigate(`/shop/products?category=${encodeURIComponent(categorySlug)}`, { replace: true });
    }
  }, [loading, parentId, currentParent, activeCategories.length, navigate]);

  useEffect(() => {
    setSeoMetadata({
      title: 'Shop by Category | 123 Bots',
      description: 'Browse categories, subcategories, and products in the 123 Bots shop.',
      keywords: 'shop categories, subcategories, product catalog, 123 bots',
      canonicalPath: '/shop',
      ogType: 'website',
    });
  }, []);

  const getProductInfoLink = (category) => {
    if (category.product_info_url) return category.product_info_url;
    return '/products';
  };

  const getShopLink = (category) => {
    if (category.shop_target_url) return category.shop_target_url;

    const childCategories = childrenByParent[category.id] || [];
    if (childCategories.length > 0) {
      return `/shop?parent=${category.id}`;
    }

    return `/shop/products?category=${encodeURIComponent(category.seo_url || slugify(category.name || ''))}`;
  };

  const goBackHref = currentParent?.parent_id ? `/shop?parent=${currentParent.parent_id}` : '/shop';

  return (
    <div className="min-h-screen bg-[#f1f1f1]" data-testid="category-landing-page">
      <Header />

      <section className="pt-32 pb-20 px-4" data-testid="category-landing-main-section">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-3 mb-8">
            <h1 className="text-4xl sm:text-5xl font-semibold text-[#2e2f34]" data-testid="category-landing-title">
              {currentParent ? currentParent.name : 'Shop Categories'}
            </h1>
            {currentParent && (
              <Link
                to={goBackHref}
                className="text-sm px-4 py-2 rounded border border-[#d6d6d6] bg-white text-[#2e2f34] hover:bg-[#f8f8f8]"
                data-testid="category-back-link"
              >
                Back
              </Link>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="category-grid-loading">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="h-[460px] rounded border border-[#dedede] bg-white animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="category-grid">
              {activeCategories.map((category) => (
                <article
                  key={category.id}
                  className="bg-white rounded border border-[#e1e1e1] p-5 min-h-[460px] flex flex-col"
                  data-testid={`category-card-${category.id}`}
                >
                  <div className="w-full border border-[#ececec] rounded bg-white h-[280px] flex items-center justify-center overflow-hidden">
                    <img
                      src={category.image || '/images/home/4-bots.jpg'}
                      alt={category.name}
                      className="w-full h-full object-contain"
                      data-testid={`category-card-image-${category.id}`}
                    />
                  </div>

                  <h2 className="text-[46px] leading-none mt-5 mb-2 font-medium text-[#3a3d44]" data-testid={`category-card-name-${category.id}`}>
                    {category.name}
                  </h2>

                  <p className="text-sm text-[#6c6f77] mb-5 flex-1" data-testid={`category-card-description-${category.id}`}>
                    {category.description || 'Explore this category.'}
                  </p>

                  <div className="flex items-center gap-3">
                    <Link
                      to={getProductInfoLink(category)}
                      className="inline-flex items-center justify-center h-11 px-4 bg-[#2f3440] text-white text-[18px] font-medium whitespace-nowrap"
                      data-testid={`category-product-info-button-${category.id}`}
                    >
                      Products Info
                    </Link>
                    <Link
                      to={getShopLink(category)}
                      className="inline-flex items-center justify-center h-11 px-6 bg-[#3f6df2] text-white text-[22px] font-medium"
                      data-testid={`category-shop-button-${category.id}`}
                    >
                      Shop
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}

          {!loading && activeCategories.length === 0 && (
            <div className="rounded border border-[#dfdfdf] bg-white p-8 text-center text-[#575b63]" data-testid="category-grid-empty">
              No categories found.
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}