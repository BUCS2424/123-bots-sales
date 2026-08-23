import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Phone, Mail, ChevronDown, ChevronUp, ChevronRight, Zap, Factory } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const GausiumMarvelPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'Gausium Marvel | Large-Space Commercial Floor Cleaner | 123 Bots',
      description: 'Power through large facilities with Gausium Marvel. 120 Ah battery, 80L/70L tanks, 55kg cleaning pressure, simultaneous sweep & scrub. Built for warehouses, factories, and complex spaces.',
      keywords: 'gausium marvel, large space floor scrubber, warehouse cleaning robot, industrial floor cleaner, autonomous scrubber',
    });
  }, []);

  const faqs = [
    {
      question: 'What makes Marvel ideal for large-scale facilities?',
      answer: 'Marvel is engineered specifically for expansive spaces like warehouses, manufacturing plants, and underground garages. With ultra-large water tanks (80L clean, 70L waste), a 120 Ah LFP battery providing 5-10 hours of runtime, and 55kg cleaning pressure, it delivers deep, consistent cleaning across massive areas with minimal downtime. The simultaneous sweep & scrub system cuts cleaning time in half.',
    },
    {
      question: 'How does the Drop & Go deployment work?',
      answer: 'Drop & Go eliminates the need for professional mapping, calibration, or technical expertise. Simply power on Marvel, press start, and it begins cleaning immediately. The system adapts in real-time to layout changes—rearranged equipment, moved pallets, or shifted furniture—without requiring manual remapping.',
    },
    {
      question: 'What is the simultaneous sweep & scrub technology?',
      answer: 'Marvel features dual front side brushes that sweep up fine dust and large debris into a built-in debris tray, followed immediately by rear disc brushes that scrub and remove stains in the same pass. This 3-in-1 cleaning approach doubles efficiency compared to machines that sweep and scrub separately, covering more ground in less time.',
    },
    {
      question: 'How long can Marvel operate on a single charge?',
      answer: 'Marvel\'s 120 Ah LFP (Lithium Iron Phosphate) battery provides 5-10 hours of continuous runtime on a single charge, depending on cleaning mode and floor conditions. The ultra-large 80L clean water and 70L waste water tanks minimize refill interruptions, ensuring extended operation across large facilities.',
    },
    {
      question: 'What is the cleaning pressure and why does it matter?',
      answer: 'Marvel delivers 55kg of cleaning pressure, engineered for deep, consistent results. This high ground pressure effectively removes stubborn dirt, grime, oil spills, and embedded debris from industrial floors—critical for warehouses, factories, and manufacturing environments where cleanliness standards are demanding.',
    },
    {
      question: 'Does it require constant maintenance?',
      answer: 'No. Marvel features an internal self-cleaning system that automatically flushes waste water tanks and rinses the suction pathway to prevent clogs, odors, and residue buildup. This maintains strong suction performance over time with minimal manual intervention. The power-assisting handle bar and stand-on pedal also make manual transport effortless.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-gray-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(100,116,139,0.3),transparent_50%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <span className="inline-block px-4 py-2 bg-slate-600/20 border border-slate-500/30 rounded-full text-slate-400 text-sm font-semibold mb-6">
                Large-Space Commercial Floor Cleaner
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Get Ready to Marvel at <span className="text-slate-400">The Power of Clean</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Tackle the toughest cleaning demands in warehouses, manufacturing plants, warehouse clubs, and underground garages. Marvel's dual side brushes and rear disc brushes sweep and scrub in a single pass, delivering a deep clean with maximum efficiency. Powered by ultra-large tanks and a 120 Ah battery, Marvel covers more ground, for longer—with minimal downtime.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="#download-brochure"
                  className="px-8 py-4 bg-slate-600 text-white font-bold rounded-full hover:bg-slate-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Brochure
                </a>
                <Link
                  to="/schedule-a-demo"
                  className="px-8 py-4 bg-bots-surface border-2 border-slate-500 text-white font-bold rounded-full hover:bg-slate-500/20 transition-colors text-center"
                >
                  Book a Demo
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-slate-400" />
                  5-10 Hour Runtime
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-slate-400" />
                  55kg Cleaning Pressure
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-slate-400" />
                  80L/70L Tanks
                </span>
              </div>
            </div>

            {/* Right: Product Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-slate-500/20 rounded-full blur-3xl" />
              <img
                src="/images/bots/gausium-marvel.png"
                alt="Gausium Marvel Large-Space Floor Cleaner"
                className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Built for Industrial Power */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built to Clean More, for Longer
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Equipped with larger tanks, higher-capacity battery, and increased ground pressure for superior scrubbing power
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Ultra-Large Tanks */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-slate-500/50 transition-colors">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Ultra-Large Water Tanks</h3>
              <p className="text-gray-400 mb-4">
                80L clean water tank and 70L waste water tank reduce the need for frequent refills across large spaces. Cover massive areas in a single run without interrupting your workflow.
              </p>
              <a href="#capabilities" className="text-slate-400 hover:text-slate-300 font-semibold flex items-center gap-2">
                Learn More <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 2: 120 Ah Battery */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">120 Ah LFP Battery</h3>
              <p className="text-gray-400 mb-4">
                5-10 hours of continuous runtime on a single charge. Lithium Iron Phosphate (LFP) technology ensures reliability, safety, and extended operational time for full-shift cleaning without downtime.
              </p>
              <a href="#capabilities" className="text-slate-400 hover:text-slate-300 font-semibold flex items-center gap-2">
                See Performance <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 3: 55kg Cleaning Pressure */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <Factory className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">55kg Cleaning Pressure</h3>
              <p className="text-gray-400 mb-4">
                Engineered for deep, consistent results. High ground pressure effectively removes stubborn dirt, grime, oil spills, and embedded debris from industrial floors—delivering spotless results every time.
              </p>
              <a href="#specs" className="text-slate-400 hover:text-slate-300 font-semibold flex items-center gap-2">
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
              Industrial-Grade Performance
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From warehouses to manufacturing floors, Marvel delivers unmatched cleaning power
            </p>
          </div>

          {/* Capability 1: Sweep & Scrub in One Pass */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 rounded-full text-blue-400 text-sm font-semibold mb-4">
                3-IN-1 CLEANING
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Sweep & Scrub in One Go
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Marvel combines three cleaning steps into one efficient pass. Dual front side brushes sweep up fine dust and large debris into a built-in debris tray, preparing the surface for a thorough clean. Rear disc brushes follow immediately behind with powerful scrubbing action, removing stains and grime for a spotless finish. This approach doubles efficiency compared to machines that sweep and scrub separately.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Dual side brushes + debris tray for comprehensive sweeping</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Rear disc brushes for immediate powerful scrubbing</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Cuts cleaning time in half vs. sequential operations</span>
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
                    poster="/images/bots/gausium-marvel.png"
                  >
                    <source src="/videos/marvel-sweep-scrub.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: Drop & Go Deployment */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <img
                    src="/legacy-assets/kqzrs46k_image.png"
                    alt="Gausium Robot Drop and Go Auto Deployment at Trade Show Booth"
                    className="w-full h-full object-cover rounded-xl"
                    data-testid="marvel-drop-and-go-image"
                  />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">
                ZERO SETUP HASSLE
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Drop & Go Auto Deployment
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Skip the time-consuming mapping and calibration process. With Drop & Go auto deployment, Marvel requires no professional mapping, no complex configuration, and no technical expertise to get up and running. Simply power on, press start, and let Marvel take it from there. Store shelves rearranged? Furniture moved? No problem. Marvel continuously adapts to layout changes in real time.
              </p>
              <div className="bg-slate-600/10 border border-slate-500/30 rounded-xl p-6">
                <p className="text-slate-300 italic mb-2">
                  "Marvel eliminated our deployment headaches. We rearrange our warehouse layout weekly, and Marvel adapts instantly without any manual remapping. It just works."
                </p>
                <p className="text-gray-400 text-sm">
                  — Operations Manager, Large Distribution Center
                </p>
              </div>
            </div>
          </div>

          {/* Capability 3: Self-Cleaning System */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">
                MINIMAL MAINTENANCE
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Self-Cleaning System
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Marvel cleans itself, so you don't have to. The internal self-cleaning system prevents dirt buildup, eliminates odors, and keeps the machine ready for its next task with minimal manual intervention. Waste water tanks are flushed automatically, and the suction pathway is rinsed to prevent clogs and residue buildup, maintaining strong suction performance over time.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-blue-400 mb-2">Auto</div>
                  <div className="text-gray-400 text-sm">Tank flushing system</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-green-400 mb-2">Auto</div>
                  <div className="text-gray-400 text-sm">Suction pipe rinse</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <iframe
                    src="https://www.youtube.com/embed/FvFeKDbFQLw"
                    title="Gausium Marvel Self-Cleaning System"
                    className="w-full h-full rounded-xl"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    data-testid="marvel-self-cleaning-video"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Capability 4: Power-Assisting Manual Mode */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <img
                    src="/legacy-assets/dxt5bgqt_image.png"
                    alt="Gausium Marvel Power-Assisted Manual Cleaning Mode in Warehouse"
                    className="w-full h-full object-cover rounded-xl"
                    data-testid="marvel-power-assisting-image"
                  />
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-orange-600/20 rounded-full text-orange-400 text-sm font-semibold mb-4">
                ERGONOMIC DESIGN
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Power-Assisting Manual Mode
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Switch to manual mode with ease. Marvel features a power-assisting handle bar and a stand-on pedal, allowing operators to transport and maneuver the machine effortlessly—no heavy lifting, no strain. Perfect for moving between buildings, loading onto vehicles, or navigating tight transitions.
              </p>
              <div className="space-y-4">
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Ergonomic Handle Bar</div>
                  <div className="text-gray-400 text-sm">Power-assisted steering reduces operator fatigue</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Stand-On Pedal</div>
                  <div className="text-gray-400 text-sm">Effortless transport across facilities</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Typical Solution Scenarios */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built for Complex Spaces
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Marvel excels in the most demanding industrial and commercial environments
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {/* Manufacturing */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-slate-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-blue-800/20 flex items-center justify-center overflow-hidden">
                <img
                  src="/legacy-assets/iu3t95tu_manufacturing.jpg"
                  alt="Gausium Marvel Cleaning Robot in Manufacturing Facility Aisle"
                  className="w-full h-full object-cover"
                  data-testid="marvel-manufacturing-image"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">Manufacturing</h3>
                <p className="text-gray-400 text-sm">
                  Production floors, assembly areas, heavy machinery zones
                </p>
              </div>
            </div>

            {/* Warehouses */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-slate-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-green-600/20 to-green-800/20 flex items-center justify-center overflow-hidden">
                <img
                  src="/legacy-assets/mg9kjjed_warehousing.jpg"
                  alt="Gausium Marvel Cleaning Robot in Warehouse Distribution Center"
                  className="w-full h-full object-cover"
                  data-testid="marvel-warehouses-image"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">Warehouses</h3>
                <p className="text-gray-400 text-sm">
                  Distribution centers, storage facilities, loading docks
                </p>
              </div>
            </div>

            {/* Car Parking */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-slate-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-purple-800/20 flex items-center justify-center overflow-hidden">
                <img
                  src="/legacy-assets/e9a8uht2_car-parking.jpg"
                  alt="Gausium Marvel Cleaning Robot in Underground Car Parking Garage"
                  className="w-full h-full object-cover"
                  data-testid="marvel-car-parking-image"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">Car Parking</h3>
                <p className="text-gray-400 text-sm">
                  Underground garages, multi-level parking structures
                </p>
              </div>
            </div>

            {/* Retail */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-slate-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 flex items-center justify-center overflow-hidden">
                <img
                  src="/legacy-assets/t6l5twfi_retail.jpg"
                  alt="Gausium Marvel Cleaning Robot in Retail Space"
                  className="w-full h-full object-cover"
                  data-testid="marvel-retail-image"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">Retail</h3>
                <p className="text-gray-400 text-sm">
                  Big-box stores, warehouse clubs, shopping centers
                </p>
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
            {/* Performance */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Battery Type</span>
                  <span className="text-white font-semibold">120 Ah LFP</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Runtime</span>
                  <span className="text-white font-semibold">5-10 hours</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Cleaning Pressure</span>
                  <span className="text-white font-semibold">55 kg</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Cleaning Method</span>
                  <span className="text-white font-semibold">Sweep + Scrub (simultaneous)</span>
                </div>
              </div>
            </div>

            {/* Tanks & Capacity */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Tanks & Capacity</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Clean Water Tank</span>
                  <span className="text-white font-semibold">80 L</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Waste Water Tank</span>
                  <span className="text-white font-semibold">70 L</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Debris Tray</span>
                  <span className="text-white font-semibold">Built-in</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Self-Cleaning</span>
                  <span className="text-white font-semibold">Auto tank flush & rinse</span>
                </div>
              </div>
            </div>

            {/* Brushes & Cleaning */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Brushes & Cleaning</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Side Brushes</span>
                  <span className="text-white font-semibold">Dual front-mounted</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Scrubbing Brushes</span>
                  <span className="text-white font-semibold">Rear disc brushes</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Floor Types</span>
                  <span className="text-white font-semibold">Hard floors (concrete, tile, epoxy)</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Target Spaces</span>
                  <span className="text-white font-semibold">Large & complex areas</span>
                </div>
              </div>
            </div>

            {/* Navigation & Control */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Navigation & Control</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Deployment</span>
                  <span className="text-white font-semibold">Drop & Go (one-touch)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Mapping</span>
                  <span className="text-white font-semibold">Unlimited, real-time adaptation</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Manual Mode</span>
                  <span className="text-white font-semibold">Power-assist handle + pedal</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Remote Control</span>
                  <span className="text-white font-semibold">Mobile app + cloud platform</span>
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
              Get answers to common questions about Gausium Marvel
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
                    <ChevronUp className="w-6 h-6 text-slate-400 flex-shrink-0" />
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
      <section className="py-20 bg-gradient-to-r from-slate-700 to-gray-700">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready for Industrial-Strength Cleaning?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join warehouses, factories, and large facilities worldwide that have transformed their cleaning operations with Gausium Marvel. Experience the power of clean.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/schedule-a-demo"
              className="px-10 py-5 bg-white text-slate-700 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg"
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

export default GausiumMarvelPage;
