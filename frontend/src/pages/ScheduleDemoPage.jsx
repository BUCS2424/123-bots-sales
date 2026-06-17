import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Phone } from 'lucide-react';
import { setSeoMetadata, SEO_PRESETS } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ScheduleDemoPage = () => {
  const [formData, setFormData] = useState({
    organization: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    products: [],
    contactMethod: 'both',
    notes: '',
    agreedToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  useEffect(() => {
    setSeoMetadata({
      ...SEO_PRESETS.demo,
      title: 'Schedule a Free Demo | 123 Bots',
    });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/leads/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          phone: formData.phone,
          subject: `Demo Request - ${formData.organization}`,
          message: `Organization: ${formData.organization}\nProduct Interest: ${formData.products.join(', ')}\nContact Method: ${formData.contactMethod}\nFacility Details: ${formData.notes}`,
          source: 'demo_request',
        }),
      });
      
      if (response.ok) {
        setSubmitStatus('success');
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-bots-dark">
        <Header />
        <section className="pt-32 pb-20">
          <div className="max-w-2xl mx-auto px-4 text-center">
            <CheckCircle className="w-24 h-24 text-green-500 mx-auto mb-8" />
            <h1 className="text-4xl font-bold text-white mb-6">Thank You!</h1>
            <p className="text-xl text-gray-300 mb-8">
              Your demo request has been received. Our team will contact you within 24 hours to schedule your personalized demonstration.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/"
                className="px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors"
              >
                Return Home
              </Link>
              <Link
                to="/products"
                className="px-8 py-4 bg-bots-surface border border-gray-700 text-white font-bold rounded-full hover:bg-bots-accent transition-colors"
              >
                View Products
              </Link>
            </div>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-bots-surface to-bots-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Schedule Your <span className="text-blue-400">Free Demo</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See our AI cleaning robots in action at your facility. No obligation, just results.
          </p>
        </div>
      </section>

      {/* Form Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Benefits */}
            <div>
              <h2 className="text-3xl font-bold text-white mb-8">What to Expect</h2>
              <div className="space-y-6">
                {[
                  { title: 'Personalized Demonstration', desc: 'We\'ll bring a robot to your facility and show you exactly how it handles your specific cleaning challenges.' },
                  { title: 'ROI Analysis', desc: 'Our team will help you calculate the potential cost savings and efficiency gains for your operation.' },
                  { title: 'No Pressure, No Obligation', desc: 'This is purely informational. We want you to make the best decision for your business.' },
                  { title: 'Expert Consultation', desc: 'Get answers to all your questions from our experienced team.' },
                ].map((item, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="w-6 h-6 text-green-500 mr-4 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                      <p className="text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Contact Info */}
              <div className="mt-12 p-6 bg-bots-surface rounded-xl border border-gray-800">
                <h3 className="text-white font-semibold mb-4">Prefer to Talk?</h3>
                <a
                  href="tel:8777022687"
                  className="flex items-center text-blue-400 hover:text-blue-300 transition-colors text-lg"
                >
                  <Phone className="w-5 h-5 mr-3" />
                  (877) 702-2687
                </a>
              </div>
            </div>

            {/* Form */}
            <div className="bg-bots-surface p-8 rounded-2xl border border-gray-800">
              <h2 className="text-2xl font-bold text-white mb-6">Request Your Demo</h2>
              
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="schedule-demo-form">
                <input
                  type="text"
                  placeholder="Organization*"
                  required
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-4 py-3 bg-bots-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                  data-testid="demo-form-organization"
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="First Name*"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 bg-bots-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    data-testid="demo-form-firstname"
                  />
                  <input
                    type="text"
                    placeholder="Last Name*"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 bg-bots-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    data-testid="demo-form-lastname"
                  />
                </div>
                
                <div className="w-full" data-testid="demo-form-products">
                  <p className="text-gray-400 text-sm mb-3">Which robot(s) are you interested in?*</p>
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-blue-400 uppercase tracking-widest">Commercial Cleaning Robots</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['AVIDBOTS NEO','AVIDBOTS KAS','GAUSIUM MIRA','GAUSIUM MARVEL','PUDU BG1 PRO','PUDU CC1 PRO','PUDU SH1','PUDU MT1 MAX','PUDU MT1 VAC','FLASHBOT MAX'].map((robot) => (
                        <label key={robot} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm font-medium uppercase tracking-wide ${formData.products.includes(robot) ? 'border-blue-500 bg-blue-500/10 text-blue-300' : 'border-gray-700 bg-bots-dark text-gray-300 hover:border-gray-500'}`}>
                          <input
                            type="checkbox"
                            className="accent-blue-500"
                            checked={formData.products.includes(robot)}
                            onChange={(e) => setFormData({ ...formData, products: e.target.checked ? [...formData.products, robot] : formData.products.filter(p => p !== robot) })}
                            data-testid={`demo-product-${robot.toLowerCase().replace(/\s+/g,'-')}`}
                          />
                          {robot}
                        </label>
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mt-3">Industrial Delivery Robots</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['PUDU T300','PUDU T600'].map((robot) => (
                        <label key={robot} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm font-medium uppercase tracking-wide ${formData.products.includes(robot) ? 'border-orange-500 bg-orange-500/10 text-orange-300' : 'border-gray-700 bg-bots-dark text-gray-300 hover:border-gray-500'}`}>
                          <input
                            type="checkbox"
                            className="accent-orange-500"
                            checked={formData.products.includes(robot)}
                            onChange={(e) => setFormData({ ...formData, products: e.target.checked ? [...formData.products, robot] : formData.products.filter(p => p !== robot) })}
                            data-testid={`demo-product-${robot.toLowerCase().replace(/\s+/g,'-')}`}
                          />
                          {robot}
                        </label>
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {['MULTIPLE UNITS / FLEET','NOT SURE - NEED CONSULTATION'].map((opt) => (
                        <label key={opt} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors text-sm font-medium uppercase tracking-wide ${formData.products.includes(opt) ? 'border-gray-400 bg-gray-500/10 text-gray-200' : 'border-gray-700 bg-bots-dark text-gray-400 hover:border-gray-500'}`}>
                          <input
                            type="checkbox"
                            className="accent-gray-400"
                            checked={formData.products.includes(opt)}
                            onChange={(e) => setFormData({ ...formData, products: e.target.checked ? [...formData.products, opt] : formData.products.filter(p => p !== opt) })}
                          />
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <span className="text-gray-400 text-sm">Contact me via:</span>
                  {['phone', 'email', 'both'].map((method) => (
                    <label key={method} className="flex items-center text-white cursor-pointer">
                      <input
                        type="radio"
                        name="contactMethod"
                        value={method}
                        checked={formData.contactMethod === method}
                        onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value })}
                        className="mr-2"
                      />
                      {method.charAt(0).toUpperCase() + method.slice(1)}
                    </label>
                  ))}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="email"
                    placeholder="Email*"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-bots-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    data-testid="demo-form-email"
                  />
                  <input
                    type="tel"
                    placeholder="Phone*"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-bots-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                    data-testid="demo-form-phone"
                  />
                </div>
                
                <textarea
                  placeholder="Tell us about your facility and cleaning needs..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-bots-dark border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none resize-none"
                  data-testid="demo-form-notes"
                />
                
                <label className="flex items-start text-gray-300 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={formData.agreedToTerms}
                    onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                    className="mr-3 mt-1"
                    data-testid="demo-form-terms"
                  />
                  <span>
                    I agree to the terms & conditions. By providing my phone number, I agree to receive communications from 123 Bots.
                  </span>
                </label>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-testid="demo-form-submit"
                >
                  {isSubmitting ? 'Submitting...' : 'SCHEDULE MY DEMO'}
                </button>
                
                {submitStatus === 'error' && (
                  <p className="text-red-400 text-center">Something went wrong. Please try again or call us directly.</p>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ScheduleDemoPage;
