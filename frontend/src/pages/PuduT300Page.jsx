import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduT300Page = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU T300 | 300kg Industrial Delivery AGV | 123 Bots',
      description: 'Heavy-duty autonomous delivery for factories and warehouses. PUDU T300: 300kg payload, up to 12-hour runtime, VDA5050 compatible, ISO 3691-4 certified, VSLAM+LiDAR navigation.',
      keywords: 'pudu t300, 300kg agv, industrial delivery robot, warehouse automation, autonomous material transport',
    });
  }, []);

  const faqs = [
    {
      question: 'How much can the PUDU T300 carry?',
      answer: 'The T300 handles up to 300 kg (661 lbs) of payload, making it ideal for transporting bulk materials, components, and multi-level cargo across factories and warehouses. Modular lifting, conveyor, tray, and towing variants let you tailor it to your exact workflow.',
    },
    {
      question: 'What operating modes does the T300 support?',
      answer: 'The T300 offers multiple flexible modes: fully autonomous auto-delivery, follow mode (it trails a worker), power-assist mode for manual guidance with motorized support, and semi-auto operation. This versatility lets a single robot cover many different material-handling tasks.',
    },
    {
      question: 'How long does it run on a charge?',
      answer: 'The T300 delivers 6–12 hours of runtime depending on load and duty cycle, and recharges from 0–90% in roughly 2 hours. This supports full-shift and multi-shift operation with minimal downtime.',
    },
    {
      question: 'Is it safe to operate around people?',
      answer: 'Yes. The T300 is ISO 3691-4 compliant and uses 360° safety sensors with VSLAM + LiDAR SLAM navigation for real-time obstacle detection and avoidance, safely sharing space with workers, forklifts, and dynamic warehouse traffic.',
    },
    {
      question: 'How quickly can it be deployed?',
      answer: 'Built-in mapping technology enables up to 30% faster deployment than comparable AGVs. The T300 maps complex facility layouts rapidly and integrates with elevators and building systems via IoT for seamless multi-area operation.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark" data-testid="pudu-t300-page">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-cyan-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(6,182,212,0.3),transparent_50%)]" />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-cyan-600/20 border border-cyan-500/30 rounded-full text-cyan-400 text-sm font-semibold mb-6">
                300kg Industrial Delivery AGV
              </span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Move More, <span className="text-cyan-400">Work Smarter</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Heavy-duty autonomous delivery for factories and warehouses. The PUDU T300 combines a 300 kg payload, flexible operating modes, and VSLAM + LiDAR navigation to streamline 24/7 material transport — safely and efficiently.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a
                  href="/brochures/123-pudu-t300-brochure.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-cyan-600 text-white font-bold rounded-full hover:bg-cyan-500 transition-colors flex items-center justify-center gap-2"
                  data-testid="t300-download-brochure"
                >
                  <Download className="w-5 h-5" />
                  Download Brochure
                </a>
                <Link
                  to="/schedule-a-demo"
                  className="px-8 py-4 bg-bots-surface border-2 border-cyan-500 text-white font-bold rounded-full hover:bg-cyan-500/20 transition-colors text-center"
                  data-testid="t300-book-demo"
                >
                  Book a Demo
                </Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" />300kg Payload</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" />Up to 12hr Runtime</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-cyan-400" />ISO 3691-4</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-3xl" />
              <img
                src="/images/bots/pudu-t300.png"
                alt="PUDU T300 Industrial Delivery Robot"
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Built for Industrial-Grade Transport</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Purpose-engineered to reduce manual material handling and keep your operation moving around the clock
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-cyan-500/50 transition-colors">
              <div className="w-16 h-16 bg-cyan-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">300kg Heavy-Duty Payload</h3>
              <p className="text-gray-400 mb-4">Transport bulk materials, components, and multi-level cargo with ease. Reduces manual material handling by up to 80% across your facility.</p>
              <a href="#capabilities" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2">Learn More <ChevronRight className="w-4 h-4" /></a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Flexible Operating Modes</h3>
              <p className="text-gray-400 mb-4">Auto-delivery, follow mode, power-assist, and semi-auto operation adapt one robot to many workflows — from assembly lines to logistics hubs.</p>
              <a href="#capabilities" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2">See It in Action <ChevronRight className="w-4 h-4" /></a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Safe & Standards-Compliant</h3>
              <p className="text-gray-400 mb-4">360° safety sensors and VSLAM + LiDAR navigation deliver real-time obstacle avoidance. ISO 3691-4 certified for shared industrial spaces.</p>
              <a href="#specs" className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-2">View Specifications <ChevronRight className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section id="capabilities" className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Engineered for Demanding Environments</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">From factory floors to distribution centers, the T300 transforms material transport</p>
          </div>

          {/* Capability 1: Navigation */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-cyan-600/20 rounded-full text-cyan-400 text-sm font-semibold mb-4">ADVANCED NAVIGATION</span>
              <h3 className="text-3xl font-bold text-white mb-6">VSLAM + LiDAR SLAM Precision</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Navigate crowded aisles and dynamic layouts with confidence. Multi-sensor fusion delivers stable mapping and dynamic path planning, safely avoiding people, forklifts, and unexpected obstacles in real time.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" /><span className="text-gray-300">360° awareness with real-time obstacle avoidance</span></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" /><span className="text-gray-300">Handles 20mm obstacles and 35mm gaps</span></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-1" /><span className="text-gray-300">Navigates 60cm minimum path widths</span></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-cyan-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <video controls playsInline preload="metadata" poster="/images/bots/pudu-t300.png" className="w-full h-full object-cover rounded-xl">
                    <source src="/videos/t300-navigation.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          {/* Capability 2: Flexible modes */}
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src="/images/bots/pudu-t300-modes.png" alt="PUDU T300 Flexible Operating Modes" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.currentTarget.src = '/images/bots/pudu-t300.png'; }} />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">VERSATILE WORKFLOWS</span>
              <h3 className="text-3xl font-bold text-white mb-6">One Robot, Many Jobs</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Switch instantly between auto-delivery, follow mode, power-assist, and semi-auto operation. Modular lifting, conveyor, tray, and towing attachments turn the T300 into exactly the tool each task requires.
              </p>
              <div className="bg-cyan-600/10 border border-cyan-500/30 rounded-xl p-6">
                <p className="text-cyan-300 italic mb-2">"We replaced three manual carts with a single T300. Follow mode during picking and auto-delivery for line-side replenishment — it paid for itself in months."</p>
                <p className="text-gray-400 text-sm">— Plant Operations Lead, Manufacturing Facility</p>
              </div>
            </div>
          </div>

          {/* Capability 3: Runtime stats */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">ALL-SHIFT ENDURANCE</span>
              <h3 className="text-3xl font-bold text-white mb-6">Up to 12 Hours of Runtime</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                Keep material moving across full shifts. The T300 runs 6–12 hours per charge and recharges from 0–90% in about 2 hours, enabling continuous multi-shift operation with rapid deployment via built-in mapping.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800"><div className="text-4xl font-bold text-cyan-400 mb-2">300kg</div><div className="text-gray-400 text-sm">max payload capacity</div></div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800"><div className="text-4xl font-bold text-green-400 mb-2">~2h</div><div className="text-gray-400 text-sm">charge 0–90%</div></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <img src="/images/bots/pudu-t300-modular.png" alt="PUDU T300 Modular Attachments" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.currentTarget.src = '/images/bots/pudu-t300.png'; }} />
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Complete PUDU Ecosystem</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">More than a robot — an integrated platform for maximum operational efficiency</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden">
                <img src="https://customer-assets.emergentagent.com/job_ef18f0c6-3791-43dc-a009-b6a410b56caf/artifacts/sy01od6d_fleet-management.png" alt="PUDU Fleet Management Dashboard" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Fleet Management</h3>
                <p className="text-gray-400 mb-6">Coordinate multiple robots, dispatch tasks, and track productivity in real time from any device — 24/7 visibility into your material-transport operation.</p>
              </div>
            </div>
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-cyan-600/20 to-cyan-800/20 flex items-center justify-center overflow-hidden">
                <img src="/images/bots/pudu-t300-iot.png" alt="PUDU T300 IoT Integration" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/bots/pudu-t300.png'; }} />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">IoT Integration</h3>
                <p className="text-gray-400 mb-6">Autonomous elevator control, automatic doors, and access gates. Multi-floor operation with 4G/Wi-Fi connectivity keeps the T300 moving across your entire facility.</p>
              </div>
            </div>
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-cyan-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden">
                <img src="https://customer-assets.emergentagent.com/job_ef18f0c6-3791-43dc-a009-b6a410b56caf/artifacts/76r9l5p9_pudu-bg1-expert-support.png" alt="123 Bots Expert Support" className="w-full h-full object-cover" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-bold text-white mb-4">Expert Support</h3>
                <p className="text-gray-400 mb-6">From site assessment and custom workflow design to staff training and ongoing technical support, our team ensures the T300 delivers optimal performance day one.</p>
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
              <h3 className="text-2xl font-bold text-white mb-6">Dimensions & Payload</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">L × W × H</span><span className="text-white font-semibold">835 × 500 × 1350 mm</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Weight</span><span className="text-white font-semibold">60–80 kg (variant)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Payload</span><span className="text-white font-semibold">300 kg (661 lbs)</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Min Path Width</span><span className="text-white font-semibold">60 cm</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Runtime</span><span className="text-white font-semibold">6–12 hours</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Speed</span><span className="text-white font-semibold">1.2 m/s</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Charging</span><span className="text-white font-semibold">~2 hours (0–90%)</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Operating Temp</span><span className="text-white font-semibold">0–40°C</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Power & Mobility</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Battery</span><span className="text-white font-semibold">30 Ah</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Obstacle Crossing</span><span className="text-white font-semibold">20mm height, 35mm gaps</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Modes</span><span className="text-white font-semibold">Auto, Follow, Power-Assist, Semi-Auto</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Attachments</span><span className="text-white font-semibold">Lifting, Conveyor, Tray, Towing</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Technology & Safety</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Navigation</span><span className="text-white font-semibold">VSLAM + LiDAR SLAM</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Safety</span><span className="text-white font-semibold">360° sensors, ISO 3691-4</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Connectivity</span><span className="text-white font-semibold">4G, Wi-Fi, Elevator Control</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Ideal For</span><span className="text-white font-semibold">Factories, Warehouses, Logistics</span></div>
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
            <p className="text-xl text-gray-300">Everything you need to know about the PUDU T300</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-bots-dark rounded-xl border border-gray-800 overflow-hidden">
                <button
                  onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-800/50 transition-colors"
                  data-testid={`t300-faq-${index}`}
                >
                  <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                  {activeFaq === index ? <ChevronUp className="w-6 h-6 text-cyan-400 flex-shrink-0" /> : <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />}
                </button>
                {activeFaq === index && (
                  <div className="px-6 pb-6"><p className="text-gray-300 leading-relaxed">{faq.answer}</p></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-cyan-600 to-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready for Industrial Automation?</h2>
          <p className="text-xl text-white/90 mb-10">Join factories and warehouses worldwide using the PUDU T300 for efficient, around-the-clock material transport.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-cyan-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg" data-testid="t300-cta-demo">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2" data-testid="t300-cta-contact"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PuduT300Page;
