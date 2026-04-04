import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { setSeoMetadata, generateOrganizationSchema } from '../lib/seo';

const differentiators = [
  'Operator-First Perspective: We are former Directors of Operations and EVS experts who have managed robotic fleets in high-stakes healthcare environments.',
  'Edge-to-Edge Strategy: We deploy a "Hub and Spoke" fleet model, utilizing heavy-duty units like the B1G for open areas and precision robots like the CC1 Pro for tight corridors and corners.',
  'The "Proof of Clean" Guarantee: Every deployment includes transparent, data-driven reporting that provides a digital paper trail of exactly where, when, and how your facility was maintained.',
  'Comprehensive Life-Cycle Support: From initial site mapping and elevator integration to long-term "All-in-One" service, we stay with the equipment from day one through its life.',
  'Regional Specialization: With deep roots in the Midwest and expanding operations in the Caribbean, we provide localized, high-frequency support that national retailers cannot match.',
];

const coreValues = [
  'Operational Transparency: We believe in data-backed results. If it is not measured, it is not clean.',
  'Relentless Solution-Orientation: Every team member is an end-user; we solve technical challenges with the urgency of someone who has a facility to run.',
  'Human-Centric Automation: We do not replace people; we empower them by automating the repetitive so they can focus on the exceptional.',
];

const journey = [
  'Year 1: The Foundation. The partners found common interest in advancing robotic technology and began using Generation 1 robots.',
  'Year 2: Field Testing & Lessons Learned. We spent this year in the trenches, running robots as operational leaders in healthcare, manufacturing, and retail environments.',
  'Year 3: Expansion & Refinement. We reviewed and tested multiple robotics brands for durability, effectiveness, and innovation.',
  'Year 4: The Strategic Horizon. We are currently expanding into Puerto Rico and the Caribbean, bringing mechanical floor restoration and autonomous fleet management to a global stage while continuing to serve the local hospitals and schools that started it all.',
];

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

  return (
    <div className="min-h-screen bg-gray-50" data-testid="about-us-page">
      <div className="bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white py-20 pt-36">
        <div className="max-w-6xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-slate-300 hover:text-white mb-6" data-testid="about-us-back-home-link">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>

          <h1 className="text-4xl lg:text-5xl font-bold mb-4" data-testid="about-us-hero-title">Our Story</h1>
          <p className="text-lg text-slate-200 max-w-4xl leading-relaxed" data-testid="about-us-hero-summary">
            At 123BoTs, we believe that the standard of cleanliness should not be a variable — it should be a guarantee.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-16 space-y-14">
        <section data-testid="about-us-story-section">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="space-y-4 text-gray-700 leading-relaxed">
            <p>
              At 123BoTs, we believe that the standard of cleanliness should not be a variable — it should be a guarantee. Our story began not in a boardroom, but on the front lines of facility management. After years of overseeing environmental services and operations for large-scale healthcare systems and industrial sites, we experienced the labor gap firsthand. We saw the burnout, the high turnover, and the inconsistency that comes with manual floor care.
            </p>
            <p>
              We realized that the future of facility maintenance was not just about better chemicals; it was about smarter systems. We founded 123BoTs to bridge the gap between cutting-edge autonomous technology and the practical realities of everyday operations.
            </p>
            <p>
              We are not just a robotics distributor; we are a team of former operators and end-users who have lived the challenges our clients face. We have spent years testing, breaking, and perfecting robotic workflows in hospitals, 3PL warehouses, and retail centers across 17 states.
            </p>
            <p>
              Today, we bring that expertise to your facility, offering a Proof of Clean that protects your budget, your staff, and your reputation. At 123BoTs, our success is measured by the miles of floor we autonomously maintain and the peace of mind we return to our partners.
            </p>
          </div>
        </section>

        <section className="bg-white border rounded-2xl p-8" data-testid="about-us-differentiators-section">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">What Sets Us Apart</h2>
          <ul className="space-y-4">
            {differentiators.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3" data-testid={`about-us-differentiator-${idx + 1}`}>
                <CheckCircle2 className="w-5 h-5 text-blue-600 mt-0.5" />
                <span className="text-gray-700 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section data-testid="about-us-core-values-section">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Core Values</h2>
          <ol className="space-y-4 list-decimal list-inside">
            {coreValues.map((item, idx) => (
              <li key={idx} className="text-gray-700 leading-relaxed" data-testid={`about-us-core-value-${idx + 1}`}>
                {item}
              </li>
            ))}
          </ol>
        </section>

        <section className="bg-white border rounded-2xl p-8" data-testid="about-us-journey-section">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Journey</h2>
          <ul className="space-y-4">
            {journey.map((item, idx) => (
              <li key={idx} className="text-gray-700 leading-relaxed" data-testid={`about-us-journey-item-${idx + 1}`}>
                • {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AboutUsPage;
