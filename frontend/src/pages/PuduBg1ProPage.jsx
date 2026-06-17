import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Play, Phone, Mail, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduBg1ProPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU BG1 PRO | AI-Native Large Scrubber-Dryer Robot | 123 Bots',
      description: 'Experience revolutionary cleaning with PUDU BG1 PRO. One-pass sweep & scrub technology, 7.5-hour runtime, AI spot cleaning, and 24/7 autonomous operation for large-scale facilities.',
      keywords: 'pudu bg1 pro, autonomous floor scrubber, AI cleaning robot, one-pass sweep scrub, commercial cleaning',
    });
  }, []);

  const faqs = [
    {
      question: 'What makes the BG1 PRO different from traditional floor scrubbers?',
      answer: 'The BG1 PRO is the world\'s first AI-Native Large Scrubber-Dryer Robot, purpose-built from the ground up for autonomous operation. Unlike converted manual machines, it features One-Pass Sweep & Scrub technology that handles wet and dry debris simultaneously, AI Spot Cleaning that detects and targets spills in real-time, and 12+ AI features including adaptive mechanics and auto-dosing for optimal cleaning efficiency.',
    },
    {
      question: 'How long can the BG1 PRO operate on a single charge?',
      answer: 'The BG1 PRO offers an impressive 7.5 hours of continuous runtime in sweep & scrub mode (standard 5.5+ hours). With its 90 Ah battery and all-in-one docking station for auto-refill, drainage, and fast charging (3-4.5 hours), it supports true 24/7/365 cleaning schedules without manual intervention.',
    },
    {
      question: 'What is One-Pass Sweep & Scrub technology?',
      answer: 'One-Pass Sweep & Scrub is PUDU\'s revolutionary cleaning approach where front sweeping brushes and rear dual-disc scrubbing work simultaneously. This means the robot handles both dry debris and wet cleaning in a single pass, eliminating the need for pre-sweeping and dramatically increasing efficiency. It\'s perfect for high-traffic areas with mixed debris types.',
    },
    {
      question: 'How does AI Spot Cleaning work?',
      answer: 'The BG1 PRO uses ultra-wide FOV AI vision cameras to detect dirt and liquid spills in real-time. When it identifies a stain, coffee spill, or puddle, it automatically targets and cleans the area with increased brush pressure and precision. In spot cleaning mode, it achieves up to 6,000 m²/h (64,583 ft²/h) coverage, responding to spills within seconds.',
    },
    {
      question: 'Can the BG1 PRO handle large facilities?',
      answer: 'Absolutely! The BG1 PRO is designed for large-scale environments like airports, shopping centers, hotels, and warehouses exceeding 10,000 m². With its 75L clean water tank, 60L dirty water tank, 3D LiDAR + 3D VSLAM navigation, and ride-on mode for rapid mapping and transitions, it efficiently covers massive areas with minimal human intervention.',
    },
    {
      question: 'What kind of support and maintenance does it require?',
      answer: 'The BG1 PRO features an all-in-one docking station that handles auto water refill, waste drainage, battery charging, and self-cleaning to prevent residue buildup. The AI system monitors brush wear, water levels, and component status in real-time via the fleet management dashboard. Routine maintenance includes emptying the 5L trash bin and occasional filter cleaning—all quick-release modules for easy servicing.',
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
                World's First AI-Native Large Scrubber-Dryer
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Revolutionize Cleaning with <span className="text-blue-400">PUDU BG1 PRO</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                The future of commercial floor care is here. BG1 PRO delivers unprecedented cleaning efficiency with One-Pass Sweep & Scrub technology, AI-powered spot cleaning, and true 24/7 autonomous operation. Built from the ground up for large-scale facilities, it's not just a robot—it's a complete cleaning revolution.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="/brochures/123-bg1-pro-brochure.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
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
                  7.5 Hour Runtime
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  One-Pass Sweep & Scrub
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  AI Spot Cleaning
                </span>
              </div>
            </div>

            {/* Right: Product Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl" />
              <img
                src="/images/bots/pudu-bg1-pro.png"
                alt="PUDU BG1 PRO Autonomous Floor Scrubber"
                className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI-Native Intelligence - Features Overview */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              12+ AI Features, Zero Compromises
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built with artificial intelligence at its core, the BG1 PRO doesn't just clean—it thinks, adapts, and optimizes every pass
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: AI Spot Cleaning */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Spot Cleaning</h3>
              <p className="text-gray-400 mb-4">
                Ultra-wide FOV AI vision detects dirt and liquid spills in real-time, targeting them proactively with dynamic path planning. Responds to spills in seconds, achieving up to 6,000 m²/h in spot mode—3× faster than traditional methods.
              </p>
              <a href="#capabilities" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                Learn More <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 2: One-Pass Technology */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">One-Pass Sweep & Scrub</h3>
              <p className="text-gray-400 mb-4">
                Revolutionary dual-action cleaning handles wet and dry debris simultaneously. Front sweeping brushes capture large debris while rear dual-disc scrubbing deep-cleans floors—all in a single pass. No pre-sweeping required.
              </p>
              <a href="#capabilities" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                See It in Action <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 3: Adaptive Intelligence */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Adaptive Mechanics</h3>
              <p className="text-gray-400 mb-4">
                Smart enough to adapt on the fly. Retracts sweeping brushes on wet spills to prevent smearing, auto-increases brush pressure for stubborn stains, and precisely doses cleaning agents based on floor type—maximizing results while minimizing waste.
              </p>
              <a href="#specs" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
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
              Built for Large-Scale Excellence
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From airports to warehouses, the BG1 PRO delivers capabilities that transform cleaning operations
            </p>
          </div>

          {/* Capability 1: 3D Perception & Navigation */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 rounded-full text-blue-400 text-sm font-semibold mb-4">
                ADVANCED NAVIGATION
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                3D LiDAR + 3D VSLAM Fusion
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Navigate complex environments with confidence. The BG1 PRO's fusion of 3D LiDAR and 3D VSLAM ensures stable navigation and mapping even in open spaces, low light, or high-interference zones. RGBD cameras, ultrasonic sensors, and IMU work together for dynamic obstacle avoidance—detecting and avoiding vehicles, people, and unexpected obstacles in real-time.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">360° awareness with multi-sensor fusion</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Stable mapping in challenging conditions</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Dynamic path planning with real-time adaptation</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover rounded-xl"
                  >
                    <source src="/videos/bg1-pro-coverage.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: 24/7 Autonomous Operation */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <img src="/images/bots/pudu-bg1-docking-station.png" alt="PUDU BG1 PRO All-in-One Docking Station" className="w-full h-full object-cover rounded-xl" />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">
                NON-STOP OPERATION
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                All-in-One Docking Station
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                True autonomy means zero downtime. The BG1 PRO's all-in-one docking station handles automatic water refill, waste drainage, battery charging, and self-cleaning to prevent residue and odors. With 7.5 hours of runtime and fast charging (3-4.5 hours), schedule multiple daily cleaning cycles without human intervention—perfect for airports, hotels, and 24/7 facilities.
              </p>
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                <p className="text-blue-300 italic mb-2">
                  "We run the BG1 PRO for three shifts a day across our 50,000 m² facility. The auto-docking station means we never worry about water, charging, or maintenance. It just works."
                </p>
                <p className="text-gray-400 text-sm">
                  — Operations Manager, International Airport
                </p>
              </div>
            </div>
          </div>

          {/* Capability 3: Massive Coverage Capacity */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">
                HIGH-VOLUME CLEANING
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Up to 2,000 m²/hr Coverage
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Built for scale. With 75L clean water and 60L dirty water tanks, 708mm cleaning width (with side brushes), and intelligent route optimization, the BG1 PRO handles massive areas exceeding 10,000 m² per operation. Switch to spot cleaning mode for up to 6,000 m²/h when targeting spills and high-traffic zones.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-blue-400 mb-2">2K</div>
                  <div className="text-gray-400 text-sm">m²/hr standard coverage</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-green-400 mb-2">7.5h</div>
                  <div className="text-gray-400 text-sm">max runtime per charge</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover rounded-xl"
                  >
                    <source src="/videos/bg1-pro-navigation.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 4: Ride-On Mode */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <img src="/images/bots/pudu-bg1-ride-on-platform.png" alt="PUDU BG1 PRO Unique Ride-On Platform" className="w-full h-full object-cover rounded-xl" />
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-orange-600/20 rounded-full text-orange-400 text-sm font-semibold mb-4">
                RAPID DEPLOYMENT
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Unique Ride-On Platform
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Get up and running faster than ever. The BG1 PRO features a fold-out ride-on platform for manual control during rapid mapping, training, and long-distance transitions between buildings or floors. This unique feature dramatically reduces deployment time and simplifies multi-location operations.
              </p>
              <div className="space-y-4">
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Quick Mapping</div>
                  <div className="text-gray-400 text-sm">Rapidly map large facilities in minutes, not hours</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Long-Distance Travel</div>
                  <div className="text-gray-400 text-sm">Move between buildings or floors efficiently</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Ecosystem */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Complete PUDU Ecosystem
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              More than a robot—an integrated platform for maximum operational efficiency
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Fleet Management */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-blue-800/20 flex items-center justify-center">
                <span className="text-gray-400">[Image: Fleet Dashboard]</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Fleet Management</h3>
                <p className="text-gray-400 mb-6">
                  Central control panel for coordinating multiple robots, real-time tracking, task dispatching, and comprehensive reporting. Monitor performance metrics, cleaning maps, and productivity analytics from any device, 24/7.
                </p>
                <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                  Learn More <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* IoT Integration */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-green-600/20 to-green-800/20 flex items-center justify-center">
                <img src="/images/bots/pudu-bg1-iot-integration.png" alt="PUDU BG1 PRO IoT Integration" className="w-full h-auto rounded-xl" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">IoT Integration</h3>
                <p className="text-gray-400 mb-6">
                  Seamless connectivity with building systems. Control elevators, automatic doors, and access gates autonomously. Support for multi-floor operations, pager systems, and 4G/Wi-Fi/Bluetooth connectivity for maximum flexibility.
                </p>
                <a href="#" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">
                  Explore Features <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Support */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-purple-800/20 flex items-center justify-center">
                <span className="text-gray-400">[Image: Customer Support]</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Expert Support</h3>
                <p className="text-gray-400 mb-6">
                  Comprehensive support from deployment to daily operations. Our team assists with site assessment, custom cleaning plan creation, staff training, and ongoing technical support to ensure optimal performance.
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
                  <span className="text-gray-400">Length × Width × Height</span>
                  <span className="text-white font-semibold">1195 × 760 × 1303 mm</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Weight</span>
                  <span className="text-white font-semibold">~344 kg (758 lbs)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Cleaning Width</span>
                  <span className="text-white font-semibold">550 mm (708 mm with side brush)</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Min Path Clearance</span>
                  <span className="text-white font-semibold">85 cm (33.5")</span>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Max Coverage (Standard)</span>
                  <span className="text-white font-semibold">2,000 m²/h (21,528 ft²/h)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Max Coverage (Spot)</span>
                  <span className="text-white font-semibold">6,000 m²/h (64,583 ft²/h)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Max Speed</span>
                  <span className="text-white font-semibold">1.2 m/s (3.94 ft/s)</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Runtime</span>
                  <span className="text-white font-semibold">Max 7.5 hours</span>
                </div>
              </div>
            </div>

            {/* Tanks & Battery */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Tanks & Power</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Clean Water Tank</span>
                  <span className="text-white font-semibold">75 L</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Dirty Water Tank</span>
                  <span className="text-white font-semibold">60 L</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Trash Bin</span>
                  <span className="text-white font-semibold">5 L (1.32 gal)</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Battery / Charging</span>
                  <span className="text-white font-semibold">90 Ah / 3-4.5 hours</span>
                </div>
              </div>
            </div>

            {/* Technology */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Technology</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Navigation</span>
                  <span className="text-white font-semibold">3D LiDAR + 3D VSLAM</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Brush Pressure</span>
                  <span className="text-white font-semibold">31 kg downforce</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">AI Features</span>
                  <span className="text-white font-semibold">12+ including spot cleaning</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Connectivity</span>
                  <span className="text-white font-semibold">4G, Wi-Fi, Bluetooth</span>
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
              Get answers to common questions about PUDU BG1 PRO
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
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Facility?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join leading facilities worldwide that have revolutionized their cleaning operations with PUDU BG1 PRO. Experience the future of autonomous floor care.
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

export default PuduBg1ProPage;
