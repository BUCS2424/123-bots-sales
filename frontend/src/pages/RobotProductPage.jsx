import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Phone, ChevronLeft, ChevronRight, Zap, Volume2, VolumeX, Maximize2, X } from 'lucide-react';
import { setSeoMetadata, generateProductSchema } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Robot product data
const ROBOT_PRODUCTS = {
  'pudu-cc1-pro': {
    name: 'PUDU CC1 PRO',
    tagline: 'Professional Commercial Floor Scrubber',
    description: 'The PUDU CC1 PRO is an advanced autonomous floor scrubber designed for commercial spaces. With state-of-the-art LiDAR navigation and AI-powered obstacle avoidance, it delivers consistent, professional-grade cleaning results.',
    image: '/images/bots/pringle-cc1-robot.png',
    features: [
      'Advanced LiDAR Navigation',
      '360° Obstacle Detection',
      'Auto Docking & Charging',
      '6+ Hour Battery Life',
      'Cloud-Connected Monitoring',
      'Multi-Surface Cleaning',
      'Real-time Status Updates',
      'Easy Maintenance',
    ],
    specs: {
      'Cleaning Width': '550mm',
      'Water Tank': '40L Clean / 45L Recovery',
      'Battery': '24V Lithium-Ion',
      'Runtime': '6+ hours',
      'Noise Level': '< 65 dB',
      'Navigation': 'LiDAR + V-SLAM',
    },
    useCases: ['Hospitals', 'Shopping Malls', 'Airports', 'Corporate Offices', 'Hotels'],
    // Docking Station info
    dockingStation: {
      name: 'CC1 Docking Station',
      description: 'The CC1 Docking Station is the perfect companion for your CC1 robots. It provides automated charging, water refill, and waste disposal for truly autonomous 24/7 operation.',
      features: [
        'Auto Charging (< 3 hours)',
        'Water Refill System (100L capacity)',
        'Waste Disposal (50L tank)',
        'Status Monitoring',
        'Multi-Robot Support',
        'Compact Footprint (1200 x 800 x 1000mm)',
      ],
    },
  },
  'ab-kas': {
    name: 'AVIDBOT KAS',
    tagline: 'Industrial-Grade Autonomous Scrubber',
    description: 'Built for the most demanding commercial environments, the AVIDBOT KAS combines robust construction with intelligent automation. Perfect for warehouses, manufacturing facilities, and high-traffic areas.',
    image: '/images/bots/avidbot-kas.png',
    features: [
      'Heavy-Duty Construction',
      'Large Capacity Tanks',
      'Smart Mapping Technology',
      'Multi-Surface Compatibility',
      'Industrial-Grade Motors',
      'Extended Runtime',
      'Remote Management',
      'Predictive Maintenance',
    ],
    specs: {
      'Cleaning Width': '660mm',
      'Water Tank': '60L Clean / 65L Recovery',
      'Battery': '36V Lithium-Ion',
      'Runtime': '8+ hours',
      'Noise Level': '< 70 dB',
      'Navigation': 'SLAM + AI',
    },
    useCases: ['Warehouses', 'Manufacturing', 'Distribution Centers', 'Airports', 'Convention Centers'],
  },
  'pudu-sh1': {
    name: 'PUDU SH1',
    tagline: 'Compact Sweeping Solution',
    description: 'The PUDU SH1 is perfect for smaller spaces and daily maintenance routines. Its compact design allows it to navigate tight spaces while delivering thorough cleaning performance.',
    image: '/images/bots/robot-pudush.png',
    features: [
      'Compact Design',
      'Quiet Operation',
      'Easy Setup & Use',
      'Cloud Connected',
      'Automatic Scheduling',
      'Obstacle Avoidance',
      'Multi-Zone Cleaning',
      'Low Maintenance',
    ],
    specs: {
      'Cleaning Width': '450mm',
      'Dust Bin': '3L',
      'Battery': '24V Lithium-Ion',
      'Runtime': '4+ hours',
      'Noise Level': '< 55 dB',
      'Navigation': 'LiDAR',
    },
    useCases: ['Retail Stores', 'Restaurants', 'Small Offices', 'Gyms', 'Clinics'],
  },
  'pudu-mt1': {
    name: 'PUDU MT1 MAX',
    tagline: 'Maximum Coverage Floor Cleaner',
    description: 'Maximum cleaning power for maximum results. The MT1 MAX is designed for large facilities that require extensive coverage and consistent cleaning quality.',
    image: '/images/bots/nav_product_mt.webp',
    features: [
      'Extended Range Coverage',
      'High Capacity Tanks',
      'Fast Charging',
      'Real-time Monitoring',
      'Adaptive Cleaning',
      'Edge Detection',
      'Report Generation',
      'Fleet Management',
    ],
    specs: {
      'Cleaning Width': '700mm',
      'Water Tank': '80L Clean / 85L Recovery',
      'Battery': '48V Lithium-Ion',
      'Runtime': '10+ hours',
      'Noise Level': '< 68 dB',
      'Navigation': 'LiDAR + Vision',
    },
    useCases: ['Large Warehouses', 'Shopping Centers', 'Airports', 'Universities', 'Stadiums'],
  },
  'pudu-bg1': {
    name: 'PUDU BG1 PRO',
    tagline: 'AI-Native Large Scrubber-Dryer Robot',
    description: 'The world\'s first AI-Native Large Scrubber-Dryer Robot. The PUDU BG1 PRO delivers ultra-long runtime and ultra-high cleaning efficiency with one-pass sweep and scrub capability, perfect for large commercial spaces requiring 24/7 autonomous cleaning.',
    image: '/images/products/pudu-bg1/bg1-front.jpg',
    heroVideo: '/images/products/pudu-bg1/pudu-bg1-hero-sm.mp4',
    heroVideoFull: '/images/products/pudu-bg1/pudu-bg1-hero.mp4',
    images: [
      '/images/products/pudu-bg1/bg1-front.jpg',
      '/images/products/pudu-bg1/bg1-side.jpg',
      '/images/products/pudu-bg1/bg1-angle.jpg',
      '/images/products/pudu-bg1/bg1-back.jpg',
    ],
    features: [
      'One-Pass Sweep & Scrub',
      'AI Spot Cleaning Detection',
      'Extendable Edge Cleaning',
      '7.5+ Hour Runtime',
      'Dual Cleaning Agent Mixing',
      'LIDAR + 3D VSLAM Navigation',
      'Automatic Docking Station',
      '24/7 Continuous Operation',
      'Stain Heat Map Generation',
      'Auto Disc Brush Installation',
      'IoT & Fleet Management',
      'Ride-on Mode Available',
    ],
    specs: {
      'Cleaning Width': '550mm / 708mm (with side brushes)',
      'Clean Water Tank': '75L',
      'Waste Water Tank': '60L',
      'Dust Box': '5L',
      'Battery': '90Ah (48V platform)',
      'Runtime': '7.5+ hours (5.5h+ standard)',
      'Efficiency': 'Up to 6,000 m²/h',
      'Navigation': 'LIDAR + 3D VSLAM Fusion',
      'Min. Path Width': '85cm (33.5 in)',
      'Weight': '344 kg (758 lbs)',
      'Dimensions': '1195 x 760 x 1303mm',
    },
    useCases: ['Warehouses', 'Parking Lots', 'Manufacturing', 'Retail Superstores', 'Distribution Centers', 'Airports'],
    highlights: [
      { title: '24H Cleaning', description: 'Non-stop autonomous operation with automatic docking' },
      { title: 'AI Magic Cleaning', description: 'Intelligent stain detection and targeted cleaning' },
      { title: 'One-Pass Clean', description: 'Wet and dry waste cleaned in a single pass' },
      { title: 'Edge Perfection', description: 'Extendable edge cleaning covers shelf edges and walls' },
    ],
  },
};

const RobotProductPage = () => {
  const { productSlug } = useParams();
  const product = ROBOT_PRODUCTS[productSlug];
  const [selectedImage, setSelectedImage] = useState(0);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const heroVideoRef = useRef(null);
  const modalVideoRef = useRef(null);
  
  // Get all images (use images array if available, otherwise just the main image)
  const productImages = product?.images || (product?.image ? [product.image] : []);

  useEffect(() => {
    if (product) {
      setSeoMetadata({
        title: `${product.name} | Commercial Cleaning Robot | 123 Bots`,
        description: product.description,
        keywords: `${product.name}, commercial cleaning robot, autonomous floor cleaner, 123 Bots`,
        canonicalPath: `/products/${productSlug}`,
        jsonLd: generateProductSchema({
          name: product.name,
          description: product.description,
          images: productImages,
          slug: productSlug,
        }),
      });
    }
  }, [product, productSlug, productImages]);

  // Reset selected image when product changes
  useEffect(() => {
    setSelectedImage(0);
  }, [productSlug]);

  if (!product) {
    return (
      <div className="min-h-screen bg-bots-dark flex items-center justify-center">
        <Header />
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Product Not Found</h1>
          <Link to="/products" className="text-blue-400 hover:underline">
            View All Products
          </Link>
        </div>
      </div>
    );
  }

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-bots-surface to-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Product Image Gallery or Hero Video */}
            <div className="flex flex-col items-center">
              {product.heroVideo ? (
                <div className="relative w-full max-w-lg rounded-2xl overflow-hidden group">
                  <video
                    ref={heroVideoRef}
                    src={product.heroVideo}
                    autoPlay
                    loop
                    muted={videoMuted}
                    playsInline
                    preload="auto"
                    className="w-full h-auto rounded-2xl"
                    data-testid="product-hero-video"
                  />
                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setVideoMuted(prev => !prev);
                        if (heroVideoRef.current) heroVideoRef.current.muted = !heroVideoRef.current.muted;
                      }}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      data-testid="video-sound-toggle"
                      aria-label={videoMuted ? 'Enable sound' : 'Mute sound'}
                    >
                      {videoMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={() => setVideoModalOpen(true)}
                      className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                      data-testid="video-expand-btn"
                      aria-label="Expand video"
                    >
                      <Maximize2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Main Image */}
                  <div className="relative w-full max-w-lg">
                    <img
                      src={productImages[selectedImage]}
                      alt={`${product.name} - View ${selectedImage + 1}`}
                      className="w-full h-auto max-h-96 object-contain"
                    />
                    {productImages.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage}
                          className="absolute left-0 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={nextImage}
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-6 h-6" />
                        </button>
                      </>
                    )}
                  </div>
                  {productImages.length > 1 && (
                    <div className="flex gap-3 mt-6">
                      {productImages.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === idx 
                              ? 'border-blue-500 ring-2 ring-blue-500/50' 
                              : 'border-gray-700 hover:border-gray-500'
                          }`}
                        >
                          <img 
                            src={img} 
                            alt={`${product.name} thumbnail ${idx + 1}`} 
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Product Info */}
            <div>
              <p className="text-blue-400 font-semibold mb-2">{product.tagline}</p>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{product.name}</h1>
              <p className="text-gray-300 text-lg mb-8">{product.description}</p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/schedule-a-demo"
                  className="px-8 py-4 bg-blue-600 text-white font-bold rounded-full text-center hover:bg-blue-500 transition-colors"
                  data-testid="product-cta-demo"
                >
                  Schedule a Demo
                </Link>
                <a
                  href="tel:8777022687"
                  className="px-8 py-4 bg-bots-surface border border-gray-700 text-white font-bold rounded-full text-center hover:bg-bots-accent transition-colors flex items-center justify-center"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  Call (877) 702-2687
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {product.features.map((feature, index) => (
              <div
                key={feature}
                className="bg-bots-surface/50 p-6 rounded-xl border border-gray-800 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
                <p className="text-white font-medium">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Highlights Section (for products with highlights) */}
      {product.highlights && product.highlights.length > 0 && (
        <section className="py-20 bg-bots-surface">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-4">Why Choose {product.name}</h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Advanced capabilities that set this robot apart
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {product.highlights.map((highlight, index) => (
                <div
                  key={index}
                  className="bg-bots-dark p-6 rounded-xl border border-gray-800 text-center"
                >
                  <div className="w-14 h-14 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{highlight.title}</h3>
                  <p className="text-gray-400 text-sm">{highlight.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Specifications Section */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Specifications</h2>
          {product.heroVideo && productImages.length > 1 ? (
            <div className="grid md:grid-cols-2 gap-10 items-start">
              {/* Image Gallery - left side */}
              <div className="flex flex-col items-center">
                <div className="relative w-full">
                  <img
                    src={productImages[selectedImage]}
                    alt={`${product.name} - View ${selectedImage + 1}`}
                    className="w-full h-auto max-h-[420px] object-contain rounded-xl"
                  />
                  {productImages.length > 1 && (
                    <>
                      <button 
                        onClick={prevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={nextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                        aria-label="Next image"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex gap-3 mt-4">
                  {productImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === idx 
                          ? 'border-blue-500 ring-2 ring-blue-500/50' 
                          : 'border-gray-700 hover:border-gray-500'
                      }`}
                    >
                      <img 
                        src={img} 
                        alt={`${product.name} thumbnail ${idx + 1}`} 
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
              {/* Specs - right side */}
              <div className="bg-bots-dark rounded-2xl p-8">
                <dl className="space-y-4">
                  {Object.entries(product.specs).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-3 border-b border-gray-800">
                      <dt className="text-gray-400">{key}</dt>
                      <dd className="text-white font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto bg-bots-dark rounded-2xl p-8">
              <dl className="space-y-4">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-3 border-b border-gray-800">
                    <dt className="text-gray-400">{key}</dt>
                    <dd className="text-white font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Ideal For</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {product.useCases.map((useCase) => (
              <span
                key={useCase}
                className="px-6 py-3 bg-blue-500/20 border border-blue-500/30 rounded-full text-white"
              >
                {useCase}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Docking Station Section (for CC1 Pro) */}
      {product.dockingStation && (
        <section className="py-20 bg-bots-surface">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-green-400 font-semibold mb-2">Complete Your Setup</p>
                <h2 className="text-3xl font-bold text-white mb-6">{product.dockingStation.name}</h2>
                <p className="text-gray-300 text-lg mb-8">{product.dockingStation.description}</p>
                <ul className="space-y-3">
                  {product.dockingStation.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3 text-white">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex justify-center">
                <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800">
                  <img
                    src="/images/bots/pudu-cc1_pro.png"
                    alt={product.dockingStation.name}
                    className="max-w-full h-auto max-h-64 object-contain mx-auto"
                  />
                  <p className="text-center text-gray-400 mt-4 text-sm">
                    Available as an add-on with your {product.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your Cleaning Operations?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            See the {product.name} in action at your facility.
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
              Buy or Lease Options
            </Link>
          </div>
        </div>
      </section>

      {/* Related Products */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Other Products</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {Object.entries(ROBOT_PRODUCTS)
              .filter(([slug]) => slug !== productSlug)
              .slice(0, 4)
              .map(([slug, prod]) => (
                <Link
                  key={slug}
                  to={`/products/${slug}`}
                  className="bg-bots-surface/50 p-6 rounded-xl border border-gray-800 hover:border-blue-500/50 transition-colors group"
                >
                  <img
                    src={prod.image}
                    alt={prod.name}
                    className="h-32 mx-auto object-contain mb-4 group-hover:scale-105 transition-transform"
                  />
                  <h3 className="text-white font-bold text-center">{prod.name}</h3>
                  <p className="text-gray-400 text-sm text-center mt-2">{prod.tagline}</p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <Footer />

      {/* Fullscreen Video Modal */}
      {videoModalOpen && product.heroVideo && (
        <div
          className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          onClick={() => setVideoModalOpen(false)}
          data-testid="video-modal-overlay"
        >
          <button
            onClick={() => setVideoModalOpen(false)}
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
            data-testid="video-modal-close"
            aria-label="Close video"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="w-full max-w-6xl mx-4" onClick={(e) => e.stopPropagation()}>
            <video
              ref={modalVideoRef}
              src={product.heroVideoFull || product.heroVideo}
              autoPlay
              loop
              playsInline
              controls
              preload="auto"
              className="w-full h-auto rounded-xl max-h-[85vh]"
              data-testid="video-modal-player"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RobotProductPage;
