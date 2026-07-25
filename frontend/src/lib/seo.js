// 123Bots SEO Utilities
// Comprehensive SEO management for all pages

const SITE_NAME = '123 Bots';
const SITE_URL = 'https://123bots.com';
const DEFAULT_IMAGE = '/images/home/4-bots.jpg';
const TWITTER_HANDLE = '@123bots';

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
  robots,
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
  
  // Robots - pass an explicit `robots` string (e.g. from a per-page SEO dropdown) to override the noIndex shorthand
  setOrCreateMeta(
    'meta[name="robots"]', 
    { name: 'robots' }, 
    robots || (noIndex ? 'noindex, nofollow' : 'index, follow')
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
    script.text = JSON.stringify(Array.isArray(jsonLd) ? jsonLd : [jsonLd]);
    document.head.appendChild(script);
  }
};

// Pre-built JSON-LD generators
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}${DEFAULT_IMAGE}`,
  description: 'Transform your commercial cleaning with AI-powered robotic solutions. We provide autonomous floor cleaning robots for businesses across the United States.',
  telephone: '+1-877-702-2687',
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
  },
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+1-877-702-2687',
    contactType: 'sales',
    email: 'support@123bots.com',
  },
  sameAs: [
    'https://facebook.com/123bots',
    'https://twitter.com/123bots',
    'https://linkedin.com/company/123bots',
    'https://instagram.com/123bots',
  ],
});

export const generateLocalBusinessSchema = (location = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}${DEFAULT_IMAGE}`,
  image: `${SITE_URL}${DEFAULT_IMAGE}`,
  description: 'AI-powered commercial cleaning robots for businesses.',
  telephone: '+1-877-702-2687',
  address: {
    '@type': 'PostalAddress',
    streetAddress: location.address || '',
    addressLocality: location.city || '',
    addressRegion: location.state || '',
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
      opens: '08:00',
      closes: '18:00',
    },
  ],
  priceRange: '$$$',
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
    name: product.brand || 'PUDU',
  },
  offers: {
    '@type': 'Offer',
    url: `${SITE_URL}/products/${product.slug || product.id}`,
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
      url: `${SITE_URL}${DEFAULT_IMAGE}`,
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
    title: 'Transform Your Commercial Cleaning with AI Robots',
    description: 'Discover smart robotic floor cleaners perfect for your business. Save time and effort with autonomous AI cleaning robots from 123 Bots. Request a demo today!',
    keywords: 'AI robots, commercial cleaning, robotic floor cleaners, autonomous cleaning, PUDU robots, floor scrubbers, 123Bots, commercial floor cleaning',
    canonicalPath: '/',
    ogType: 'website',
  },
  products: {
    title: 'Commercial Cleaning Robots',
    description: 'Browse our collection of AI-powered commercial cleaning robots. PUDU CC1 PRO, AVIDBOT KAS, PUDU MT1 MAX, and more autonomous floor cleaning solutions.',
    keywords: 'cleaning robots, PUDU CC1, AVIDBOT KAS, floor scrubbers, autonomous cleaning robots',
    canonicalPath: '/products',
    ogType: 'website',
  },
  shop: {
    title: 'Shop Robot Parts & Accessories',
    description: 'Shop for robot parts, accessories, and cleaning supplies for your commercial cleaning robots.',
    keywords: 'robot parts, cleaning robot accessories, PUDU parts, floor scrubber parts',
    canonicalPath: '/shop',
    ogType: 'website',
  },
  demo: {
    title: 'Schedule a Demo',
    description: 'Schedule a free demo to see our AI cleaning robots in action at your facility. No obligation, just results.',
    keywords: 'schedule demo, cleaning robot demo, free demo, robot demonstration',
    canonicalPath: '/schedule-a-demo',
    ogType: 'website',
  },
  buyLease: {
    title: 'Buy or Lease Cleaning Robots',
    description: 'Flexible buying and leasing options for commercial cleaning robots. Find the perfect plan for your business.',
    keywords: 'buy cleaning robot, lease cleaning robot, robot financing, commercial robot lease',
    canonicalPath: '/rent-or-buy-a-cleaning-bot',
    ogType: 'website',
  },
  about: {
    title: 'About Us',
    description: 'Learn about 123 Bots - your trusted partner for AI-powered commercial cleaning solutions across the United States.',
    keywords: 'about 123 Bots, commercial cleaning company, robot cleaning solutions',
    canonicalPath: '/about',
    ogType: 'website',
  },
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with 123 Bots. We\'re here to help with your commercial cleaning robot needs. Call (877) 702-2687.',
    keywords: 'contact 123 Bots, customer support, robot support, sales inquiry',
    canonicalPath: '/contact',
    ogType: 'website',
  },
  faq: {
    title: 'Frequently Asked Questions',
    description: 'Find answers to common questions about our commercial cleaning robots, pricing, support, and more.',
    keywords: 'FAQ, robot questions, cleaning robot help, support',
    canonicalPath: '/faq',
    ogType: 'website',
  },
  resources: {
    title: 'Resources & Guides',
    description: 'Explore guides, articles, and resources about autonomous cleaning technology and best practices.',
    keywords: 'cleaning robot resources, guides, articles, best practices',
    canonicalPath: '/123-bots-resources',
    ogType: 'website',
  },
};

// Export site constants for use elsewhere
export { SITE_NAME, SITE_URL, DEFAULT_IMAGE, TWITTER_HANDLE };
