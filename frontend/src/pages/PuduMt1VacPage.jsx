import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduMt1VacPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU MT1 VAC | Triple-Mode Sweeper-Vacuum Robot | 123 Bots',
      description: 'Sweep, vacuum, and dust mop in one robot. PUDU MT1 VAC features H11 HEPA filtration, 14L dust capacity, dual-fan 200% suction boost, and AI spot detection for airports, malls, and offices.',
      keywords: 'pudu mt1 vac, triple mode vacuum, hepa filter robot, commercial vacuum robot, autonomous sweeper',
    });
  }, []);

  const faqs = [
    {
      question: 'What does "triple-mode" cleaning mean?',
      answer: 'The MT1 VAC combines three functions in one machine: sweeping (side brushes collect large debris), vacuuming (dual-fan deep suction pulls embedded dirt), and dust mopping (light maintenance and polishing). One robot replaces multiple single-purpose machines.',
    },
    {
      question: 'How effective is the HEPA filtration?',
      answer: 'The MT1 VAC uses an H11 HEPA-grade filter that captures 98%+ of particles down to 0.3 µm. Paired with its dual independent air-duct fans (a 200% efficiency boost), it removes fine dust and improves air quality in busy public spaces.',
    },
    {
      question: 'What surfaces and environments is it built for?',
      answer: 'It is multi-surface capable and ideal for high-traffic commercial environments — airports, shopping malls, hotels and casinos, metro stations, hospitals, office buildings, and large retail. It handles a 55cm vacuum width (70cm with side brushes) and climbs 20mm / 8° thresholds.',
    },
    {
      question: 'How long does it run and how does it recharge?',
      answer: 'The MT1 VAC runs 3–6.5 hours (about 4 hours standard) on its 45 Ah battery and recharges in under 3.5 hours. Auto-docking supports scheduled, hands-off 24/7 operation.',
    },
    {
      question: 'Does it clean intelligently or just follow a route?',
      answer: 'It uses AI vision recognition for smart spot detection — automatically identifying and targeting trash and dirty areas for up to a 500% efficiency gain. VSLAM + LiDAR SLAM navigation handles obstacle avoidance and complex layouts.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark" data-testid="pudu-mt1-vac-page">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-green-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(34,197,94,0.3),transparent_50%)]" /></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full text-green-400 text-sm font-semibold mb-6">AI Triple-Mode Sweeper-Vacuum</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Sweep, Vacuum, Mop— <span className="text-green-400">All in One</span></h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">Triple-mode cleaning for mixed-surface facilities. With 14L dust capacity, dual-fan deep vacuuming (200% boost), H11 HEPA filtration, and AI spot detection, the MT1 VAC keeps airports, malls, and offices spotless — and the air cleaner.</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="/brochures/123-pudu-mt1-vac-brochure.pdf" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-green-600 text-white font-bold rounded-full hover:bg-green-500 transition-colors flex items-center justify-center gap-2" data-testid="mt1vac-download-brochure"><Download className="w-5 h-5" />Download Brochure</a>
                <Link to="/schedule-a-demo" className="px-8 py-4 bg-bots-surface border-2 border-green-500 text-white font-bold rounded-full hover:bg-green-500/20 transition-colors text-center" data-testid="mt1vac-book-demo">Book a Demo</Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />H11 HEPA</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />14L Capacity</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-400" />200% Suction Boost</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-3xl" />
              <img src="/images/bots/pudu-mt1-vac.png" alt="PUDU MT1 VAC Triple-Mode Cleaning Robot" className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Three Cleaning Modes, One Machine</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Versatility to handle any floor type and debris — with air-quality benefits built in</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6"><svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg></div>
              <h3 className="text-2xl font-bold text-white mb-4">Sweeping Mode</h3>
              <p className="text-gray-400 mb-4">Side brushes collect dust and large debris into 14L dual dust bags. Ideal for daily maintenance across expansive hard floors.</p>
              <a href="#capabilities" className="text-green-400 hover:text-green-300 font-semibold flex items-center gap-2">Learn More <ChevronRight className="w-4 h-4" /></a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6"><svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
              <h3 className="text-2xl font-bold text-white mb-4">Vacuum Mode</h3>
              <p className="text-gray-400 mb-4">Dual-fan deep vacuuming with 200% suction boost. H11 HEPA filtration captures 98%+ of 0.3µm particles for measurably cleaner air.</p>
              <a href="#capabilities" className="text-green-400 hover:text-green-300 font-semibold flex items-center gap-2">See It in Action <ChevronRight className="w-4 h-4" /></a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6"><svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>
              <h3 className="text-2xl font-bold text-white mb-4">Dust Mopping Mode</h3>
              <p className="text-gray-400 mb-4">Light maintenance mopping and polishing keeps floors looking fresh between deep-clean cycles — all from the same autonomous unit.</p>
              <a href="#specs" className="text-green-400 hover:text-green-300 font-semibold flex items-center gap-2">View Specifications <ChevronRight className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section id="capabilities" className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Deep Clean, Cleaner Air</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Engineered for the dust, foot traffic, and air-quality demands of large public spaces</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">DEEP SUCTION POWER</span>
              <h3 className="text-3xl font-bold text-white mb-6">Dual-Fan 200% Suction Boost</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">Two independent air-duct fans deliver a 200% efficiency boost over traditional cleaners, pulling embedded dirt from grout lines and textured surfaces. The H11 HEPA-grade filter locks in fine particles for healthier indoor air.</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" /><span className="text-gray-300">98%+ capture of 0.3µm particles</span></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" /><span className="text-gray-300">55cm vacuum width (70cm with side brushes)</span></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" /><span className="text-gray-300">Quiet operation under 75 dB</span></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <video controls playsInline preload="metadata" poster="/images/bots/pudu-mt1-vac.png" className="w-full h-full object-cover rounded-xl">
                    <source src="/videos/mt1-vac-cleaning.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src="/images/bots/pudu-mt1-vac-hepa.png" alt="PUDU MT1 VAC HEPA Filtration System" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.currentTarget.src = '/images/bots/pudu-mt1-vac.png'; }} />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-blue-600/20 rounded-full text-blue-400 text-sm font-semibold mb-4">AI SPOT DETECTION</span>
              <h3 className="text-3xl font-bold text-white mb-6">Smart Cleaning, Not Just Routes</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">AI vision recognition detects trash and dirty patches automatically, targeting them for focused cleaning with up to a 500% efficiency gain. VSLAM + LiDAR SLAM plus markers deliver reliable navigation and obstacle avoidance across busy floors.</p>
              <div className="bg-green-600/10 border border-green-500/30 rounded-xl p-6">
                <p className="text-green-300 italic mb-2">"One MT1 VAC replaced our nightly sweep-and-vacuum crew across the concourse. The HEPA filtration made a noticeable difference in dust complaints."</p>
                <p className="text-gray-400 text-sm">— Facilities Manager, Regional Airport</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">ALL-DAY OPERATION</span>
              <h3 className="text-3xl font-bold text-white mb-6">Up to 1,400 m²/hr Coverage</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">Cover large facilities fast. The MT1 VAC cleans up to 1,400 m²/h, runs 3–6.5 hours per charge, and auto-docks to recharge in under 3.5 hours — enabling scheduled, hands-off 24/7 operation.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800"><div className="text-4xl font-bold text-green-400 mb-2">14L</div><div className="text-gray-400 text-sm">dual dust capacity</div></div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800"><div className="text-4xl font-bold text-blue-400 mb-2">6.5h</div><div className="text-gray-400 text-sm">max runtime</div></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <img src="/images/bots/pudu-mt1-vac-dock.png" alt="PUDU MT1 VAC Auto-Docking" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.currentTarget.src = '/images/bots/pudu-mt1-vac.png'; }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Complete PUDU Ecosystem</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">More than a robot — an integrated platform for maximum operational efficiency</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-green-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden"><img src="/legacy-assets/sy01od6d_fleet-management.png" alt="PUDU Fleet Management Dashboard" className="w-full h-full object-cover" /></div>
              <div className="p-8"><h3 className="text-2xl font-bold text-white mb-4">Fleet Management</h3><p className="text-gray-400 mb-6">Schedule cleaning cycles, track coverage maps, and monitor air-quality metrics in real time from any device, 24/7.</p></div>
            </div>
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-green-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-green-600/20 to-green-800/20 flex items-center justify-center overflow-hidden"><img src="/images/bots/pudu-mt1-vac-iot.png" alt="PUDU MT1 VAC IoT Integration" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/bots/pudu-mt1-vac.png'; }} /></div>
              <div className="p-8"><h3 className="text-2xl font-bold text-white mb-4">IoT Integration</h3><p className="text-gray-400 mb-6">Elevator and door control for multi-floor cleaning, plus 4G/Wi-Fi connectivity to keep the MT1 VAC covering your whole facility.</p></div>
            </div>
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-green-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden"><img src="/legacy-assets/76r9l5p9_pudu-bg1-expert-support.png" alt="123 Bots Expert Support" className="w-full h-full object-cover" /></div>
              <div className="p-8"><h3 className="text-2xl font-bold text-white mb-4">Expert Support</h3><p className="text-gray-400 mb-6">From site assessment and custom cleaning plans to staff training and ongoing support, our team keeps the MT1 VAC performing at its best.</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Specs */}
      <section id="specs" className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Technical Specifications</h2></div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Dimensions & Capacity</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">L × W × H</span><span className="text-white font-semibold">840 × 600 × 490 mm</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Weight</span><span className="text-white font-semibold">75 kg (165 lbs)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Dust Capacity</span><span className="text-white font-semibold">14 L (dual bags)</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Trash Bin</span><span className="text-white font-semibold">6 L</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Coverage</span><span className="text-white font-semibold">1,400 m²/h</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Vacuum / Total Width</span><span className="text-white font-semibold">55 cm / 70 cm</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Suction Boost</span><span className="text-white font-semibold">200% (dual-fan)</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Noise Level</span><span className="text-white font-semibold">&lt;75 dB</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Power & Mobility</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Battery</span><span className="text-white font-semibold">45 Ah</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Runtime</span><span className="text-white font-semibold">3–6.5 hours</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Charging</span><span className="text-white font-semibold">&lt;3.5 hours</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Max Climb</span><span className="text-white font-semibold">20mm / 8°</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Technology</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Navigation</span><span className="text-white font-semibold">VSLAM + LiDAR + Markers</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Filtration</span><span className="text-white font-semibold">H11 HEPA-grade</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Cleaning Modes</span><span className="text-white font-semibold">Sweep, Vacuum, Mop</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Ideal For</span><span className="text-white font-semibold">Airports, Malls, Offices</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Frequently Asked Questions</h2><p className="text-xl text-gray-300">Everything you need to know about the PUDU MT1 VAC</p></div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-bots-dark rounded-xl border border-gray-800 overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === index ? null : index)} className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-800/50 transition-colors" data-testid={`mt1vac-faq-${index}`}>
                  <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                  {activeFaq === index ? <ChevronUp className="w-6 h-6 text-green-400 flex-shrink-0" /> : <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />}
                </button>
                {activeFaq === index && (<div className="px-6 pb-6"><p className="text-gray-300 leading-relaxed">{faq.answer}</p></div>)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-teal-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready for Triple-Mode Cleaning?</h2>
          <p className="text-xl text-white/90 mb-10">Join airports, malls, and office buildings using the PUDU MT1 VAC for cleaner floors and healthier air.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-green-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg" data-testid="mt1vac-cta-demo">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2" data-testid="mt1vac-cta-contact"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PuduMt1VacPage;
