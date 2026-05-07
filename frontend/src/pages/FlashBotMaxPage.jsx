import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Play, Phone, Mail, ChevronDown, ChevronUp, ChevronRight, Package, Lock } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const FlashBotMaxPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'FlashBot Max | Multi-Floor Autonomous Delivery Robot | 123 Bots',
      description: 'Transform building logistics with FlashBot Max. Autonomous multi-floor delivery robot with secure compartments, elevator integration, and 9-10 hour battery life for hotels, hospitals, and offices.',
      keywords: 'flashbot max, autonomous delivery robot, hotel delivery robot, hospital robot, contactless delivery',
    });
  }, []);

  const faqs = [
    {
      question: 'How does FlashBot Max navigate between floors?',
      answer: 'FlashBot Max seamlessly integrates with elevator systems via cloud or hardware connections. It autonomously calls elevators, boards them, selects the destination floor, and exits—all without human intervention. The rapid multi-floor map replication feature enables quick deployment across entire buildings.',
    },
    {
      question: 'What makes FlashBot Max more secure than tray-style delivery robots?',
      answer: 'Unlike open tray robots, FlashBot Max features 2-4 secure, lockable compartments with multiple access methods: password protection, phone verification, and NFC. This ensures items remain secure during transit and are only accessible to authorized recipients—critical for high-value items, medications, or confidential documents.',
    },
    {
      question: 'How long does the battery last?',
      answer: 'FlashBot Max operates for 9-10 hours on a single charge (up to 24 hours in some configurations), making it ideal for full-shift operation. When the battery runs low, it automatically returns to its charging station and resumes deliveries after a 4-4.5 hour charge cycle.',
    },
    {
      question: 'Can it operate outdoors?',
      answer: 'Yes! FlashBot Max is designed for semi-outdoor use, including garden corridors, poolside areas, and covered walkways. Its VSLAM+ navigation system with RGBD cameras and LiDAR handles varied lighting conditions and outdoor elements while maintaining precise navigation.',
    },
    {
      question: 'What types of deliveries can it handle?',
      answer: 'FlashBot Max excels at a wide range of deliveries: hotel room service, guest amenities, medical supplies, pharmaceuticals, laboratory samples, meals, parcels, documents, linens, and more. The adjustable compartments (single: 187×410×280mm, double: 380×410×280mm) accommodate various item sizes with a total payload of 20-30kg.',
    },
    {
      question: 'How does the AI voice interaction work?',
      answer: 'FlashBot Max features advanced AI powered by large language models for natural conversations. Guests can ask questions about hotel services, local recommendations, facility information, or delivery status. The 10.1" touchscreen provides visual feedback while the AI responds intelligently to voice commands.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-cyan-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,211,238,0.3),transparent_50%)]" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <span className="inline-block px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-semibold mb-6">
                Building Delivery Expert
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Elevate Logistics with <span className="text-cyan-400">FlashBot Max</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Revolutionize building logistics with secure, autonomous delivery. FlashBot Max navigates multiple floors with ease, integrates seamlessly with elevators and doors, and delivers items safely via locked compartments. Perfect for hotels, hospitals, offices, and high-rise buildings demanding contactless, traceable service.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="#download-brochure"
                  className="px-8 py-4 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Brochure
                </a>
                <Link
                  to="/schedule-a-demo"
                  className="px-8 py-4 bg-bots-surface border-2 border-cyan-500 text-white font-bold rounded-full hover:bg-cyan-500/20 transition-colors text-center"
                >
                  Book a Demo
                </Link>
              </div>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                  9-10 Hour Battery Life
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                  Multi-Floor Navigation
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-cyan-400" />
                  Secure Compartments
                </span>
              </div>
            </div>

            {/* Right: Product Image */}
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl" />
              <img
                src="/images/bots/flashbot-max.webp"
                alt="FlashBot Max Autonomous Delivery Robot"
                className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Smarter Delivery, Safer Operations
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              FlashBot Max combines intelligent navigation, secure storage, and natural AI interaction for the ultimate delivery experience
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Secure Compartments */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-cyan-500/50 transition-colors">
              <div className="w-16 h-16 bg-cyan-600/20 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-8 h-8 text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Secure Compartments</h3>
              <p className="text-gray-400 mb-4">
                2-4 modular lockable compartments with password, phone verification, and NFC access. Unlike open trays, items remain secure and traceable from pickup to delivery—essential for high-value items, medications, and confidential documents.
              </p>
              <a href="#capabilities" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2">
                Learn More <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 2: Multi-Floor Navigation */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Autonomous Elevator Control</h3>
              <p className="text-gray-400 mb-4">
                Seamlessly integrates with building elevators via cloud or hardware connections. Autonomously calls elevators, boards, selects floors, and exits—navigating entire multi-story buildings without human assistance. Rapid multi-floor map replication speeds up deployment.
              </p>
              <a href="#capabilities" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2">
                See It in Action <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 3: AI Voice Interaction */}
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Voice & Interaction</h3>
              <p className="text-gray-400 mb-4">
                Powered by large language models for natural conversations. Guests can ask about hotel services, local recommendations, delivery status, or facility information. 10.1" touchscreen provides visual feedback while AI responds intelligently to voice commands.
              </p>
              <a href="#specs" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2">
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
              Built for High-Volume Delivery
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From luxury hotels to busy hospitals, FlashBot Max delivers capabilities that transform building logistics
            </p>
          </div>

          {/* Capability 1: Advanced Navigation */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-cyan-600/20 rounded-full text-cyan-400 text-sm font-semibold mb-4">
                SMART NAVIGATION
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                VSLAM+ Indoor/Semi-Outdoor Navigation
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Navigate with confidence in any environment. FlashBot Max uses VSLAM+ (Visual SLAM) combined with LiDAR SLAM for precise indoor and semi-outdoor navigation. RGBD cameras and panoramic sensors enable 3D mapping and dynamic obstacle avoidance—detecting pedestrians and low obstacles in real-time. Handles garden corridors, poolside areas, and covered walkways with ease.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">3D mapping with panoramic awareness</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Dynamic pedestrian and obstacle avoidance</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Indoor & semi-outdoor capability</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <img src="https://images.unsplash.com/photo-1767966769495-dbb5e14cab5f?w=800" alt="Robot delivery system" className="w-full h-full object-cover rounded-xl opacity-70" />
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: IoT Integration */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <Play className="w-16 h-16 text-green-400" />
                  <span className="ml-4 text-gray-400">[Video: IoT Integration Demo]</span>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">
                SEAMLESS INTEGRATION
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Complete Building Automation
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                FlashBot Max integrates seamlessly with your building's infrastructure. Control elevators autonomously (cloud or hardware interface), operate automatic doors and turnstiles, and leverage cloud network connectivity for instant deployment across multiple floors. Multi-stop routing optimizes delivery efficiency for high-volume operations.
              </p>
              <div className="bg-cyan-600/10 border border-cyan-500/30 rounded-xl p-6">
                <p className="text-cyan-300 italic mb-2">
                  "FlashBot Max handles 80+ room deliveries per day across 12 floors. The elevator integration is seamless, and guests love the AI interaction. It's transformed our guest experience."
                </p>
                <p className="text-gray-400 text-sm">
                  — General Manager, Luxury Hotel
                </p>
              </div>
            </div>
          </div>

          {/* Capability 3: Secure Delivery */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">
                MAXIMUM SECURITY
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Locked Compartments with Multi-Factor Access
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Security you can trust. FlashBot Max features 2-4 adjustable compartments secured by password protection, phone verification, and NFC access. Items remain locked during transit and only authorized recipients can retrieve them. Perfect for medications, lab samples, high-value items, and confidential documents where traceability and security are critical.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-cyan-400 mb-2">2-4</div>
                  <div className="text-gray-400 text-sm">secure compartments</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-green-400 mb-2">30kg</div>
                  <div className="text-gray-400 text-sm">max payload capacity</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <Lock className="w-16 h-16 text-purple-400" />
                  <span className="ml-4 text-gray-400">[Image: Secure Compartments]</span>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 4: Long Battery Life */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center">
                  <span className="text-gray-400 text-center px-4">[Image: Auto-Charging Station]</span>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-orange-600/20 rounded-full text-orange-400 text-sm font-semibold mb-4">
                ALL-DAY OPERATION
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                9-10 Hour Battery Life
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Work through entire shifts without interruption. FlashBot Max delivers 9-10 hours of continuous operation on a single charge (up to 24 hours in optimized configurations). When the battery runs low, it autonomously returns to its charging station for a 4-4.5 hour recharge, then resumes deliveries—ensuring maximum uptime for demanding environments.
              </p>
              <div className="space-y-4">
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">All-Day Operation</div>
                  <div className="text-gray-400 text-sm">9-10 hours runtime covers full shifts without recharging</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Fast Auto-Charging</div>
                  <div className="text-gray-400 text-sm">4-4.5 hour charge time with automatic docking</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Scenarios */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Versatile Applications
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From hospitality to healthcare, FlashBot Max excels across diverse environments
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Hotels */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 flex items-center justify-center">
                <span className="text-gray-400">[Image: Hotel Delivery]</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Hotels & Resorts</h3>
                <p className="text-gray-400 mb-6">
                  Room service, amenities, towels, toiletries, and guest requests. Navigate lobbies, elevators, and corridors autonomously. AI interaction enhances guest experience with service recommendations and facility information.
                </p>
                <a href="#" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2">
                  Learn More <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Hospitals */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-green-600/20 to-green-800/20 flex items-center justify-center">
                <span className="text-gray-400">[Image: Hospital Robot]</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Hospitals & Healthcare</h3>
                <p className="text-gray-400 mb-6">
                  Medications, lab samples, medical supplies, meals, and linens. Secure compartments ensure safe, traceable delivery of sensitive items. Reduces staff workload and contamination risks while maintaining strict hygiene protocols.
                </p>
                <a href="#" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2">
                  Explore Features <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Offices */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-purple-800/20 flex items-center justify-center">
                <span className="text-gray-400">[Image: Office Delivery]</span>
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Offices & Buildings</h3>
                <p className="text-gray-400 mb-6">
                  Parcels, documents, mail, catering, and supplies across multiple floors. Multi-stop routing optimizes efficiency for high-volume deliveries. Secure compartments protect confidential documents and valuable items.
                </p>
                <a href="#" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2">
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
            {/* Dimensions & Capacity */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Dimensions & Capacity</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Length × Width × Height</span>
                  <span className="text-white font-semibold">538 × 534 × 1052 mm</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Weight (Empty)</span>
                  <span className="text-white font-semibold">~50-60 kg</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Max Payload</span>
                  <span className="text-white font-semibold">20-30 kg total</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Compartments</span>
                  <span className="text-white font-semibold">2-4 (adjustable)</span>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Max Speed</span>
                  <span className="text-white font-semibold">0.5-1.2 m/s (adjustable)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Battery Life</span>
                  <span className="text-white font-semibold">9-10 hours (up to 24h)</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Charging Time</span>
                  <span className="text-white font-semibold">4-4.5 hours</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Min Path Clearance</span>
                  <span className="text-white font-semibold">70 cm</span>
                </div>
              </div>
            </div>

            {/* Navigation & Safety */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Navigation & Safety</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Navigation</span>
                  <span className="text-white font-semibold">VSLAM+ & LiDAR SLAM</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Sensors</span>
                  <span className="text-white font-semibold">RGBD, Panoramic, Pressure</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Obstacle Detection</span>
                  <span className="text-white font-semibold">3D omnidirectional</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">Max Climb</span>
                  <span className="text-white font-semibold">20 mm height / 8° angle</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Smart Features</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Display</span>
                  <span className="text-white font-semibold">10.1" touchscreen</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">AI Interaction</span>
                  <span className="text-white font-semibold">Voice & visual</span>
                </div>
                <div className="flex justify-between py-3 border-b border-gray-800">
                  <span className="text-gray-400">Security</span>
                  <span className="text-white font-semibold">Password / NFC / Phone</span>
                </div>
                <div className="flex justify-between py-3">
                  <span className="text-gray-400">IoT Integration</span>
                  <span className="text-white font-semibold">Elevator, door, turnstile</span>
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
              Get answers to common questions about FlashBot Max
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
                    <ChevronUp className="w-6 h-6 text-cyan-400 flex-shrink-0" />
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
      <section className="py-20 bg-gradient-to-r from-cyan-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Revolutionize Building Logistics?
          </h2>
          <p className="text-xl text-white/90 mb-10">
            Join leading hotels, hospitals, and offices worldwide that have transformed their delivery operations with FlashBot Max. Experience the future of autonomous logistics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/schedule-a-demo"
              className="px-10 py-5 bg-white text-cyan-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg"
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

export default FlashBotMaxPage;
