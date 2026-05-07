import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduSh1Page = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU SH1 | Smart Manual Scrubber with 27kg Downforce | 123 Bots',
      description: 'Professional cleaning made simple. PUDU SH1 features 27kg downforce, 350 RPM brush speed, 1,600 m²/h productivity—70% faster than traditional mops.',
      keywords: 'pudu sh1, manual scrubber, smart scrubber, 27kg downforce, professional cleaning',
    });
  }, []);

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      <section className="pt-32 pb-20 bg-gradient-to-b from-orange-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-orange-600/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-semibold mb-6">Smart Manual Scrubber</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Professional Cleaning <span className="text-orange-400">Made Simple</span></h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">Combine mop-like ease with professional scrubbing power. SH1 features 27kg downforce, 350 RPM brush speed, and 7 cleaning modes—delivering 70% faster cleaning than traditional mops with spotless results.</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="#download" className="px-8 py-4 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-500 transition-colors flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Brochure</a>
                <Link to="/schedule-a-demo" className="px-8 py-4 bg-bots-surface border-2 border-orange-500 text-white font-bold rounded-full hover:bg-orange-500/20 transition-colors text-center">Book a Demo</Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-400" />27kg Downforce</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-400" />350 RPM</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-400" />1,600 m²/h</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-3xl" />
              <img src="/images/bots/robot-pudush.png" alt="PUDU SH1" className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Professional Power, Simple Operation</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Combines commercial scrubbing capability with user-friendly controls</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-orange-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">27kg Downforce</h3>
              <p className="text-gray-400 mb-4">Powerful cleaning pressure removes stubborn dirt and stains. Professional results with minimal effort—70% faster than traditional mopping.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">7 Cleaning Modes</h3>
              <p className="text-gray-400 mb-4">Adapt to any floor type and soil level. From light maintenance to deep cleaning, select the perfect mode via intuitive 4.2-inch touchscreen.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">20kPa Suction</h3>
              <p className="text-gray-400 mb-4">Strong vacuuming power leaves floors dry immediately after cleaning. Safe for high-traffic areas with no slip hazards.</p>
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
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Cleaning Pressure</span><span className="text-white font-semibold">27 kg downforce</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Brush Speed</span><span className="text-white font-semibold">350 RPM</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Productivity</span><span className="text-white font-semibold">1,600 m²/h</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Suction Power</span><span className="text-white font-semibold">20 kPa</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Features</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Cleaning Modes</span><span className="text-white font-semibold">7 modes</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Display</span><span className="text-white font-semibold">4.2" touchscreen</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Operation</span><span className="text-white font-semibold">Walk-behind manual</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Ideal For</span><span className="text-white font-semibold">All hard floors</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Upgrade Your Cleaning</h2>
          <p className="text-xl text-white/90 mb-10">Experience professional scrubbing power with mop-like simplicity. See why facilities love PUDU SH1.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-orange-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default PuduSh1Page;