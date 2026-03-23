import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Gift, Shield, Award, Target, Users, Heart,
  CheckCircle, Palette, Sparkles, Globe, Zap, Star
} from 'lucide-react';
import { setSeoMetadata, generateOrganizationSchema } from '../lib/seo';

const AboutUsPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'About Us',
      description: 'Learn about GingerKare Custom Emporium - your trusted source for custom printables and personalized gifts. Made with love in Alabama since 2020!',
      keywords: 'about GingerKare, custom printing company, Alabama business, personalized gifts, sublimation printing',
      canonicalPath: '/about',
      ogType: 'website',
      jsonLd: generateOrganizationSchema(),
    });
  }, []);

  const values = [
    {
      icon: Heart,
      title: 'Made With Care',
      description: 'Every product is crafted with attention to detail and love. We take pride in creating items that bring joy.'
    },
    {
      icon: Palette,
      title: 'Creative Excellence',
      description: 'Our design team brings your visions to life with vibrant colors and stunning prints that last.'
    },
    {
      icon: Users,
      title: 'Customer Focus',
      description: 'You\'re not just a customer, you\'re part of the GingerKare family. We\'re here to help every step of the way.'
    },
    {
      icon: Zap,
      title: 'Fast & Reliable',
      description: 'Quick turnaround on custom orders and reliable shipping means your treasures arrive when you need them.'
    }
  ];

  const milestones = [
    { year: '2020', event: 'GingerKare Custom Emporium founded with a passion for creating unique personalized gifts' },
    { year: '2021', event: 'Expanded product line to include tumblers, mugs, and home goods' },
    { year: '2022', event: 'Launched Hawaiian and Cruise collections, served 1,000+ happy customers' },
    { year: '2023', event: 'Introduced same-day production on select items, expanded shipping nationwide' },
    { year: '2024', event: 'Partnered with Baltimore Cancer Support Group for awareness merchandise' },
    { year: '2025', event: 'Continuing to grow and spread joy through personalized creations' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[#2c1810] via-[#3a1f12] to-[#2c1810] text-white py-20 pt-36">
        <div className="max-w-6xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-[#ffd4b8] hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6">
                Whatever Your Pleasure,<br />
                <span className="text-[#ff8c42]">Find Your Treasure!</span>
              </h1>
              <p className="text-xl text-[#ffd4b8] leading-relaxed">
                GingerKare Custom Emporium is dedicated to creating unique, personalized products 
                that celebrate life's special moments. From custom apparel to one-of-a-kind gifts, 
                we make treasures just for you.
              </p>
            </div>
            <div className="hidden lg:flex justify-center">
              <div className="relative">
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-[#ff8c42]/30 to-[#9370db]/20 flex items-center justify-center">
                  <Gift className="w-32 h-32 text-[#ff8c42]" />
                </div>
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-[#ff8c42]/20 flex items-center justify-center">
                  <Star className="w-10 h-10 text-[#ff8c42]" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-[#9370db]/30 flex items-center justify-center">
                  <Heart className="w-8 h-8 text-[#9370db]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Story */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
            <div className="space-y-4 text-gray-600 leading-relaxed">
              <p>
                GingerKare Custom Emporium started with a simple idea: everyone deserves something 
                special that's uniquely theirs. What began as a passion project creating custom 
                gifts for friends and family has grown into something we're truly proud of.
              </p>
              <p>
                We believe that the best gifts come from the heart. That's why every item we create 
                is made with care and attention to detail. Whether it's a custom t-shirt for a family 
                reunion, a personalized tumbler for a cruise vacation, or a heartfelt gift for someone 
                going through a tough time, we pour our hearts into every creation.
              </p>
              <p>
                Today, GingerKare serves customers across the United States, helping them celebrate 
                life's moments with unique, personalized products. From our Hawaiian collection to our 
                Cancer Support merchandise, every design tells a story and spreads a little joy.
              </p>
            </div>
          </div>
          <div className="bg-[#fff8f3] rounded-2xl p-8 border border-[#ffe4d4]">
            <h3 className="text-xl font-bold text-[#2c1810] mb-4">What Sets Us Apart</h3>
            <ul className="space-y-3">
              {['Custom designs tailored to your vision', 'High-quality materials that last', 'Fast production and shipping', 'Responsive customer support', 'Satisfaction guaranteed'].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#ff8c42]" />
                  <span className="text-gray-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Our Values */}
      <div className="bg-gradient-to-br from-[#2c1810] to-[#3a1f12] py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, idx) => {
              const Icon = value.icon;
              return (
                <div key={idx} className="bg-white/10 backdrop-blur rounded-xl p-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-[#ff8c42]/20 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-[#ff8c42]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-[#ffd4b8] text-sm">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Our Journey */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Journey</h2>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-[#ff8c42] to-[#9370db]" />
          
          {/* Milestones */}
          <div className="space-y-8">
            {milestones.map((milestone, idx) => (
              <div key={idx} className={`flex items-center gap-8 ${idx % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`flex-1 ${idx % 2 === 0 ? 'text-right' : 'text-left'}`}>
                  <div className="bg-white rounded-xl p-6 shadow-lg inline-block max-w-md border border-gray-100">
                    <span className="text-[#ff8c42] font-bold text-lg">{milestone.year}</span>
                    <p className="text-gray-600 mt-2">{milestone.event}</p>
                  </div>
                </div>
                <div className="w-4 h-4 rounded-full bg-[#ff8c42] ring-4 ring-white shadow-lg z-10" />
                <div className="flex-1" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Collections */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Our Collections</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Explore our themed collections, each designed to bring joy and celebrate life's special moments.
          </p>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Hawaiian Collection', desc: 'Tropical vibes for beach lovers and island dreamers', icon: '🌺' },
              { name: 'Cruise Collection', desc: 'Set sail with custom cruise merchandise and memories', icon: '🚢' },
              { name: 'Cancer Support', desc: 'Products that spread hope and support fighters', icon: '💜' }
            ].map((collection, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow text-center">
                <span className="text-4xl mb-4 block">{collection.icon}</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{collection.name}</h3>
                <p className="text-gray-600 text-sm">{collection.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Create Something Special?</h2>
          <p className="text-white/90 mb-8 text-lg">
            Let us help you bring your ideas to life. Whether it's a gift for someone special or 
            merchandise for your group, we're here to make it happen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/shop"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-[#ff8c42] font-semibold rounded-full hover:bg-gray-100 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Browse Products
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-full hover:bg-white/10 transition-colors"
            >
              Request Custom Design
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUsPage;
