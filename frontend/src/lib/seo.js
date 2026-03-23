// GingerKare SEO Utilities
// Comprehensive SEO management for all pages

const SITE_NAME = 'GingerKare Custom Emporium';
const SITE_URL = 'https://gingerkare.com';
const DEFAULT_IMAGE = 'https://customer-assets.emergentagent.com/job_cart-builder-21/artifacts/dk8ihy2p_gingerkare-emporuim-and-collectibles.png';
const TWITTER_HANDLE = '@gingerkare';

// Helper to set or create meta tags
const setOrCreateMeta = (selector, attributes, content) => {
  if (!content) return;
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement('meta');
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
};

// Helper to set or create link tags
const setOrCreateLink = (rel, href, attributes = {}) => {
  if (!href) return;
  let element = document.head.querySelector(`link[rel="${rel}"]`);

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
};

// Main SEO function
export const setSeoMetadata = ({
  title,
  description,
  keywords,
  canonicalPath,
  ogType = 'website',
  ogImage,
  twitterCard = 'summary_large_image',
  jsonLd,
  noIndex = false,
  author,
}) => {
  // Title
  if (title) {
    document.title = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  }

  // Basic meta tags
  setOrCreateMeta('meta[name="description"]', { name: 'description' }, description);
  setOrCreateMeta('meta[name="keywords"]', { name: 'keywords' }, keywords);
  setOrCreateMeta('meta[name="author"]', { name: 'author' }, author || SITE_NAME);
  
  // Robots
  setOrCreateMeta(
    'meta[name="robots"]', 
    { name: 'robots' }, 
    noIndex ? 'noindex, nofollow' : 'index, follow'
  );

  // Open Graph
  setOrCreateMeta('meta[property="og:title"]', { property: 'og:title' }, title);
  setOrCreateMeta('meta[property="og:description"]', { property: 'og:description' }, description);
  setOrCreateMeta('meta[property="og:type"]', { property: 'og:type' }, ogType);
  setOrCreateMeta('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME);
  setOrCreateMeta('meta[property="og:image"]', { property: 'og:image' }, ogImage || DEFAULT_IMAGE);
  setOrCreateMeta('meta[property="og:locale"]', { property: 'og:locale' }, 'en_US');
  
  if (canonicalPath) {
    const fullUrl = `${SITE_URL}${canonicalPath}`;
    setOrCreateMeta('meta[property="og:url"]', { property: 'og:url' }, fullUrl);
  }

  // Twitter Card
  setOrCreateMeta('meta[name="twitter:card"]', { name: 'twitter:card' }, twitterCard);
  setOrCreateMeta('meta[name="twitter:site"]', { name: 'twitter:site' }, TWITTER_HANDLE);
  setOrCreateMeta('meta[name="twitter:title"]', { name: 'twitter:title' }, title);
  setOrCreateMeta('meta[name="twitter:description"]', { name: 'twitter:description' }, description);
  setOrCreateMeta('meta[name="twitter:image"]', { name: 'twitter:image' }, ogImage || DEFAULT_IMAGE);

  // Canonical URL
  if (canonicalPath) {
    setOrCreateLink('canonical', `${SITE_URL}${canonicalPath}`);
  }

  // JSON-LD Structured Data
  if (jsonLd) {
    // Remove existing JSON-LD
    const existingJsonLd = document.getElementById('page-json-ld');
    if (existingJsonLd) {
      existingJsonLd.remove();
    }

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'page-json-ld';
    script.text = JSON.stringify(jsonLd);
    document.head.appendChild(script);
  }
};

// Pre-built JSON-LD generators
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: DEFAULT_IMAGE,
  description: 'Custom printables, unique gifts, and personalized treasures. Made with love!',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Dothan',
    addressRegion: 'AL',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'gingerkare44@yahoo.com',
    contactType: 'customer service',
  },
  sameAs: [
    'https://facebook.com/gingerkare',
    'https://instagram.com/gingerkare',
  ],
});

export const generateLocalBusinessSchema = (location = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: SITE_NAME,
  url: SITE_URL,
  logo: DEFAULT_IMAGE,
  image: DEFAULT_IMAGE,
  description: 'Custom printables, unique gifts, and personalized treasures.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: location.address || '',
    addressLocality: location.city || 'Dothan',
    addressRegion: location.state || 'AL',
    postalCode: location.zip || '',
    addressCountry: 'US',
  },
  geo: location.lat && location.lng ? {
    '@type': 'GeoCoordinates',
    latitude: location.lat,
    longitude: location.lng,
  } : undefined,
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: 'Saturday',
      opens: '10:00',
      closes: '16:00',
    },
  ],
  priceRange: '$$',
});

export const generateProductSchema = (product) => ({
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: product.name,
  description: product.description,
  image: product.images?.[0] || DEFAULT_IMAGE,
  sku: product.sku || product.id,
  brand: {
    '@type': 'Brand',
    name: SITE_NAME,
  },
  offers: {
    '@type': 'Offer',
    url: `${SITE_URL}/shop/${product.slug || product.id}`,
    priceCurrency: 'USD',
    price: product.price,
    availability: product.in_stock !== false 
      ? 'https://schema.org/InStock' 
      : 'https://schema.org/OutOfStock',
    seller: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
  },
});

export const generateArticleSchema = (article) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: article.title,
  description: article.summary || article.description,
  image: article.image || DEFAULT_IMAGE,
  datePublished: article.published_date,
  dateModified: article.updated_date || article.published_date,
  author: {
    '@type': 'Organization',
    name: SITE_NAME,
  },
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_IMAGE,
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${SITE_URL}/research/${article.slug}`,
  },
});

export const generateBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url ? `${SITE_URL}${item.url}` : undefined,
  })),
});

export const generateFAQSchema = (faqs) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer,
    },
  })),
});

export const generateWebsiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/shop?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

// SEO presets for common pages
export const SEO_PRESETS = {
  home: {
    title: 'Custom Printables & Unique Gifts',
    description: 'GingerKare Custom Emporium - Your destination for custom printables, unique gifts, and personalized treasures. T-shirts, mugs, tumblers, canvas art, and more!',
    keywords: 'custom printables, personalized gifts, custom t-shirts, sublimation printing, custom mugs, tumblers, canvas art, GingerKare',
    canonicalPath: '/',
    ogType: 'website',
  },
  shop: {
    title: 'Shop Custom Products',
    description: 'Browse our collection of custom printables and personalized products. T-shirts, mugs, tumblers, canvas art, stickers, and more!',
    keywords: 'custom products, personalized gifts, t-shirts, mugs, tumblers, canvas prints, sublimation',
    canonicalPath: '/shop',
    ogType: 'website',
  },
  research: {
    title: 'Design Tips & Inspiration',
    description: 'Explore our articles about sublimation printing, design tips, and custom product ideas. Learn how to create amazing personalized items!',
    keywords: 'sublimation tips, design inspiration, custom printing guide, product care',
    canonicalPath: '/research',
    ogType: 'website',
  },
  about: {
    title: 'About Us',
    description: 'Learn about GingerKare Custom Emporium - your trusted source for custom printables and personalized gifts. Made with love in Alabama!',
    keywords: 'about GingerKare, custom printing company, Alabama business',
    canonicalPath: '/about',
    ogType: 'website',
  },
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with GingerKare Custom Emporium. We\'re here to help with your custom product needs!',
    keywords: 'contact GingerKare, custom order inquiry, customer support',
    canonicalPath: '/contact',
    ogType: 'website',
  },
  faq: {
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about GingerKare products, ordering, shipping, and custom designs.',
    keywords: 'FAQ, custom printing questions, ordering help, shipping info',
    canonicalPath: '/faq',
    ogType: 'website',
  },
};

// Export site constants for use elsewhere
export { SITE_NAME, SITE_URL, DEFAULT_IMAGE, TWITTER_HANDLE };
