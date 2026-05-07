import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AvidbotKasPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'AVIDBOT KAS | Compact 22" Autonomous Floor Scrubber | 123 Bots',
      description: 'Navigate narrow aisles with AVIDBOT KAS. Compact 22-inch scrubber, 45L/46L tanks, 500-1,000 m²/hr coverage, perfect for retail, healthcare, education.',
      keywords: 'avidbot kas, compact scrubber, 22 inch scrubber, retail cleaning robot',
    });
  }, []);

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-6">Compact Autonomous Scrubber</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Small Spaces, <span className="text-blue-400">Big Performance</span></h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">Navigate narrow aisles with confidence. AVIDBOT KAS delivers commercial-grade cleaning in a compact 22-inch design, perfect for retail stores, healthcare facilities, and educational institutions where space is at a premium.</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="#download" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Brochure</a>
                <Link to="/schedule-a-demo" className="px-8 py-4 bg-bots-surface border-2 border-blue-500 text-white font-bold rounded-full hover:bg-blue-500/20 transition-colors text-center">Book a Demo</Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-400" />22" Width</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-400" />45L/46L Tanks</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-400" />4hr Runtime</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl" />
              <img src="/images/bots/avidbot-kas.png" alt="AVIDBOT KAS" className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Compact Design, Commercial Power</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Engineered for tight spaces without compromising performance</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">22-Inch Cleaning Path</h3>
              <p className="text-gray-400 mb-4">Navigate retail aisles, healthcare corridors, and tight spaces with ease. Perfect for areas where larger machines can't fit.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">500-1,000 m²/hr Coverage</h3>
              <p className="text-gray-400 mb-4">Clean efficiently with 45L solution tank and 46L recovery tank. 3-4 hour runtime handles medium-sized facilities in one session.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">Avidbots Autonomy</h3>
              <p className="text-gray-400 mb-4">Powered by industry-leading software for reliable navigation, obstacle avoidance, and consistent cleaning performance.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Technical Specifications</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Dimensions & Capacity</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Cleaning Width</span><span className="text-white font-semibold">22 inches (56 cm)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Solution Tank</span><span className="text-white font-semibold">45 L</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Recovery Tank</span><span className="text-white font-semibold">46 L</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Runtime</span><span className="text-white font-semibold">3-4 hours</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Coverage Rate</span><span className="text-white font-semibold">500-1,000 m²/hr</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Navigation</span><span className="text-white font-semibold">Avidbots Autonomy</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Ideal For</span><span className="text-white font-semibold">Retail, Healthcare, Education</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Charging Time</span><span className="text-white font-semibold">~4 hours</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready for Compact Cleaning Power?</h2>
          <p className="text-xl text-white/90 mb-10">Join retail, healthcare, and education facilities that have transformed tight spaces with AVIDBOT KAS.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default AvidbotKasPage;