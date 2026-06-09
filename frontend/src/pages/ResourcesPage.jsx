import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Video, BookOpen, Download, ArrowRight } from 'lucide-react';
import { setSeoMetadata, SEO_PRESETS } from '../lib/seo';
import Header from '../components/Header';
import Footer from '../components/Footer';

const ResourcesPage = () => {
  useEffect(() => {
    setSeoMetadata({
      ...SEO_PRESETS.resources,
      title: 'Resources & Guides | 123 Bots',
    });
  }, []);

  const resources = [
    {
      category: 'Product Guides',
      icon: BookOpen,
      items: [
        { title: 'PUDU CC1 PRO User Manual', type: 'PDF', link: '#' },
        { title: 'AVIDBOT KAS Setup Guide', type: 'PDF', link: '#' },
        { title: 'PUDU SH1 Quick Start', type: 'PDF', link: '#' },
        { title: 'MT1 MAX Operations Manual', type: 'PDF', link: '#' },
      ],
    },
    {
      category: 'Training Videos',
      icon: Video,
      items: [
        { title: 'Robot Setup & First Run', type: 'Video', link: '#' },
        { title: 'Mapping Your Facility', type: 'Video', link: '#' },
        { title: 'Maintenance Best Practices', type: 'Video', link: '#' },
        { title: 'Troubleshooting Common Issues', type: 'Video', link: '#' },
      ],
    },
    {
      category: 'Case Studies',
      icon: FileText,
      items: [
        { title: 'Hospital Cleaning ROI Study', type: 'PDF', link: '/brochures/hospital-cleaning-roi-case-study-123bots.pdf' },
        { title: 'Warehouse Efficiency Report', type: 'PDF', link: '/brochures/warehouse-efficiency-report-123bots.pdf' },
        { title: 'Retail Store Success Story', type: 'PDF', link: '#' },
        { title: 'Hotel Chain Implementation', type: 'PDF', link: '#' },
      ],
    },
  ];

  const blogPosts = [
    {
      title: 'The Future of Commercial Cleaning: AI and Robotics',
      excerpt: 'Explore how artificial intelligence is transforming the commercial cleaning industry.',
      date: 'March 15, 2026',
      image: '/images/home/4-bots.jpg',
    },
    {
      title: '5 Ways Cleaning Robots Improve Employee Safety',
      excerpt: 'Discover how autonomous cleaning reduces workplace injuries and improves conditions.',
      date: 'March 10, 2026',
      image: '/images/bots/pringle-cc1-robot.png',
    },
    {
      title: 'Calculating ROI for Your Cleaning Robot Investment',
      excerpt: 'A comprehensive guide to measuring the return on your robot investment.',
      date: 'March 5, 2026',
      image: '/images/bots/avidbot-kas.png',
    },
  ];

  return (
    <div className="min-h-screen bg-bots-dark">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-bots-surface to-bots-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Resources & <span className="text-blue-400">Guides</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to get the most out of your cleaning robots.
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {resources.map((section, index) => (
              <div
                key={section.category}
                className="bg-bots-surface rounded-2xl border border-gray-800 p-6 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center mb-6">
                  <section.icon className="w-8 h-8 text-blue-400 mr-3" />
                  <h2 className="text-xl font-bold text-white">{section.category}</h2>
                </div>
                
                <ul className="space-y-4">
                  {section.items.map((item, idx) => (
                    <li key={idx}>
                      <a
                        href={item.link}
                        download={item.link !== '#' ? true : undefined}
                        className="flex items-center justify-between p-3 bg-bots-dark rounded-lg hover:bg-bots-accent transition-colors group"
                      >
                        <span className="text-gray-300 group-hover:text-white transition-colors">
                          {item.title}
                        </span>
                        <span className="flex items-center text-blue-400 text-sm">
                          {item.type}
                          <Download className="w-4 h-4 ml-2" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-20 bg-bots-surface">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Latest Articles</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <article
                key={index}
                className="bg-bots-dark rounded-2xl overflow-hidden border border-gray-800 hover:border-blue-500/50 transition-colors group"
              >
                <div className="h-48 bg-bots-accent overflow-hidden">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <p className="text-blue-400 text-sm mb-2">{post.date}</p>
                  <h3 className="text-lg font-bold text-white mb-2">{post.title}</h3>
                  <p className="text-gray-400 text-sm mb-4">{post.excerpt}</p>
                  <a
                    href="#"
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Read More <ArrowRight className="w-4 h-4 ml-2" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Stay Updated</h2>
          <p className="text-gray-300 mb-8">
            Subscribe to our newsletter for the latest product updates, tips, and industry news.
          </p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-6 py-4 bg-bots-surface border border-gray-700 rounded-full text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-500 transition-colors"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Need Help Getting Started?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Our team is here to answer your questions and help you succeed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/contact"
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full hover:bg-gray-100 transition-colors"
            >
              Contact Support
            </Link>
            <Link
              to="/schedule-a-demo"
              className="px-8 py-4 bg-green-500 text-black font-bold rounded-full hover:bg-green-400 transition-colors"
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

export default ResourcesPage;
