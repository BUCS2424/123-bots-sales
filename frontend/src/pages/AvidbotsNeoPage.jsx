import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Play, Phone, Mail, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AvidbotsNeoPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'AVIDBOTS NEO | World-Leading Autonomous Floor Scrubbing Robot | 123 Bots',
      description: 'Experience the future of commercial cleaning with AVIDBOTS NEO. Fully autonomous floor scrubbing robot with AI-powered navigation, 42,000 ft²/hr coverage, and 24/7 operation capability.',
      keywords: 'avidbots neo, autonomous floor scrubber, commercial cleaning robot, AI cleaning, floor care automation',
    });
  }, []);

  const faqs = [
    {
      question: 'What makes AVIDBOTS NEO different from traditional floor scrubbers?',
      answer: 'NEO is purpose-built from the ground up as an autonomous robot—no steering wheel, seat, or manual controls needed. Powered by advanced AI, it delivers fully autonomous cleaning while adapting to environmental changes in real-time. Unlike converted manual machines, NEO maximizes productivity and minimizes human intervention with 360° awareness and intelligent path planning.',
    },
    {
      question: 'How long does NEO operate on a single charge?',
      answer: 'NEO provides 4-6 hours of continuous cleaning per charge. With fast-swappable battery packs, you can extend operation indefinitely, enabling true 24/7/365 cleaning schedules without downtime.',
    },
    {
      question: 'What floor types can NEO clean?',
      answer: 'NEO handles virtually all commercial hard floor surfaces including tile, concrete, epoxy, granite, marble, terrazzo, vinyl, linoleum, and more. Choose between disc or cylindrical cleaning heads optimized for your specific flooring needs.',
    },
    {
      question: 'How do I monitor and manage NEO?',
      answer: 'The Avidbots Command Center web platform provides 24/7 remote monitoring, detailed performance reports, visual cleaning maps, and fleet management capabilities. Access real-time status, productivity metrics, and comprehensive analytics from any device, anywhere.',
    },
    {
      question: 'Is NEO safe to operate around people?',
      answer: 'Absolutely. NEO features advanced safety systems including real-time obstacle detection, 360° sensor coverage, emergency stop buttons, safety bumpers, LED status indicators, and audible alerts. The AI continuously monitors the environment and automatically pauses when detecting potential risks.',
    },
    {
      question: 'What kind of support does Avidbots provide?',
      answer: 'Avidbots Customer Success delivers white-glove service from day one—including deployment assistance, custom cleaning plan creation, comprehensive training, and ongoing 24/7/365 technical support. Factory-trained technicians ensure your NEO always performs at peak efficiency.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.3),transparent_50%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-6">
                World-Leading Autonomous Technology
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Transform Floor Cleaning with <span className="text-blue-400">AVIDBOTS NEO</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                The need for consistent, measurable cleaning has never been higher. NEO changes everything—delivering autonomous, efficient, and data-driven floor care that frees your team to focus on what matters most. Built from scratch by robotics experts, NEO delivers a flawless clean every single time.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="#download-brochure"
                  className="px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Brochure
                </a>
                <Link
                  to="/schedule-a-demo"
                  className="px-8 py-4 bg-bots-surface border-2 border-blue-500 text-white font-bold rounded-full hover:bg-blue-500/20 transition-colors text-center"
                >
                  Book a Demo
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  42,000 ft²/hr Coverage
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  6 Hour Runtime
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  24/7 Operation Ready
                </span>
              </div>
            </div>

            {/* Right: Product Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl" />
              <img
                src="/images/bots/avidbots-neo.png"
                alt="AVIDBOTS NEO Autonomous Floor Scrubber"
                className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Not Just a Pretty Face - Features Overview */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              More Than Meets the Eye
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Explore the advanced features that make NEO the world's most intelligent autonomous floor cleaning solution
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: AI Autonomy */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Avidbots Autonomy AI</h3>
              <p className="text-gray-400 mb-4">
                Proprietary artificial intelligence powers fully autonomous operation. NEO maps your facility, analyzes the environment in real-time, and determines optimal cleaning routes—adapting to changes instantly while maximizing productivity.
              </p>
              <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                Learn More <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 2: Build Quality */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Industrial-Grade Construction</h3>
              <p className="text-gray-400 mb-4">
                Engineered to the highest quality and reliability standards. Heavy-duty plastic tanks, interchangeable industrial batteries, and rugged components ensure NEO withstands the demands of continuous commercial operation.
              </p>
              <a href="#specs" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                View Specifications <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 3: Real-Time Intelligence */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Command Center Analytics</h3>
              <p className="text-gray-400 mb-4">
                Monitor every square foot cleaned with detailed reports, visual coverage maps, and productivity metrics. The web-based Command Center provides 24/7 access to performance data from anywhere in the world.
              </p>
              <a href="#platform" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                Explore Platform <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Redefining Floor Care - Key Capabilities */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Redefining Floor Care at Your Facility
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              NEO delivers game-changing capabilities that transform cleaning operations
            </p>
          </div>

          {/* Capability 1: Active Cleaning Control */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 rounded-full text-blue-400 text-sm font-semibold mb-4">
                INTELLIGENT PRESSURE ADJUSTMENT
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Active Cleaning Control System
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Protect your floor investment with auto-adjustable cleaning heads that intelligently detect pad wear and optimize pressure in real-time. This advanced system not only fine-tunes performance for your facility's unique needs—it also extends the life of consumables and prevents floor damage.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Automatically adjusts to floor surface changes</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Detects pad/brush wear and compensates pressure</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Extends consumable lifespan by up to 40%</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <video 
                    controls 
                    className="w-full h-full object-cover rounded-xl"
                    poster="/images/bots/avidbots-neo.png"
                  >
                    <source src="/videos/neo-disinfecting.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: Around the Clock */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <img src="/images/placeholders/neo-battery-swap.png" alt="Battery Swap" className="w-full h-full object-cover rounded-xl opacity-50" />
                  <span className="absolute text-gray-400">[Image: Fast Battery Swapping]</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">
                NON-STOP OPERATION
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                24/7/365 Continuous Cleaning
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Whether your facility operates around the clock or requires multiple daily cleaning runs, NEO delivers up to 6 hours of runtime per charge. Fast-swappable battery packs extend operation indefinitely—enabling true 24/7/365 autonomous cleaning that elevates cleanliness across your entire facility.
              </p>
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                <p className="text-blue-300 italic mb-2">
                  "We schedule NEO for three cleaning cycles per day without increasing labor costs. The swappable batteries mean zero downtime, and our facility has never looked better."
                </p>
                <p className="text-gray-400 text-sm">
                  — Facility Manager, Premium Retail Center
                </p>
              </div>
            </div>
          </div>

          {/* Capability 3: Unrivaled Performance */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">
                AUTONOMOUS EFFICIENCY
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Up to 42,000 ft²/hr Coverage
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                NEO cleans up to 42,000 square feet per hour—completely autonomously. Simply press a button and your team is free to focus on revenue-generating activities. Imagine the transformation when consistent, reliable floor care is available exactly when and where you need it.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-blue-400 mb-2">42K</div>
                  <div className="text-gray-400 text-sm">ft²/hr max coverage</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-green-400 mb-2">6h</div>
                  <div className="text-gray-400 text-sm">runtime per charge</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <Play className="w-16 h-16 text-purple-400" />
                  <span className="ml-4 text-gray-400">[Video: NEO in Action - Large Area]</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 4: Flexible Cleaning Heads */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-square bg-gray-800/50 rounded-xl flex items-center justify-center">
                    <span className="text-gray-400 text-sm text-center">[Image: Disc Head]</span>
                  </div>
                  <div className="aspect-square bg-gray-800/50 rounded-xl flex items-center justify-center">
                    <span className="text-gray-400 text-sm text-center">[Image: Cylindrical Head]</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-orange-600/20 rounded-full text-orange-400 text-sm font-semibold mb-4">
                OPTIMIZED FOR YOUR FLOORS
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Flexible Cleaning Head Options
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                The wrong cleaning head causes inefficiency and long-term floor damage. That's why NEO offers both disc and cylindrical configurations—ensuring optimal performance for your specific hard floor types. Whatever your surface, there's a perfect solution.
              </p>
              <div className="space-y-4">
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Disc Heads (26" & 32")</div>
                  <div className="text-gray-400 text-sm">Best for tile, terrazzo, and smooth concrete. Up to 87 kg applied pressure.</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Cylindrical Heads (24" & 32")</div>
                  <div className="text-gray-400 text-sm">Ideal for textured concrete and debris-prone areas. Sweeping + scrubbing action.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Ecosystem */}
      <section id="platform" className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              The Complete Avidbots Platform
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              NEO is powered by a comprehensive ecosystem designed for maximum operational efficiency
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Avidbots Autonomy */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-blue-800/20">
                <img src="/images/neo-360-sensor-view.png" alt="NEO 360° Sensor View" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Avidbots Autonomy</h3>
                <p className="text-gray-400 mb-6">
                  Advanced AI, computer vision, and deep learning power NEO's ability to understand its environment and make autonomous decisions. A market-leading sensor suite delivers real awareness and fully autonomous operation.
                </p>
                <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                  Learn More <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Command Center */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-green-600/20 to-green-800/20">
                <img src="/images/platform-avidbots-command-center.png" alt="Avidbots Command Center Dashboard" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Command Center</h3>
                <p className="text-gray-400 mb-6">
                  Web-based software makes managing, monitoring, and measuring your fleet incredibly easy from anywhere. Access detailed reports, productivity metrics, and sector-level coverage maps 24/7 from any device.
                </p>
                <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                  Explore Features <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Customer Success */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-purple-800/20">
                <img src="/images/neo-customer-success.png" alt="Avidbots Customer Success" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Customer Success</h3>
                <p className="text-gray-400 mb-6">
                  World-class support from day one. Whether you have one NEO or an entire fleet, our factory-trained team assists with deployment, training, cleaning plan creation, and ongoing 24/7/365 support.
                </p>
                <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                  Get Support <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Specifications */}
      <section id="specs" className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Technical Specifications
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Dimensions & Weight */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Dimensions & Weight</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Length</span>
                  <span className="text-white font-semibold">152 cm (59.8")</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Width</span>
                  <span className="text-white font-semibold">76-94 cm (29.9-37")</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Height</span>
                  <span className="text-white font-semibold">137 cm (53.9")</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Gross Vehicle Weight</span>
                  <span className="text-white font-semibold">581-688 kg (1,282-1,518 lbs)</span>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Max Coverage</span>
                  <span className="text-white font-semibold">3,900 m²/hr (42,000 ft²/hr)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Max Speed</span>
                  <span className="text-white font-semibold">1.35 m/s (4.43 ft/s)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Runtime</span>
                  <span className="text-white font-semibold">4-6 hours per charge</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Noise Level</span>
                  <span className="text-white font-semibold">&lt; 72 dBA</span>
                </div>
              </div>
            </div>

            {/* Tanks & Battery */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Tanks & Power</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Solution Tank</span>
                  <span className="text-white font-semibold">109 L (28.8 gal)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Recovery Tank</span>
                  <span className="text-white font-semibold">135 L (35.7 gal)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Battery</span>
                  <span className="text-white font-semibold">6×6V AGM (36V, 220Ah)</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Charging Time</span>
                  <span className="text-white font-semibold">&lt; 3.5 hours (0-90%)</span>
                </div>
              </div>
            </div>

            {/* Cleaning Heads */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Cleaning Heads</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Disc Options</span>
                  <span className="text-white font-semibold">26" & 32"</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Cylindrical Options</span>
                  <span className="text-white font-semibold">24" & 32"</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Max Applied Pressure</span>
                  <span className="text-white font-semibold">Up to 87 kg (193 lbs)</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Navigation</span>
                  <span className="text-white font-semibold">AI + LiDAR + 3D Vision</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-300">
              Get answers to common questions about AVIDBOTS NEO
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-bots-dark rounded-xl border border-gray-800 overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-lg font-semibold text-white pr-8">
                    {faq.question}
                  </span>
                  {activeFaq === index ? (
                    <ChevronUp className="w-6 h-6 text-blue-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />
                  )}
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Experience the Future of Floor Cleaning?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join hundreds of facilities worldwide that have transformed their cleaning operations with AVIDBOTS NEO. Schedule your demo today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/schedule-a-demo"
              className="px-10 py-5 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg"
            >
              Schedule a Demo
            </Link>
            <Link
              to="/contact"
              className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2"
            >
              <Mail className="w-5 h-5" />
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AvidbotsNeoPage;
