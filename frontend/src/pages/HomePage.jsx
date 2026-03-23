import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Coffee, Shirt, Frame, Sticker, Flag, Sparkles, Gift, Heart, Sun, Snowflake, ChevronRight, Star } from 'lucide-react';
import HeroSection from '../components/HeroSection';
import ProductCard from '../components/ProductCard';
import ReviewsSection from '../components/ReviewsSection';
import { useSiteSettings } from '../context/SiteSettingsContext';
import axios from 'axios';
import { setSeoMetadata, generateWebsiteSchema, generateOrganizationSchema } from '../lib/seo';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api/store`;

const HomePage = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const siteSettings = useSiteSettings();

  useEffect(() => {
    setSeoMetadata({
      title: 'Custom Printables & Unique Gifts',
      description: 'GingerKare Custom Emporium - Your destination for custom printables, personalized gifts, and unique treasures. T-shirts, mugs, tumblers, canvas art and more!',
      keywords: 'custom printables, personalized gifts, custom mugs, custom t-shirts, tumblers, canvas art, patches, stickers, GingerKare, sublimation printing',
      canonicalPath: '/',
      ogType: 'website',
      jsonLd: [
        generateWebsiteSchema(),
        generateOrganizationSchema(),
        {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'GingerKare Custom Emporium - Home',
          description: 'Custom printables, personalized gifts, and unique treasures made just for you.',
          isPartOf: {
            '@type': 'WebSite',
            name: 'GingerKare Custom Emporium',
            url: 'https://gingerkare.com',
          },
        },
      ],
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          axios.get(`${API}/products`),
          axios.get(`${API}/categories`)
        ]);
        setFeaturedProducts(productsRes.data.slice(0, 8));
        setCategories(categoriesRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Printable categories for GingerKare
  const printableCategories = [
    { icon: Coffee, name: 'Coffee Mugs', description: 'Start your day with a custom mug', link: '/shop?category=coffee-mugs', color: 'from-amber-500 to-orange-600' },
    { icon: Shirt, name: 'T-Shirts', description: 'Wear your style proudly', link: '/shop?category=t-shirts', color: 'from-blue-500 to-cyan-500' },
    { icon: Frame, name: 'Canvas Art', description: 'Art that speaks to you', link: '/shop?category=on-canvas', color: 'from-purple-500 to-pink-500' },
    { icon: Sticker, name: 'Stickers & Patches', description: 'Small but mighty designs', link: '/shop?category=patches', color: 'from-green-500 to-emerald-500' },
    { icon: Flag, name: 'Flags & Banners', description: 'Make a statement', link: '/shop?category=flags', color: 'from-red-500 to-rose-500' },
    { icon: Sparkles, name: 'Tumblers', description: 'Keep drinks at perfect temp', link: '/shop?category=tumblers', color: 'from-teal-500 to-cyan-500' },
  ];

  // Featured collections
  const featuredCollections = [
    {
      title: 'Cancer Support Collection',
      description: 'Featuring The Baltimore Cancer Support Group',
      image: 'https://customer-assets.emergentagent.com/job_38142eca-d39f-438c-945a-8be7be193bd7/artifacts/vc5jlgk1_Cancer-Collection-2.jpg',
      link: '/shop?category=cancer-support-group',
      badge: 'Featured'
    },
    {
      title: 'Custom Printing',
      description: 'Customize print on any of our items',
      image: 'https://customer-assets.emergentagent.com/job_38142eca-d39f-438c-945a-8be7be193bd7/artifacts/hiqzaimq_gingerkare-custom-printables1.jpg',
      link: '/shop',
      badge: 'Popular'
    },
    {
      title: 'Tumbler Collections',
      description: 'Cool tumbler collections for every season',
      image: 'https://customer-assets.emergentagent.com/job_38142eca-d39f-438c-945a-8be7be193bd7/artifacts/81gq8f92_0-2.jpg',
      link: '/shop?category=tumblers',
      badge: 'New'
    },
    {
      title: 'Cruise Collection',
      description: 'Find your cruise line apparel',
      image: 'https://customer-assets.emergentagent.com/job_38142eca-d39f-438c-945a-8be7be193bd7/artifacts/nsagv9rj_Featured-Vision-of-the-Seas-4.jpg',
      link: '/shop?category=vision-of-the-seas',
      badge: 'Trending'
    },
    {
      title: 'Hawaiian Collections',
      description: 'Tropical vibes for every occasion',
      image: 'https://customer-assets.emergentagent.com/job_38142eca-d39f-438c-945a-8be7be193bd7/artifacts/fc7lo8g2_Hawiian-Collection.jpg',
      link: '/shop?category=hawaiian-prints',
      badge: 'Summer',
      imagePosition: 'top'
    },
  ];

  // Special occasions
  const specialOccasions = [
    { icon: Gift, name: 'Birthday', link: '/special/birthday', color: 'bg-pink-500' },
    { icon: Heart, name: 'Love', link: '/special/love', color: 'bg-red-500' },
    { icon: Sun, name: 'Thank You', link: '/special/thank-you', color: 'bg-yellow-500' },
    { icon: Star, name: 'Moms', link: '/special/moms', color: 'bg-purple-500' },
  ];

  return (
    <div className="min-h-screen bg-[#faf5f0]" data-testid="home-page">
      <HeroSection />

      {/* Stats Strip */}
      <section className="relative bg-gradient-to-r from-[#2c1810] via-[#4a2c1a] to-[#2c1810] py-8" data-testid="stats-strip">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { value: '1000+', label: 'Custom Designs Created' },
            { value: '50+', label: 'Product Categories' },
            { value: '100%', label: 'Satisfaction Guaranteed' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              className="rounded-2xl border border-[#ff8c42]/25 bg-white/10 px-5 py-4 text-center"
              data-testid={`stat-item-${index}`}
            >
              <p className="font-heading text-3xl font-bold text-[#ff8c42]">{item.value}</p>
              <p className="text-sm text-[#ffd4b8]">{item.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Printable Categories */}
      <section className="relative py-24 bg-gradient-to-b from-[#faf5f0] via-white to-[#fff8f0]" data-testid="categories-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff8c42]/15 border border-[#ff8c42] text-[#a55a2a] text-sm font-semibold tracking-wider mb-4">
              <Sparkles className="w-4 h-4" />
              SHOP BY CATEGORY
            </span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-[#2c1810] mb-4" data-testid="categories-heading">
              Our Printable Collections
            </h2>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Everything on our site can be customized to your needs. Your name, logo, or design - we make it happen!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {printableCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={category.link}
                  className="group block p-6 bg-white border border-[#ff8c42]/20 rounded-2xl hover:border-[#ff8c42] hover:shadow-xl hover:shadow-[#ff8c42]/20 transition-all duration-300"
                  data-testid={`category-${index}`}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center mb-5 group-hover:shadow-lg transition-all`}>
                    <category.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-heading font-semibold text-[#2c1810] text-lg mb-2">
                    {category.name}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {category.description}
                  </p>
                  <div className="mt-4 flex items-center text-[#ff8c42] font-medium text-sm group-hover:translate-x-1 transition-transform">
                    Shop Now <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections Grid */}
      <section className="relative py-24 overflow-hidden" data-testid="featured-collections">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://customer-assets.emergentagent.com/job_38142eca-d39f-438c-945a-8be7be193bd7/artifacts/l9vhcory_vision-of-the-seas-solarium-pool-deck.jpg')`,
          }}
        />
        {/* Cool teal/blue overlay with gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2a3a]/85 via-[#1a4a5a]/80 to-[#2c1810]/90" />
        {/* Decorative accent glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00bfff]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ff8c42]/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-[#00bfff]/20 border border-[#00bfff] text-[#00bfff] text-sm font-semibold tracking-wider mb-4">
              FEATURED
            </span>
            <h2 className="font-heading text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Things to Check Out!
            </h2>
            <p className="text-white/90 text-lg max-w-2xl mx-auto drop-shadow-md">
              Whatever your pleasure, here you'll find the perfect treasure!
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCollections.map((collection, index) => (
              <motion.div
                key={collection.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={index === 0 ? 'md:col-span-2 lg:col-span-1' : ''}
              >
                <Link
                  to={collection.link}
                  className="group block relative overflow-hidden rounded-2xl h-72 border border-white/10 backdrop-blur-sm"
                  data-testid={`collection-${index}`}
                >
                  <img
                    src={collection.image}
                    alt={collection.title}
                    className={`absolute inset-0 w-full h-full group-hover:scale-110 transition-transform duration-500 ${collection.imageStyle === 'contain' ? 'object-contain bg-gray-100' : 'object-cover'}`}
                    style={{ objectPosition: collection.imagePosition || 'center' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#ff8c42] text-white text-xs font-bold rounded-full">
                      {collection.badge}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="font-heading text-xl font-bold text-white mb-1 group-hover:text-[#ff8c42] transition-colors">
                      {collection.title}
                    </h3>
                    <p className="text-white/80 text-sm">{collection.description}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Special Occasions */}
      <section className="relative py-20 bg-gradient-to-b from-[#fff8f0] to-white" data-testid="special-occasions">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-[#2c1810] mb-4">
              Shop by Special Occasion
            </h2>
            <p className="text-slate-600">Find the perfect gift for every moment that matters</p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {specialOccasions.map((occasion, index) => (
              <motion.div
                key={occasion.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  to={occasion.link}
                  className="group flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-100 hover:border-[#ff8c42] hover:shadow-lg transition-all"
                >
                  <div className={`w-16 h-16 ${occasion.color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <occasion.icon className="w-8 h-8 text-white" />
                  </div>
                  <span className="font-semibold text-[#2c1810] group-hover:text-[#ff8c42] transition-colors">
                    {occasion.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="relative py-24 bg-gradient-to-b from-white to-[#faf5f0]" data-testid="products-section">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col md:flex-row md:items-end justify-between mb-12"
          >
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-[#ff8c42]/15 border border-[#ff8c42] text-[#a55a2a] text-sm font-semibold tracking-wider mb-4">
                FEATURED ITEMS
              </span>
              <h2 className="font-heading text-4xl md:text-5xl font-bold text-[#2c1810]">
                Some Featured Items
              </h2>
            </div>
            <Link
              to="/shop"
              data-testid="view-all-products"
              className="inline-flex items-center gap-2 text-[#ff8c42] hover:text-[#ff6b1a] font-semibold mt-4 md:mt-0 group"
            >
              View All Products
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-slate-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} cardContext="homepage" />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Custom Design CTA */}
      <section className="relative py-20 bg-gradient-to-r from-[#ff8c42] via-[#ff6b1a] to-[#ff8c42]" data-testid="custom-cta">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              Just About Everything Can Be Customized!
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              If you see a product you'd like with your name, logo, or design, reach out to us! Design charges may apply, and we'll do our very best to get your design on our awesome gear.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                data-testid="cta-contact-btn"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white text-[#ff6b1a] font-heading font-bold uppercase tracking-wider rounded-full hover:shadow-xl transition-all"
              >
                Request Custom Design
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="mailto:info@gingerkare.com"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 border-2 border-white text-white font-heading font-bold uppercase tracking-wider rounded-full hover:bg-white/10 transition-all"
              >
                Email Us
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <ReviewsSection />

      {/* Footer */}
      <footer className="bg-gradient-to-b from-[#2c1810] to-[#1a0f0a] text-white py-16 pb-24" data-testid="footer">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <img
                  src={siteSettings.logoUrl}
                  alt={siteSettings.siteName}
                  className="h-16 w-auto object-contain"
                  data-testid="footer-logo-image"
                />
              </div>
              <p className="text-[#ffd4b8] text-sm max-w-md mb-6">
                Your destination for custom printables, personalized gifts, and unique treasures. Whatever your pleasure, here you'll find the perfect treasure!
              </p>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/gingerkare.collectibles" target="_blank" rel="noopener noreferrer" className="text-[#ffd4b8] hover:text-[#00bfff] transition-colors" data-testid="footer-social-facebook">Facebook</a>
                <a href={`mailto:${siteSettings.supportEmail}`} className="text-[#ffd4b8] hover:text-[#ff8c42] transition-colors" data-testid="footer-social-email">Email</a>
              </div>
            </div>

            <div>
              <h4 className="font-heading font-semibold mb-4 text-[#ff8c42]">Shop</h4>
              <ul className="space-y-2">
                <li><Link to="/shop" className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors">All Products</Link></li>
                <li><Link to="/shop?category=coffee-mugs" className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors">Coffee Mugs</Link></li>
                <li><Link to="/shop?category=t-shirts" className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors">T-Shirts</Link></li>
                <li><Link to="/shop?category=tumblers" className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors">Tumblers</Link></li>
                <li><Link to="/shop" className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors">Collections</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold mb-4 text-[#ff8c42]">Support</h4>
              <ul className="space-y-2">
                <li><Link to="/contact" className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors">Contact Us</Link></li>
                <li><Link to="/faq" className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors">FAQs</Link></li>
                <li><Link to="/about" className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors">About Us</Link></li>
                <li><Link to="/shipping-returns" className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors">Shipping & Returns</Link></li>
                <li><Link to="/research" className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors">Research</Link></li>
                <li><a href={`mailto:${siteSettings.supportEmail}`} className="text-[#ffd4b8] hover:text-[#ff8c42] text-sm transition-colors" data-testid="footer-support-email-link">{siteSettings.supportEmail}</a></li>
              </ul>
            </div>
          </div>

          {/* Legal Links */}
          <div className="pt-6 mb-8 border-t border-[#ff8c42]/20">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <Link to="/privacy-policy" className="text-[#ffd4b8] hover:text-[#ff8c42] transition-colors">Privacy Policy</Link>
              <Link to="/terms-conditions" className="text-[#ffd4b8] hover:text-[#ff8c42] transition-colors">Terms & Conditions</Link>
              <Link to="/accessibility" className="text-[#ffd4b8] hover:text-[#ff8c42] transition-colors">Accessibility</Link>
              <Link to="/shipping-returns" className="text-[#ffd4b8] hover:text-[#ff8c42] transition-colors">Shipping & Returns</Link>
            </div>
          </div>

          <div className="pt-6 border-t border-[#ff8c42]/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#ffd4b8] text-sm" data-testid="footer-copyright">
              © 2026 {siteSettings.siteName}. All rights reserved.
            </p>
            <p className="text-[#ff8c42]/90 text-xs font-mono tracking-wider text-center">
              CUSTOM PRINTABLES • UNIQUE GIFTS • MADE WITH ❤️
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
