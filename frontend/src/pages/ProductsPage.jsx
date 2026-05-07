import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { setSeoMetadata, SEO_PRESETS } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PRODUCTS = [
  // Commercial Cleaning Bots
  {
    id: 'pudu-bg1',
    name: 'PUDU BG1 PRO',
    tagline: 'AI-Native Large Scrubber-Dryer Robot',
    description: 'The world\'s first AI-Native Large Scrubber-Dryer Robot with ultra-long runtime and one-pass sweep & scrub capability.',
    image: '/images/bots/pudu-bg1-pro.png',
    features: ['One-Pass Sweep & Scrub', 'AI Spot Cleaning', '7.5+ Hour Runtime', '24/7 Operation'],
    color: 'blue',
    category: 'Commercial Cleaning Bots',
    categorySlug: 'cleaning',
  },
  {
    id: 'pudu-cc1-pro',
    name: 'PUDU CC1 PRO',
    tagline: 'Professional Commercial Floor Scrubber',
    description: 'Advanced autonomous floor scrubber with state-of-the-art LiDAR navigation and AI-powered obstacle avoidance.',
    image: '/images/bots/pringle-cc1-robot.png',
    features: ['LiDAR Navigation', '360° Obstacle Detection', 'Auto Docking', '6+ Hour Battery'],
    color: 'blue',
    category: 'Commercial Cleaning Bots',
    categorySlug: 'cleaning',
  },
  {
    id: 'ab-kas',
    name: 'AVIDBOT KAS',
    tagline: 'Industrial-Grade Autonomous Scrubber',
    description: 'Built for the most demanding commercial environments with robust construction and intelligent automation.',
    image: '/images/bots/avidbot-kas.png',
    features: ['Heavy Duty', 'Large Capacity', 'Smart Mapping', 'Multi-Surface'],
    color: 'green',
    category: 'Commercial Cleaning Bots',
    categorySlug: 'cleaning',
  },
  {
    id: 'pudu-mt1',
    name: 'PUDU MT1 MAX',
    tagline: 'AI-Powered 3D Perception Robotic Sweeper',
    description: 'Maximum cleaning power with extended range and precision for large-area coverage.',
    image: '/images/bots/pudu-mt1-max.png',
    features: ['Extended Range', 'High Capacity', 'Fast Charging', 'Real-time Monitoring'],
    color: 'purple',
    category: 'Commercial Cleaning Bots',
    categorySlug: 'cleaning',
  },
  {
    id: 'pudu-sh1',
    name: 'PUDU SH1',
    tagline: 'Compact Sweeping Solution',
    description: 'Perfect for smaller spaces and daily maintenance. Compact design with quiet operation.',
    image: '/images/bots/robot-pudush.png',
    features: ['Compact Design', 'Quiet Operation', 'Easy Setup', 'Cloud Connected'],
    color: 'orange',
    category: 'Commercial Cleaning Bots',
    categorySlug: 'cleaning',
  },
  {
    id: 'avidbots-neo',
    name: 'AVIDBOTS NEO',
    tagline: 'Next-Gen Autonomous Cleaning Excellence',
    description: 'Enterprise-grade autonomous floor scrubber with advanced AI navigation, real-time reporting, and unmatched reliability.',
    image: '/images/bots/avidbots-neo.png',
    features: ['AI Navigation', 'Real-time Reports', 'Enterprise-Grade', '500+ Deployments'],
    color: 'blue',
    category: 'Commercial Cleaning Bots',
    categorySlug: 'cleaning',
  },
  // Industrial Delivery Bots
  {
    id: 'flashbot-max',
    name: 'FlashBot Max',
    tagline: 'Building Delivery Expert',
    description: 'Multi-floor autonomous delivery robot with elevator calling and secure compartments for hotels, hospitals, and offices.',
    image: '/images/bots/flashbot-max.webp',
    features: ['Multi-Floor Navigation', 'Auto Elevator Calling', 'Secure Compartments', '9-12 Hour Runtime'],
    color: 'cyan',
    category: 'Industrial Delivery Bots',
    categorySlug: 'delivery',
  },
  {
    id: 'pudu-t300',
    name: 'PUDU T300',
    tagline: 'Industrial Delivery Powerhouse',
    description: '300 kg payload capacity with intelligent autonomous operation for factories, warehouses, and logistics centers.',
    image: '/images/bots/pudu-t300.png',
    features: ['300 kg Payload', 'Multi-Mode Operation', '12 Hour Runtime', 'IoT Integration'],
    color: 'indigo',
    category: 'Industrial Delivery Bots',
    categorySlug: 'delivery',
  },
  {
    id: 'pudu-t600',
    name: 'PUDU T600',
    tagline: 'Heavy-Payload Industrial Champion',
    description: '600 kg capacity with AI rack recognition and VDA5050 integration for high-density industrial environments.',
    image: '/images/bots/pudu-t600.png',
    features: ['600 kg Payload', 'AI Rack Recognition', 'VDA5050 Protocol', 'Fleet Coordination'],
    color: 'violet',
    category: 'Industrial Delivery Bots',
    categorySlug: 'delivery',
  },
];

const CATEGORIES = [
  { label: 'All Products', slug: 'all' },
  { label: 'Commercial Cleaning Bots', slug: 'cleaning' },
  { label: 'Industrial Delivery Bots', slug: 'delivery' },
];

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'all';
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  
  useEffect(() => {
    setSeoMetadata({
      ...SEO_PRESETS.products,
      title: 'Autonomous Robots | Commercial Cleaning & Industrial Delivery | 123 Bots',
    });
  }, []);

  useEffect(() => {
    // Update selected category when URL parameter changes
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSearchParams(category === 'all' ? {} : { category });
  };

  const filteredProducts = selectedCategory === 'all' 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.categorySlug === selectedCategory);

  const getColorClass = (color) => {
    const colors = {
      blue: 'from-blue-500/20 to-transparent border-blue-500/30',
      green: 'from-green-500/20 to-transparent border-green-500/30',
      orange: 'from-orange-500/20 to-transparent border-orange-500/30',
      purple: 'from-purple-500/20 to-transparent border-purple-500/30',
      cyan: 'from-cyan-500/20 to-transparent border-cyan-500/30',
      indigo: 'from-indigo-500/20 to-transparent border-indigo-500/30',
      violet: 'from-violet-500/20 to-transparent border-violet-500/30',
      gray: 'from-gray-500/20 to-transparent border-gray-500/30',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-bots-surface to-bots-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Autonomous Robot <span className="text-blue-400">Solutions</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover our complete lineup of AI-powered robots for commercial cleaning and industrial delivery.
          </p>
        </div>
      </section>

      {/* Category Filter */}
      <section className="py-8 bg-bots-dark border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.slug}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                  selectedCategory === category.slug
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                    : 'bg-bots-surface text-gray-300 hover:bg-bots-accent hover:text-white border border-gray-700'
                }`}
                data-testid={`filter-${category.slug}`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <p className="text-center text-gray-400 mt-4">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product, index) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className={`group relative bg-gradient-to-b ${getColorClass(product.color)} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
                data-testid={`product-card-${product.id}`}
              >
                {/* Category Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-blue-600/80 backdrop-blur-sm rounded-full text-xs font-semibold text-white">
                  {product.categorySlug === 'cleaning' ? '🧹 Cleaning' : '📦 Delivery'}
                </div>

                {/* Product Image */}
                <div className="h-48 flex items-center justify-center mb-6">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="max-h-full max-w-full object-contain group-hover:scale-110 transition-transform duration-300"
                  />
                </div>

                {/* Product Info */}
                <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                <p className="text-blue-400 text-sm mb-3">{product.tagline}</p>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {product.features.slice(0, 3).map((feature) => (
                    <span
                      key={feature}
                      className="px-2 py-1 bg-bots-dark/50 rounded text-xs text-gray-300"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                  <span className="font-medium">Learn More</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-gray-400 text-lg">No products found in this category.</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to See These Robots in Action?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Schedule a free demo at your facility and discover how our robots can transform your operations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/schedule-a-demo"
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors"
              data-testid="products-cta-demo"
            >
              Schedule a Demo
            </Link>
            <Link
              to="/rent-or-buy-a-cleaning-bot"
              className="px-8 py-4 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-colors"
              data-testid="products-cta-buy"
            >
              Buy or Lease
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ProductsPage;
