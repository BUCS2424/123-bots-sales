import React, { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Gift, Palette, CheckCircle } from 'lucide-react';
import axios from 'axios';

const BACKGROUND_IMAGE = 'https://customer-assets.emergentagent.com/job_cart-builder-21/artifacts/dk8ihy2p_gingerkare-emporuim-and-collectibles.png';
const HERO_VIDEO_DEFAULT = '/videos/butterfly_alpha.webm';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const getVideoMimeType = (videoUrl) => {
  const normalized = (videoUrl || '').toLowerCase();
  if (normalized.endsWith('.mp4') || normalized.includes('.mp4?')) return 'video/mp4';
  if (normalized.endsWith('.webm') || normalized.includes('.webm?')) return 'video/webm';
  if (normalized.endsWith('.mov') || normalized.includes('.mov?')) return 'video/quicktime';
  return 'video/webm';
};

const HeroSection = () => {
  const videoRef = useRef(null);
  const [heroSettings, setHeroSettings] = useState({
    hero_background_image_url: BACKGROUND_IMAGE,
    hero_video_url: HERO_VIDEO_DEFAULT,
    hero_card_image_url: 'https://images.unsplash.com/photo-1513519245088-0e12902e35ca?auto=format&fit=crop&w=1000&q=80',
    hero_card_title: 'CUSTOM EMPORIUM',
    hero_card_subtitle: 'Unique & Personalized',
    hero_card_description: 'Made with care, just for you'
  });

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
    
    // Fetch hero display settings
    const fetchHeroSettings = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/settings/hero-display`);
        if (response.data) {
          setHeroSettings(response.data);
        }
      } catch (error) {
        console.log('Using default hero settings');
      }
    };
    fetchHeroSettings();
  }, []);

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden pt-28" data-testid="hero-section">
      {/* Background Image - Watercolor Butterflies - ALWAYS VISIBLE */}
      <div 
        className="absolute inset-0 z-0"
        style={{ 
          backgroundImage: `url(${heroSettings.hero_background_image_url || BACKGROUND_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />
      
      {/* Video Overlay - Butterflies flying - with alpha transparency */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-[1] pointer-events-none"
        data-testid="hero-video-overlay"
      >
        <source src={heroSettings.hero_video_url || HERO_VIDEO_DEFAULT} type={getVideoMimeType(heroSettings.hero_video_url || HERO_VIDEO_DEFAULT)} />
        <source src="/butterfly-overlay.mp4" type="video/mp4" />
      </video>
      
      {/* Dark overlay for text readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#2c1810]/65 via-[#3a1f12]/55 to-[#1a0f0a]/65 pointer-events-none z-10"
      />
      
      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 z-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -48 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#ff8c42]/20 border border-[#ff8c42]/50 mb-8 backdrop-blur-sm"
              data-testid="hero-badge"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#ff8c42] animate-pulse" />
              <span className="text-[#ffd4b8] text-sm font-semibold tracking-wider">CUSTOM PRINTABLES & GIFTS</span>
            </motion.div>

            <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" data-testid="hero-heading">
              <span className="text-white drop-shadow-lg">Whatever Your</span>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ff8c42] via-[#ffb366] to-[#ffd4b8] drop-shadow-lg">
                Pleasure
              </span>
              <br />
              <span className="text-white drop-shadow-lg">Find Your Treasure!</span>
            </h1>

            <p className="text-[#ffd4b8]/90 text-lg leading-relaxed mb-10 max-w-xl drop-shadow-md" data-testid="hero-description">
              Custom printables, unique gifts, and personalized treasures. <span className="text-[#00bfff] font-semibold">Made just for you</span> - from mugs to t-shirts, tumblers to canvas art.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/shop"
                data-testid="hero-shop-btn"
                className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] text-white font-heading font-bold uppercase tracking-wider rounded-full hover:shadow-xl hover:shadow-[#ff8c42]/40 transition-all duration-300 hover:-translate-y-1"
              >
                Shop Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/contact"
                data-testid="hero-custom-btn"
                className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-sm border border-[#9370db]/50 text-white font-heading font-bold uppercase tracking-wider rounded-full hover:bg-white/20 hover:border-[#9370db] transition-all duration-300"
              >
                Request Custom Design
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-12 pt-10 border-t border-[#ff8c42]/30" data-testid="hero-trust-grid">
              <div className="flex items-center gap-3 px-1 py-1.5 min-h-[76px]">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 backdrop-blur-sm border border-[#ff8c42]/40 flex items-center justify-center">
                  <Palette className="w-7 h-7 text-[#ff8c42]" strokeWidth={2.1} />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-white font-semibold text-[17px] whitespace-nowrap drop-shadow-md">Custom Designs</p>
                  <p className="text-[#eadcbf] text-[13px] whitespace-nowrap">Your Vision, Our Creation</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-1 py-1.5 min-h-[76px]">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 backdrop-blur-sm border border-[#ff8c42]/40 flex items-center justify-center">
                  <Sparkles className="w-7 h-7 text-[#9370db]" strokeWidth={2.1} />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-white font-semibold text-[17px] whitespace-nowrap drop-shadow-md">Premium Quality</p>
                  <p className="text-[#eadcbf] text-[12px] whitespace-nowrap">Vibrant & Long-Lasting</p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-1 py-1.5 min-h-[76px]">
                <div className="w-12 h-12 shrink-0 rounded-xl bg-white/10 backdrop-blur-sm border border-[#ff8c42]/40 flex items-center justify-center">
                  <Gift className="w-7 h-7 text-[#00bfff]" strokeWidth={2.1} />
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-white font-semibold text-[17px] whitespace-nowrap drop-shadow-md">Perfect Gifts</p>
                  <p className="text-[#eadcbf] text-[12px] whitespace-nowrap">For Every Occasion</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex items-center justify-center"
          >
            <div className="relative">
              <div className="relative w-80 h-80">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#ff8c42]/30 to-[#9370db]/30 blur-2xl" />
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl">
                  <img
                    src={heroSettings.hero_card_image_url}
                    alt="Custom printed products"
                    className="w-full h-full object-cover"
                    data-testid="hero-card-image"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2c1810]/90 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="font-mono text-xs text-[#ff8c42] mb-1">{heroSettings.hero_card_title}</p>
                    <p className="font-heading text-white font-bold text-lg drop-shadow-md">{heroSettings.hero_card_subtitle}</p>
                    <p className="text-[#eadcbf] text-sm">{heroSettings.hero_card_description}</p>
                  </div>
                </div>
              </div>

              <motion.div
                animate={{ y: [0, -9, 0] }}
                transition={{ duration: 3.3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 px-4 py-2 bg-white/95 backdrop-blur rounded-xl shadow-lg"
              >
                <p className="font-mono text-[#ff6b1a] text-sm font-semibold">100% CUSTOMIZABLE</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 -left-4 px-4 py-2 bg-white/95 backdrop-blur rounded-xl shadow-lg flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="font-mono text-[#ff6b1a] text-sm font-semibold">PREMIUM QUALITY</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
