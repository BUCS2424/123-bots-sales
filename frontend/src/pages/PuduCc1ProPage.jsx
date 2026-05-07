import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Play, Phone, Mail, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduCc1ProPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU CC1 PRO | 4-in-1 AI Commercial Cleaning Robot | 123 Bots',
      description: 'Transform cleaning with PUDU CC1 PRO. 4-in-1 versatile cleaning (sweep, vacuum, mop, scrub), AI spot scrubbing, world\'s first rear camera cleaning verification. 17,000 Pa suction, 5hr runtime.',
      keywords: 'pudu cc1 pro, 4-in-1 cleaning robot, AI spot scrubbing, commercial cleaning, autonomous floor cleaner',
    });
  }, []);

  const faqs = [
    {
      question: 'What makes the 4-in-1 cleaning system unique?',
      answer: 'CC1 PRO combines four cleaning methods in one machine: sweeping for debris, vacuuming (including carpets with 17,000 Pa suction), dust mopping for daily maintenance, and scrubbing for deep cleaning. Switch between modes instantly based on your needs—no need for multiple machines or manual intervention.',
    },
    {
      question: 'How does AI Spot Scrubbing work?',
      answer: 'CC1 PRO uses AI vision to detect stubborn stains and automatically boosts cleaning power and intensity for targeted deep cleaning. In spot cleaning mode, it achieves 1,500-3,000 m²/h efficiency, focusing on high-traffic areas and problem spots without wasting time on already-clean surfaces.',
    },
    {
      question: 'What is the rear AI camera cleaning verification?',
      answer: 'World\'s first! A rear-facing AI camera monitors floor cleanliness after CC1 PRO passes. If it detects leftover stains or missed spots, it automatically triggers re-cleaning and generates heatmaps showing cleaning quality. This ensures consistently spotless results without manual inspection.',
    },
    {
      question: 'Can it handle both hard floors and carpets?',
      answer: 'Yes! CC1 PRO automatically detects floor types. On hard floors, it uses sweep+vacuum+scrub modes. On carpets, it switches to vacuum-only mode (avoiding brush tangling) with powerful 17,000 Pa suction. The AI Cleaning Intensity Control adapts power based on dirt levels for optimal results on any surface.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-indigo-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.3),transparent_50%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-400 text-sm font-semibold mb-6">
                4-in-1 AI-Powered Cleaning System
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                One Robot, <span className="text-indigo-400">Four Cleaning Modes</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Meet CC1 PRO—the world's most versatile commercial cleaning robot. Sweep, vacuum, mop, and scrub with a single machine. AI spot scrubbing targets stubborn stains, while the world's first rear camera verification ensures nothing is missed. Perfect for airports, hospitals, schools, and large commercial spaces.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="#download-brochure" className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-500 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" />
                  Download Brochure
                </a>
                <Link to="/schedule-a-demo" className="px-8 py-4 bg-bots-surface border-2 border-indigo-500 text-white font-bold rounded-full hover:bg-indigo-500/20 transition-colors text-center">
                  Book a Demo
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                  4-in-1 Cleaning
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                  17,000 Pa Suction
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-indigo-400" />
                  AI Spot Scrubbing
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl" />
              <img src="/images/bots/pudu-cc1-pro.png" alt="PUDU CC1 PRO" className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Revolutionary AI-Powered Cleaning</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Intelligent features that adapt to your environment and ensure spotless results</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-indigo-500/50 transition-colors">
              <div className="w-16 h-16 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Rear Camera Verification</h3>
              <p className="text-gray-400 mb-4">World's first rear AI camera monitors cleanliness post-cleaning. Detects leftover stains, triggers auto re-cleaning, and generates quality heatmaps—ensuring nothing is missed.</p>
              <a href="#capabilities" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2">Learn More <ChevronRight className="w-4 h-4" /></a>
            </div>

            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Spot Scrubbing</h3>
              <p className="text-gray-400 mb-4">Detects stubborn stains via AI and automatically boosts cleaning power. Achieves 1,500-3,000 m²/h in spot mode, targeting high-traffic zones without wasting time on clean areas.</p>
              <a href="#capabilities" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2">See Demo <ChevronRight className="w-4 h-4" /></a>
            </div>

            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Adaptive Intensity Control</h3>
              <p className="text-gray-400 mb-4">Automatically detects floor type and dirt level. Eco mode for clean areas, deep cleaning for dirty spots. Detects carpets and switches to vacuum-only to prevent tangling.</p>
              <a href="#specs" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2">View Specs <ChevronRight className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section id="capabilities" className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">4-in-1 Versatile Cleaning</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">One machine, four modes—ultimate flexibility for any cleaning challenge</p>
          </div>

          {/* Capability 1 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-indigo-600/20 rounded-full text-indigo-400 text-sm font-semibold mb-4">MODE 1: SWEEPING</span>
              <h3 className="text-3xl font-bold text-white mb-6">High-Efficiency Debris Collection</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">Standard sweeping mode captures dust, dirt, and large debris across hard floors. Perfect for lobbies, hallways, and high-traffic areas. Covers up to 700-1,000 m²/h with 500mm cleaning width.</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" /><span className="text-gray-300">Captures fine dust and large debris simultaneously</span></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" /><span className="text-gray-300">2.5L standard dustbin, 6L with dust bag</span></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" /><span className="text-gray-300">Up to 5 hours runtime in sweep mode</span></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <Play className="w-16 h-16 text-indigo-400" />
                  <span className="ml-4 text-gray-400">[Video: Sweeping Demo]</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <img src="https://images.unsplash.com/photo-1622118416167-f4c3d46eda67?w=800" alt="Carpet vacuuming" className="w-full h-full object-cover rounded-xl opacity-70" />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">MODE 2 & 3: VACUUMING & MOPPING</span>
              <h3 className="text-3xl font-bold text-white mb-6">Powerful Suction + Silent Mopping</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">Vacuum mode delivers 17,000 Pa suction for carpets and hard floors—handling embedded dirt with ease. Silent dust mopping mode provides 9 hours of quiet, eco-friendly maintenance perfect for occupied spaces like offices and schools.</p>
              <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-xl p-6">
                <p className="text-indigo-300 italic mb-2">"CC1 PRO replaced three separate machines in our hospital. The carpet vacuuming is exceptionally powerful, and silent mopping mode lets us clean during business hours without disturbing patients."</p>
                <p className="text-gray-400 text-sm">— Facilities Director, Regional Hospital</p>
              </div>
            </div>
          </div>

          {/* Capability 3 */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">MODE 4: SCRUBBING</span>
              <h3 className="text-3xl font-bold text-white mb-6">Deep Cleaning with AI Spot Detection</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">Scrubbing mode combines water and cleaning solution for deep floor cleaning. AI Spot Scrubbing detects stubborn stains and automatically increases power for targeted removal. Covers 700-1,000 m²/h standard, 1,500-3,000 m²/h in high-efficiency spot mode.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-indigo-400 mb-2">15L</div>
                  <div className="text-gray-400 text-sm">Clean + Waste tanks</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-green-400 mb-2">5hr</div>
                  <div className="text-gray-400 text-sm">Scrubbing runtime</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <Play className="w-16 h-16 text-purple-400" />
                  <span className="ml-4 text-gray-400">[Video: AI Scrubbing]</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 4 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <span className="text-gray-400 text-center px-4">[Image: Self-Monitoring Dashboard]</span>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-orange-600/20 rounded-full text-orange-400 text-sm font-semibold mb-4">SMART MAINTENANCE</span>
              <h3 className="text-3xl font-bold text-white mb-6">AI Component Self-Monitoring</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">CC1 PRO continuously monitors brushes, rollers, and squeegees in real-time. Automatically triggers maintenance alerts, touch-up cleaning, or self-cleaning cycles to prevent secondary contamination and maintain peak performance.</p>
              <div className="space-y-4">
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Auto Self-Cleaning</div>
                  <div className="text-gray-400 text-sm">Roller brush and squeegee self-clean to prevent buildup</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Predictive Maintenance</div>
                  <div className="text-gray-400 text-sm">Alerts before components need replacement</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Integration */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Complete PUDU Ecosystem</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Seamless integration with PUDU's intelligent cleaning platform</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 flex items-center justify-center">
                <span className="text-gray-400">[Image: Fleet Dashboard]</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">VSLAM+ Navigation</h3>
                <p className="text-gray-400 mb-6">LiDAR + Visual Fusion Positioning. No QR codes needed. Handles complex environments with Omni-Sense Safety for static and moving obstacles.</p>
                <a href="#" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2">Learn More <ChevronRight className="w-4 h-4" /></a>
              </div>
            </div>

            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-green-600/20 to-green-800/20 flex items-center justify-center">
                <span className="text-gray-400">[Image: Auto Charging]</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">24/7 Autonomous Operation</h3>
                <p className="text-gray-400 mb-6">Auto-charging, water refill/drain (optional docking station), breakpoint resume, and multi-floor mapping for continuous cleaning.</p>
                <a href="#" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2">Explore <ChevronRight className="w-4 h-4" /></a>
              </div>
            </div>

            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-indigo-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-purple-800/20 flex items-center justify-center">
                <span className="text-gray-400">[Image: IoT Integration]</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">IoT & Smart Features</h3>
                <p className="text-gray-400 mb-6">10.1-inch LCD display, remote monitoring, cleaning heatmaps, and floor cleanliness tracking to optimize energy and water usage.</p>
                <a href="#" className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-2">Get Support <ChevronRight className="w-4 h-4" /></a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section id="specs" className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Technical Specifications</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Dimensions & Weight</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Dimensions (L×W×H)</span><span className="text-white font-semibold">629 × 552 × 695 mm</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Weight</span><span className="text-white font-semibold">~60-75 kg</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Cleaning Width</span><span className="text-white font-semibold">500 mm (19.69 in)</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Min Path Clearance</span><span className="text-white font-semibold">70 cm</span></div>
              </div>
            </div>

            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Coverage (Standard)</span><span className="text-white font-semibold">700-1,000 m²/h</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Coverage (Spot)</span><span className="text-white font-semibold">1,500-3,000 m²/h</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Speed</span><span className="text-white font-semibold">0.2-1.2 m/s</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Runtime</span><span className="text-white font-semibold">4-9 hours (mode dependent)</span></div>
              </div>
            </div>

            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Tanks & Capacity</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Clean Water Tank</span><span className="text-white font-semibold">15 L</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Waste Water Tank</span><span className="text-white font-semibold">15 L</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Dustbin</span><span className="text-white font-semibold">2.5L (6L with bag)</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Battery / Charging</span><span className="text-white font-semibold">50 Ah / ~3 hours</span></div>
              </div>
            </div>

            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Technology</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Suction Power</span><span className="text-white font-semibold">Max 17,000 Pa</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Navigation</span><span className="text-white font-semibold">VSLAM+ (LiDAR + Visual)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">AI Features</span><span className="text-white font-semibold">Spot scrubbing, rear camera verify</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Display</span><span className="text-white font-semibold">10.1-inch LCD touchscreen</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-300">Get answers about PUDU CC1 PRO</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-bots-dark rounded-xl border border-gray-800 overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === index ? null : index)} className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-800/50 transition-colors">
                  <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                  {activeFaq === index ? <ChevronUp className="w-6 h-6 text-indigo-400 flex-shrink-0" /> : <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />}
                </button>
                {activeFaq === index && <div className="px-6 pb-6"><p className="text-gray-300 leading-relaxed">{faq.answer}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Transform Your Cleaning Operations</h2>
          <p className="text-xl text-white/90 mb-10">Join facilities worldwide that have revolutionized cleaning with PUDU CC1 PRO's 4-in-1 versatility and AI-powered precision.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-indigo-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PuduCc1ProPage;