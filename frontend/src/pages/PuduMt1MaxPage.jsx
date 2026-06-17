import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduMt1MaxPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU MT1 MAX | 3D Perception Autonomous Sweeper | 123 Bots',
      description: 'Master large-scale cleaning with PUDU MT1 MAX. 3D LiDAR perception, 8-hour runtime, 2,200 m²/h coverage, 7,000 m²/h spot cleaning for parking garages and courtyards.',
      keywords: 'pudu mt1 max, 3d lidar sweeper, autonomous sweeper, parking garage cleaning, outdoor robot sweeper',
    });
  }, []);

  const faqs = [
    {
      question: 'What environments is the MT1 MAX designed for?',
      answer: 'The MT1 MAX is purpose-built for large, complex, and outdoor-adjacent environments that challenge standard 2D navigation systems. Primary use cases include multi-level parking garages, open courtyards, high-ceiling warehouses, logistics hubs, airports, and industrial facilities. Its 3D LiDAR handles the dramatic height changes, low-reflectivity surfaces, and wide-open spaces that 2D sensors struggle with.',
    },
    {
      question: 'How does 3D LiDAR differ from standard 2D navigation?',
      answer: '2D LiDAR scans a single horizontal plane and is blind to obstacles above or below that plane — like a speed bump, a loading dock edge, or a vehicle overhanging the floor. The MT1 MAX uses 3D LiDAR to build a full volumetric point-cloud map of its environment. This means it detects curbs, ramps, raised platforms, hanging pipes, and pedestrians at all heights — making it the only autonomous sweeper that can safely navigate parking garages without infrastructure modifications.',
    },
    {
      question: 'How long can the MT1 MAX run on a single charge?',
      answer: 'The MT1 MAX delivers 8 hours of continuous operation per charge from its 60 Ah battery — enough for a full overnight shift covering up to 17,600 m² at standard sweeping speed. Charging takes approximately 5 hours, making single-charge daily cycles practical for most facilities. For 24/7 operations, two units staggered on charging cycles provide uninterrupted coverage.',
    },
    {
      question: 'What is the difference between standard and spot cleaning modes?',
      answer: 'Standard sweeping mode (2,200 m²/h) uses full-coverage path planning with overlapping passes for thorough debris pickup. Spot cleaning mode (7,000 m²/h) activates when the MT1 MAX detects a concentrated debris zone — it concentrates its path on the target area for rapid remediation, then resumes full coverage. The mode switch is automatic and requires no operator input.',
    },
    {
      question: 'How does the smart dust suppression system work?',
      answer: 'The MT1 MAX includes an integrated dust suppression system that uses controlled misting to bind fine particulate matter before it becomes airborne. This is critical for enclosed parking garages where diesel particulates and brake dust accumulate, and for dry industrial facilities where sweeping without suppression can create air quality violations. Suppression intensity adjusts automatically based on debris density detected by the front sensors.',
    },
    {
      question: 'Does it need infrastructure changes to operate in a parking garage?',
      answer: 'No. Unlike some robotic systems that require QR codes, magnetic strips, or reflective markers installed in the facility, the MT1 MAX maps its environment on first deployment using its onboard 3D LiDAR. It handles standard parking garage features — support columns, speed bumps, ramps up to a specified grade, and vehicles parked in stalls — without any physical modifications to the facility.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-purple-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(147,51,234,0.3),transparent_50%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-semibold mb-6">
                3D Perception Autonomous Sweeper
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                See More, <span className="text-purple-400">Clean Smarter</span> with MT1 MAX
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Built for the spaces standard robots can't handle — parking garages, open courtyards, high-ceiling warehouses. MT1 MAX pairs 3D LiDAR perception with 8-hour runtime and 7,000 m²/h spot cleaning to master large-scale, complex environments autonomously.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="https://customer-assets.emergentagent.com/job_d17d16d7-aec2-4c18-a380-9b1b89c02454/artifacts/t1qeb6eo_MT1_MAX_123_SPECS_BROCHURE.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-purple-600 text-white font-bold rounded-full hover:bg-purple-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Brochure
                </a>
                <Link
                  to="/schedule-a-demo"
                  className="px-8 py-4 bg-bots-surface border-2 border-purple-500 text-white font-bold rounded-full hover:bg-purple-500/20 transition-colors text-center"
                >
                  Book a Demo
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-400" />3D LiDAR Perception</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-400" />8-Hour Runtime</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-purple-400" />7,000 m²/h Spot Mode</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-3xl" />
              <img
                src="/images/bots/pudu-mt1-max.png"
                alt="PUDU MT1 MAX Autonomous Sweeper"
                className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* AI Features Overview */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built for Spaces Where Others Fail
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              3D perception, full-shift endurance, and intelligent dust control — designed specifically for the most demanding sweeping environments
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">3D LiDAR Perception</h3>
              <p className="text-gray-400 mb-4">
                Full volumetric point-cloud mapping sees curbs, ramps, hanging obstacles, and vehicles at every height — not just the floor plane. The only sweeper that navigates real parking garages without infrastructure modifications.
              </p>
              <a href="#capabilities" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2">
                Learn More <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">8-Hour Full-Shift Operation</h3>
              <p className="text-gray-400 mb-4">
                60 Ah battery delivers a complete overnight shift without a recharge stop. 2,200 m²/h standard coverage, accelerating to 7,000 m²/h in spot cleaning mode — covering up to 17,600 m² in a single charge cycle.
              </p>
              <a href="#capabilities" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2">
                See Coverage Stats <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Smart Dust Suppression</h3>
              <p className="text-gray-400 mb-4">
                Integrated misting system binds fine particulate before it becomes airborne — essential for enclosed parking garages and industrial facilities with air quality requirements. Suppression intensity auto-adjusts based on debris density.
              </p>
              <a href="#specs" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2">
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
              From underground parking to open industrial yards, MT1 MAX delivers capabilities that transform large-scale sweeping operations
            </p>
          </div>

          {/* Capability 1: 3D Perception */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">
                ADVANCED NAVIGATION
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                3D LiDAR — Full Volumetric Mapping
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Where 2D LiDAR sees a flat slice of the world, the MT1 MAX's 3D LiDAR builds a complete volumetric point cloud — mapping every column, ramp edge, vehicle underbody, and overhead obstruction. Navigation stays accurate in wide-open spaces with low visual landmarks, in high-reflection environments, and in low-light conditions where camera-based systems degrade.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Detects obstacles at all heights — not just floor level</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Stable in open, featureless spaces like parking lots and courtyards</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">No QR codes, reflective markers, or facility modifications needed</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gradient-to-br from-purple-900/40 to-purple-700/20 rounded-xl flex items-center justify-center">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover rounded-xl"
                  >
                    <source src="/videos/mt1-max-navigation.mp4" type="video/mp4" />
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">MT1 MAX 3D Navigation Demo</p>
                    </div>
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: 8-Hour Autonomous Operation */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gradient-to-br from-green-900/40 to-green-700/20 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src="/images/bots/pudu-mt1-max.png"
                    alt="PUDU MT1 MAX Autonomous Sweeping Operation"
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">
                FULL-SHIFT ENDURANCE
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                8-Hour Runtime — No Mid-Shift Interruptions
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                The MT1 MAX's 60 Ah battery runs a full overnight cleaning shift without stopping. Schedule it at facility close, and arrive in the morning to a swept parking garage, clean courtyard, or clear warehouse floor. At 2,200 m²/h, a single charge covers parking structures up to 17,600 m² — with the autonomous auto-dock return when the mission is complete.
              </p>
              <div className="bg-purple-600/10 border border-purple-500/30 rounded-xl p-6">
                <p className="text-purple-300 italic mb-2">
                  "We deploy MT1 MAX in our 400-space underground garage every night at midnight. By 5 AM it's docked, charged, and the garage is clean for the morning rush. Zero staff needed overnight."
                </p>
                <p className="text-gray-400 text-sm">— Facilities Director, Commercial Real Estate Portfolio</p>
              </div>
            </div>
          </div>

          {/* Capability 3: 7,000 m²/h Spot Cleaning */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 rounded-full text-blue-400 text-sm font-semibold mb-4">
                HIGH-SPEED SPOT CLEANING
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                7,000 m²/h — Fastest in Class
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                When MT1 MAX detects a concentrated debris zone — tracked-in gravel at a parking entrance, fallen leaves at a courtyard gate, or scattered debris from a loading dock — it switches to 7,000 m²/h spot mode automatically. The AI targets the zone, clears it at maximum speed, and resumes full-coverage sweeping without operator input.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-purple-400 mb-2">2.2K</div>
                  <div className="text-gray-400 text-sm">m²/h standard coverage</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-blue-400 mb-2">7K</div>
                  <div className="text-gray-400 text-sm">m²/h spot mode coverage</div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gradient-to-br from-blue-900/40 to-blue-700/20 rounded-xl overflow-hidden flex items-center justify-center">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover rounded-xl"
                  >
                    <source src="/videos/mt1-max-spot-cleaning.mp4" type="video/mp4" />
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">MT1 MAX Spot Cleaning Demo</p>
                    </div>
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 4: Smart Dust Suppression */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gradient-to-br from-cyan-900/40 to-cyan-700/20 rounded-xl overflow-hidden flex items-center justify-center">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover rounded-xl"
                  >
                    <source src="/videos/mt1-max-dust-suppression.mp4" type="video/mp4" />
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-cyan-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">Smart Dust Suppression in Action</p>
                    </div>
                  </video>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-cyan-600/20 rounded-full text-cyan-400 text-sm font-semibold mb-4">
                AIR QUALITY PROTECTION
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Smart Dust Suppression System
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Sweeping in enclosed spaces without dust suppression creates an air quality hazard — resuspending brake dust, diesel soot, and fine silica particles. MT1 MAX's integrated misting system binds particulate at the source before it becomes airborne, making autonomous sweeping safe for occupied garages and compliant with indoor air quality regulations.
              </p>
              <div className="space-y-4">
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Auto-Intensity Control</div>
                  <div className="text-gray-400 text-sm">Misting intensity scales with debris density — maximum suppression where it matters most</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Safe for Occupied Spaces</div>
                  <div className="text-gray-400 text-sm">Operate during business hours in garages and warehouses without displacing people or vehicles</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Compliance Ready</div>
                  <div className="text-gray-400 text-sm">Supports OSHA and EPA indoor air quality standards for industrial cleaning operations</div>
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
              More than a sweeper — an integrated platform for maximum operational efficiency
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Fleet Management */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden">
                <img src="https://customer-assets.emergentagent.com/job_ef18f0c6-3791-43dc-a009-b6a410b56caf/artifacts/sy01od6d_fleet-management.png" alt="Fleet Management Dashboard" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Fleet Management</h3>
                <p className="text-gray-400 mb-6">
                  Coordinate multiple MT1 MAX units across a facility from one dashboard. Real-time location tracking, task dispatching, coverage maps, and productivity analytics accessible from any device, 24/7.
                </p>
                <a href="#" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2">
                  Learn More <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* IoT Integration */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden">
                <img src="https://customer-assets.emergentagent.com/job_ef18f0c6-3791-43dc-a009-b6a410b56caf/artifacts/qslij3kb_IoT-smart-features.jpg" alt="IoT Smart Integration" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">IoT Integration</h3>
                <p className="text-gray-400 mb-6">
                  Connects seamlessly with building management systems — access gates, parking barriers, elevators, and facility scheduling software. 4G, Wi-Fi, and Bluetooth support for maximum connectivity flexibility.
                </p>
                <a href="#" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2">
                  Explore Features <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Expert Support */}
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-purple-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden">
                <img src="https://customer-assets.emergentagent.com/job_ef18f0c6-3791-43dc-a009-b6a410b56caf/artifacts/76r9l5p9_pudu-bg1-expert-support.png" alt="Expert Support Team" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Expert Support</h3>
                <p className="text-gray-400 mb-6">
                  Comprehensive support from site assessment to daily operations. Our team handles deployment planning, facility mapping, staff training, and ongoing technical assistance to keep your MT1 MAX at peak performance.
                </p>
                <Link to="/contact" className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-2">
                  Get Support <ChevronRight className="w-4 h-4" />
                </Link>
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
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Dimensions (L × W × H)</span><span className="text-white font-semibold">~1400 × 900 × 1200 mm</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Sweeping Width</span><span className="text-white font-semibold">1,100 mm (main + side brushes)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Min Path Clearance</span><span className="text-white font-semibold">~120 cm</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Max Step Height</span><span className="text-white font-semibold">20 mm</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Coverage (Standard)</span><span className="text-white font-semibold">2,200 m²/h (23,680 ft²/h)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Coverage (Spot Mode)</span><span className="text-white font-semibold">7,000 m²/h (75,347 ft²/h)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Speed</span><span className="text-white font-semibold">1.5 m/s</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Runtime</span><span className="text-white font-semibold">8 hours</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Power & Tanks</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Battery Capacity</span><span className="text-white font-semibold">60 Ah</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Charging Time</span><span className="text-white font-semibold">~5 hours</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Dust Bin Capacity</span><span className="text-white font-semibold">60 L</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Suppression Tank</span><span className="text-white font-semibold">20 L</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Technology</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Navigation</span><span className="text-white font-semibold">3D LiDAR + VSLAM</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Dust Control</span><span className="text-white font-semibold">Smart suppression (auto-intensity)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Connectivity</span><span className="text-white font-semibold">4G, Wi-Fi, Bluetooth</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Ideal Environments</span><span className="text-white font-semibold">Parking, courtyards, warehouses</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-gray-300">Get answers to common questions about PUDU MT1 MAX</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-bots-dark rounded-xl border border-gray-800 overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-800/50 transition-colors"
                >
                  <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                  {activeFaq === index
                    ? <ChevronUp className="w-6 h-6 text-purple-400 flex-shrink-0" />
                    : <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />}
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
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready for Large-Scale Sweeping?</h2>
          <p className="text-xl text-white/90 mb-10">
            Join facilities worldwide using PUDU MT1 MAX for parking garages, courtyards, and complex environments. Schedule a live demo at your facility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-purple-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">
              Schedule a Demo
            </Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2">
              <Mail className="w-5 h-5" /> Contact Sales
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PuduMt1MaxPage;
