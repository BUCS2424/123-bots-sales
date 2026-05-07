import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduMt1VacPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU MT1 VAC | Triple-Mode Sweeper-Vacuum Robot | 123 Bots',
      description: 'Sweep, vacuum, mop all in one. PUDU MT1 VAC features H11 HEPA filtration, 14L dust capacity, dual-fan 200% suction boost for airports, malls, office buildings.',
      keywords: 'pudu mt1 vac, triple mode vacuum, hepa filter robot, commercial vacuum robot',
    });
  }, []);

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      <section className="pt-32 pb-20 bg-gradient-to-b from-green-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold mb-6">Triple-Mode Cleaner</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Sweep, Vacuum, Mop— <span className="text-green-400">All in One</span></h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">Triple-mode cleaning for mixed-surface facilities. 14L dust capacity, dual-fan deep vacuuming (200% boost), and H11 HEPA filtration for airports, shopping malls, and office buildings.</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="#download" className="px-8 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-500 transition-colors flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Brochure</a>
                <Link to="/schedule-a-demo" className="px-8 py-4 bg-bots-surface border-2 border-green-500 text-white font-bold rounded-full hover:bg-green-500/20 transition-colors text-center">Book a Demo</Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />H11 HEPA</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />14L Capacity</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />200% Boost</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl" />
              <img src="/images/bots/pudu-mt1-vac.png" alt="PUDU MT1 VAC" className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Three Cleaning Modes, One Machine</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Versatility to handle any floor type and debris</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">Sweeping Mode</h3>
              <p className="text-gray-400 mb-4">Side brushes collect dust and debris into 14L dust bag. Perfect for daily maintenance and large debris collection across hard floors.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">Vacuum Mode</h3>
              <p className="text-gray-400 mb-4">Dual-fan deep vacuuming with 200% suction boost. H11 HEPA filter captures 99.9% of particles for cleaner air—ideal for high-traffic public spaces.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">Mopping Mode</h3>
              <p className="text-gray-400 mb-4">Dust mopping for light maintenance and polishing. Keeps floors looking fresh between deep cleaning sessions.</p>
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
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Coverage Rate</span><span className="text-white font-semibold">1,400 m²/h</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Dust Capacity</span><span className="text-white font-semibold">14 L dust bag</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Suction Boost</span><span className="text-white font-semibold">200% (dual-fan)</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Filtration</span><span className="text-white font-semibold">H11 HEPA</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Features</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Cleaning Modes</span><span className="text-white font-semibold">Sweep, Vacuum, Mop</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Navigation</span><span className="text-white font-semibold">SLAM + sensors</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Ideal For</span><span className="text-white font-semibold">Airports, malls, offices</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Air Quality</span><span className="text-white font-semibold">99.9% particle capture</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-green-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready for Triple-Mode Cleaning?</h2>
          <p className="text-xl text-white/90 mb-10">Join airports, malls, and office buildings using PUDU MT1 VAC for cleaner floors and healthier air.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-green-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default PuduMt1VacPage;