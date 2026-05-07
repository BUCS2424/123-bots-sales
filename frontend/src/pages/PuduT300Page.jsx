import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduT300Page = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU T300 | 300kg Industrial Delivery AGV | 123 Bots',
      description: 'Heavy-duty autonomous delivery for factories and warehouses. PUDU T300: 300kg payload, 12-hour runtime, VDA5050 compatible, ISO 3691-4 certified.',
      keywords: 'pudu t300, 300kg agv, industrial delivery robot, warehouse automation',
    });
  }, []);

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      <section className="pt-32 pb-20 bg-gradient-to-b from-cyan-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-semibold mb-6">300kg Industrial AGV</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Move More, <span className="text-cyan-400">Work Smarter</span></h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">Heavy-duty autonomous delivery for factories and warehouses. VDA5050 compatible, ISO 3691-4 certified, with VSLAM+ navigation for 24/7 material transport.</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="#download" className="px-8 py-4 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Brochure</a>
                <Link to="/schedule-a-demo" className="px-8 py-4 bg-bots-surface border-2 border-cyan-500 text-white font-bold rounded-full hover:bg-cyan-500/20 transition-colors text-center">Book a Demo</Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" />300kg Payload</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" />12hr Runtime</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" />VDA5050</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl" />
              <img src="/images/bots/pudu-t300.png" alt="PUDU T300" className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Industrial-Grade Material Transport</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Built for demanding factory and warehouse environments</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-cyan-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">300kg Payload</h3>
              <p className="text-gray-400 mb-4">Heavy-duty transport for manufacturing materials, components, and finished goods. Reduces manual material handling by 80%.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">12-Hour Operation</h3>
              <p className="text-gray-400 mb-4">Full-shift autonomous delivery with VSLAM+ navigation. Handles complex warehouse layouts and dynamic obstacles in real-time.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">VDA5050 Compatible</h3>
              <p className="text-gray-400 mb-4">Standardized fleet management integration. ISO 3691-4 certified for safe operation in industrial environments.</p>
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
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Payload</span><span className="text-white font-semibold">300 kg</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Runtime</span><span className="text-white font-semibold">12 hours</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Speed</span><span className="text-white font-semibold">1.5 m/s</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Charging Time</span><span className="text-white font-semibold">~4-5 hours</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Features</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Navigation</span><span className="text-white font-semibold">VSLAM+</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Standards</span><span className="text-white font-semibold">VDA5050, ISO 3691-4</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Ideal For</span><span className="text-white font-semibold">Factories, warehouses</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Safety</span><span className="text-white font-semibold">360° sensors</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-cyan-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready for Industrial Automation?</h2>
          <p className="text-xl text-white/90 mb-10">Join factories and warehouses worldwide using PUDU T300 for efficient material transport.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-cyan-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default PuduT300Page;