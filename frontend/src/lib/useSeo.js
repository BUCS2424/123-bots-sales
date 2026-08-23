import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  setSeoMetadata, 
  SEO_PRESETS,
  generateWebsiteSchema,
  generateOrganizationSchema,
  generateBreadcrumbSchema,
} from './seo';

/**
 * React hook for SEO management
 * Automatically applies SEO metadata when component mounts
 * 
 * @param {Object} options - SEO options
 * @param {string} options.title - Page title
 * @param {string} options.description - Meta description
 * @param {string} options.keywords - Meta keywords
 * @param {string} options.canonicalPath - Canonical URL path (optional, auto-detected if not provided)
 * @param {string} options.ogType - Open Graph type (default: 'website')
 * @param {string} options.ogImage - Open Graph image URL
 * @param {Object} options.jsonLd - JSON-LD structured data
 * @param {boolean} options.noIndex - Whether to noindex the page
 * @param {string} options.preset - Use a predefined SEO preset ('home', 'shop', 'research', etc.)
 */
export const useSeo = (options = {}) => {
  const location = useLocation();
  
  useEffect(() => {
    // If using a preset, merge with provided options
    const presetConfig = options.preset ? SEO_PRESETS[options.preset] : {};
    
    const seoConfig = {
      ...presetConfig,
      ...options,
      // Auto-detect canonical path if not provided
      canonicalPath: options.canonicalPath || presetConfig.canonicalPath || location.pathname,
    };
    
    setSeoMetadata(seoConfig);
    
    // Cleanup function to reset title on unmount (optional)
    return () => {
      // Could reset to default here if needed
    };
  }, [
    options.title, 
    options.description, 
    options.canonicalPath, 
    options.preset,
    location.pathname
  ]);
};

/**
 * Hook for homepage SEO with full schema markup
 */
export const useHomeSeo = () => {
  useEffect(() => {
    setSeoMetadata({
      ...SEO_PRESETS.home,
      jsonLd: [
        generateWebsiteSchema(),
        generateOrganizationSchema(),
      ],
    });
  }, []);
};

/**
 * Hook for product page SEO
 */
export const useProductSeo = (product) => {
  const location = useLocation();
  
  useEffect(() => {
    if (!product) return;
    
    setSeoMetadata({
      title: product.name,
      description: product.description?.substring(0, 160) || `Shop ${product.name} at 123Bots`,
      keywords: [product.category, product.name, 'custom', 'personalized'].filter(Boolean).join(', '),
      canonicalPath: location.pathname,
      ogType: 'product',
      ogImage: product.images?.[0],
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.images?.[0],
        sku: product.sku || product.id,
        brand: {
          '@type': 'Brand',
          name: '123Bots',
        },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: product.price,
          availability: product.in_stock !== false 
            ? 'https://schema.org/InStock' 
            : 'https://schema.org/OutOfStock',
        },
      },
    });
  }, [product, location.pathname]);
};

/**
 * Hook for article/research page SEO
 */
export const useArticleSeo = (article) => {
  const location = useLocation();
  
  useEffect(() => {
    if (!article) return;
    
    setSeoMetadata({
      title: article.title,
      description: article.summary || article.content?.substring(0, 160),
      keywords: article.tags?.join(', ') || article.category,
      canonicalPath: location.pathname,
      ogType: 'article',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: article.title,
        description: article.summary,
        datePublished: article.published_date,
        author: {
          '@type': 'Organization',
          name: '123Bots',
        },
        publisher: {
          '@type': 'Organization',
          name: '123Bots',
        },
      },
    });
  }, [article, location.pathname]);
};

/**
 * Hook for category/collection pages
 */
export const useCategorySeo = (category, products = []) => {
  const location = useLocation();
  
  useEffect(() => {
    const categoryName = category?.name || category || 'Products';
    
    setSeoMetadata({
      title: `${categoryName} - Custom Products`,
      description: `Shop our ${categoryName.toLowerCase()} collection. Custom and personalized items at 123Bots.`,
      keywords: `${categoryName}, custom ${categoryName.toLowerCase()}, personalized`,
      canonicalPath: location.pathname,
      ogType: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${categoryName} Collection`,
        description: `Browse ${categoryName} at 123Bots`,
        numberOfItems: products.length,
      },
    });
  }, [category, products.length, location.pathname]);
};

/**
 * Hook for location pages
 */
export const useLocationSeo = (locationData) => {
  useEffect(() => {
    if (!locationData) return;
    
    const { name, type, state } = locationData;
    const locationLabel = type === 'state' ? name : `${name}, ${state}`;
    
    setSeoMetadata({
      title: `Commercial Cleaning Robots in ${locationLabel}`,
      description: `123Bots delivers commercial cleaning and delivery robots to ${locationLabel}. Sales, leasing, parts, and support.`,
      keywords: `commercial cleaning robots ${locationLabel}, delivery robots ${locationLabel}, 123Bots`,
      canonicalPath: `/locations/123Bots-${locationData.slug}`,
      ogType: 'website',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: '123Bots',
        description: `Commercial cleaning and delivery robots serving ${locationLabel}`,
        areaServed: locationLabel,
      },
    });
  }, [locationData]);
};

export default useSeo;
