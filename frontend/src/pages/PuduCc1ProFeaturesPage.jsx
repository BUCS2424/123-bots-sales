import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight, Download, Mail, Zap, Cpu, Eye, Wifi, ArrowLeft, Layers, Maximize2, Clock, Smartphone, Camera, Wind, Shield, Activity } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduCc1ProFeaturesPage = () => {
  const [activeMode, setActiveMode] = useState(0);

  const cleaningModes = [
    {
      name: 'Sweep',
      color: 'blue',
      icon: <Layers className="w-7 h-7 text-blue-400" />,
      stat: '2,500 m²/h', statLabel: 'coverage rate',
      desc: 'Rotating side brushes sweep debris — including large particles, wrappers, and tracked-in grit — into the main path. Ideal as a first-pass mode before vacuuming or scrubbing. Operates silently enough for open-hours use in retail and hospitality.',
    },
    {
      name: 'Vacuum',
      color: 'indigo',
      icon: <Wind className="w-7 h-7 text-indigo-400" />,
      stat: '17,000 Pa', statLabel: 'max suction power',
      desc: '17,000 Pa industrial-grade suction captures fine dust, allergens, and embedded carpet fiber that sweeping misses. CC1 PRO automatically detects carpet surfaces and switches to vacuum-only mode — avoiding brush tangling and protecting carpet pile while delivering the deepest clean possible.',
    },
    {
      name: 'Mop',
      color: 'cyan',
      icon: <Maximize2 className="w-7 h-7 text-cyan-400" />,
      stat: 'Dry + Damp', statLabel: 'dual mop modes',
      desc: 'Microfiber mopping module handles post-scrub dust pickup (dry mode) and light daily maintenance (damp mode). The AI Cleaning Intensity Control adjusts water output based on detected soil load — no over-wetting that damages hardwood or leaves residue on sealed tile.',
    },
    {
      name: 'Scrub',
      color: 'purple',
      icon: <Zap className="w-7 h-7 text-purple-400" />,
      stat: '1,500 m²/h', statLabel: 'spot scrub coverage',
      desc: 'Deep-scrub mode applies pressurized water and rotary brush action for grease, caked grime, and high-traffic floor staining. In AI Spot Scrubbing mode (1,500–3,000 m²/h), the robot targets detected problem zones without running the full scrub cycle everywhere — massively reducing water and detergent consumption.',
    },
  ];

  const colorMap = {
    blue: { tab: 'bg-blue-600 text-white', inactive: 'border-blue-500/30 text-blue-300 hover:border-blue-500/60', stat: 'text-blue-400', badge: 'bg-blue-600/20', dot: 'bg-blue-400' },
    indigo: { tab: 'bg-indigo-600 text-white', inactive: 'border-indigo-500/30 text-indigo-300 hover:border-indigo-500/60', stat: 'text-indigo-400', badge: 'bg-indigo-600/20', dot: 'bg-indigo-400' },
    cyan: { tab: 'bg-cyan-600 text-white', inactive: 'border-cyan-500/30 text-cyan-300 hover:border-cyan-500/60', stat: 'text-cyan-400', badge: 'bg-cyan-600/20', dot: 'bg-cyan-400' },
    purple: { tab: 'bg-purple-600 text-white', inactive: 'border-purple-500/30 text-purple-300 hover:border-purple-500/60', stat: 'text-purple-400', badge: 'bg-purple-600/20', dot: 'bg-purple-400' },
    green: { tab: 'bg-green-600 text-white', inactive: 'border-green-500/30 text-green-300 hover:border-green-500/60', stat: 'text-green-400', badge: 'bg-green-600/20', dot: 'bg-green-400' },
    orange: { tab: 'bg-orange-600 text-white', inactive: 'border-orange-500/30 text-orange-300 hover:border-orange-500/60', stat: 'text-orange-400', badge: 'bg-orange-600/20', dot: 'bg-orange-400' },
  };

  const active = cleaningModes[activeMode];
  const activeColor = colorMap[active.color];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-indigo-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.3),transparent_50%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Link to="/products/pudu-cc1-pro" className="inline-flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to CC1 PRO
          </Link>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-400 text-sm font-semibold mb-6">
                4-in-1 · AI Spot Scrubbing · Rear Camera Verification
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Every Feature of the <span className="text-indigo-400">CC1 PRO</span>, Explained
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Beyond the headline specs — this page covers what the PUDU CC1 PRO does that no other commercial cleaner can: four cleaning modes in one platform, AI-directed spot scrubbing, the world's first rear-camera cleaning verification, and autonomous 24/7 operation without supervision.
              </p>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-indigo-400" />4-in-1 Cleaning Modes</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-indigo-400" />AI Spot Scrubbing</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-indigo-400" />Rear Camera Verification</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl" />
              <img
                src="/images/bots/pringle-cc1-robot.png"
                alt="PUDU CC1 PRO Features Deep Dive"
                className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4-in-1 Cleaning System */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-400 text-sm font-semibold mb-4">CLEANING VERSATILITY</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">4 Cleaning Modes, One Platform</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              No other commercial robot consolidates sweep, vacuum, mop, and scrub into a single unit that AI-selects the right mode per floor zone. Click each mode to see exactly what it does.
            </p>
          </div>

          {/* Tab row */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {cleaningModes.map((m, i) => (
              <button
                key={i}
                onClick={() => setActiveMode(i)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  activeMode === i
                    ? colorMap[m.color].tab + ' border-transparent'
                    : 'bg-bots-dark ' + colorMap[m.color].inactive
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${colorMap[m.color].dot}`} />
                {m.name}
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 max-w-3xl mx-auto">
            <div className="flex items-start gap-6">
              <div className={`w-14 h-14 ${activeColor.badge} rounded-xl flex items-center justify-center flex-shrink-0`}>
                {active.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-bold text-white">{active.name} Mode</h3>
                  <div className="text-right">
                    <div className={`text-2xl font-black ${activeColor.stat}`}>{active.stat}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wide">{active.statLabel}</div>
                  </div>
                </div>
                <p className="text-gray-300 leading-relaxed">{active.desc}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Spot Scrubbing */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-semibold mb-6">AI-POWERED</span>
              <h2 className="text-4xl font-bold text-white mb-6">AI Spot Scrubbing — Targets Dirt, Skips Clean Floors</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Traditional scrubbers clean at a fixed intensity everywhere — burning time, water, and detergent on already-clean surfaces. CC1 PRO's AI Spot Scrubbing detects problem zones in real-time and concentrates deep-scrub power exactly where it's needed.
              </p>
              <div className="space-y-5">
                {[
                  { title: 'Real-Time Stain Detection', desc: 'Onboard AI vision identifies stubborn stains, scuff marks, and dried spills while the robot navigates. No pre-mapping or manual flagging required.' },
                  { title: 'Variable Intensity Per Zone', desc: 'AI Cleaning Intensity Control scales brush pressure and water output from light maintenance to maximum scrub power — automatically. Light soil gets a light pass. Heavy grease gets the full treatment.' },
                  { title: '1,500–3,000 m²/h Focused Efficiency', desc: 'By concentrating scrubbing on problem spots instead of uniform full-coverage mode, CC1 PRO processes high-traffic areas up to 2x faster without sacrificing cleanliness standards.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 bg-bots-surface rounded-xl p-5 border border-gray-800">
                    <CheckCircle className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-1">{item.title}</p>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-purple-500/20">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: '17,000 Pa', sub: 'Max suction', color: 'indigo' },
                    { label: 'AI', sub: 'Stain detection', color: 'purple' },
                    { label: '4-in-1', sub: 'Mode switching', color: 'blue' },
                    { label: 'Auto', sub: 'Floor type detect', color: 'cyan' },
                  ].map((s, i) => (
                    <div key={i} className={`bg-bots-dark rounded-xl p-4 border border-${s.color}-500/20 text-center`}>
                      <div className={`text-2xl font-black text-${s.color}-400`}>{s.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-bots-dark rounded-xl p-5 border border-gray-800">
                  <p className="text-sm text-gray-400 leading-relaxed text-center">
                    CC1 PRO uses AI to detect carpet automatically — switching to vacuum-only mode instantly to protect carpet pile while still delivering 17,000 Pa deep clean.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* World's First Rear Camera Verification */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold mb-4">INDUSTRY FIRST</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">World's First Rear Camera Cleaning Verification</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Every other robot assumes the floor is clean after it passes. CC1 PRO checks. A rear-facing AI camera monitors cleanliness behind the robot in real time — and re-cleans automatically if anything was missed.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-green-500/20 hover:border-green-500/50 transition-colors">
              <div className="w-14 h-14 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <Camera className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Rear AI Camera</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                A dedicated rear-facing camera and AI model continuously evaluates the floor surface directly behind the robot's cleaning path. It checks for residual stains, missed streaks, and cleaning agent residue — the things human QC walkthroughs catch hours later.
              </p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-blue-500/20 hover:border-blue-500/50 transition-colors">
              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Auto Re-Clean Trigger</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                If the verification camera detects a problem zone after the first pass, CC1 PRO autonomously re-routes to cover that area again — immediately and without supervisor instruction. The cleaning mission continues; the problem is resolved in real time.
              </p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-indigo-500/20 hover:border-indigo-500/50 transition-colors">
              <div className="w-14 h-14 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-6">
                <Activity className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Cleaning Heatmaps</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Every session generates a floor-cleanliness heatmap showing which zones were clean, which triggered re-cleaning, and historical patterns. Facility managers can pinpoint chronic problem areas — grease traps, forklift turning zones, entrance vestibules — and adjust cleaning programs accordingly.
              </p>
            </div>
          </div>
          <div className="mt-10 bg-bots-dark rounded-2xl p-8 border border-green-500/20 text-center max-w-3xl mx-auto">
            <Shield className="w-10 h-10 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Zero-Guess Cleanliness Guarantee</h3>
            <p className="text-gray-400 leading-relaxed">
              No other commercial floor robot verifies its own work. The CC1 PRO rear camera system eliminates the need for post-shift manual inspection — shifting quality assurance from a human labor cost to an automated function that runs on every single mission.
            </p>
          </div>
        </div>
      </section>

      {/* VSLAM+ Navigation */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-indigo-500/20">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'VSLAM+', sub: 'LiDAR + Visual fusion', color: 'indigo' },
                    { label: 'No QR', sub: 'Codes needed', color: 'blue' },
                    { label: '3D', sub: 'Obstacle classification', color: 'purple' },
                    { label: 'Multi-floor', sub: 'Map management', color: 'cyan' },
                  ].map((s, i) => (
                    <div key={i} className={`bg-bots-dark rounded-xl p-4 border border-${s.color}-500/20 text-center`}>
                      <div className={`text-xl font-black text-${s.color}-400`}>{s.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-bots-dark rounded-xl p-5 border border-gray-800">
                  <p className="text-sm text-gray-400 text-center leading-relaxed">
                    Omni-Sense safety stops for both static obstacles and moving people — forklifts, carts, and pedestrians — simultaneously.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-400 text-sm font-semibold mb-6">VSLAM+ NAVIGATION</span>
              <h2 className="text-4xl font-bold text-white mb-6">LiDAR + Visual Fusion — No Infrastructure Required</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                VSLAM+ combines LiDAR sweep data with camera-based visual landmark recognition to build and maintain an accurate real-time map — no QR codes, no floor stickers, no retrofit infrastructure.
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Handles Complex Environments', desc: 'Grocery aisles, narrow warehouse corridors, open retail floors, and irregular hospital layouts — VSLAM+ adapts to any space on first run.' },
                  { title: 'Static + Dynamic Obstacle Avoidance', desc: 'Omni-Sense Safety simultaneously detects fixed obstacles and moving ones (people, carts, forklifts) with independent response logic for each.' },
                  { title: 'Breakpoint Resume', desc: 'If the robot needs to divert for charging, restock, or an emergency stop, it resumes exactly where it left off — no re-mapping, no lost progress.' },
                  { title: 'Multi-Floor Mapping', desc: 'Stores independent maps for every floor. Operators assign routes per level and schedule them independently — perfect for multi-story hospitals, hotels, and office buildings.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white text-sm">{item.title}</p>
                      <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 24/7 Autonomous Operation */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold mb-4">ZERO-SUPERVISION OPERATION</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">24/7 Autonomous Operation — No Human Required</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              CC1 PRO handles its own servicing between every mission — charging, water management, and brush maintenance — without operator intervention.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', time: 'Auto', action: 'Returns to docking station when battery is low or cleaning mission completes. Plugs in and charges without any human interaction.', title: 'Auto-Charging', color: 'green' },
              { step: '02', time: 'Optional', action: 'Optional docking station handles water refill and waste drainage automatically. No buckets, no mess, no scheduled manual water changes.', title: 'Water Refill/Drain', color: 'blue' },
              { step: '03', time: 'Instant', action: 'If an obstacle blocks the path mid-mission, CC1 PRO reroutes dynamically, completes the zone, and marks the obstacle for reporting.', title: 'Dynamic Rerouting', color: 'purple' },
              { step: '04', time: '5 hrs', action: 'Up to 5 hours of continuous runtime per charge — enough for large-facility full-coverage shifts in airports, hospitals, and distribution centers.', title: 'Runtime Per Charge', color: 'orange' },
            ].map((item, i) => (
              <div key={i} className={`bg-bots-dark rounded-2xl p-7 border border-${item.color}-500/20 hover:border-${item.color}-500/50 transition-colors flex flex-col`}>
                <div className={`text-xs font-black text-${item.color}-400 tracking-widest mb-3`}>STEP {item.step}</div>
                <div className={`text-4xl font-black text-${item.color}-400 mb-2`}>{item.time}</div>
                <h4 className="font-bold text-white text-base mb-3">{item.title}</h4>
                <p className="text-gray-400 text-sm leading-relaxed flex-1">{item.action}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 bg-bots-dark rounded-2xl p-8 border border-green-500/20 text-center max-w-3xl mx-auto">
            <Clock className="w-10 h-10 text-green-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-3">Runs During Off-Hours — No Shift Conflicts</h3>
            <p className="text-gray-400 leading-relaxed">
              Schedule CC1 PRO to clean during closing hours, overnight, or between customer-facing periods. The robot begins, completes, docks, and charges — staff arrive in the morning to a clean facility with a full mission report.
            </p>
          </div>
        </div>
      </section>

      {/* AI Component Self-Monitoring */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-semibold mb-6">PREDICTIVE MAINTENANCE</span>
              <h2 className="text-4xl font-bold text-white mb-6">AI Component Self-Monitoring</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                CC1 PRO monitors its own hardware health continuously — tracking brush wear, suction performance, battery degradation, and sensor calibration — and alerts facility managers before a failure interrupts operations.
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Brush Wear Tracking', desc: 'Monitors rotational resistance and suction performance to predict brush replacement before it impacts cleaning quality — not after.' },
                  { title: 'Suction Blockage Detection', desc: 'Detects airflow restriction caused by accumulated debris in the suction path and alerts operators immediately to prevent motor strain.' },
                  { title: 'Battery Health Reporting', desc: 'Tracks charge cycle count and capacity degradation, surfacing battery replacement recommendations before runtime drops noticeably.' },
                  { title: 'Remote Diagnostic Access', desc: 'All component health data is accessible via the PUDU Link app — facility managers see the robot\'s maintenance status from anywhere, without physical inspection.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 bg-bots-surface rounded-xl p-5 border border-gray-800">
                    <CheckCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white mb-1">{item.title}</p>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-cyan-500/20">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Brush', sub: 'Wear prediction', color: 'cyan' },
                    { label: 'Suction', sub: 'Blockage alert', color: 'blue' },
                    { label: 'Battery', sub: 'Health cycle', color: 'green' },
                    { label: 'Remote', sub: 'PUDU Link app', color: 'indigo' },
                  ].map((s, i) => (
                    <div key={i} className={`bg-bots-dark rounded-xl p-4 border border-${s.color}-500/20 text-center`}>
                      <div className={`text-lg font-black text-${s.color}-400`}>{s.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-bots-dark rounded-xl p-5 border border-gray-800">
                  <p className="text-sm text-gray-400 text-center leading-relaxed">
                    Predictive alerts — not reactive failures. CC1 PRO flags problems before they stop operations.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* IoT & Smart Features */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-full text-indigo-400 text-sm font-semibold mb-4">IoT & SMART PLATFORM</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Connected Facility Intelligence</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              CC1 PRO connects to PUDU's intelligent platform — a 10.1-inch onboard display, full remote monitoring, and actionable post-clean analytics.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-bots-dark rounded-2xl p-8 border border-indigo-500/20 hover:border-indigo-500/40 transition-colors">
              <div className="w-14 h-14 bg-indigo-600/20 rounded-xl flex items-center justify-center mb-6">
                <Smartphone className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">10.1" LCD Display</h3>
              <p className="text-gray-400 leading-relaxed">
                A large, high-visibility touchscreen shows current task, cleaning mode, zone map, and status at a glance. Operators can adjust tasks, pause missions, and review recent results directly on the robot — no app required for on-site management.
              </p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <Wifi className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Remote Monitoring</h3>
              <p className="text-gray-400 leading-relaxed">
                Full fleet visibility from PUDU Link — real-time location, current task, battery level, and water status for every robot across every floor. Managers monitor operations from their phone without being on-site.
              </p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-green-500/20 hover:border-green-500/40 transition-colors">
              <div className="w-14 h-14 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <Activity className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Cleaning Heatmaps</h3>
              <p className="text-gray-400 leading-relaxed">
                Post-session heatmaps overlay cleaning coverage and intensity onto your facility map. Identify high-traffic problem zones, verify SLA compliance, and optimize scheduling based on actual data — not guesswork.
              </p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors">
              <div className="w-14 h-14 bg-cyan-600/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Floor Cleanliness Tracking</h3>
              <p className="text-gray-400 leading-relaxed">
                AI assigns a cleanliness score to each zone after every session. Track trends over time — see if a zone is consistently being re-cleaned, whether foot traffic patterns changed, or whether a cleaning schedule adjustment is needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to See CC1 PRO in Action?</h2>
          <p className="text-xl text-white/90 mb-10">
            No spec sheet replaces watching CC1 PRO switch cleaning modes on the fly, re-clean a flagged zone automatically, and dock itself — all in your own facility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-indigo-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">
              Schedule a Demo
            </Link>
            <a href="/legacy-assets/6550hlup_CC1-cleaning-robot-brochure.pdf" target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2">
              <Download className="w-5 h-5" /> Download Brochure
            </a>
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

export default PuduCc1ProFeaturesPage;
