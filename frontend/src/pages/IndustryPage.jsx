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
  'healthcare': {
    name: 'Healthcare',
    title: 'Hospital-Grade Autonomous Floor Care',
    description: 'Deliver infection control excellence with autonomous robots designed for healthcare environments. Our Proof of Clean system ensures compliance and patient safety.',
    heroImage: '/images/home/4-bots.jpg',
    metaDescription: 'Autonomous floor cleaning robots for hospitals, clinics, and healthcare facilities. HIPAA-compliant operations, infection control support, and 24/7 cleaning with real-time reporting.',
    metaKeywords: 'healthcare cleaning robots, hospital floor cleaning, autonomous EVS, infection control cleaning, healthcare facility maintenance, medical facility cleaning robots, HIPAA compliant cleaning',
    benefits: [
      'Infection control through consistent cleaning protocols',
      'Reduce HAI (Hospital-Acquired Infection) risks',
      '24/7 autonomous operation with minimal disruption',
      'Real-time Proof of Clean reporting for compliance',
      'HIPAA-compliant data handling',
      'Reduce EVS staff burnout and turnover',
      'Navigate safely around patients and medical equipment',
      'Elevator integration for multi-floor facilities',
    ],
    challenges: [
      { problem: 'Infection control requirements', solution: 'Hospital-grade cleaning with UV-C options and antimicrobial squeegees' },
      { problem: 'Patient and visitor safety', solution: 'Multi-sensor navigation avoids people, beds, and equipment with gentle approach' },
      { problem: 'Compliance documentation', solution: 'Automated Proof of Clean reports showing where, when, and how floors were cleaned' },
      { problem: 'Night shift staffing shortages', solution: 'Autonomous operation during off-hours with remote monitoring' },
      { problem: 'Multiple floor types and areas', solution: 'Hub and Spoke fleet model with specialized robots for each zone' },
      { problem: 'Budget constraints', solution: 'Flexible leasing and all-in-one service packages' },
    ],
    useCases: [
      { area: 'Emergency Departments', description: 'Rapid response cleaning between patients with minimal disruption' },
      { area: 'Operating Room Corridors', description: 'Consistent sterile pathway maintenance' },
      { area: 'Patient Room Hallways', description: 'Quiet night-time cleaning while patients rest' },
      { area: 'Lobby & Waiting Areas', description: 'Continuous cleaning for high-traffic public spaces' },
      { area: 'Cafeterias & Break Rooms', description: 'Scheduled cleaning around meal times' },
      { area: 'Pharmacy & Lab Corridors', description: 'Clean environment for sensitive operations' },
    ],
    stats: [
      { value: '99.2%', label: 'Cleaning Coverage Rate' },
      { value: '40%', label: 'Reduction in EVS Overtime' },
      { value: '24/7', label: 'Autonomous Operation' },
      { value: '17', label: 'States Served' },
    ],
    recommendedProducts: ['pudu-cc1-pro', 'ab-kas', 'pudu-sh1', 'pudu-mt1'],
    testimonial: {
      quote: "The robots have transformed our EVS operations. We now have consistent, documented cleaning that our infection control team can actually verify.",
      author: "Director of Environmental Services",
      facility: "Regional Medical Center"
    }
  },
};

const ROBOT_PRODUCTS = {
  'pudu-cc1-pro': { name: 'PUDU CC1 PRO', image: '/images/bots/pringle-cc1-robot.png' },
  'ab-kas': { name: 'AVIDBOT KAS', image: '/images/bots/avidbot-kas.png' },
  'pudu-sh1': { name: 'PUDU SH1', image: '/images/bots/robot-pudush.png' },
  'pudu-mt1': { name: 'PUDU MT1 MAX', image: '/images/bots/pudu-mt1-max.png' },
};

const IndustryPage = () => {
  const { industrySlug } = useParams();
  const industry = INDUSTRIES[industrySlug];
  const isHealthcare = industrySlug === 'healthcare';

  useEffect(() => {
    if (industry) {
      setSeoMetadata({
        title: `${industry.title} | 123 Bots`,
        description: industry.metaDescription || industry.description,
        keywords: industry.metaKeywords || `${industry.name} cleaning robots, autonomous cleaning ${industry.name.toLowerCase()}, commercial floor cleaning`,
        canonicalPath: `/industries/${industrySlug}`,
      });
    }
  }, [industry, industrySlug]);

  if (!industry) {
    return (
      <div className="min-h-screen bg-bots-dark flex items-center justify-center">
        <Header />
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
          <p className="text-blue-400 font-semibold mb-4 uppercase tracking-wider">{industry.name} Industry</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">{industry.title}</h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">{industry.description}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/schedule-a-demo"
              className="inline-block px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors"
              data-testid="industry-cta-demo"
            >
              Schedule a Demo
            </Link>
            <Link
              to="/contact"
              className="inline-block px-8 py-4 bg-transparent border-2 border-white text-white font-bold rounded-full hover:bg-white hover:text-bots-dark transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section - Healthcare Only */}
      {isHealthcare && industry.stats && (
        <section className="py-12 bg-bots-surface border-y border-gray-800">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {industry.stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-green-400 mb-2">{stat.value}</p>
                  <p className="text-gray-400 text-sm md:text-base">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Benefits for {industry.name}
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            {isHealthcare 
              ? "Our autonomous floor care solutions are designed specifically for the unique demands of healthcare environments."
              : `Discover how our autonomous robots transform ${industry.name.toLowerCase()} operations.`
            }
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {industry.benefits.map((benefit, index) => (
              <div
                key={benefit}
                className="flex items-start p-6 bg-bots-dark rounded-xl border border-gray-800 hover:border-green-500/30 transition-colors"
              >
                <CheckCircle className="w-6 h-6 text-green-500 mr-4 flex-shrink-0 mt-0.5" />
                <p className="text-white text-sm md:text-base">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section - Healthcare Only */}
      {isHealthcare && industry.useCases && (
        <section className="py-20 bg-bots-dark">
          <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-white text-center mb-4">
              Healthcare Areas We Serve
            </h2>
            <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
              Our robots are deployed across diverse healthcare facility zones, each with tailored cleaning protocols.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industry.useCases.map((useCase, index) => (
                <div
                  key={index}
                  className="p-6 bg-bots-surface rounded-xl border border-gray-800 hover:border-blue-500/30 transition-colors"
                >
                  <h3 className="text-lg font-bold text-blue-400 mb-2">{useCase.area}</h3>
                  <p className="text-gray-300 text-sm">{useCase.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Challenges & Solutions */}
      <section className={`py-20 ${isHealthcare ? 'bg-bots-surface' : 'bg-bots-dark'}`}>
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            How We Solve {industry.name} Challenges
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            {isHealthcare
              ? "Healthcare facilities face unique cleaning challenges. Here's how 123Bots addresses each one."
              : `We understand the unique challenges facing ${industry.name.toLowerCase()} facilities.`
            }
          </p>
          <div className="space-y-6">
            {industry.challenges.map((item, index) => (
              <div
                key={index}
                className="bg-bots-dark p-6 rounded-xl border border-gray-800 grid md:grid-cols-2 gap-6"
              >
                <div>
                  <p className="text-red-400 font-semibold mb-2 text-sm uppercase tracking-wider">Challenge:</p>
                  <p className="text-white">{item.problem}</p>
                </div>
                <div>
                  <p className="text-green-400 font-semibold mb-2 text-sm uppercase tracking-wider">Our Solution:</p>
                  <p className="text-white">{item.solution}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial Section - Healthcare Only */}
      {isHealthcare && industry.testimonial && (
        <section className="py-20 bg-bots-dark">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <blockquote className="text-2xl md:text-3xl text-white font-light italic mb-8">
              "{industry.testimonial.quote}"
            </blockquote>
            <div>
              <p className="text-blue-400 font-semibold">{industry.testimonial.author}</p>
              <p className="text-gray-400">{industry.testimonial.facility}</p>
            </div>
          </div>
        </section>
      )}

      {/* Recommended Products */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Recommended for {industry.name}
          </h2>
          <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
            {isHealthcare
              ? "Our healthcare-optimized fleet includes robots for every area of your facility."
              : `These robots are ideal for ${industry.name.toLowerCase()} environments.`
            }
          </p>
          <div className={`grid ${isHealthcare ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'} gap-8 ${isHealthcare ? '' : 'max-w-4xl mx-auto'}`}>
            {industry.recommendedProducts.map((productId) => {
              const product = ROBOT_PRODUCTS[productId];
              if (!product) return null;
              return (
                <Link
                  key={productId}
                  to={`/products/${productId}`}
                  className="bg-bots-dark p-8 rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-colors group text-center"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-40 md:h-48 mx-auto object-contain mb-6 group-hover:scale-105 transition-transform"
                  />
                  <h3 className="text-lg md:text-xl font-bold text-white mb-2">{product.name}</h3>
                  <span className="inline-flex items-center text-blue-400 group-hover:text-blue-300 text-sm">
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
            {isHealthcare 
              ? "Ready for Hospital-Grade Autonomous Floor Care?"
              : `Ready to Transform Your ${industry.name} Cleaning?`
            }
          </h2>
          <p className="text-white/80 text-lg mb-8">
            {isHealthcare
              ? "Join leading healthcare facilities across 17 states already using our Proof of Clean system."
              : `Join hundreds of ${industry.name.toLowerCase()} businesses already using our robots.`
            }
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

      {/* Available States Section */}
      <section className="py-16 bg-bots-dark border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-8">
            <span className="text-green-400 italic">AVAILABLE STATES</span>{' '}
            <span className="text-white">WE SERVE</span>
          </h2>
          <p className="text-gray-300 text-lg mb-4">
            Missouri | Iowa | Illinois | Indiana | Ohio | Kentucky | Tennessee | Arkansas | Kansas | Oklahoma
          </p>
          <p className="text-gray-300 text-lg">
            Texas | Louisiana | Mississippi | Alabama | Georgia | South Carolina | Florida | Puerto Rico | Virgin Islands
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IndustryPage;
