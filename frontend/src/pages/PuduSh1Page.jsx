import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduSh1Page = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU SH1 | Smart Manual Scrubber with 27kg Downforce | 123 Bots',
      description: 'Professional cleaning made simple. PUDU SH1 features 27kg downforce, 350 RPM brush speed, 1,600 m²/h productivity — 70% faster than traditional mops.',
      keywords: 'pudu sh1, manual scrubber, smart scrubber, 27kg downforce, professional cleaning, walk-behind scrubber',
    });
  }, []);

  const faqs = [
    {
      question: 'Who is the SH1 designed for?',
      answer: 'The SH1 is designed for facility staff who need professional-grade floor scrubbing results without the complexity of an autonomous robot. It\'s ideal for schools, small retail stores, restaurants, healthcare clinics, and any facility where an operator walks the space. The walk-behind design means staff already familiar with traditional mops can operate it within minutes — no technical training required.',
    },
    {
      question: 'How does 27kg downforce compare to traditional mops?',
      answer: 'A traditional mop applies roughly 3–5kg of pressure from a human pushing down. The SH1\'s mechanical downforce system delivers a consistent 27kg of brush pressure — 5–9x more than manual mopping — while requiring zero physical effort from the operator. This is what enables it to lift embedded grime, scuff marks, and dried-on stains that a mop just smears around.',
    },
    {
      question: 'What are the 7 cleaning modes?',
      answer: 'The 7 modes span a range from light maintenance to intensive deep cleaning: Dry Sweep, Light Scrub, Standard Scrub, Deep Scrub, Wet Mop, Scrub+Vacuum, and Auto-Select. Auto-Select mode uses the onboard AI to analyze floor condition and select the optimal mode automatically — ideal when different zones have different soil levels. All modes are accessible from the 4.2-inch touchscreen display.',
    },
    {
      question: 'How does the 20kPa suction keep floors dry?',
      answer: 'After the scrubbing brushes clean the floor, the SH1\'s rear squeegee system channels dirty water into the collection path, where 20kPa vacuum suction extracts it from the floor surface in a single pass. The result is a floor that is visually dry and safe to walk on within seconds — eliminating the wet-floor slip hazard that traditional mop-and-bucket cleaning creates for 15–30 minutes.',
    },
    {
      question: 'How long does the battery last?',
      answer: 'The SH1 battery delivers approximately 2–3 hours of continuous cleaning per charge, covering up to 4,800 m² on a full charge at standard coverage speed. Charging takes approximately 3–4 hours. For facilities with multi-shift cleaning needs, a spare battery enables hot-swapping for uninterrupted operation.',
    },
    {
      question: 'Is the SH1 suitable for all floor types?',
      answer: 'Yes. The SH1 works on virtually all hard floor surfaces: sealed concrete, ceramic and porcelain tile, vinyl/LVT, epoxy-coated floors, terrazzo, and hardwood (in appropriate low-moisture modes). The brush pressure and water output adjust per mode — light modes for sensitive surfaces, intensive modes for high-traffic industrial floors. It is not designed for carpet.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-orange-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(234,88,12,0.3),transparent_50%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-orange-600/20 border border-orange-500/30 rounded-full text-orange-400 text-sm font-semibold mb-6">
                Smart Walk-Behind Scrubber
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Professional Cleaning <span className="text-orange-400">Made Simple</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                The power of a commercial scrubber with the simplicity of a mop. SH1 delivers 27kg of mechanical downforce, 350 RPM brush speed, and 7 AI-selected cleaning modes — making it 70% faster than traditional mopping with zero learning curve.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="#download"
                  className="px-8 py-4 bg-orange-600 text-white font-bold rounded-full hover:bg-orange-500 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download Brochure
                </a>
                <Link
                  to="/schedule-a-demo"
                  className="px-8 py-4 bg-bots-surface border-2 border-orange-500 text-white font-bold rounded-full hover:bg-orange-500/20 transition-colors text-center"
                >
                  Book a Demo
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-400" />27kg Downforce</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-400" />350 RPM Brush Speed</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-orange-400" />1,600 m²/h Coverage</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-3xl" />
              <img
                src="/images/bots/robot-pudush.png"
                alt="PUDU SH1 Smart Walk-Behind Scrubber"
                className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Feature Overview */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Professional Power. Zero Complexity.
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Industrial-grade cleaning performance in a walk-behind form factor any staff member can operate from day one
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-orange-500/50 transition-colors">
              <div className="w-16 h-16 bg-orange-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">27kg Mechanical Downforce</h3>
              <p className="text-gray-400 mb-4">
                5–9x more pressure than manual mopping, delivered consistently without operator effort. Embedded grime, scuff marks, and dried stains lift on first pass — no re-mopping required.
              </p>
              <a href="#capabilities" className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-2">
                Learn More <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">7 AI-Assisted Cleaning Modes</h3>
              <p className="text-gray-400 mb-4">
                From dry sweep to intensive deep scrub. Auto-Select mode analyzes floor condition and picks the right program automatically — operators just push and the SH1 adapts.
              </p>
              <a href="#capabilities" className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-2">
                See All Modes <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">20kPa Instant-Dry Suction</h3>
              <p className="text-gray-400 mb-4">
                Rear squeegee + 20kPa vacuum extracts dirty water from the floor in the same pass. Floors are dry and safe to walk on within seconds — no wet-floor hazard, no waiting.
              </p>
              <a href="#specs" className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-2">
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
              Built for Real-World Facilities
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From retail floors to hospital corridors, SH1 outperforms traditional cleaning in every environment
            </p>
          </div>

          {/* Capability 1: Deep Clean Performance */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-orange-600/20 rounded-full text-orange-400 text-sm font-semibold mb-4">
                DEEP CLEAN PERFORMANCE
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                27kg Downforce + 350 RPM — See the Difference
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Watch what consistent 27kg brush pressure does to a floor that's been mopped every day but never truly cleaned. The SH1's rotating disc brushes at 350 RPM agitate embedded grime at a mechanical level — the kind of deep clean that requires hours of hand-scrubbing or expensive professional service to replicate without it.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Lifts embedded grease, scuff marks, and dried spills on first pass</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">Zero operator effort — mechanical downforce requires no pushing force</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                  <span className="text-gray-300">1,600 m²/h — covers a 40,000 sq ft facility in under 2.5 hours</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video rounded-xl overflow-hidden">
                  <video
                    controls
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                  >
                    <source src="/legacy-assets/vru5rdjt_pudu-sh1-main.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: 7 Cleaning Modes */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gradient-to-br from-green-900/40 to-green-700/20 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src="/images/bots/robot-pudush.png"
                    alt="PUDU SH1 7 Cleaning Modes"
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">
                INTELLIGENT VERSATILITY
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                7 Cleaning Modes — One Machine for Every Floor Condition
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                No other walk-behind scrubber gives operators this range. SH1 covers every cleaning scenario — from morning dry sweeps to end-of-day deep scrubs — through a 4.2-inch touchscreen that any staff member can use without training. Auto-Select mode handles mode choice automatically based on floor condition detection.
              </p>
              <div className="bg-orange-600/10 border border-orange-500/30 rounded-xl p-6">
                <p className="text-orange-300 italic mb-2">
                  "We used to send crews in twice — once to mop, once to scrub. Now one person with the SH1 does it all in a single pass and the floors actually look clean. We cut cleaning labor by 40% in the first month."
                </p>
                <p className="text-gray-400 text-sm">— Operations Supervisor, Regional Hotel Chain</p>
              </div>
            </div>
          </div>

          {/* Capability 3: Smart Water Management */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 rounded-full text-blue-400 text-sm font-semibold mb-4">
                SMART WATER MANAGEMENT
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Precision Water Dosing — No Over-Wetting, No Residue
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Traditional scrubbers either flood the floor (damaging hardwood and LVT) or run dry (leaving residue). SH1's AI-controlled water dosing system dispenses exactly the right amount of water per floor type and soil level — protecting sensitive surfaces while maximizing cleaning effectiveness.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-orange-400 mb-2">70%</div>
                  <div className="text-gray-400 text-sm">faster than traditional mopping</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800">
                  <div className="text-4xl font-bold text-blue-400 mb-2">20kPa</div>
                  <div className="text-gray-400 text-sm">suction for instant-dry floors</div>
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
                    className="w-full h-full object-cover"
                  >
                    <source src="/legacy-assets/vru5rdjt_pudu-sh1-main.mp4" type="video/mp4" />
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 4: Ergonomic Design */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gradient-to-br from-purple-900/40 to-purple-700/20 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src="/images/bots/robot-pudush.png"
                    alt="PUDU SH1 Ergonomic Design"
                    className="w-full h-full object-contain p-4"
                  />
                </div>
              </div>
            </div>
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">
                STAFF-FIRST DESIGN
              </span>
              <h3 className="text-3xl font-bold text-white mb-6">
                Ergonomic Build — No Fatigue, No Training Required
              </h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                The SH1 was designed around the operator. Adjustable handle height accommodates any user, zero downforce effort eliminates back strain from pushing, and the 4.2-inch touchscreen puts everything one tap away. Staff who've used a mop can operate the SH1 effectively within 10 minutes — no certification or technical training needed.
              </p>
              <div className="space-y-4">
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Zero Physical Downforce Effort</div>
                  <div className="text-gray-400 text-sm">Machine applies all 27kg of pressure — operator just guides direction</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">4.2" Touchscreen Control</div>
                  <div className="text-gray-400 text-sm">All 7 modes, water dosing, and status on one intuitive display</div>
                </div>
                <div className="bg-bots-surface rounded-xl p-4 border border-gray-800">
                  <div className="font-bold text-white mb-1">Compact Maneuverability</div>
                  <div className="text-gray-400 text-sm">Tight turning radius handles narrow corridors, restrooms, and elevator lobbies</div>
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
              More than a scrubber — backed by an integrated support and management platform
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-orange-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden">
                <img src="/legacy-assets/sy01od6d_fleet-management.png" alt="Fleet Management Dashboard" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Fleet Management</h3>
                <p className="text-gray-400 mb-6">
                  Track usage, cleaning coverage, and productivity for every SH1 unit across your facility. Real-time reporting, maintenance alerts, and shift performance analytics from any device.
                </p>
                <a href="#" className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-2">
                  Learn More <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-orange-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden">
                <img src="/legacy-assets/qslij3kb_IoT-smart-features.jpg" alt="IoT Smart Features" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">IoT Integration</h3>
                <p className="text-gray-400 mb-6">
                  Connect SH1 to your facility management system. Monitor water usage, cleaning hours, brush wear, and battery cycles remotely — predictive maintenance before problems occur.
                </p>
                <a href="#" className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-2">
                  Explore Features <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-orange-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden">
                <img src="/legacy-assets/76r9l5p9_pudu-bg1-expert-support.png" alt="Expert Support" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Expert Support</h3>
                <p className="text-gray-400 mb-6">
                  From initial setup to ongoing operation — our team provides site assessment, cleaning plan optimization, staff training, and dedicated technical support to keep your SH1 performing at peak.
                </p>
                <Link to="/contact" className="text-orange-400 hover:text-orange-300 font-semibold flex items-center gap-2">
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
              <h3 className="text-2xl font-bold text-white mb-6">Cleaning Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Brush Downforce</span><span className="text-white font-semibold">27 kg</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Brush Speed</span><span className="text-white font-semibold">350 RPM</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Productivity</span><span className="text-white font-semibold">1,600 m²/h (17,222 ft²/h)</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Suction Power</span><span className="text-white font-semibold">20 kPa</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Features & Controls</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Cleaning Modes</span><span className="text-white font-semibold">7 (incl. Auto-Select)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Display</span><span className="text-white font-semibold">4.2" color touchscreen</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Water Dosing</span><span className="text-white font-semibold">AI-controlled precision dosing</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Operation Type</span><span className="text-white font-semibold">Walk-behind manual</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Power & Tanks</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Battery Runtime</span><span className="text-white font-semibold">~2–3 hours</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Charge Time</span><span className="text-white font-semibold">~3–4 hours</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Clean Water Tank</span><span className="text-white font-semibold">~15 L</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Dirty Water Tank</span><span className="text-white font-semibold">~15 L</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Floor Compatibility</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Sealed Concrete</span><span className="text-white font-semibold">All modes</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Ceramic / Porcelain Tile</span><span className="text-white font-semibold">All modes</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Vinyl / LVT / Epoxy</span><span className="text-white font-semibold">All modes</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Hardwood / Terrazzo</span><span className="text-white font-semibold">Low-moisture modes</span></div>
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
            <p className="text-xl text-gray-300">Get answers to common questions about PUDU SH1</p>
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
                    ? <ChevronUp className="w-6 h-6 text-orange-400 flex-shrink-0" />
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

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-red-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Upgrade Your Cleaning</h2>
          <p className="text-xl text-white/90 mb-10">
            Experience professional scrubbing power with mop-like simplicity. See why facilities worldwide choose PUDU SH1.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-orange-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg">
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

export default PuduSh1Page;
