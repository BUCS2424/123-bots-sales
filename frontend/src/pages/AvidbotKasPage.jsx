import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, CheckCircle, Mail, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const AvidbotKasPage = () => {
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      title: 'AVIDBOT KAS | Compact 22" Autonomous Floor Scrubber | 123 Bots',
      description: 'Navigate narrow aisles with AVIDBOT KAS. A compact 22-inch autonomous scrubber with 45L/46L tanks, 500–1,000 m²/hr coverage, and Avidbots Autonomy — perfect for retail, healthcare, and education.',
      keywords: 'avidbot kas, compact scrubber, 22 inch scrubber, retail cleaning robot, autonomous floor scrubber',
    });
  }, []);

  const faqs = [
    {
      question: 'What makes the KAS good for tight spaces?',
      answer: 'The KAS has a compact 22-inch (56cm) cleaning path engineered specifically for narrow retail aisles, healthcare corridors, and classrooms where larger scrubbers simply cannot fit — without giving up commercial-grade cleaning quality.',
    },
    {
      question: 'How large an area can it clean per session?',
      answer: 'With a 45L solution tank and 46L recovery tank plus a 3–4 hour runtime, the KAS covers 500–1,000 m²/hr, handling medium-sized facilities in a single session before it needs to refill or recharge.',
    },
    {
      question: 'How autonomous is it really?',
      answer: 'The KAS runs on Avidbots Autonomy — industry-leading navigation software providing reliable route planning, dynamic obstacle avoidance, and consistent, repeatable cleaning performance shift after shift.',
    },
    {
      question: 'Which industries is the KAS designed for?',
      answer: 'It is ideal for retail stores, healthcare facilities, and educational institutions — any environment where space is at a premium but cleanliness and safety standards are high.',
    },
    {
      question: 'How long does it take to recharge?',
      answer: 'The KAS recharges in roughly 4 hours, allowing it to be scheduled around business hours or run during quieter periods for hands-off, consistent daily cleaning.',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark" data-testid="avidbot-kas-page">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-20 bg-gradient-to-b from-blue-900/30 via-bots-surface to-bots-dark relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"><div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.3),transparent_50%)]" /></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-sm font-semibold mb-6">Compact Autonomous Scrubber</span>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">Small Spaces, <span className="text-blue-400">Big Performance</span></h1>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">Navigate narrow aisles with confidence. The AVIDBOT KAS delivers commercial-grade cleaning in a compact 22-inch design — purpose-built for retail stores, healthcare facilities, and schools where every square foot counts.</p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <a href="/brochures/123-avidbot-kas-brochure.pdf" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors flex items-center justify-center gap-2" data-testid="kas-download-brochure"><Download className="w-5 h-5" />Download Brochure</a>
                <Link to="/schedule-a-demo" className="px-8 py-4 bg-bots-surface border-2 border-blue-500 text-white font-bold rounded-full hover:bg-blue-500/20 transition-colors text-center" data-testid="kas-book-demo">Book a Demo</Link>
              </div>
              <div className="flex flex-wrap gap-6 text-sm text-gray-400">
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-400" />22" Cleaning Path</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-400" />45L/46L Tanks</span>
                <span className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-blue-400" />Avidbots Autonomy</span>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl" />
              <img src="/images/bots/avidbot-kas.png" alt="AVIDBOT KAS Compact Autonomous Floor Scrubber" className="relative z-10 w-full h-auto object-contain transform hover:scale-105 transition-transform duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Compact Design, Commercial Power</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Engineered for tight spaces without compromising cleaning performance</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-blue-500/50 transition-colors">
              <div className="w-16 h-16 bg-blue-600/20 rounded-xl flex items-center justify-center mb-6"><svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg></div>
              <h3 className="text-2xl font-bold text-white mb-4">22-Inch Cleaning Path</h3>
              <p className="text-gray-400 mb-4">Navigate retail aisles, healthcare corridors, and tight spaces with ease — reaching areas where larger machines simply cannot fit.</p>
              <a href="#capabilities" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">Learn More <ChevronRight className="w-4 h-4" /></a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-green-500/50 transition-colors">
              <div className="w-16 h-16 bg-green-600/20 rounded-xl flex items-center justify-center mb-6"><svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg></div>
              <h3 className="text-2xl font-bold text-white mb-4">500–1,000 m²/hr Coverage</h3>
              <p className="text-gray-400 mb-4">Clean efficiently with a 45L solution tank and 46L recovery tank. A 3–4 hour runtime handles medium-sized facilities in a single session.</p>
              <a href="#capabilities" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">See It in Action <ChevronRight className="w-4 h-4" /></a>
            </div>
            <div className="bg-bots-dark rounded-2xl p-8 border border-gray-800 hover:border-purple-500/50 transition-colors">
              <div className="w-16 h-16 bg-purple-600/20 rounded-xl flex items-center justify-center mb-6"><svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></div>
              <h3 className="text-2xl font-bold text-white mb-4">Avidbots Autonomy</h3>
              <p className="text-gray-400 mb-4">Powered by industry-leading software for reliable navigation, obstacle avoidance, and consistent cleaning performance shift after shift.</p>
              <a href="#specs" className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-2">View Specifications <ChevronRight className="w-4 h-4" /></a>
            </div>
          </div>
        </div>
      </section>

      {/* Key Capabilities */}
      <section id="capabilities" className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Big Results in Small Footprints</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">From retail floors to hospital wings, the KAS keeps tight spaces spotless and safe</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <span className="inline-block px-4 py-2 bg-blue-600/20 rounded-full text-blue-400 text-sm font-semibold mb-4">SMART NAVIGATION</span>
              <h3 className="text-3xl font-bold text-white mb-6">Reliable Avidbots Autonomy</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">Deploy with confidence. The KAS uses proven Avidbots navigation software for consistent, repeatable routes and dynamic obstacle avoidance — safely sharing narrow aisles with shoppers, patients, and staff.</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" /><span className="text-gray-300">Consistent, repeatable cleaning routes</span></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" /><span className="text-gray-300">Dynamic obstacle avoidance in busy areas</span></div>
                <div className="flex items-start gap-3"><CheckCircle className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" /><span className="text-gray-300">Compact 22" path for narrow aisles</span></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <video controls playsInline preload="metadata" poster="/images/bots/avidbot-kas.png" className="w-full h-full object-cover rounded-xl">
                    <source src="/videos/avidbot-kas-cleaning.mp4" type="video/mp4" />
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
                  <img src="/images/bots/avidbot-kas-tanks.png" alt="AVIDBOT KAS Tank System" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.currentTarget.src = '/images/bots/avidbot-kas.png'; }} />
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block px-4 py-2 bg-green-600/20 rounded-full text-green-400 text-sm font-semibold mb-4">EFFICIENT BY DESIGN</span>
              <h3 className="text-3xl font-bold text-white mb-6">45L / 46L Tank System</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">Generous 45L solution and 46L recovery tanks mean fewer stops for refills and dumps. Combined with a 3–4 hour runtime, the KAS cleans medium-sized facilities end-to-end in a single session.</p>
              <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-6">
                <p className="text-blue-300 italic mb-2">"The KAS fits down aisles our old ride-on scrubber couldn't touch. Our floors are cleaner and our team is freed up for customer-facing work."</p>
                <p className="text-gray-400 text-sm">— Store Operations Manager, Retail Chain</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-block px-4 py-2 bg-purple-600/20 rounded-full text-purple-400 text-sm font-semibold mb-4">ALL-DAY READY</span>
              <h3 className="text-3xl font-bold text-white mb-6">Up to 1,000 m²/hr Coverage</h3>
              <p className="text-gray-300 text-lg mb-6 leading-relaxed">Cover more ground between charges. The KAS cleans up to 1,000 m²/hr, runs 3–4 hours per charge, and recharges in about 4 hours — easy to schedule around business hours for hands-off daily cleaning.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800"><div className="text-4xl font-bold text-blue-400 mb-2">22"</div><div className="text-gray-400 text-sm">compact cleaning path</div></div>
                <div className="bg-bots-surface rounded-xl p-6 border border-gray-800"><div className="text-4xl font-bold text-green-400 mb-2">4h</div><div className="text-gray-400 text-sm">runtime per charge</div></div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-purple-500/10 rounded-2xl blur-2xl" />
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
                <div className="aspect-video bg-gray-800/50 rounded-xl overflow-hidden">
                  <img src="/images/bots/avidbot-kas-environments.png" alt="AVIDBOT KAS in Retail and Healthcare" className="w-full h-full object-cover rounded-xl" onError={(e) => { e.currentTarget.src = '/images/bots/avidbot-kas.png'; }} />
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
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">The Avidbots Advantage</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">More than a scrubber — a managed cleaning platform backed by expert support</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden"><img src="/legacy-assets/sy01od6d_fleet-management.png" alt="Avidbots Fleet Command Dashboard" className="w-full h-full object-cover" /></div>
              <div className="p-8"><h3 className="text-2xl font-bold text-white mb-4">Cleaning Analytics</h3><p className="text-gray-400 mb-6">Track coverage, cleaning maps, and productivity in real time from any device — proof-of-clean reporting for every shift.</p></div>
            </div>
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video bg-gradient-to-br from-blue-600/20 to-blue-800/20 flex items-center justify-center overflow-hidden"><img src="/images/bots/avidbot-kas-app.png" alt="AVIDBOT KAS Connected App" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = '/images/bots/avidbot-kas.png'; }} /></div>
              <div className="p-8"><h3 className="text-2xl font-bold text-white mb-4">Connected Operation</h3><p className="text-gray-400 mb-6">Schedule cleaning cycles, receive alerts, and manage the KAS remotely with cloud connectivity for consistent, hands-off performance.</p></div>
            </div>
            <div className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-all hover:transform hover:scale-105">
              <div className="aspect-video overflow-hidden"><img src="/legacy-assets/76r9l5p9_pudu-bg1-expert-support.png" alt="123 Bots Expert Support" className="w-full h-full object-cover" /></div>
              <div className="p-8"><h3 className="text-2xl font-bold text-white mb-4">Expert Support</h3><p className="text-gray-400 mb-6">From site assessment and deployment to staff training and ongoing service, our team keeps the KAS delivering spotless results.</p></div>
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
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Cleaning Width</span><span className="text-white font-semibold">22 inches (56 cm)</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Solution Tank</span><span className="text-white font-semibold">45 L</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Recovery Tank</span><span className="text-white font-semibold">46 L</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Runtime</span><span className="text-white font-semibold">3–4 hours</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Performance</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Coverage Rate</span><span className="text-white font-semibold">500–1,000 m²/hr</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Charging Time</span><span className="text-white font-semibold">~4 hours</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Navigation</span><span className="text-white font-semibold">Avidbots Autonomy</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Ideal For</span><span className="text-white font-semibold">Retail, Healthcare, Education</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Autonomy & Safety</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Obstacle Avoidance</span><span className="text-white font-semibold">Dynamic, real-time</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Route Planning</span><span className="text-white font-semibold">Consistent & repeatable</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Operation</span><span className="text-white font-semibold">Fully autonomous</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Environment</span><span className="text-white font-semibold">Indoor hard floors</span></div>
              </div>
            </div>
            <div className="bg-bots-surface rounded-2xl p-8 border border-gray-800">
              <h3 className="text-2xl font-bold text-white mb-6">Management</h3>
              <div className="space-y-4">
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Connectivity</span><span className="text-white font-semibold">Cloud-connected</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Reporting</span><span className="text-white font-semibold">Proof-of-clean analytics</span></div>
                <div className="flex justify-between py-3 border-b border-gray-800"><span className="text-gray-400">Scheduling</span><span className="text-white font-semibold">Remote & automated</span></div>
                <div className="flex justify-between py-3"><span className="text-gray-400">Support</span><span className="text-white font-semibold">Full-service Avidbots</span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16"><h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Frequently Asked Questions</h2><p className="text-xl text-gray-300">Everything you need to know about the AVIDBOT KAS</p></div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-bots-dark rounded-xl border border-gray-800 overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq === index ? null : index)} className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-800/50 transition-colors" data-testid={`kas-faq-${index}`}>
                  <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                  {activeFaq === index ? <ChevronUp className="w-6 h-6 text-blue-400 flex-shrink-0" /> : <ChevronDown className="w-6 h-6 text-gray-400 flex-shrink-0" />}
                </button>
                {activeFaq === index && (<div className="px-6 pb-6"><p className="text-gray-300 leading-relaxed">{faq.answer}</p></div>)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-cyan-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready for Compact Cleaning Power?</h2>
          <p className="text-xl text-white/90 mb-10">Join retail, healthcare, and education facilities that have transformed tight spaces with the AVIDBOT KAS.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/schedule-a-demo" className="px-10 py-5 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors text-lg" data-testid="kas-cta-demo">Schedule a Demo</Link>
            <Link to="/contact" className="px-10 py-5 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors text-lg flex items-center justify-center gap-2" data-testid="kas-cta-contact"><Mail className="w-5 h-5" />Contact Sales</Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AvidbotKasPage;
