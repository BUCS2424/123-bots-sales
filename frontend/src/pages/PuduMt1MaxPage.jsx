import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduMt1MaxPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU MT1 MAX | 3D Perception Autonomous Sweeper | 123 Bots',
      description: 'Master large-scale cleaning with PUDU MT1 MAX. 3D LiDAR perception, 8-hour runtime, 2,200 m²/h coverage, 7,000 m²/h spot cleaning for parking garages and courtyards.',
      keywords: 'pudu mt1 max, 3d lidar sweeper, autonomous sweeper, parking garage cleaning',
    });
  }, []);

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      <section className="pt-32 pb-20 bg-gradient-to-b from-purple-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-semibold mb-6">3D Perception Sweeper</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">See More, <span className="text-purple-400">Clean Smarter</span></h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">Master large-scale cleaning with advanced 3D perception. MT1 MAX handles parking garages, courtyards, and high-ceiling spaces with 8-hour runtime and 7,000 m²/h spot cleaning capability.</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="/brochures/123-mt1-max-brochure.pdf" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Brochure</a>
                <Link to="/schedule-a-demo" className="px-8 py-4 bg-bots-surface border-2 border-purple-500 text-white font-bold rounded-full hover:bg-purple-500/20 transition-colors text-center">Book a Demo</Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-400" />3D LiDAR</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-400" />8hr Runtime</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-400" />2,200 m²/h</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl" />
              <img src="/images/bots/pudu-mt1-max.png" alt="PUDU MT1 MAX" className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">3D Vision for Complex Environments</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Advanced perception technology navigates challenging spaces</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">3D LiDAR Perception</h3>
              <p className="text-gray-400 mb-4">Navigate parking garages, high-ceiling warehouses, and open spaces with advanced 3D mapping. Handles complex environments where 2D systems fail.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">8-Hour Operation</h3>
              <p className="text-gray-400 mb-4">60 Ah battery delivers full-shift cleaning. Covers massive areas with 2,200 m²/h standard sweeping, 7,000 m²/h in spot cleaning mode.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">Smart Dust Control</h3>
              <p className="text-gray-400 mb-4">Advanced dust suppression system minimizes airborne particles. Perfect for enclosed parking garages and indoor spaces requiring clean air.</p>
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
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Coverage (Standard)</span><span className="text-white font-semibold">2,200 m²/h</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Coverage (Spot)</span><span className="text-white font-semibold">7,000 m²/h</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Runtime</span><span className="text-white font-semibold">8 hours</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Battery</span><span className="text-white font-semibold">60 Ah</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Technology</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Navigation</span><span className="text-white font-semibold">3D LiDAR perception</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Dust Control</span><span className="text-white font-semibold">Advanced suppression</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Ideal For</span><span className="text-white font-semibold">Parking, courtyards, warehouses</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Charging Time</span><span className="text-white font-semibold">~5 hours</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready for Large-Scale Sweeping?</h2>
          <p className="text-xl text-white/90 mb-10">Join facilities worldwide using PUDU MT1 MAX for parking garages, courtyards, and complex environments.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-purple-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default PuduMt1MaxPage;