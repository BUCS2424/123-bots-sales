import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { setSeoMetadata } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

// Industry data
const INDUSTRIES = {
  'retail-uses': {
    name: 'Retail',
    title: 'Autonomous Cleaning for Retail Spaces',
    description: 'Keep your retail floors spotless and create a welcoming environment for customers with our AI-powered cleaning robots.',
    heroImage: '/images/home/4-bots.jpg',
    benefits: [
      'Clean aisles attract more customers',
      'Reduce slip and fall accidents',
      'Consistent cleaning schedules',
      'Night-time autonomous operation',
      'Cost-effective labor solution',
      'Real-time cleaning reports',
    ],
    challenges: [
      { problem: 'High foot traffic areas', solution: 'Our robots navigate around customers safely' },
      { problem: 'Extended operating hours', solution: '24/7 autonomous cleaning capability' },
      { problem: 'Multiple floor surfaces', solution: 'Multi-surface cleaning technology' },
    ],
    recommendedProducts: ['pudu-cc1-pro', 'pudu-sh1'],
  },
  'warehouses': {
    name: 'Warehouses',
    title: 'Industrial-Grade Cleaning for Warehouses',
    description: 'Maintain clean and safe warehouse floors with our heavy-duty autonomous cleaning solutions designed for industrial environments.',
    heroImage: '/images/home/4-bots.jpg',
    benefits: [
      'Handle large floor areas efficiently',
      'Work around pallets and equipment',
      'Reduce dust and debris',
      'OSHA compliance support',
      'Minimal supervision required',
      'Fleet management capabilities',
    ],
    challenges: [
      { problem: 'Massive floor areas', solution: 'Extended range robots with large tanks' },
      { problem: 'Heavy equipment obstacles', solution: 'Advanced obstacle detection and avoidance' },
      { problem: 'Continuous operations', solution: 'Auto-docking and self-charging' },
    ],
    recommendedProducts: ['ab-kas', 'pudu-mt1'],
  },
  'hospitality': {
    name: 'Hospitality',
    title: 'Premium Cleaning for Hotels & Hospitality',
    description: 'Deliver exceptional guest experiences with pristine floors. Our quiet, efficient robots work around the clock without disturbing guests.',
    heroImage: '/images/home/4-bots.jpg',
    benefits: [
      'Ultra-quiet operation',
      'Guest-friendly navigation',
      'Lobby and hallway coverage',
      'Schedule around events',
      'Consistent brand standards',
      'Staff productivity boost',
    ],
    challenges: [
      { problem: 'Guest presence', solution: 'Quiet operation and polite obstacle avoidance' },
      { problem: 'Brand image concerns', solution: 'Sleek, professional robot appearance' },
      { problem: 'Variable schedules', solution: 'Flexible scheduling via cloud app' },
    ],
    recommendedProducts: ['pudu-cc1-pro', 'pudu-sh1'],
  },
  'events-stadiums': {
    name: 'Events & Stadiums',
    title: 'Rapid Cleaning for Events & Stadiums',
    description: 'Handle the cleaning challenges of high-capacity venues with robots that can quickly restore floors between events.',
    heroImage: '/images/home/4-bots.jpg',
    benefits: [
      'Rapid post-event cleaning',
      'Handle spills and debris',
      'Work in team formations',
      'Cover massive areas quickly',
      'Reduce turnaround time',
      'Lower labor costs',
    ],
    challenges: [
      { problem: 'Massive cleaning needs post-event', solution: 'Fleet deployment for rapid coverage' },
      { problem: 'Tight turnaround times', solution: 'Fast cleaning with multiple robots' },
      { problem: 'Varied surface conditions', solution: 'Adaptive cleaning technology' },
    ],
    recommendedProducts: ['pudu-mt1', 'ab-kas'],
  },
  'education': {
    name: 'Education',
    title: 'Safe Cleaning for Schools & Universities',
    description: 'Create healthier learning environments with consistent, thorough floor cleaning that works around class schedules.',
    heroImage: '/images/home/4-bots.jpg',
    benefits: [
      'Healthier learning environments',
      'Clean during off-hours',
      'Safe around students',
      'Reduce custodial strain',
      'Budget-friendly solution',
      'Compliance reporting',
    ],
    challenges: [
      { problem: 'Student safety concerns', solution: 'Extensive safety sensors and slow approach' },
      { problem: 'Budget constraints', solution: 'Flexible leasing options' },
      { problem: 'Building variety', solution: 'Adaptable to different floor types' },
    ],
    recommendedProducts: ['pudu-cc1-pro', 'pudu-sh1'],
  },
};

const ROBOT_PRODUCTS = {
  'pudu-cc1-pro': { name: 'PUDU CC1 PRO', image: '/images/bots/pringle-cc1-robot.png' },
  'ab-kas': { name: 'AVIDBOT KAS', image: '/images/bots/avidbot-kas.png' },
  'pudu-sh1': { name: 'PUDU SH1', image: '/images/bots/robot-pudush.png' },
  'pudu-mt1': { name: 'PUDU MT1 MAX', image: '/images/bots/nav_product_mt.webp' },
};

const IndustryPage = () => {
  const { industrySlug } = useParams();
  const industry = INDUSTRIES[industrySlug];

  useEffect(() => {
    if (industry) {
      setSeoMetadata({
        title: `${industry.title} | 123 Bots`,
        description: industry.description,
        keywords: `${industry.name} cleaning robots, autonomous cleaning ${industry.name.toLowerCase()}, commercial floor cleaning`,
        canonicalPath: `/industries/${industrySlug}`,
      });
    }
  }, [industry, industrySlug]);

  if (!industry) {
    return (
      <div className="min-h-screen bg-bots-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">Industry Not Found</h1>
          <Link to="/" className="text-blue-400 hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${industry.heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-bots-dark via-bots-dark/90 to-bots-dark" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <p className="text-blue-400 font-semibold mb-4">{industry.name} Industry</p>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">{industry.title}</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">{industry.description}</p>
          <Link
            to="/schedule-a-demo"
            className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors"
            data-testid="industry-cta-demo"
          >
            Schedule a Demo
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Benefits for {industry.name}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industry.benefits.map((benefit, index) => (
              <div
                key={benefit}
                className="flex items-start p-6 bg-bots-dark rounded-xl animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CheckCircle className="w-6 h-6 text-green-500 mr-4 flex-shrink-0 mt-1" />
                <p className="text-white">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Challenges & Solutions */}
      <section className="py-20 bg-bots-dark">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How We Solve {industry.name} Challenges
          </h2>
          <div className="space-y-6">
            {industry.challenges.map((item, index) => (
              <div
                key={index}
                className="bg-bots-surface/50 p-6 rounded-xl border border-gray-800 grid md:grid-cols-2 gap-6"
              >
                <div>
                  <p className="text-red-400 font-semibold mb-2">Challenge:</p>
                  <p className="text-white">{item.problem}</p>
                </div>
                <div>
                  <p className="text-green-400 font-semibold mb-2">Our Solution:</p>
                  <p className="text-white">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recommended Products */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Recommended for {industry.name}
          </h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {industry.recommendedProducts.map((productId) => {
              const product = ROBOT_PRODUCTS[productId];
              return (
                <Link
                  key={productId}
                  to={`/products/${productId}`}
                  className="bg-bots-dark p-8 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-colors group text-center"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-48 mx-auto object-contain mb-6 group-hover:scale-105 transition-transform"
                  />
                  <h3 className="text-xl font-bold text-white mb-2">{product.name}</h3>
                  <span className="inline-flex items-center text-blue-400 group-hover:text-blue-300">
                    Learn More <ArrowRight className="w-4 h-4 ml-2" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Ready to Transform Your {industry.name} Cleaning?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join hundreds of {industry.name.toLowerCase()} businesses already using our robots.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/schedule-a-demo"
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors"
            >
              Schedule a Demo
            </Link>
            <Link
              to="/rent-or-buy-a-cleaning-bot"
              className="px-8 py-4 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-colors"
            >
              Get Pricing
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IndustryPage;
