import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const DELIVERY_BOTS = [
  {
    id: 'flashbot-max',
    name: 'FlashBot Max',
    tagline: 'Building Delivery Expert',
    description: 'Multi-floor autonomous delivery robot with elevator calling and secure compartments for hotels, hospitals, and offices.',
    image: '/images/bots/flashbot-max.webp',
    features: ['Multi-Floor Navigation', 'Auto Elevator Calling', 'Secure Compartments', '9-12 Hour Runtime'],
    color: 'cyan',
  },
  {
    id: 'pudu-t300',
    name: 'PUDU T300',
    tagline: 'Industrial Delivery Powerhouse',
    description: '300 kg payload capacity with intelligent autonomous operation for factories, warehouses, and logistics centers.',
    image: '/images/bots/pudu-t300.png',
    features: ['300 kg Payload', 'Multi-Mode Operation', '12 Hour Runtime', 'IoT Integration'],
    color: 'indigo',
  },
  {
    id: 'pudu-t600',
    name: 'PUDU T600',
    tagline: 'Heavy-Payload Industrial Champion',
    description: '600 kg capacity with AI rack recognition and VDA5050 integration for high-density industrial environments.',
    image: '/images/bots/pudu-t600.png',
    features: ['600 kg Payload', 'AI Rack Recognition', 'VDA5050 Protocol', 'Fleet Coordination'],
    color: 'violet',
  },
];

const IndustrialDeliveryBotsPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'Industrial Delivery Robots | Autonomous Material Transport | 123 Bots',
      description: 'Discover our lineup of heavy-payload industrial delivery robots. From 10kg to 600kg capacity, perfect for warehouses, factories, and logistics operations.',
      keywords: 'industrial delivery robots, autonomous delivery, warehouse robots, material transport, PUDU T300, PUDU T600, FlashBot',
    });
  }, []);

  const getColorClass = (color) => {
    const colors = {
      cyan: 'from-cyan-500/20 to-transparent border-cyan-500/30',
      indigo: 'from-indigo-500/20 to-transparent border-indigo-500/30',
      violet: 'from-violet-500/20 to-transparent border-violet-500/30',
    };
    return colors[color] || colors.cyan;
  };

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-bots-surface to-bots-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-semibold mb-6">
            📦 Industrial Delivery Solutions
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Industrial <span className="text-purple-400">Delivery Robots</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Revolutionize material transport with autonomous delivery robots. 
            From building deliveries to heavy industrial payloads up to 600 kg.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center">✓ Multi-Floor Capable</span>
            <span className="flex items-center">✓ Up to 600kg Payload</span>
            <span className="flex items-center">✓ Fleet Management</span>
            <span className="flex items-center">✓ IoT Integration</span>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {DELIVERY_BOTS.map((product, index) => (
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
                <p className="text-purple-400 text-sm mb-3">{product.tagline}</p>
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
                <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
                  <span className="font-medium">Learn More</span>
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Automate Your Material Transport?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Schedule a consultation to see how our delivery robots can streamline your operations and boost efficiency.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/schedule-a-demo"
              className="px-8 py-4 bg-white text-purple-600 font-bold rounded-full hover:bg-gray-100 transition-colors"
            >
              Schedule a Demo
            </Link>
            <Link
              to="/contact"
              className="px-8 py-4 bg-indigo-500 text-white font-bold rounded-full hover:bg-indigo-400 transition-colors"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IndustrialDeliveryBotsPage;
