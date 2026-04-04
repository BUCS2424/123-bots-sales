import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Bot,
  Users,
  Heart,
  CheckCircle,
  Target,
  Shield,
  Zap,
  Star,
} from 'lucide-react';
import { setSeoMetadata, generateOrganizationSchema } from '../lib/seo';
import Header from '../components/Header';

const AboutUsPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'About Us',
      description: 'Learn the 123BoTs story, operating model, core values, and strategic journey in autonomous facility maintenance.',
      keywords: '123BoTs about us, autonomous floor care, healthcare robotics, proof of clean, facility maintenance automation',
      canonicalPath: '/about',
      ogType: 'website',
      jsonLd: generateOrganizationSchema(),
    });
  }, []);

  const values = [
    {
      icon: Shield,
      title: 'Operational Transparency',
      description: 'We believe in data-backed results. If it is not measured, it is not clean.',
    },
    {
      icon: Target,
      title: 'Relentless Solution-Orientation',
      description: 'Every team member is an end-user; we solve technical challenges with urgency.',
    },
    {
      icon: Users,
      title: 'Human-Centric Automation',
      description: 'We do not replace people; we automate repetitive work so teams can focus on exceptional work.',
    },
    {
      icon: Zap,
      title: 'Proof of Clean Focus',
      description: 'Our success is measured by the autonomous miles we maintain and partner confidence we restore.',
    },
  ];

  const differentiators = [
    'Operator-First Perspective: We are former Directors of Operations and EVS experts who have managed robotic fleets in high-stakes healthcare environments.',
    'Edge-to-Edge Strategy: We deploy a Hub and Spoke fleet model, utilizing heavy-duty units like the B1G for open areas and precision robots like the CC1 Pro for tight corridors and corners.',
    'The Proof of Clean Guarantee: Every deployment includes transparent, data-driven reporting showing where, when, and how your facility was maintained.',
    'Comprehensive Life-Cycle Support: From initial site mapping and elevator integration to long-term all-in-one service, we stay with the equipment from day one through its life.',
    'Regional Specialization: With deep roots in the Midwest and expanding operations in the Caribbean, we provide localized high-frequency support that national retailers cannot match.',
  ];

  const milestones = [
    { year: 'Year 1', event: 'The Foundation. The partners found common interest in advancing robotic technology and began using Generation 1 robots.' },
    { year: 'Year 2', event: 'Field Testing & Lessons Learned. We spent this year in the trenches running robots in healthcare, manufacturing, and retail environments.' },
    { year: 'Year 3', event: 'Expansion & Refinement. We reviewed and tested multiple robotics brands for durability, effectiveness, and innovation.' },
    { year: 'Year 4', event: 'The Strategic Horizon. We are expanding into Puerto Rico and the Caribbean while continuing to serve local hospitals and schools.' },
  ];

  return (
    <div className="min-h-screen bg-[#0a1628]" data-testid="about-us-page">
      <Header />
      <div className="bg-[#0a1628] text-white py-20 pt-36">
        <div className="max-w-6xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-blue-400 hover:text-white mb-6" data-testid="about-us-back-home-link">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="about-us-hero-title">
                Our Story,
                <br />
                <span className="text-green-400">Built in Operations.</span>
              </h1>
              <p className="text-xl text-gray-300 leading-relaxed" data-testid="about-us-hero-summary">
                At 123BoTs, we believe that the standard of cleanliness should not be a variable — it should be a guarantee.
              </p>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/30 to-green-500/20 flex items-center justify-center">
                  <Bot className="w-32 h-32 text-blue-400" />
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <Star className="w-10 h-10 text-blue-400" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-green-500/30 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <section data-testid="about-us-story-section">
            <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-300 leading-relaxed">
              <p>
                At 123BoTs, we believe that the standard of cleanliness should not be a variable — it should be a guarantee. Our story began not in a boardroom, but on the front lines of facility management. After years of overseeing environmental services and operations for large-scale healthcare systems and industrial sites, we experienced the labor gap firsthand. We saw burnout, turnover, and inconsistency that comes with manual floor care.
              </p>
              <p>
                We realized the future of facility maintenance was not just better chemicals; it was smarter systems. We founded 123BoTs to bridge cutting-edge autonomous technology with the practical realities of daily operations.
              </p>
              <p>
                We are former operators and end-users who have lived these challenges. We have tested, broken, and perfected robotic workflows in hospitals, 3PL warehouses, and retail centers across 17 states.
              </p>
              <p>
                Today, we bring that expertise to your facility, offering a Proof of Clean that protects budget, staff, and reputation. Our success is measured by the miles of floor we autonomously maintain and the peace of mind we return to our partners.
              </p>
            </div>
          </section>

          <div className="bg-[#111d2e] rounded-2xl p-8 border border-gray-700" data-testid="about-us-differentiators-section">
            <h3 className="text-xl font-bold text-white mb-4">What Sets Us Apart</h3>
            <ul className="space-y-3">
              {differentiators.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3" data-testid={`about-us-differentiator-${idx + 1}`}>
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <span className="text-gray-300 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-[#111d2e] py-16" data-testid="about-us-core-values-section">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="bg-[#0a1628] backdrop-blur rounded-xl p-6 text-center border border-gray-700" data-testid={`about-us-core-value-${idx + 1}`}>
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-gray-400 text-sm">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16" data-testid="about-us-journey-section">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Our Journey</h2>
        <div className="relative">
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-blue-500 to-green-500" />

          <div className="space-y-8">
            {milestones.map((milestone, idx) => (
              <div key={idx} className={`flex items-center gap-8 ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`} data-testid={`about-us-journey-item-${idx + 1}`}>
                <div className={`flex-1 ${idx % 2 === 0 ? 'text-right' : 'text-left'}`}>
                  <div className="bg-[#111d2e] rounded-xl p-6 shadow-lg inline-block max-w-md border border-gray-700">
                    <span className="text-blue-400 font-bold text-lg">{milestone.year}</span>
                    <p className="text-gray-300 mt-2 leading-relaxed">{milestone.event}</p>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full bg-green-400 ring-4 ring-[#0a1628] shadow-lg z-10" />
                <div className="flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
