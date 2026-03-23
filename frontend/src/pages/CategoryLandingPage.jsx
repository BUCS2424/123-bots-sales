import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const CATEGORY_ROWS = [
  {
    id: 'autonomous-floor-scrubbers',
    name: 'Autonomous Floor Scrubbers',
    description: 'Reliable everyday cleaning for retail, schools, and healthcare spaces.',
    image: '/images/bots/pringle-cc1-robot.png',
    infoLink: '/products/pudu-cc1-pro',
    shopLink: '/shop',
  },
  {
    id: 'industrial-cleaning-robots',
    name: 'Industrial Cleaning Robots',
    description: 'Heavy-duty robotic cleaning built for warehouses and high-traffic facilities.',
    image: '/images/bots/avidbot-kas.png',
    infoLink: '/products/ab-kas',
    shopLink: '/shop',
  },
  {
    id: 'compact-sweeping-robots',
    name: 'Compact Sweeping Robots',
    description: 'Agile and compact automation for narrow aisles and smaller commercial sites.',
    image: '/images/bots/robot-pudush.png',
    infoLink: '/products/pudu-sh1',
    shopLink: '/shop',
  },
  {
    id: 'large-area-cleaning-robots',
    name: 'Large-Area Cleaning Robots',
    description: 'Maximum area coverage and runtime for larger venues and campuses.',
    image: '/images/bots/nav_product_mt.webp',
    infoLink: '/products/pudu-mt1',
    shopLink: '/shop',
  },
  {
    id: 'docking-and-accessories',
    name: 'Docking & Accessories',
    description: 'Keep your fleet running with charging, refill, and maintenance accessories.',
    image: '/images/bots/pudu-cc1_pro.png',
    infoLink: '/products/pudu-cc1-docking-station',
    shopLink: '/shop?category=parts',
  },
];

export default function CategoryLandingPage() {
  useEffect(() => {
    setSeoMetadata({
      title: 'Shop by Category | 123 Bots',
      description:
        'Explore 123 Bots robot categories and quickly jump to product details or shop inventory.',
      keywords:
        'robot categories, commercial cleaning robots, autonomous scrubbers, 123 bots shop',
      canonicalPath: '/categories',
      ogType: 'website',
    });
  }, []);

  return (
    <div className="min-h-screen bg-bots-dark" data-testid="category-landing-page">
      <Header />

      <section className="pt-32 pb-16 px-4" data-testid="category-landing-hero">
        <div className="max-w-7xl mx-auto text-center">
          <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-500/40 bg-blue-500/10 text-blue-300 text-sm font-semibold tracking-wide">
            <ShoppingBag className="w-4 h-4" />
            SHOP COLLECTIONS
          </p>
          <h1
            className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold text-white"
            data-testid="category-landing-title"
          >
            Find the Right Robot Category for Your Facility
          </h1>
          <p
            className="mt-4 text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto"
            data-testid="category-landing-subtitle"
          >
            Compare cleaning robot categories, review product details, and jump directly into shopping.
          </p>
        </div>
      </section>

      <section className="pb-24 px-4" data-testid="category-landing-list-section">
        <div className="max-w-7xl mx-auto space-y-6">
          {CATEGORY_ROWS.map((category, index) => (
            <article
              key={category.id}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center rounded-3xl border border-gray-700 bg-gradient-to-r from-bots-surface to-bots-dark/80 p-6 lg:p-8 animate-fade-in-up"
              style={{ animationDelay: `${index * 90}ms` }}
              data-testid={`category-row-${category.id}`}
            >
              <div className="lg:col-span-4" data-testid={`category-info-${category.id}`}>
                <h2 className="text-2xl md:text-3xl font-bold text-white">{category.name}</h2>
                <p className="mt-3 text-gray-300 text-sm sm:text-base">{category.description}</p>
              </div>

              <div className="lg:col-span-4">
                <div
                  className="w-full aspect-[16/9] rounded-2xl bg-bots-dark/70 border border-gray-700 flex items-center justify-center p-4"
                  data-testid={`category-image-wrap-${category.id}`}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-contain"
                    data-testid={`category-image-${category.id}`}
                  />
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
                <Link
                  to={category.infoLink}
                  className="inline-flex justify-center items-center gap-2 w-full sm:w-auto lg:w-56 px-6 py-3 rounded-full border border-blue-500/50 bg-blue-500/15 text-blue-200 font-semibold hover:bg-blue-500/25 transition-colors"
                  data-testid={`category-info-button-${category.id}`}
                >
                  Product Info
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to={category.shopLink}
                  className="inline-flex justify-center items-center w-full sm:w-auto lg:w-56 px-6 py-3 rounded-full bg-green-500 text-black font-semibold hover:bg-green-400 transition-colors"
                  data-testid={`category-shop-button-${category.id}`}
                >
                  Shop
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}