import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduT600Page = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU T600 | 600kg Heavy Payload Industrial Robot | 123 Bots',
      description: 'Reduce delivery trips by 50% with PUDU T600. 600kg capacity, fleet coordination, rack recognition, 12-hour runtime for warehouse automation.',
      keywords: 'pudu t600, 600kg agv, heavy payload robot, warehouse automation',
    });
  }, []);

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      <section className="pt-32 pb-20 bg-gradient-to-b from-red-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-full text-red-400 text-sm font-semibold mb-6">600kg Heavy Payload</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Maximum Payload, <span className="text-red-400">Minimum Trips</span></h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">Reduce delivery trips by 50% with 600kg payload capacity. Fleet coordination, rack recognition, and underride variant for seamless warehouse automation.</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="#download" className="px-8 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-500 transition-colors flex items-center justify-center gap-2"><Download className="w-5 h-5" />Download Brochure</a>
                <Link to="/schedule-a-demo" className="px-8 py-4 bg-bots-surface border-2 border-red-500 text-white font-bold rounded-full hover:bg-red-500/20 transition-colors text-center">Book a Demo</Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-400" />600kg Payload</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-400" />Fleet Coordination</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-400" />12hr Runtime</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl" />
              <img src="/images/bots/pudu-t600.png" alt="PUDU T600" className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Heavy-Duty Warehouse Automation</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Maximum capacity for high-volume distribution centers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-red-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">600kg Capacity</h3>
              <p className="text-gray-400 mb-4">Handle twice the payload of standard AGVs. Move pallets, heavy materials, and bulk goods in fewer trips—cutting operational costs by 50%.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">Fleet Coordination</h3>
              <p className="text-gray-400 mb-4">Coordinate multiple T600 units for maximum efficiency. Smart task allocation and collision avoidance ensure smooth operations across your facility.</p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <h3 className="text-2xl font-bold text-white mb-4">Rack Recognition</h3>
              <p className="text-gray-400 mb-4">Automated loading and unloading with intelligent rack detection. Underride variant available for seamless integration with existing warehouse systems.</p>
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
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Payload</span><span className="text-white font-semibold">600 kg</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Runtime</span><span className="text-white font-semibold">12 hours</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Speed</span><span className="text-white font-semibold">1.5 m/s</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Charging Time</span><span className="text-white font-semibold">~4-5 hours</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Features</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Fleet Management</span><span className="text-white font-semibold">Multi-unit coordination</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Rack Detection</span><span className="text-white font-semibold">Automated loading</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Variants</span><span className="text-white font-semibold">Standard + Underride</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Ideal For</span><span className="text-white font-semibold">High-volume warehouses</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-red-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready for Heavy-Duty Automation?</h2>
          <p className="text-xl text-white/90 mb-10">Join distribution centers worldwide using PUDU T600 for maximum payload capacity and efficiency.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-red-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default PuduT600Page;