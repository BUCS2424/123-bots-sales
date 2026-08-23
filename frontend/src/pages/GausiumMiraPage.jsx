import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Phone, Mail, ChevronDown, ChevronUp, ChevronRight, Zap } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const GausiumMiraPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'Gausium Mira | Award-Winning Compact Autonomous Scrubber | 123 Bots',
      description: 'Experience effortless cleaning with Gausium Mira. Drop & Go deployment, simultaneous sweep & scrub, 660mm narrow aisle navigation. Winner of ISSA 2025 Innovation of the Year Award.',
      keywords: 'gausium mira, compact autonomous scrubber, drop and go robot, retail cleaning robot, narrow aisle scrubber',
    });
  }, []);

  const faqs = [
    {
      question: 'What makes Gausium Mira different from other autonomous scrubbers?',
      answer: 'Mira revolutionizes deployment with Drop & Go technology—simply power it on and press start. No professional mapping required. It automatically adapts to layout changes in real-time, making it perfect for dynamic retail environments where shelves and displays are constantly rearranged. Plus, its 660mm clearance navigates the narrowest aisles with ease.',
    },
    {
      question: 'How does the Drop & Go deployment work?',
      answer: 'Drop & Go eliminates complex setup. Power on Mira, press the start button, and it immediately begins mapping and cleaning. The AI-powered navigation adapts in real-time to layout changes—no manual remapping needed when you rearrange displays or shelving. This one-touch deployment saves hours compared to traditional robots.',
    },
    {
      question: 'What is the simultaneous sweep & scrub feature?',
      answer: 'Mira performs sweeping and scrubbing in a single pass, cutting cleaning time in half. The front roller brush collects dust and debris while the rear disc brushes scrub and remove stains—all simultaneously. This pre-sweep function eliminates the need for separate cleaning passes, dramatically improving efficiency.',
    },
    {
      question: 'Can it handle narrow retail aisles?',
      answer: 'Absolutely! Mira is purpose-built for tight spaces with 660mm (26-inch) minimum pass clearance. It navigates retail aisles, under-shelf areas, and dense corridors that larger robots can\'t access. The compact design combined with advanced 3D perception ensures safe, efficient cleaning in challenging layouts.',
    },
    {
      question: 'How does the self-cleaning system work?',
      answer: 'Mira features automatic wastewater tank flushing and suction pathway rinsing to prevent clogs, odors, and buildup. It requires minimal manual intervention. When paired with optional Gausium workstations, it receives high-pressure flushing of tanks, hoses, and squeegees for deep maintenance—keeping Mira running at peak performance.',
    },
    {
      question: 'What is Spot Cleaning Mode?',
      answer: 'Spot Cleaning Mode uses RGB-D cameras and deep learning to detect dirt and spills automatically. When Mira identifies a stain or spill, it diverts from its planned route to target and deep-clean the area immediately. This proactive cleaning ensures high-traffic zones and problem areas stay spotless without manual intervention.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-emerald-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.3),transparent_50%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <span className="inline-block px-4 py-2 bg-emerald-600/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-semibold mb-6">
                🏆 ISSA 2025 Innovation of the Year Winner
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Clean Smarter with <span className="text-emerald-400">Gausium Mira</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Effortless cleaning starts here. Mira redefines autonomous floor care with Drop & Go deployment, simultaneous sweep & scrub technology, and intelligent self-maintenance. Purpose-built for mid-sized retail, manufacturing, and healthcare facilities where narrow aisles and dynamic layouts demand a smarter solution.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="#download-brochure"
                  className="px-8 py-4 bg-emerald-600 text-white font-bold rounded-full hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Brochure
                </a>
                <Link
                  to="/schedule-a-demo"
                  className="px-8 py-4 bg-bots-surface border-2 border-emerald-500 text-white font-bold rounded-full hover:bg-emerald-500/20 transition-colors text-center"
                >
                  Book a Demo
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Drop & Go Deployment
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  660mm Narrow Aisles
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  One-Pass Sweep & Scrub
                </span>
              </div>
            </div>

            {/* Right: Product Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl" />
              <img
                src="/images/bots/gausium-mira.webp"
                alt="Gausium Mira Autonomous Floor Scrubber"
                className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Award-Winning Features Overview */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Innovation That Sets New Standards
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Recognized by ISSA Show North America 2025 for groundbreaking automation and efficiency
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Drop & Go */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-emerald-500/50 transition-colors">
              <div className="w-16 h-16 bg-emerald-600/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Drop & Go Deployment</h3>
              <p className="text-gray-400 mb-4">
                Revolutionary one-touch start. No professional mapping, no complex setup. Power on, press start, and Mira automatically maps and cleans. Real-time adaptation to layout changes means zero manual remapping when you rearrange your space.
              </p>
              <a href="#capabilities" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2">
                Learn More <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 2: Narrow Aisle Master */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">660mm Narrow Aisle Navigation</h3>
              <p className="text-gray-400 mb-4">
                Compact design meets powerful cleaning. With 660mm (26-inch) minimum clearance, Mira navigates retail aisles, under-shelf spaces, and dense corridors larger robots can't reach. Advanced 3D perception ensures safe operation in tight environments.
              </p>
              <a href="#capabilities" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2">
                See It in Action <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 3: Simultaneous Sweep & Scrub */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">One-Pass Sweep & Scrub</h3>
              <p className="text-gray-400 mb-4">
                Efficiency redefined. Front roller brush sweeps dust and debris while rear disc brushes simultaneously scrub and remove stains—all in a single pass. This pre-sweep function cuts cleaning time in half compared to sequential operations.
              </p>
              <a href="#specs" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2">
                View Specifications <ChevronRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section id="capabilities" className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built for Real-World Challenges
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From retail stores to manufacturing floors, Mira adapts to your environment
            </p>
          </div>

          {/* Capability 1: AI-Powered Spot Cleaning */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-emerald-600/20 rounded-full text-emerald-400 text-sm font-semibold mb-4">
                INTELLIGENT DETECTION
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                AI Spot Cleaning Mode
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Never miss a spill again. Mira's RGB-D cameras and deep learning algorithms continuously scan for dirt and spills. When detected, it automatically diverts from its planned route to target and deep-clean the area. This proactive approach ensures high-traffic zones stay spotless without manual intervention.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Real-time dirt and spill detection</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Automatic route diversion for targeted cleaning</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Deep learning continuously improves accuracy</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <video 
                    controls 
                    className="w-full h-full object-cover rounded-xl"
                    poster="/images/bots/gausium-mira.webp"
                  >
                    <source src="/videos/mira-spot-cleaning.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: Self-Maintenance System */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <img src="/images/mira-self-cleaning.jpg" alt="Mira Self-Cleaning System" className="w-full h-full object-cover rounded-xl" />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-blue-600/20 rounded-full text-blue-400 text-sm font-semibold mb-4">
                MINIMAL MAINTENANCE
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Automatic Self-Cleaning System
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Keep Mira running at peak performance with minimal effort. The automatic wastewater tank flushing and suction pathway rinsing prevent clogs, odors, and buildup. Compatible with optional Gausium workstations for high-pressure deep maintenance of tanks, hoses, and squeegees—ensuring long-term reliability.
              </p>
              <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-xl p-6">
                <p className="text-emerald-300 italic mb-2">
                  "Mira's self-cleaning system has cut our maintenance time by 70%. It just works day after day with virtually no intervention. Perfect for our 24/7 retail operation."
                </p>
                <p className="text-gray-400 text-sm">
                  — Facilities Manager, Multi-Store Retail Chain
                </p>
              </div>
            </div>
          </div>

          {/* Capability 3: Dynamic Layout Adaptation */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">
                REAL-TIME ADAPTATION
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                No Remapping Required
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Retail environments change constantly. Mira's industry-leading AI navigation adapts in real-time to rearranged shelves, new displays, and layout modifications. No manual remapping, no downtime—just continuous, intelligent cleaning. The ±10mm localization accuracy ensures precision even in dynamic spaces.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">±10mm</div>
                  <div className="text-gray-400 text-sm">localization accuracy</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-blue-400 mb-2">3D</div>
                  <div className="text-gray-400 text-sm">perception technology</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/Fc7AF430A9Y"
                    title="Gausium Mira Dynamic Navigation - No Remapping Required"
                    className="w-full h-full rounded-xl"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    data-testid="mira-dynamic-navigation-video"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Capability 4: Eco-Friendly Operation */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <img
                    src="/legacy-assets/90ma0lz8_1778050909371.jpg"
                    alt="Gausium Robot Scrubber Cleaning Retail Warehouse Aisle with Gausium Leaves Integration"
                    className="w-full h-full object-cover rounded-xl"
                    data-testid="mira-gausium-leaves-image"
                  />
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">
                SUSTAINABLE CLEANING
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Gausium Leaves Integration
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Reduce waste and environmental impact with optional Gausium Leaves integration. Precise chemical dosing optimizes cleaning agent usage based on floor type and soil level, minimizing waste while maximizing results. Eco-mode operation reduces water and energy consumption without compromising performance.
              </p>
              <div className="space-y-4">
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Precision Dosing</div>
                  <div className="text-gray-400 text-sm">Milliliter-accurate chemical dispensing reduces waste</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Eco Mode</div>
                  <div className="text-gray-400 text-sm">Optimized water and energy usage for sustainability</div>
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Complete Gausium Ecosystem
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Mira integrates seamlessly with Gausium's smart cleaning platform
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Smart Cloud Platform */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-emerald-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-emerald-600/20 to-emerald-800/20 flex items-center justify-center overflow-hidden">
                <img
                  src="/legacy-assets/kgsj6420_remote-map-editing-gausium-scaled.webp"
                  alt="Gausium Cloud Platform Remote Map Editing Dashboard"
                  className="w-full h-full object-cover"
                  data-testid="mira-smart-cloud-platform-image"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Smart Cloud Platform</h3>
                <p className="text-gray-400 mb-6">
                  Remote deployment, real-time monitoring, and comprehensive analytics. Edit maps, schedule cleaning tasks, and track performance from anywhere. OTA updates keep Mira at the cutting edge without downtime.
                </p>
                <a href="#" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2">
                  Learn More <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Mobile App */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-emerald-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-blue-800/20 flex items-center justify-center overflow-hidden">
                <img
                  src="/legacy-assets/302w2lwv_IoT-Integration-min.jpg"
                  alt="Gausium Mira Mobile App on Laptop, Tablet and Phone with Cloud Dashboard and Data Statistics"
                  className="w-full h-full object-cover"
                  data-testid="mira-mobile-app-image"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">User-Friendly Mobile App</h3>
                <p className="text-gray-400 mb-6">
                  Monitor Mira's status, adjust settings, and receive notifications on the go. Intuitive interface puts powerful control at your fingertips. View cleaning coverage, battery status, and maintenance alerts in real-time.
                </p>
                <a href="#" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2">
                  Explore Features <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Open API */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-emerald-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-purple-800/20 flex items-center justify-center overflow-hidden">
                <img
                  src="/legacy-assets/tcu6d9p9_future-of-commercial-cleaning-robots_Gausium.webp"
                  alt="Future of Commercial Cleaning Robots - Gausium IoT Integration"
                  className="w-full h-full object-cover"
                  data-testid="mira-iot-integration-image"
                />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Open API & IoT Integration</h3>
                <p className="text-gray-400 mb-6">
                  Integrate Mira with your existing facility management systems. Open API enables custom workflows, third-party integrations, and seamless data exchange. Build the cleaning solution that fits your unique needs.
                </p>
                <a href="#" className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2">
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
            {/* Dimensions & Navigation */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Dimensions & Navigation</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Min Pass Clearance</span>
                  <span className="text-white font-semibold">660 mm (26 in)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Weight</span>
                  <span className="text-white font-semibold">~80 kg (176 lbs)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Localization Accuracy</span>
                  <span className="text-white font-semibold">±10 mm</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Max Climb Angle</span>
                  <span className="text-white font-semibold">4.6° incline</span>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Max Speed</span>
                  <span className="text-white font-semibold">~1 m/s</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Cleaning Mechanism</span>
                  <span className="text-white font-semibold">Sweep + Scrub (simultaneous)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Battery</span>
                  <span className="text-white font-semibold">Extended runtime</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Charging</span>
                  <span className="text-white font-semibold">Auto-docking available</span>
                </div>
              </div>
            </div>

            {/* Technology */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Technology</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Navigation</span>
                  <span className="text-white font-semibold">3D LiDAR + RGB-D + AI</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Mapping</span>
                  <span className="text-white font-semibold">Unlimited, real-time</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Spot Cleaning</span>
                  <span className="text-white font-semibold">AI deep learning detection</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Self-Maintenance</span>
                  <span className="text-white font-semibold">Auto-flush system</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Smart Features</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Deployment</span>
                  <span className="text-white font-semibold">Drop & Go (one-touch)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Floor Types</span>
                  <span className="text-white font-semibold">Hard floors, low-pile carpet</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Connectivity</span>
                  <span className="text-white font-semibold">Cloud, mobile app, OTA updates</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">API</span>
                  <span className="text-white font-semibold">Open for IoT integration</span>
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
              Get answers to common questions about Gausium Mira
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
                    <ChevronUp className="w-6 h-6 text-emerald-400 flex-shrink-0" />
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
      <section className="py-20 bg-gradient-to-r from-emerald-600 to-green-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Experience Award-Winning Innovation
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join retail, manufacturing, and healthcare facilities worldwide that have transformed their cleaning with Gausium Mira. See why ISSA recognized us as Innovation of the Year 2025.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/schedule-a-demo"
              className="px-10 py-5 bg-white text-emerald-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg"
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

export default GausiumMiraPage;
