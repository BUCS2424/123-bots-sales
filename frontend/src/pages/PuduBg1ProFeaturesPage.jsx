import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ChevronRight, Download, Mail, Zap, Cpu, Wrench, Volume2, ArrowLeft, FlaskConical, Layers, Maximize2, Clock, Smartphone } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduBg1ProFeaturesPage = () => {
  const [activeConsumable, setActiveConsumable] = useState(0);

  const consumables = [
    {
      name: 'Scrubbing Disc Brush',
      desc: 'Heavy-duty rotating disc brush delivering 31 kg of downforce for deep scrubbing on hard floors. Compatible with both standard and aggressive cleaning settings. The auto-attachment mechanism means zero manual positioning — drops in under 10 seconds.',
      stat: '31 kg', statLabel: 'downforce rating',
      color: 'blue',
    },
    {
      name: 'Rubber Blade (Squeegee)',
      desc: 'High-durometer rubber squeegee collects dirty water behind the disc brushes with zero streaking. Snap-on design enables replacement without tools in under 30 seconds. Available in standard and heavy-duty variants.',
      stat: '< 30s', statLabel: 'replacement time',
      color: 'cyan',
    },
    {
      name: 'Scrubbing Pad',
      desc: 'Interchangeable with the disc brush for lighter daily maintenance or polishing cycles. The same auto-attachment system accepts pads — no adapter ring required. Ideal for sealed stone, vinyl, and epoxy floors.',
      stat: 'Tool-free', statLabel: 'swap in seconds',
      color: 'green',
    },
    {
      name: 'Side Brush',
      desc: 'Extends total cleaning width from 550 mm to 708 mm, sweeping debris from corners and along baseboards into the main path. Particularly effective in facilities with lots of racking, shelving, or wall-mounted equipment.',
      stat: '+158 mm', statLabel: 'width extension',
      color: 'purple',
    },
    {
      name: 'Sweeping Roller Brush',
      desc: 'Counter-rotating roller brush captures large dry debris, dust bunnies, and fine particles ahead of the disc scrubbers. Works in tandem with the One-Pass architecture to prevent debris from being pushed by the scrubbing water.',
      stat: 'One-Pass', statLabel: 'debris capture',
      color: 'orange',
    },
    {
      name: 'Trash Bin (5L)',
      desc: 'Quick-release 5L trash bin collects swept solids separately from the dirty water circuit. Snap-out removal means emptying takes under 15 seconds. Prevents debris from clogging dirty water drainage lines.',
      stat: '5 L', statLabel: '1.32 gal capacity',
      color: 'teal',
    },
  ];

  const optionalModes = [
    {
      icon: <Layers className="w-7 h-7 text-indigo-400" />,
      bg: 'bg-indigo-600/20',
      border: 'border-indigo-500/30',
      title: 'Dust Mopping (Optional)',
      desc: 'Add a microfiber mopping attachment for post-scrub dust pickup or standalone dry-floor maintenance in sensitive areas like lobbies, showrooms, or healthcare corridors where wet cleaning isn\'t always practical.',
      tag: 'Optional Add-On',
    },
    {
      icon: <Zap className="w-7 h-7 text-amber-400" />,
      bg: 'bg-amber-600/20',
      border: 'border-amber-500/30',
      title: 'Polishing (Optional)',
      desc: 'High-speed polishing pad mode for maintaining gloss on marble, terrazzo, and sealed concrete. Adds a premium finish without a separate machine — one robot handles scrubbing and polishing on the same scheduled run.',
      tag: 'Optional Add-On',
    },
    {
      icon: <Maximize2 className="w-7 h-7 text-pink-400" />,
      bg: 'bg-pink-600/20',
      border: 'border-pink-500/30',
      title: 'Edge Scrubbing (Standard)',
      desc: 'Unlike conventional scrubbers that leave a 5–10 cm gap along walls, the BG1 PRO\'s disc brush physically extends to reach walls and shelving edges. Dust and dirt along baseboards — historically a manual-touch-up zone — are fully automated.',
      tag: 'Industry First',
    },
  ];

  const colorMap = {
    blue: { tab: 'bg-blue-600 text-white', inactive: 'border-blue-500/30 text-blue-300 hover:border-blue-500/60', stat: 'text-blue-400', badge: 'bg-blue-600/20', dot: 'bg-blue-400' },
    cyan: { tab: 'bg-cyan-600 text-white', inactive: 'border-cyan-500/30 text-cyan-300 hover:border-cyan-500/60', stat: 'text-cyan-400', badge: 'bg-cyan-600/20', dot: 'bg-cyan-400' },
    green: { tab: 'bg-green-600 text-white', inactive: 'border-green-500/30 text-green-300 hover:border-green-500/60', stat: 'text-green-400', badge: 'bg-green-600/20', dot: 'bg-green-400' },
    purple: { tab: 'bg-purple-600 text-white', inactive: 'border-purple-500/30 text-purple-300 hover:border-purple-500/60', stat: 'text-purple-400', badge: 'bg-purple-600/20', dot: 'bg-purple-400' },
    orange: { tab: 'bg-orange-600 text-white', inactive: 'border-orange-500/30 text-orange-300 hover:border-orange-500/60', stat: 'text-orange-400', badge: 'bg-orange-600/20', dot: 'bg-orange-400' },
    teal: { tab: 'bg-teal-600 text-white', inactive: 'border-teal-500/30 text-teal-300 hover:border-teal-500/60', stat: 'text-teal-400', badge: 'bg-teal-600/20', dot: 'bg-teal-400' },
  };

  const active = consumables[activeConsumable];
  const activeColor = colorMap[active.color];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.3),transparent_50%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <Link to="/pudu-bg1-pro" className="inline-flex items-center gap-2 text-gray-400 hover:text-blue-400 transition-colors mb-8 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back to BG1 PRO
          </Link>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-6">
                Dual-Chip · 3D Vision Computing · AI-Native
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Every Feature of the <span className="text-blue-400">BG1 PRO</span>, Explained
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Beyond the headline specs — this page covers what the PUDU BG1 PRO does that no other commercial scrubber can: extendable edge cleaning, sub-minute maintenance, safety alerting, optional polish modes, and a consumables system built for zero-downtime operations.
              </p>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-400" />Extendable Edge Brush</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-400" />&lt; 1 Min Maintenance</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-400" />6 Consumable Types</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl" />
              <img
                src="/images/bots/pudu-bg1-pro.png"
                alt="PUDU BG1 PRO Features Deep Dive"
                className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dual-Chip Computing Engine */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-4">COMPUTING ARCHITECTURE</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Dual-Chip · 3D Vision Computing Engine</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The BG1 PRO isn't running navigation software retrofitted onto off-the-shelf hardware. It's built on a purpose-designed dual-chip platform with a dedicated 3D vision computing engine — purpose-built for high-throughput real-time AI at the edge.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-blue-500/20 hover:border-blue-500/50 transition-colors">
              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <Cpu className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Dual-Chip Processing</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Two dedicated processing chips — one for real-time navigation and SLAM, one for AI vision inference. Neither competes for resources. The result: AI Spot Cleaning and 3D LiDAR navigation run simultaneously at full performance, not throttled by a shared CPU.
              </p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-purple-500/20 hover:border-purple-500/50 transition-colors">
              <div className="w-14 h-14 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">3D Vision at the Edge</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                The dedicated vision computing engine processes RGBD depth data, AI dirt detection, and obstacle classification in real-time — onboard, without cloud dependency. This enables sub-second Spot Cleaning activation and split-second obstacle avoidance even without network connectivity.
              </p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-green-500/20 hover:border-green-500/50 transition-colors">
              <div className="w-14 h-14 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <FlaskConical className="w-7 h-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Millions of Hours of Training</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                PUDU's AI models are forged from millions of real-world operational hours across their global fleet. The BG1 PRO's adaptive algorithms have encountered and learned from virtually every floor type, debris pattern, and facility layout — arriving at your site already trained.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Extendable Edge Cleaning */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-orange-600/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-semibold mb-6">INDUSTRY FIRST</span>
              <h2 className="text-4xl font-bold text-white mb-6">Extendable Edge Cleaning — No More Manual Touch-Ups</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Every conventional floor scrubber leaves a 5–10 cm dead zone along walls, shelves, and racking. Operators manually mop this strip daily. The BG1 PRO eliminates it entirely with an industry-first expandable disc-brush system that physically extends to reach edges on command.
              </p>
              <div className="space-y-5">
                <div className="flex items-start gap-4 bg-bots-surface rounded-xl p-5 border border-gray-800">
                  <CheckCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">Reaches Walls & Shelving Edges</p>
                    <p className="text-gray-400 text-sm">The brush physically extends outward — not just a side brush angled in, but the main scrubbing element reaching the edge. Removes dust and built-up grime directly along baseboards.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-bots-surface rounded-xl p-5 border border-gray-800">
                  <CheckCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">Eliminates the Manual Mopping Strip</p>
                    <p className="text-gray-400 text-sm">In warehouses, retail, and airports — the strip along walls is the most labor-intensive to clean manually. BG1 PRO automates it on every single pass.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-bots-surface rounded-xl p-5 border border-gray-800">
                  <CheckCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white mb-1">Combined with Side Brushes</p>
                    <p className="text-gray-400 text-sm">Side brushes sweep debris into the main path while the extendable disc brush scrubs the last centimeters — a double-action edge system no competitor offers.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-orange-500/20">
                <img src="/images/bots/pudu-bg1-ride-on-platform.png" alt="BG1 PRO Extendable Edge Cleaning" className="w-full h-auto rounded-xl" />
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="bg-bots-dark rounded-xl p-4 border border-gray-800 text-center">
                    <div className="text-2xl font-black text-orange-400">550 mm</div>
                    <div className="text-xs text-gray-500 mt-1">Base scrub width</div>
                  </div>
                  <div className="bg-bots-dark rounded-xl p-4 border border-gray-800 text-center">
                    <div className="text-2xl font-black text-orange-400">708 mm</div>
                    <div className="text-xs text-gray-500 mt-1">With side brushes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-Minute Maintenance */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold mb-4">ZERO-DOWNTIME DESIGN</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Complete Routine Maintenance in Under 1 Minute</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              The BG1 PRO's snap-on consumable architecture was engineered from the ground up so operators spend zero time on setup and next to no time on upkeep. No tools. No training. No downtime.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: '01', time: '< 10s', action: 'Disc brush drops onto auto-attachment mount — no alignment, no clips, no manual positioning required.', title: 'Auto Brush Attachment', color: 'green' },
              { step: '02', time: '< 30s', action: 'Rubber squeegee blade snaps in without tools. Replacement cycle is so fast it can happen mid-shift without stopping operations.', title: 'Snap-On Squeegee', color: 'blue' },
              { step: '03', time: '< 15s', action: 'The 5L snap-out trash bin clears in seconds. No bag liners, no secondary containers — direct disposal keeps the maintenance cycle clean.', title: 'Quick-Release Trash Bin', color: 'purple' },
              { step: '04', time: 'Auto', action: 'The all-in-one docking station handles water refill, waste drainage, charging, and brush self-cleaning automatically between every shift.', title: 'Docking Auto-Service', color: 'orange' },
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
            <h3 className="text-2xl font-bold text-white mb-3">Total Routine Maintenance: Under 1 Minute</h3>
            <p className="text-gray-400 leading-relaxed">
              Traditional commercial scrubbers require 15–30 minutes of daily setup and teardown. BG1 PRO reduces this to under a minute — recovering more than <strong className="text-white">100 hours of labor per year</strong> in a typical large-facility deployment.
            </p>
          </div>
        </div>
      </section>

      {/* Dual Agent Dosing System */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-teal-500/20">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: '7 L', sub: 'Dual tank total', color: 'teal' },
                    { label: 'mL', sub: 'Dosing accuracy', color: 'blue' },
                    { label: 'Auto', sub: 'Floor-type detection', color: 'green' },
                  ].map((s, i) => (
                    <div key={i} className={`bg-bots-dark rounded-xl p-4 border border-${s.color}-500/20 text-center`}>
                      <div className={`text-2xl font-black text-${s.color}-400`}>{s.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{s.sub}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-bots-dark rounded-xl p-6 border border-gray-800">
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Two independent agent tanks allow you to load two different cleaning formulas — one for general maintenance, one for heavy-duty degreasing or disinfection — and the AI selects the right blend automatically based on detected floor conditions.
                  </p>
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-teal-600/20 border border-teal-500/30 rounded-full text-teal-400 text-sm font-semibold mb-6">AI AUTO-DOSING</span>
              <h2 className="text-4xl font-bold text-white mb-6">Dual 7L Agent Tanks with Milliliter-Level Precision</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                Manual scrubbers rely on operators to mix and pour cleaning agents — introducing human error, waste, and inconsistency. The BG1 PRO's AI-Native Auto-dosing System eliminates this entirely.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Scales to Floor Conditions</p>
                    <p className="text-gray-400 text-sm mt-1">Light soil = minimal agent. Heavy grease zones = maximum concentration. The robot matches dosing to what the floor actually needs — not a fixed program set by a supervisor.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Minimizes Chemical Waste</p>
                    <p className="text-gray-400 text-sm mt-1">Milliliter-level accuracy prevents over-dosing — a common issue with manual machines that wastes chemicals, leaves residue, and creates slippery floors.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <CheckCircle className="w-6 h-6 text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Two Formulas, One Robot</p>
                    <p className="text-gray-400 text-sm mt-1">Dual independent tanks let you load general maintenance and heavy-duty formulas simultaneously. The AI blends and selects based on zone and soil level detected by the vision system.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audio-Visual Safety Alerts */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-yellow-600/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-semibold mb-4">HUMAN-ROBOT INTERACTION</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Built to Work Alongside People Safely</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              In busy facilities, a cleaning robot sharing space with foot traffic and vehicles needs to communicate. The BG1 PRO does this actively — not passively.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-bots-dark rounded-2xl p-8 border border-yellow-500/20 hover:border-yellow-500/40 transition-colors">
              <div className="w-14 h-14 bg-yellow-600/20 rounded-xl flex items-center justify-center mb-6">
                <Volume2 className="w-7 h-7 text-yellow-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Audio Alerts</h3>
              <p className="text-gray-400 leading-relaxed">
                Integrated sound cues broadcast the robot's intentions before it moves, turns, or crosses an intersection. Pedestrians hear the robot before they see it — critical in high-traffic corridors, around blind corners, and in noisy warehouse environments.
              </p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-blue-500/20 hover:border-blue-500/40 transition-colors">
              <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-4">Light Signal System</h3>
              <p className="text-gray-400 leading-relaxed">
                Color-coded light signals communicate operational status at a glance — cleaning, navigating, docking, obstacle detected, or waiting for right-of-way. Vehicles and forklifts can read the robot's state without needing to approach or stop operations.
              </p>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-green-500/20 hover:border-green-500/40 transition-colors md:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4">Proactive Right-of-Way Communication</h3>
              <p className="text-gray-400 leading-relaxed max-w-2xl">
                The BG1 PRO doesn't just stop for people — it <em className="text-white">tells</em> them what it's about to do. This reduces hesitation, eliminates awkward stop-and-go interactions, and keeps both the robot and human workers moving efficiently. In airports, shopping centers, and busy warehouses, this distinction matters operationally.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Optional Cleaning Modes */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-2 bg-purple-600/20 border border-purple-500/30 rounded-full text-purple-400 text-sm font-semibold mb-4">CLEANING VERSATILITY</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Beyond Scrubbing — Optional Capability Modes</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              One robot platform, three cleaning disciplines. Add capabilities as your facility needs change.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {optionalModes.map((mode, i) => (
              <div key={i} className={`bg-bots-surface rounded-2xl p-8 border ${mode.border} hover:scale-[1.02] transition-transform`}>
                <div className={`w-14 h-14 ${mode.bg} rounded-xl flex items-center justify-center mb-6`}>{mode.icon}</div>
                <span className={`inline-block px-3 py-1 ${mode.bg} rounded-full text-xs font-semibold mb-4 ${mode.bg.replace('bg-','text-').replace('/20','-300')}`}>{mode.tag}</span>
                <h3 className="text-xl font-bold text-white mb-4">{mode.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{mode.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Consumables Ecosystem */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-4">CONSUMABLES SYSTEM</span>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">6 Consumables, All Tool-Free</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Every wearable component on the BG1 PRO swaps without tools. Click each consumable to understand what it does and when to replace it.
            </p>
          </div>

          {/* Tab row */}
          <div className="flex flex-wrap gap-2 justify-center mb-10">
            {consumables.map((c, i) => (
              <button
                key={i}
                onClick={() => setActiveConsumable(i)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
                  activeConsumable === i
                    ? colorMap[c.color].tab + ' border-transparent'
                    : 'bg-bots-dark ' + colorMap[c.color].inactive
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${colorMap[c.color].dot}`} />
                {c.name}
              </button>
            ))}
          </div>

          {/* Detail panel */}
          <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 max-w-3xl mx-auto">
            <div className="flex items-start gap-6">
              <div className={`w-14 h-14 ${activeColor.badge} rounded-xl flex items-center justify-center flex-shrink-0`}>
                <Wrench className={`w-7 h-7 ${activeColor.stat}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-bold text-white">{active.name}</h3>
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

      {/* PUDU Link App */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-6">PUDU LINK APP</span>
              <h2 className="text-4xl font-bold text-white mb-6">Fleet Intelligence in Your Pocket</h2>
              <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                PUDU Link is the fleet management platform that connects directly to your BG1 PRO fleet. Monitor, schedule, and review performance from any device — without ever needing to be on-site.
              </p>
              <div className="space-y-4">
                {[
                  { title: 'Real-Time Robot Status', desc: 'See every robot\'s current task, location, battery level, and water status on a live facility map.' },
                  { title: 'Schedule & Dispatch', desc: 'Set recurring cleaning schedules, define cleaning zones, and dispatch ad-hoc tasks from the app.' },
                  { title: 'Post-Clean Reports', desc: 'Review coverage maps, cleaning efficiency scores, and trouble-zone history after every completed task.' },
                  { title: 'Alert Management', desc: 'Receive push notifications for low water, completed tasks, errors, or unusual activity patterns.' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 bg-bots-surface rounded-xl p-5 border border-gray-800">
                    <CheckCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-white text-sm mb-1">{item.title}</p>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-10 border border-blue-500/20 text-center">
                <Smartphone className="w-16 h-16 text-blue-400 mx-auto mb-6" />
                <div className="text-3xl font-black text-white mb-2">PUDU Link</div>
                <div className="text-gray-400 mb-8">Available on iOS & Android</div>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: '4G LTE', sub: 'Remote monitoring' },
                    { label: 'Wi-Fi', sub: 'On-site management' },
                    { label: 'Bluetooth', sub: 'Direct robot pairing' },
                    { label: 'API', sub: 'BMS integration' },
                  ].map((c, i) => (
                    <div key={i} className="bg-bots-dark rounded-xl p-4 border border-gray-800 text-center">
                      <div className="text-blue-400 font-bold">{c.label}</div>
                      <div className="text-gray-500 text-xs mt-1">{c.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Voltage-Adaptive Charging */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold mb-4">POWER SYSTEM</span>
            <h2 className="text-4xl font-bold text-white mb-6">Voltage-Adaptive Smart Charging</h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              The BG1 PRO's 90 Ah battery system (48V platform) automatically detects available mains voltage and adjusts charging behavior accordingly.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-bots-dark rounded-2xl p-8 border border-green-500/20 text-center">
              <div className="text-5xl font-black text-green-400 mb-2">3 hrs</div>
              <div className="text-white font-semibold mb-2">High Voltage Charging</div>
              <div className="text-gray-400 text-sm">AC ≥ 180V supply — standard in most commercial facilities. Fastest charge cycle supports three full shifts per day.</div>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-blue-500/20 text-center">
              <div className="text-5xl font-black text-blue-400 mb-2">4.5 hrs</div>
              <div className="text-white font-semibold mb-2">Low Voltage Charging</div>
              <div className="text-gray-400 text-sm">AC ≤ 180V supply — older installations or rural facilities. Still enables two full-shift cycles per day with 7.5h runtime.</div>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-purple-500/20 text-center">
              <div className="text-5xl font-black text-purple-400 mb-2">Auto</div>
              <div className="text-white font-semibold mb-2">Voltage Detection</div>
              <div className="text-gray-400 text-sm">No manual configuration required. The system automatically detects supply voltage and optimizes the charge curve — deploy anywhere without electrical modifications.</div>
            </div>
          </div>
          <div className="mt-8 bg-bots-dark rounded-2xl p-6 border border-gray-800 text-center">
            <p className="text-gray-400 text-sm">Battery platform: <strong className="text-white">90 Ah @ 48V</strong> (equivalent to 180 Ah @ 24V) — industry-leading energy density for the BG1 PRO's weight class</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to See It in Person?</h2>
          <p className="text-xl text-white/90 mb-10">
            No spec sheet replaces watching the BG1 PRO extend its edge brush, auto-attach a fresh disc, and brief your team with audio-visual cues — all in your own facility.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">
              Schedule a Demo
            </Link>
            <a href="/brochures/123-bg1-pro-brochure.pdf" target="_blank" rel="noopener noreferrer" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2">
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

export default PuduBg1ProFeaturesPage;
