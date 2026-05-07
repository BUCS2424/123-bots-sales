import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CLEANING_BOTS = [
  {
    id: 'pudu-bg1',
    name: 'PUDU BG1 PRO',
    tagline: 'AI-Native Large Scrubber-Dryer Robot',
    description: 'The world\'s first AI-Native Large Scrubber-Dryer Robot with ultra-long runtime and one-pass sweep & scrub capability.',
    image: '/images/bots/pudu-bg1-pro.png',
    features: ['One-Pass Sweep & Scrub', 'AI Spot Cleaning', '7.5+ Hour Runtime', '24/7 Operation'],
    color: 'blue',
  },
  {
    id: 'pudu-cc1-pro',
    name: 'PUDU CC1 PRO',
    tagline: 'Professional Commercial Floor Scrubber',
    description: 'Advanced autonomous floor scrubber with state-of-the-art LiDAR navigation and AI-powered obstacle avoidance.',
    image: '/images/bots/pringle-cc1-robot.png',
    features: ['LiDAR Navigation', '360° Obstacle Detection', 'Auto Docking', '6+ Hour Battery'],
    color: 'blue',
  },
  {
    id: 'ab-kas',
    name: 'AVIDBOT KAS',
    tagline: 'Industrial-Grade Autonomous Scrubber',
    description: 'Built for the most demanding commercial environments with robust construction and intelligent automation.',
    image: '/images/bots/avidbot-kas.png',
    features: ['Heavy Duty', 'Large Capacity', 'Smart Mapping', 'Multi-Surface'],
    color: 'green',
  },
  {
    id: 'pudu-mt1',
    name: 'PUDU MT1 MAX',
    tagline: 'AI-Powered 3D Perception Robotic Sweeper',
    description: 'Maximum cleaning power with extended range and precision for large-area coverage.',
    image: '/images/bots/pudu-mt1-max.png',
    features: ['Extended Range', 'High Capacity', 'Fast Charging', 'Real-time Monitoring'],
    color: 'purple',
  },
  {
    id: 'pudu-sh1',
    name: 'PUDU SH1',
    tagline: 'Compact Sweeping Solution',
    description: 'Perfect for smaller spaces and daily maintenance. Compact design with quiet operation.',
    image: '/images/bots/robot-pudush.png',
    features: ['Compact Design', 'Quiet Operation', 'Easy Setup', 'Cloud Connected'],
    color: 'orange',
  },
  {
    id: 'avidbots-neo',
    name: 'AVIDBOTS NEO',
    tagline: 'Next-Gen Autonomous Cleaning Excellence',
    description: 'Enterprise-grade autonomous floor scrubber with advanced AI navigation, real-time reporting, and unmatched reliability.',
    image: '/images/bots/avidbots-neo.png',
    features: ['AI Navigation', 'Real-time Reports', 'Enterprise-Grade', '500+ Deployments'],
    color: 'blue',
  },
  {
    id: 'pudu-mt1-vac',
    name: 'PUDU MT1 VAC',
    tagline: 'Advanced Vacuuming Robot',
    description: 'Intelligent autonomous vacuum cleaner with powerful suction and smart navigation for comprehensive floor cleaning.',
    image: '/images/bots/pudu-mt1-vac.png',
    features: ['Powerful Suction', 'Smart Navigation', 'Auto Charging', 'Multi-Surface'],
    color: 'purple',
  },
  {
    id: 'gausium-mira',
    name: 'GAUSIUM MIRA',
    tagline: 'Award-Winning Compact Autonomous Scrubber',
    description: 'ISSA 2025 Innovation Winner. Drop & Go deployment, simultaneous sweep & scrub, 660mm narrow aisle navigation for retail and mid-sized facilities.',
    image: '/images/bots/gausium-mira.webp',
    features: ['Drop & Go Deploy', '660mm Narrow Aisle', 'One-Pass Clean', 'Self-Cleaning'],
    color: 'green',
  },
  {
    id: 'gausium-marvel',
    name: 'GAUSIUM MARVEL',
    tagline: 'Large-Space Commercial Floor Cleaner',
    description: 'Built for warehouses, factories, and large facilities. 120 Ah battery, 80L/70L tanks, 55kg cleaning pressure, sweep & scrub in one pass.',
    image: '/images/bots/gausium-marvel.png',
    features: ['5-10 Hour Runtime', '80L/70L Tanks', '55kg Pressure', '3-in-1 Cleaning'],
    color: 'gray',
  },
];

const CommercialCleaningBotsPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'Commercial Cleaning Robots | Autonomous Floor Scrubbers | 123 Bots',
      description: 'Discover our lineup of AI-powered commercial cleaning robots. Autonomous floor scrubbers designed for hospitals, warehouses, retail spaces, and more.',
      keywords: 'commercial cleaning robots, floor scrubbers, autonomous cleaners, PUDU robots, industrial floor cleaning',
    });
  }, []);

  const getColorClass = (color) => {
    const colors = {
      blue: 'from-blue-500/20 to-transparent border-blue-500/30',
      green: 'from-green-500/20 to-transparent border-green-500/30',
      orange: 'from-orange-500/20 to-transparent border-orange-500/30',
      purple: 'from-purple-500/20 to-transparent border-purple-500/30',
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-bots-surface to-bots-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-6">
            🧹 Commercial Cleaning Solutions
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Commercial <span className="text-blue-400">Cleaning Robots</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Transform your cleaning operations with AI-powered autonomous floor scrubbers. 
            Designed for hospitals, warehouses, retail spaces, and commercial facilities.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
            <span className="flex items-center">✓ 24/7 Autonomous Operation</span>
            <span className="flex items-center">✓ Zero Training Required</span>
            <span className="flex items-center">✓ Consistent Results</span>
            <span className="flex items-center">✓ Reduce Labor Costs</span>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {CLEANING_BOTS.map((product, index) => (
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
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Cleaning Operations?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Schedule a free demo at your facility and see how our robots deliver spotless results, every time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/schedule-a-demo"
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors"
            >
              Schedule a Demo
            </Link>
            <Link
              to="/rent-or-buy-a-cleaning-bot"
              className="px-8 py-4 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-colors"
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

export default CommercialCleaningBotsPage;
