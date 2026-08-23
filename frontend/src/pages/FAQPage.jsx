import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, HelpCircle, ChevronDown, ChevronUp, 
  ShoppingCart, Truck, Gift, CreditCard, Shield, Package,
  Clock, FileText, Mail
} from 'lucide-react';
import { setSeoMetadata, generateFAQSchema } from '../lib/seo';

const FAQPage = () => {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (id) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const faqCategories = [
    {
      id: 'ordering',
      title: 'Ordering & Account',
      icon: ShoppingCart,
      color: 'orange',
      questions: [
        {
          q: 'Do I need an account to place an order?',
          a: 'No, you can check out as a guest for parts and accessories. Creating an account lets you track orders, view order history, and save shipping addresses.'
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept major credit cards and other secure online payment options at checkout. For robot purchases and fleet orders, we also offer buy or lease financing - see our Buy or Lease page for details.'
        },
        {
          q: 'Do you offer fleet or bulk pricing for multiple robots?',
          a: 'Yes. If you\'re outfitting multiple locations or need several units, contact us and our team will put together a custom quote.'
        },
        {
          q: 'Can I modify or cancel my order after placing it?',
          a: 'Contact us as soon as possible at support@123bots.com or (877) 702-2687 if you need to change or cancel an order - we\'ll do everything we can before it ships.'
        }
      ]
    },
    {
      id: 'shipping',
      title: 'Shipping & Delivery',
      icon: Truck,
      color: 'blue',
      questions: [
        {
          q: 'Do you ship robots and equipment nationwide?',
          a: 'Yes, we currently serve customers across our listed states. Robots typically ship via freight carrier; parts and accessories ship via standard parcel carriers. Contact us for a shipping estimate to your location.'
        },
        {
          q: 'Is setup or installation included?',
          a: 'Our team can walk you through setup, mapping, and onboarding for your robot after delivery. Reach out to schedule a demo or support session.'
        },
        {
          q: 'How can I track my order?',
          a: 'Once your order ships, you will receive tracking information by email. You can also log into your account to view tracking details for all your orders.'
        }
      ]
    },
    {
      id: 'products',
      title: 'Products & Services',
      icon: Gift,
      color: 'purple',
      questions: [
        {
          q: 'What products do you offer?',
          a: 'We offer commercial cleaning robots (Pudu, Gausium, Avidbots) and industrial delivery robots, along with replacement parts and accessories like brushes, squeegees, and floor care chemicals.'
        },
        {
          q: 'Can I try a robot before buying?',
          a: 'Yes! Use our "Schedule a Demo" page to request a no-obligation demo at your facility.'
        },
        {
          q: 'Should I buy or lease a robot?',
          a: 'Both options are available - visit our Buy or Lease page to compare and find what fits your business best.'
        },
        {
          q: 'Do you carry parts for my specific robot model?',
          a: 'We stock parts for the models we sell (Pudu CC1/CC1 Pro, MT1, SH1, BG1, and more). Check our Parts section, or contact support with your model to confirm availability.'
        }
      ]
    },
    {
      id: 'returns',
      title: 'Returns & Refunds',
      icon: Package,
      color: 'green',
      questions: [
        {
          q: 'What if I receive a damaged or defective item?',
          a: 'Contact us within 48 hours with photos of the issue and your order number, and we\'ll work with you on a replacement or repair.'
        },
        {
          q: 'How do I request a return or refund?',
          a: 'Contact us at support@123bots.com with your order number and reason for the request. Return eligibility can vary by item, especially for robots and installed equipment, so our team will confirm the options for your specific order.'
        }
      ]
    },
    {
      id: 'support',
      title: 'Support & Contact',
      icon: Mail,
      color: 'teal',
      questions: [
        {
          q: 'How can I contact customer support?',
          a: 'You can reach us at (877) 702-2687, support@123bots.com, or through our Contact page.'
        },
        {
          q: 'What are your business hours?',
          a: 'Monday-Friday 9 AM-6 PM, Saturday 10 AM-4 PM, closed Sundays.'
        },
        {
          q: 'What areas do you serve?',
          a: 'We currently serve businesses across our listed states - check our homepage for the full coverage list, or contact us to confirm availability in your area.'
        }
      ]
    }
  ];

  // Generate FAQ schema from all questions
  useEffect(() => {
    const allFaqs = faqCategories.flatMap(category => 
      category.questions.map(q => ({ question: q.q, answer: q.a }))
    );
    
    setSeoMetadata({
      title: 'Frequently Asked Questions',
      description: 'Find answers to common questions about 123Bots commercial cleaning and delivery robots, ordering, shipping, and support.',
      keywords: 'FAQ, commercial cleaning robots, delivery robots, ordering help, shipping info, 123Bots help',
      canonicalPath: '/faq',
      ogType: 'website',
      jsonLd: generateFAQSchema(allFaqs),
    });
  }, []);

  const getColorClasses = (color) => {
    const colors = {
      orange: { bg: 'bg-[#fff8f3]', border: 'border-[#ff8c42]', text: 'text-[#ff8c42]', icon: 'text-[#ff8c42]' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', icon: 'text-blue-600' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600', icon: 'text-purple-600' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-600', icon: 'text-pink-600' },
      green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600', icon: 'text-green-600' },
      teal: { bg: 'bg-teal-50', border: 'border-teal-500', text: 'text-teal-600', icon: 'text-teal-600' }
    };
    return colors[color] || colors.orange;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2c1810] to-[#3a1f12] text-white py-16 pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-[#ffd4b8] hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <HelpCircle className="w-10 h-10 text-[#ff8c42]" />
            <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-[#ffd4b8] mt-2">Find answers to common questions about our products and services</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="space-y-8">
          {faqCategories.map(category => {
            const colorClasses = getColorClasses(category.color);
            const Icon = category.icon;
            
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Category Header */}
                <div className={`${colorClasses.bg} border-l-4 ${colorClasses.border} p-6`}>
                  <div className="flex items-center gap-3">
                    <Icon className={`w-8 h-8 ${colorClasses.icon}`} />
                    <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                  </div>
                </div>
                
                {/* Questions */}
                <div className="divide-y divide-gray-100">
                  {category.questions.map((item, idx) => {
                    const itemId = `${category.id}-${idx}`;
                    const isOpen = openItems[itemId];
                    
                    return (
                      <div key={itemId} className="border-l-4 border-transparent hover:border-[#ff8c42] transition-colors">
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-900 pr-4">{item.q}</span>
                          {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-[#ff8c42] flex-shrink-0" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-6 pb-4">
                            <p className="text-gray-600 leading-relaxed">{item.a}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-gradient-to-r from-[#2c1810] to-[#3a1f12] rounded-xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-4">Still Have Questions?</h3>
          <p className="text-[#ffd4b8] mb-6">Our team is here to help! Reach out and we'll get back to you as soon as possible.</p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#ff8c42] text-white font-semibold rounded-full hover:bg-[#ff6b1a] transition-colors"
          >
            <Mail className="w-5 h-5" />
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
