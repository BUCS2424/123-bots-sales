import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { setSeoMetadata, SEO_PRESETS } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PRODUCTS = [
  {
    id: 'pudu-cc1-pro',
    name: 'PUDU CC1 PRO',
    tagline: 'Professional Commercial Floor Scrubber',
    description: 'The CC1 PRO delivers exceptional cleaning performance with advanced AI navigation. Perfect for large commercial spaces.',
    image: '/images/bots/pringle-cc1-robot.png',
    features: ['LiDAR Navigation', '360° Obstacle Detection', 'Auto Docking', '6+ Hour Battery'],
    color: 'blue',
  },
  {
    id: 'ab-kas',
    name: 'AVIDBOT KAS',
    tagline: 'Industrial-Grade Autonomous Scrubber',
    description: 'Built for the most demanding environments. The AVIDBOT KAS handles heavy-duty cleaning with ease.',
    image: '/images/bots/avidbot-kas.png',
    features: ['Heavy Duty', 'Large Capacity', 'Smart Mapping', 'Multi-Surface'],
    color: 'green',
  },
  {
    id: 'pudu-sh1',
    name: 'PUDU SH1',
    tagline: 'Compact Sweeping Solution',
    description: 'The SH1 is perfect for smaller spaces and daily maintenance. Quiet, efficient, and reliable.',
    image: '/images/bots/robot-pudush.png',
    features: ['Compact Design', 'Quiet Operation', 'Easy Setup', 'Cloud Connected'],
    color: 'orange',
  },
  {
    id: 'pudu-mt1',
    name: 'PUDU MT1 MAX',
    tagline: 'Maximum Coverage Floor Cleaner',
    description: 'Maximum cleaning power for maximum results. The MT1 MAX covers large areas with precision.',
    image: '/images/bots/nav_product_mt.webp',
    features: ['Extended Range', 'High Capacity', 'Fast Charging', 'Real-time Monitoring'],
    color: 'purple',
  },
  {
    id: 'pudu-cc1-docking-station',
    name: 'CC1 DOCKING STATION',
    tagline: 'Automated Charging & Maintenance',
    description: 'The perfect companion for your CC1 robots. Automatic charging, water refill, and waste disposal.',
    image: '/images/bots/pudu-cc1_pro.png',
    features: ['Auto Charging', 'Water Refill', 'Waste Disposal', 'Status Monitoring'],
    color: 'gray',
  },
];

const ProductsPage = () => {
  useEffect(() => {
    setSeoMetadata({
      ...SEO_PRESETS.products,
      title: 'Commercial Cleaning Robots | 123 Bots',
    });
  }, []);

  const getColorClass = (color) => {
    const colors = {
      blue: 'from-blue-500/20 to-transparent border-blue-500/30',
      green: 'from-green-500/20 to-transparent border-green-500/30',
      orange: 'from-orange-500/20 to-transparent border-orange-500/30',
      purple: 'from-purple-500/20 to-transparent border-purple-500/30',
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
            Commercial Cleaning <span className="text-blue-400">Robots</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover our lineup of AI-powered autonomous floor cleaning solutions designed for commercial excellence.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {PRODUCTS.map((product, index) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className={`group relative bg-gradient-to-b ${getColorClass(product.color)} border rounded-2xl p-6 hover:scale-105 transition-all duration-300 animate-fade-in-up`}
                style={{ animationDelay: `${index * 100}ms` }}
                data-testid={`product-card-${product.id}`}
              >
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
                <p className="text-gray-400 text-sm mb-4">{product.description}</p>

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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to See These Robots in Action?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Schedule a free demo at your facility and see the difference AI cleaning makes.
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
