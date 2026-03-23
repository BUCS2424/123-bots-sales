import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Phone, DollarSign, Clock, Shield, Wrench } from 'lucide-react';
import { setSeoMetadata, SEO_PRESETS } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const BuyLeasePage = () => {
  useEffect(() => {
    setSeoMetadata({
      ...SEO_PRESETS.buyLease,
      title: 'Buy or Lease Cleaning Robots | 123 Bots',
    });
  }, []);

  const buyBenefits = [
    { icon: DollarSign, title: 'Own Your Asset', desc: 'Build equity with full ownership' },
    { icon: Shield, title: 'Long-term Savings', desc: 'No ongoing payments after purchase' },
    { icon: Wrench, title: 'Full Control', desc: 'Customize and maintain on your schedule' },
  ];

  const leaseBenefits = [
    { icon: DollarSign, title: 'Lower Upfront Cost', desc: 'Start cleaning with minimal initial investment' },
    { icon: Clock, title: 'Flexible Terms', desc: '12, 24, or 36 month options available' },
    { icon: Shield, title: 'Maintenance Included', desc: 'We handle repairs and upkeep' },
  ];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-bots-surface to-bots-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Buy or <span className="text-green-400">Lease</span> Your Robot
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
            Flexible options to fit your business needs and budget. Get started with AI cleaning today.
          </p>
          <a
            href="tel:8777022687"
            className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors"
          >
            <Phone className="w-5 h-5 mr-2" />
            Call for Custom Quote
          </a>
        </div>
      </section>

      {/* Options Comparison */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Buy Option */}
            <div className="bg-bots-surface rounded-2xl border border-gray-800 overflow-hidden">
              <div className="bg-blue-600 p-6 text-center">
                <h2 className="text-2xl font-bold text-white">Purchase</h2>
                <p className="text-blue-100">Own your robot outright</p>
              </div>
              <div className="p-8">
                <div className="space-y-6 mb-8">
                  {buyBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <benefit.icon className="w-6 h-6 text-blue-400 mr-4 flex-shrink-0" />
                      <div>
                        <h3 className="text-white font-semibold">{benefit.title}</h3>
                        <p className="text-gray-400 text-sm">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <h4 className="text-white font-semibold mb-4">Includes:</h4>
                <ul className="space-y-2 mb-8">
                  {['Full robot ownership', 'Initial training & setup', '1-year warranty', 'Technical support', 'Software updates'].map((item) => (
                    <li key={item} className="flex items-center text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <Link
                  to="/schedule-a-demo"
                  className="block w-full py-4 bg-blue-600 text-white font-bold rounded-full text-center hover:bg-blue-500 transition-colors"
                  data-testid="buy-option-cta"
                >
                  Get Purchase Quote
                </Link>
              </div>
            </div>

            {/* Lease Option */}
            <div className="bg-bots-surface rounded-2xl border border-green-500/30 overflow-hidden relative">
              <div className="absolute top-4 right-4 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="bg-green-500 p-6 text-center">
                <h2 className="text-2xl font-bold text-black">Lease</h2>
                <p className="text-green-900">Flexible monthly payments</p>
              </div>
              <div className="p-8">
                <div className="space-y-6 mb-8">
                  {leaseBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start">
                      <benefit.icon className="w-6 h-6 text-green-400 mr-4 flex-shrink-0" />
                      <div>
                        <h3 className="text-white font-semibold">{benefit.title}</h3>
                        <p className="text-gray-400 text-sm">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <h4 className="text-white font-semibold mb-4">Includes:</h4>
                <ul className="space-y-2 mb-8">
                  {['Low monthly payments', 'All maintenance included', 'Free replacement if needed', '24/7 support', 'Option to buy at end', 'Tax advantages'].map((item) => (
                    <li key={item} className="flex items-center text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      {item}
                    </li>
                  ))}
                </ul>
                
                <Link
                  to="/schedule-a-demo"
                  className="block w-full py-4 bg-green-500 text-black font-bold rounded-full text-center hover:bg-green-400 transition-colors"
                  data-testid="lease-option-cta"
                >
                  Get Lease Quote
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                q: 'What are the lease terms available?',
                a: 'We offer 12, 24, and 36 month lease terms. Longer terms typically result in lower monthly payments.',
              },
              {
                q: 'Is maintenance really included in the lease?',
                a: 'Yes! All routine maintenance, repairs, and even replacement if needed are included in your lease payment.',
              },
              {
                q: 'Can I buy the robot at the end of my lease?',
                a: 'Absolutely. At the end of your lease term, you can purchase the robot at fair market value or upgrade to a newer model.',
              },
              {
                q: 'What if I need multiple robots?',
                a: 'We offer fleet discounts for businesses needing multiple units. Contact us for custom pricing.',
              },
              {
                q: 'Is financing available for purchases?',
                a: 'Yes, we partner with several financing companies to offer flexible payment plans for purchases.',
              },
            ].map((faq, index) => (
              <div key={index} className="bg-bots-dark p-6 rounded-xl">
                <h3 className="text-white font-semibold mb-2">{faq.q}</h3>
                <p className="text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-green-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-white/90 text-lg mb-8">
            Our team will help you find the perfect option for your business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:8777022687"
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              <Phone className="w-5 h-5 mr-2" />
              (877) 702-2687
            </a>
            <Link
              to="/schedule-a-demo"
              className="px-8 py-4 bg-black text-white font-bold rounded-full hover:bg-gray-900 transition-colors"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BuyLeasePage;
