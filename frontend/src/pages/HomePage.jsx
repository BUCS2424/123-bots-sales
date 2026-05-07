import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, Phone, Play, CheckCircle, ArrowRight } from 'lucide-react';
import { setSeoMetadata, generateOrganizationSchema, generateWebsiteSchema, SEO_PRESETS } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Product data for the robots
const PRODUCTS = [
  {
    id: 'cc1-pro',
    name: 'CC1 PRO',
    fullName: 'PUDU CC1 PRO',
    image: '/images/bots/pringle-cc1-robot.png',
    buttonImage: '/images/buttons/button-pudu-cc1-pro.png',
    link: '/products/pudu-cc1-pro',
    color: 'blue',
    category: 'cleaning',
  },
  {
    id: 'bg1-pro',
    name: 'BG1 PRO',
    fullName: 'PUDU BG1 PRO',
    image: '/images/bots/pudu-bg1-pro.png',
    buttonImage: '/images/buttons/button-pudu-bg1-pro.png',
    link: '/products/pudu-bg1',
    color: 'cyan',
    category: 'cleaning',
  },
  {
    id: 'ab-kas',
    name: 'AB KAS',
    fullName: 'AVIDBOT KAS',
    image: '/images/bots/avidbot-kas.png',
    buttonImage: '/images/buttons/button-avidbot-kas.png',
    link: '/products/ab-kas',
    color: 'green',
    category: 'cleaning',
  },
  {
    id: 'sh1',
    name: 'PUDU SH1',
    fullName: 'PUDU SH1',
    image: '/images/bots/robot-pudush.png',
    buttonImage: '/images/buttons/button-pudu-sh1.png',
    link: '/products/pudu-sh1',
    color: 'orange',
    category: 'cleaning',
  },
  {
    id: 'mt1',
    name: 'MT1 MAX',
    fullName: 'PUDU MT1 MAX',
    image: '/images/bots/pudu-mt1-max.png',
    buttonImage: '/images/buttons/button-pudu-mt1-max.png',
    link: '/products/pudu-mt1',
    color: 'purple',
    category: 'cleaning',
  },
  {
    id: 'flashbot-max',
    name: 'FLASHBOT MAX',
    fullName: 'FlashBot Max',
    image: '/images/bots/flashbot-max.webp',
    buttonImage: '/images/buttons/button-flashbot-max.png',
    link: '/products/flashbot-max',
    color: 'cyan',
    category: 'delivery',
  },
  {
    id: 'pudu-t300',
    name: 'PUDU T300',
    fullName: 'PUDU T300',
    image: '/images/bots/pudu-t300.png',
    buttonImage: '/images/buttons/button-pudu-t300.png',
    link: '/products/pudu-t300',
    color: 'indigo',
    category: 'delivery',
  },
  {
    id: 'pudu-t600',
    name: 'PUDU T600',
    fullName: 'PUDU T600',
    image: '/images/bots/pudu-t600.png',
    buttonImage: '/images/buttons/button-pudu-t600.png',
    link: '/products/pudu-t600',
    color: 'violet',
    category: 'delivery',
  },
];

// Industries served
const INDUSTRIES = [
  { name: 'Airports', icon: '/images/icons/industries/indus-airport.png' },
  { name: 'Hotels', icon: '/images/icons/industries/indus-bed.png' },
  { name: 'Restaurants', icon: '/images/icons/industries/indus-restaurant.png' },
  { name: 'Janitorial Services', icon: '/images/icons/industries/indus-janitor.png' },
  { name: 'Casinos', icon: '/images/icons/industries/indus-casino.png' },
  { name: 'Assisted Living', icon: '/images/icons/industries/indus-wheelchair.png' },
  { name: 'Gyms', icon: '/images/icons/industries/indus-gym.png' },
  { name: 'Malls', icon: '/images/icons/industries/indus-mall.png' },
  { name: 'Schools', icon: '/images/icons/industries/indus-school.png' },
  { name: 'Office Buildings', icon: '/images/icons/industries/indus-office.png' },
  { name: 'Hospitals & Healthcare', icon: '/images/icons/industries/indus-hospital.png' },
  { name: 'Museums', icon: '/images/icons/industries/indus-museum.png' },
];

// Technology features
const TECH_FEATURES = [
  {
    title: 'LiDAR and V-SLAM',
    description: 'High-resolution LiDAR sensors and Visual Simultaneous Localization and Mapping (V-SLAM) create detailed, real-time 3D spatial maps of the environment.',
  },
  {
    title: '360° Obstacle Avoidance',
    description: 'Integrated cameras, ultrasonic, and infrared sensors provide complete situational awareness, enabling dynamic obstacle detection and safe collision avoidance.',
  },
  {
    title: 'Dynamic Route Optimization',
    description: 'Sophisticated AI route planning algorithms dynamically calculate the most efficient path, guaranteeing comprehensive coverage.',
  },
];

const HomePage = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    // Set SEO metadata
    setSeoMetadata({
      ...SEO_PRESETS.home,
      title: 'Transform Your Commercial Cleaning with AI Robots | 123 Bots',
      description: 'Discover smart robotic floor cleaners perfect for your business. Save time and effort with autonomous AI cleaning robots. Request a demo today!',
      keywords: 'AI robots, commercial cleaning, robotic floor cleaners, autonomous cleaning, PUDU robots, floor scrubbers, 123Bots',
      jsonLd: [generateOrganizationSchema(), generateWebsiteSchema()],
    });
  }, []);

  const scrollToDemo = () => {
    document.getElementById('schedule-demo')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      
      {/* Hero Section with Video Background */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/images/home/4-bots.jpg"
        >
          <source src="/videos/cc1-pro.mp4" type="video/mp4" />
        </video>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-bots-dark/80 via-bots-dark/60 to-bots-dark" />
        
        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <p className="text-blue-400 font-semibold mb-6 animate-fade-in-down text-lg">EXPLORE OUR ROBOT SOLUTIONS</p>
          
          {/* Category Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 animate-fade-in">
            <Link 
              to="/commercial-cleaning-bots"
              className="group relative px-8 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold rounded-full text-lg hover:from-blue-500 hover:to-cyan-400 transition-all transform hover:scale-105 shadow-lg shadow-blue-500/30 w-full sm:w-auto"
              data-testid="hero-cta-cleaning"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">🧹</span>
                <span>Commercial Cleaning Bots</span>
              </div>
            </Link>
            
            <Link 
              to="/industrial-delivery-bots"
              className="group relative px-8 py-5 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold rounded-full text-lg hover:from-purple-500 hover:to-indigo-400 transition-all transform hover:scale-105 shadow-lg shadow-purple-500/30 w-full sm:w-auto"
              data-testid="hero-cta-delivery"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">📦</span>
                <span>Industrial Delivery Bots</span>
              </div>
            </Link>
          </div>
          
          <p className="text-blue-300 text-sm mb-8 animate-fade-in">or continue scrolling down</p>
          
          {/* Scroll Down Indicator */}
          <div className="animate-bounce-slow">
            <img 
              src="/images/home/scroll-down.gif" 
              alt="Scroll down" 
              className="w-12 h-12 mx-auto opacity-70"
            />
          </div>
        </div>
      </section>

      {/* AI Impact Section */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Robot Animation */}
            <div className="flex justify-center animate-fade-in-left">
              <img 
                src="/images/bots/screen2-robot-gif.gif" 
                alt="AI Cleaning Robot" 
                className="w-full max-w-md rounded-2xl shadow-2xl shadow-blue-500/20"
              />
            </div>
            
            {/* Content */}
            <div className="text-center md:text-left animate-fade-in-right">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                HAVE YOU EVER WONDERED, HOW AI WOULD AFFECT YOUR BUSINESS...
              </h2>
              <div className="space-y-4 text-lg">
                <p className="text-red-400 font-semibold">
                  Tasks Like, Sweeping, Mopping, Vacuuming, Delivery & Snow Removal...
                </p>
                <p className="text-red-400 font-semibold">
                  We Will See More Autonomous Equipment Being Used In The Workplace.
                </p>
                <p className="text-white text-2xl font-bold mt-6">
                  It's Not a Matter IF You Will Use This Equipment.... It's WHEN...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Products Showcase Section */}
      <section className="py-20 bg-gradient-to-b from-bots-dark via-bots-surface to-bots-dark relative overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src="/videos/123-bots-home-background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-bots-dark/70" />
        
        <div className="relative z-10 w-full px-8">
          {/* Intro Text */}
          <div className="text-center mb-16">
            <p className="text-white text-lg max-w-4xl mx-auto leading-relaxed">
              <span className="font-bold">Transform Your Operations with Autonomous Robotics</span><br /><br />
              From pristine floors to seamless logistics, our intelligent robots revolutionize commercial spaces. 
              Our <span className="text-blue-400 font-semibold">commercial cleaning bots</span> deliver deeper, more consistent cleaning—
              boosting hygiene standards across hospitals, warehouses, and corporate campuses with 24/7 autonomous operation. 
              Meanwhile, our <span className="text-purple-400 font-semibold">industrial delivery robots</span> handle payloads from 22lbs 
              to 1322lbs, streamlining material transport in factories, hotels, and distribution centers. Together, these 
              advanced machines enhance safety, maximize efficiency, and deliver significant operational savings.
            </p>
          </div>

          {/* Products Grid - Infinite Scroll */}
          <div className="relative overflow-hidden mb-16">
            <div className="flex animate-scroll-infinite gap-12">
              {/* First set of products */}
              {PRODUCTS.map((product, index) => (
                <Link 
                  key={`${product.id}-1`}
                  to={product.link}
                  className="group text-center flex-shrink-0 w-64"
                  data-testid={`product-card-${product.id}`}
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img 
                      src={product.image} 
                      alt={product.fullName}
                      className="w-full h-64 object-contain mx-auto transform group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-white font-bold text-2xl mb-2">{product.name}</h3>
                  <p className="text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
                    Click to see more...
                  </p>
                </Link>
              ))}
              {/* Duplicate set for seamless loop */}
              {PRODUCTS.map((product, index) => (
                <Link 
                  key={`${product.id}-2`}
                  to={product.link}
                  className="group text-center flex-shrink-0 w-64"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <img 
                      src={product.image} 
                      alt={product.fullName}
                      className="w-full h-64 object-contain mx-auto transform group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-white font-bold text-2xl mb-2">{product.name}</h3>
                  <p className="text-blue-400 text-sm group-hover:text-blue-300 transition-colors">
                    Click to see more...
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Revolutionizing Solutions Section */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-8">
            Revolutionizing Floor Cleaning Solutions for Modern Spaces
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 mt-12">
            <div className="bg-bots-surface/50 p-8 rounded-2xl border border-blue-500/20">
              <h3 className="text-2xl font-bold text-white mb-4">AUTONOMOUS FLOOR CLEANING SOLUTIONS</h3>
              <p className="text-gray-300 leading-relaxed">
                Floor care has evolved well beyond traditional manual mopping. Today, autonomous robotics 
                are revolutionizing the industry, setting new standards for reliability and effectiveness 
                in floor cleaning. These intelligent solutions provide faster, more consistent, and more 
                hygienic results, all with minimal human intervention.
              </p>
            </div>
            
            <div className="bg-bots-surface/50 p-8 rounded-2xl border border-blue-500/20">
              <h3 className="text-2xl font-bold text-white mb-4">Engineered for Commercial Excellence</h3>
              <p className="text-gray-300 leading-relaxed">
                Designed specifically for the needs of commercial settings, our autonomous solutions 
                provide reliable, professional-grade results each time. Enhance the health, safety, 
                and visual appeal of your entire facility with state-of-the-art autonomy, advanced 
                robotics, and industry-leading software.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ROI & Market Growth Section */}
      <section className="py-20 bg-gradient-to-r from-blue-900/30 to-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Maximize Your Facility's ROI?
              </h2>
              <div className="bg-bots-surface/50 p-6 rounded-xl border border-blue-500/20 mb-6">
                <h4 className="text-blue-400 font-bold mb-2">Market Growth</h4>
                <p className="text-gray-300">
                  The autonomous cleaning industry is experiencing rapid growth. Market research indicates 
                  an annual increase exceeding 20%. An increasing number of enterprises are adapting their 
                  operations to incorporate these solutions.
                </p>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">
                LiDAR and AI: Redefining Cleaning in Healthcare
              </h3>
              <p className="text-gray-300 mb-6">
                Modern robotic systems now utilize advanced Artificial Intelligence, sophisticated sensors, 
                and intelligent technology. Innovations such as LiDAR and integrated camera systems allow 
                these platforms to navigate complex layouts with exceptional precision.
              </p>
              
              <ul className="space-y-3">
                {['Deliver a Consistent Clean', 'Maximize Staff Efficiency', 'Validate ROI'].map((item) => (
                  <li key={item} className="flex items-center text-white">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="flex justify-center">
              <img 
                src="/images/bots/pudu-cc1_pro.png" 
                alt="PUDU CC1 Pro" 
                className="w-full max-w-md animate-float"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Deployment CTA Banner */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
            We are on track to deploy over 30,000 robots across the U.S. Don't miss out—schedule your demo today!
          </h2>
          <button 
            onClick={scrollToDemo}
            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full text-lg hover:bg-gray-100 transition-colors shadow-lg"
            data-testid="schedule-demo-cta"
          >
            Schedule Your Demo!
          </button>
        </div>
      </section>

      {/* Core Technologies Section */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            Core Technologies Behind Autonomous Cleaning
          </h2>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <img 
                src="/images/home/4-bots.jpg" 
                alt="Four cleaning robots" 
                className="w-full rounded-2xl shadow-2xl"
              />
            </div>
            
            <div className="space-y-6">
              <p className="text-gray-300 text-lg">
                Our Pudu robots are equipped with an advanced core of AI and High-Precision Perception Systems. 
                Going beyond mere automation, this technology facilitates exceptional performance and safety.
              </p>
              
              {TECH_FEATURES.map((feature, index) => (
                <div key={index} className="bg-bots-surface/50 p-6 rounded-xl border border-blue-500/20">
                  <h4 className="text-blue-400 font-bold mb-2">{feature.title}</h4>
                  <p className="text-gray-300 text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Schedule Demo Form Section */}
      <section id="schedule-demo" className="py-20 bg-gradient-to-b from-bots-dark to-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Ready To Explore a New Way of Working?
              </h2>
              <p className="text-gray-300 text-lg mb-8">
                Ready to see our robot live at your facility? Complete our quick 2-minute form to schedule 
                your no-obligation demo. Our team will get in touch to show you the significant time and 
                cost savings our solution can bring to your bottom line.
              </p>
            </div>
            
            <div className="bg-bots-surface p-8 rounded-2xl border border-blue-500/20">
              <DemoRequestForm />
            </div>
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            <span className="text-blue-400">INDUSTRIES</span> WE SERVE... AND MANY MORE...
          </h2>
          
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-8">
            {INDUSTRIES.map((industry, index) => (
              <div 
                key={industry.name}
                className="text-center group animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="w-20 h-20 mx-auto mb-3 flex items-center justify-center bg-bots-surface/50 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <img 
                    src={industry.icon} 
                    alt={industry.name}
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <p className="text-white text-sm font-medium">{industry.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Areas Section */}
      <section className="py-12 bg-bots-surface">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h3 className="text-2xl font-bold text-white mb-6">
            <span className="text-blue-400">AVAILABLE STATES</span> WE SERVE
          </h3>
          <p className="text-gray-300 leading-relaxed">
            Missouri | Iowa | Illinois | Indiana | Ohio | Kentucky | Tennessee | Arkansas | Kansas | Oklahoma
          </p>
          <p className="text-gray-300 leading-relaxed mt-2">
            Texas | Louisiana | Mississippi | Alabama | Georgia | South Carolina | Florida | Puerto Rico | Virgin Islands
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

// Demo Request Form Component
const DemoRequestForm = () => {
  const [formData, setFormData] = useState({
    organization: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    product: '',
    contactMethod: 'both',
    notes: '',
    agreedToTerms: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

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
          message: `Organization: ${formData.organization}\nProduct Interest: ${formData.product}\nContact Method: ${formData.contactMethod}\nAdditional Notes: ${formData.notes}`,
          source: 'demo_request',
        }),
      });
      
      if (response.ok) {
        setSubmitStatus('success');
        setFormData({
          organization: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          product: '',
          contactMethod: 'both',
          notes: '',
          agreedToTerms: false,
        });
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
      <div className="text-center py-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-white mb-2">Thank You!</h3>
        <p className="text-gray-300">We'll be in touch shortly to schedule your demo.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" data-testid="demo-request-form">
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
      
      <select
        required
        value={formData.product}
        onChange={(e) => setFormData({ ...formData, product: e.target.value })}
        className="w-full px-4 py-3 bg-bots-dark border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none"
        data-testid="demo-form-product"
      >
        <option value="">What product are you interested in?*</option>
        <option value="PUDU CC1">PUDU CC1</option>
        <option value="PUDU SH1">PUDU SH1</option>
        <option value="PUDU MT1">PUDU MT1</option>
        <option value="AVIDBOT KAS">AVIDBOT KAS</option>
      </select>
      
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center text-white cursor-pointer">
          <input
            type="radio"
            name="contactMethod"
            value="phone"
            checked={formData.contactMethod === 'phone'}
            onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value })}
            className="mr-2"
          />
          Phone
        </label>
        <label className="flex items-center text-white cursor-pointer">
          <input
            type="radio"
            name="contactMethod"
            value="email"
            checked={formData.contactMethod === 'email'}
            onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value })}
            className="mr-2"
          />
          Email
        </label>
        <label className="flex items-center text-white cursor-pointer">
          <input
            type="radio"
            name="contactMethod"
            value="both"
            checked={formData.contactMethod === 'both'}
            onChange={(e) => setFormData({ ...formData, contactMethod: e.target.value })}
            className="mr-2"
          />
          Both
        </label>
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
        placeholder="Enter any additional notes or more information"
        value={formData.notes}
        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        rows={3}
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
          I agree to terms & conditions provided by 123 Bots. By providing my phone number, 
          I agree to receive text messages from the business.
        </span>
      </label>
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        data-testid="demo-form-submit"
      >
        {isSubmitting ? 'Submitting...' : 'SCHEDULE MY CALL'}
      </button>
      
      {submitStatus === 'error' && (
        <p className="text-red-400 text-center">Something went wrong. Please try again.</p>
      )}
    </form>
  );
};

export default HomePage;
