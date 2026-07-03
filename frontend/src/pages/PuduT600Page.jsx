import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PuduT600Page = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'PUDU T600 | 600kg Heavy Payload Industrial Robot | 123 Bots',
      description: 'Reduce delivery trips by 50% with PUDU T600. 600kg payload, AI rack recognition, VDA5050 fleet coordination, 12-hour runtime, and an underride variant for warehouse automation.',
      keywords: 'pudu t600, 600kg agv, heavy payload robot, warehouse automation, vda5050, autonomous forklift',
    });
  }, []);

  const faqs = [
    {
      question: 'How much can the PUDU T600 carry?',
      answer: 'The T600 handles up to 600 kg (1,322 lbs) — roughly double a standard AGV. That means fewer trips, lower operating cost, and faster movement of pallets, heavy materials, and bulk goods across high-density facilities.',
    },
    {
      question: 'What is the underride variant?',
      answer: 'The T600 is available in a low-profile underride variant that drives beneath racks and shelving to lift and transport them autonomously. It uses AI rack recognition to identify positions for precise, unmanned pick-up and drop-off.',
    },
    {
      question: 'Can multiple T600 units work together?',
      answer: 'Yes. With VDA5050 protocol support and fleet coordination, multiple T600 units share tasks intelligently with traffic control and collision avoidance — scaling smoothly across large warehouses and distribution centers.',
    },
    {
      question: 'How long does it run and charge?',
      answer: 'The T600 runs up to 12 hours (no load) and recharges from 0–90% in about 2 hours, supporting continuous multi-shift operation with minimal downtime.',
    },
    {
      question: 'Is it suitable for secure environments?',
      answer: 'Absolutely. The T600 supports on-premises deployment for data security, offers emergency response modes, and is engineered to operate safely in demanding 0–40°C industrial conditions.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark" data-testid="pudu-t600-page">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-red-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(239,68,68,0.3),transparent_50%)]" /></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-red-600/20 border border-red-500/30 rounded-full text-red-400 text-sm font-semibold mb-6">600kg Heavy-Payload Champion</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Maximum Payload, <span className="text-red-400">Minimum Trips</span></h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">Cut delivery trips by up to 50% with a 600 kg payload. The PUDU T600 pairs AI rack recognition, VDA5050 fleet coordination, and an underride variant for seamless, unmanned warehouse automation at scale.</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="/brochures/123-t600-flyer.pdf" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-red-600 text-white font-bold rounded-full hover:bg-red-500 transition-colors flex items-center justify-center gap-2" data-testid="t600-download-brochure"><Download className="w-5 h-5" />Download Brochure</a>
                <Link to="/schedule-a-demo" className="px-8 py-4 bg-bots-surface border-2 border-red-500 text-white font-bold rounded-full hover:bg-red-500/20 transition-colors text-center" data-testid="t600-book-demo">Book a Demo</Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-400" />600kg Payload</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-400" />Fleet Coordination</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-red-400" />12hr Runtime</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl" />
              <img src="/images/bots/pudu-t600.png" alt="PUDU T600 Heavy Payload Industrial Robot" className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Heavy-Duty Warehouse Automation</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Maximum capacity engineered for high-volume distribution centers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-red-500/50 transition-colors">
              <div className="w-16 h-16 bg-red-600/20 rounded-xl flex items-center justify-center mb-6"><svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg></div>
              <h3 className="text-2xl font-bold text-white mb-4">600kg Capacity</h3>
              <p className="text-gray-400 mb-4">Handle twice the payload of standard AGVs. Move pallets, heavy materials, and bulk goods in fewer trips — cutting operational costs by up to 50%.</p>
              <a href="#capabilities" className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-2">Learn More <ChevronRight className="w-4 h-4" /></a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6"><svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg></div>
              <h3 className="text-2xl font-bold text-white mb-4">Fleet Coordination</h3>
              <p className="text-gray-400 mb-4">Coordinate multiple T600 units with VDA5050. Smart task allocation, traffic control, and collision avoidance keep operations smooth across your facility.</p>
              <a href="#capabilities" className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-2">See It in Action <ChevronRight className="w-4 h-4" /></a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6"><svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg></div>
              <h3 className="text-2xl font-bold text-white mb-4">AI Rack Recognition</h3>
              <p className="text-gray-400 mb-4">Automated loading and unloading with intelligent rack detection. The underride variant integrates seamlessly with existing warehouse racking systems.</p>
              <a href="#specs" className="text-red-400 hover:text-red-300 font-semibold flex items-center gap-2">View Specifications <ChevronRight className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section id="capabilities" className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Built to Move More, Faster</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">From bulk pallet transport to autonomous rack handling, the T600 scales your operation</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-red-600/20 rounded-full text-red-400 text-sm font-semibold mb-4">SMART NAVIGATION</span>
              <h3 className="text-3xl font-bold text-white mb-6">LiDAR + VSLAM Fusion</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">Confidently navigate dense, high-traffic warehouses. Multi-sensor fusion enables stable mapping, dynamic path planning, and real-time avoidance of people, forklifts, and obstacles — even with a full 600 kg load.</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" /><span className="text-gray-300">70cm minimum passability for tight lanes</span></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" /><span className="text-gray-300">Surmounts 10mm heights and 35mm gaps</span></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" /><span className="text-gray-300">Adjustable speed 0.2–1.2 m/s</span></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <video controls playsInline preload="metadata" poster="/images/bots/pudu-t600.png" className="w-full h-full object-cover rounded-xl">
                    <source src="/videos/t600-navigation.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1 relative">
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl flex items-center justify-center overflow-hidden">
                  <img src="/images/bots/pudu-t600-underride.png" alt="PUDU T600 Underride Variant" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.currentTarget.src = '/images/bots/pudu-t600.png'; }} />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">AUTONOMOUS RACK HANDLING</span>
              <h3 className="text-3xl font-bold text-white mb-6">Low-Profile Underride Variant</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">The T600 underride model slips beneath racks and shelving to lift and relocate them autonomously. Combined with AI rack recognition and VDA5050 integration, it enables truly unmanned goods-to-person and rack-shuttling workflows.</p>
              <div className="bg-red-600/10 border border-red-500/30 rounded-xl p-6">
                <p className="text-red-300 italic mb-2">"The T600 fleet moves our heaviest pallets around the clock. Fewer trips, no manual forklifts on those routes, and the underride units reorganize our racking overnight."</p>
                <p className="text-gray-400 text-sm">— Warehouse Director, Distribution Center</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">ALL-SHIFT ENDURANCE</span>
              <h3 className="text-3xl font-bold text-white mb-6">Up to 12 Hours of Runtime</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">Keep heavy goods moving across full shifts. The T600 runs up to 12 hours and recharges from 0–90% in about 2 hours, enabling continuous multi-shift operation with secure on-premises deployment.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800"><div className="text-4xl font-bold text-red-400 mb-2">600kg</div><div className="text-gray-400 text-sm">max payload capacity</div></div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800"><div className="text-4xl font-bold text-green-400 mb-2">~2h</div><div className="text-gray-400 text-sm">charge 0–90%</div></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <img src="/images/bots/pudu-t600-fleet.png" alt="PUDU T600 Fleet Coordination" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.currentTarget.src = '/images/bots/pudu-t600.png'; }} />
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
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-red-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden"><img src="https://customer-assets.emergentagent.com/job_ef18f0c6-3791-43dc-a009-b6a410b56caf/artifacts/sy01od6d_fleet-management.png" alt="PUDU Fleet Management Dashboard" className="w-full h-full object-cover" /></div>
              <div className="p-8"><h3 className="text-2xl font-bold text-white mb-4">Fleet Management</h3><p className="text-gray-400 mb-6">Coordinate a full fleet of T600 units, dispatch heavy-transport tasks, and monitor productivity in real time from any device with VDA5050 compatibility.</p></div>
            </div>
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-red-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-red-600/20 to-red-800/20 flex items-center justify-center overflow-hidden"><img src="/images/bots/pudu-t600-iot.png" alt="PUDU T600 IoT Integration" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/bots/pudu-t600.png'; }} /></div>
              <div className="p-8"><h3 className="text-2xl font-bold text-white mb-4">IoT Integration</h3><p className="text-gray-400 mb-6">Autonomous elevator control, doors, and gates with multi-floor support. On-premises deployment keeps operations secure and data private.</p></div>
            </div>
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-red-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden"><img src="https://customer-assets.emergentagent.com/job_ef18f0c6-3791-43dc-a009-b6a410b56caf/artifacts/76r9l5p9_pudu-bg1-expert-support.png" alt="123 Bots Expert Support" className="w-full h-full object-cover" /></div>
              <div className="p-8"><h3 className="text-2xl font-bold text-white mb-4">Expert Support</h3><p className="text-gray-400 mb-6">From site assessment and workflow design to staff training and ongoing technical support, our team ensures the T600 fleet performs from day one.</p></div>
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
              <h3 className="text-2xl font-bold text-white mb-6">Dimensions & Payload</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">L × W × H</span><span className="text-white font-semibold">960 × 500 × 1350 mm</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Weight</span><span className="text-white font-semibold">112 kg (247 lbs)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Payload</span><span className="text-white font-semibold">600 kg (1,322 lbs)</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Min Passability</span><span className="text-white font-semibold">70 cm</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Runtime</span><span className="text-white font-semibold">12 hours (no load)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Max Speed</span><span className="text-white font-semibold">0.2–1.2 m/s</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Charging</span><span className="text-white font-semibold">~2 hours (0–90%)</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Operating Temp</span><span className="text-white font-semibold">0–40°C</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Power & Mobility</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Battery</span><span className="text-white font-semibold">30 Ah</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Surmountability</span><span className="text-white font-semibold">10mm height, 35mm gap</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Variants</span><span className="text-white font-semibold">Standard + Underride</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Deployment</span><span className="text-white font-semibold">On-premises</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Technology & Safety</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Navigation</span><span className="text-white font-semibold">LiDAR + VSLAM</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Protocol</span><span className="text-white font-semibold">VDA5050 Fleet</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Safety</span><span className="text-white font-semibold">Emergency response modes</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Ideal For</span><span className="text-white font-semibold">Warehouses, Distribution</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Frequently Asked Questions</h2><p className="text-xl text-gray-300">Everything you need to know about the PUDU T600</p></div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-bots-dark rounded-xl border border-gray-800 overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === index ? null : index)} className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-800/50 transition-colors" data-testid={`t600-faq-${index}`}>
                  <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                  {activeFaq === index ? <ChevronUp className="w-6 h-6 text-red-400 flex-shrink-0" /> : <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />}
                </button>
                {activeFaq === index && (<div className="px-6 pb-6"><p className="text-gray-300 leading-relaxed">{faq.answer}</p></div>)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-red-600 to-orange-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready for Heavy-Duty Automation?</h2>
          <p className="text-xl text-white/90 mb-10">Join distribution centers worldwide using the PUDU T600 for maximum payload capacity and around-the-clock efficiency.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-red-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg" data-testid="t600-cta-demo">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2" data-testid="t600-cta-contact"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PuduT600Page;
