import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, HelpCircle, ChevronDown, ChevronUp, 
  ShoppingCart, Truck, Gift, CreditCard, Shield, Package,
  Clock, FileText, Palette, Mail
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
          a: 'No, you can checkout as a guest. However, creating an account allows you to track orders, view order history, save shipping addresses, and access exclusive member discounts.'
        },
        {
          q: 'What payment methods do you accept?',
          a: 'We accept major credit cards (Visa, MasterCard, American Express, Discover), as well as PayPal, CashApp, and Venmo for your convenience. All transactions are processed securely.'
        },
        {
          q: 'Can I modify or cancel my order after placing it?',
          a: 'Orders can be modified or cancelled within 2 hours of placement, provided production has not yet begun. Since our items are custom made, once production starts, orders cannot be changed. Please contact us immediately at support@gingerkare.com if you need to make changes.'
        },
        {
          q: 'Do you offer bulk or wholesale pricing?',
          a: 'Yes! We offer special pricing for bulk orders, events, and businesses. Contact us with your requirements for a custom quote.'
        },
        {
          q: 'Is there a minimum order amount?',
          a: 'No, there is no minimum order amount. However, orders over $75 qualify for free standard shipping within the United States.'
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
          q: 'How long does shipping take?',
          a: 'Production typically takes 2-5 business days as each item is custom made. After production, standard shipping takes 5-7 business days, expedited shipping takes 2-3 business days, and overnight shipping delivers within 1 business day.'
        },
        {
          q: 'Do you ship internationally?',
          a: 'We primarily ship within the United States. For international shipping inquiries, please contact us for availability and shipping quotes.'
        },
        {
          q: 'How are products packaged for shipping?',
          a: 'All items are carefully packaged to prevent damage during transit. Fragile items like tumblers and mugs include extra padding. Apparel is folded neatly in protective packaging.'
        },
        {
          q: 'Can I ship to a P.O. Box?',
          a: 'Standard shipping can be delivered to P.O. Boxes. However, expedited and overnight shipping methods require a physical street address.'
        },
        {
          q: 'How can I track my order?',
          a: 'Once your order ships, you will receive an email with tracking information. You can also log into your account to view tracking details for all your orders.'
        }
      ]
    },
    {
      id: 'products',
      title: 'Products & Customization',
      icon: Gift,
      color: 'purple',
      questions: [
        {
          q: 'What products do you offer?',
          a: 'We offer a wide range of custom printed products including t-shirts, tumblers, mugs, hoodies, hats, mousepads, and more. Check out our collections for holiday themes, cruise merchandise, Hawaiian designs, and custom options!'
        },
        {
          q: 'Can I request a custom design?',
          a: 'Absolutely! We love creating custom designs. Use our "Request Custom Design" feature or contact us with your ideas. We\'ll work with you to bring your vision to life.'
        },
        {
          q: 'What file formats do you accept for custom designs?',
          a: 'We accept PNG, JPG, PDF, and vector files (AI, EPS, SVG). For best results, we recommend high-resolution images (300 DPI or higher) with transparent backgrounds when applicable.'
        },
        {
          q: 'How do I know what size to order for apparel?',
          a: 'Each product page includes a size guide with detailed measurements. If you\'re between sizes, we generally recommend sizing up for a more comfortable fit.'
        },
        {
          q: 'Are your tumblers dishwasher safe?',
          a: 'We recommend hand washing our printed tumblers to preserve the design quality and longevity. Hot water and mild soap work best. Avoid abrasive scrubbers.'
        }
      ]
    },
    {
      id: 'customization',
      title: 'Design & Printing',
      icon: Palette,
      color: 'pink',
      questions: [
        {
          q: 'What printing methods do you use?',
          a: 'We use high-quality direct-to-garment (DTG) printing for apparel and sublimation printing for drinkware and other items. Both methods produce vibrant, long-lasting prints.'
        },
        {
          q: 'Will the colors match exactly what I see on screen?',
          a: 'We strive for accurate color reproduction, but slight variations may occur due to differences in monitor settings and printing materials. If exact color matching is critical, please contact us to discuss.'
        },
        {
          q: 'How long will the print last?',
          a: 'Our prints are designed to last! With proper care (following wash/care instructions), apparel prints typically last the life of the garment. Tumbler and mug prints are scratch-resistant and durable.'
        },
        {
          q: 'Can I see a proof before my order is produced?',
          a: 'For custom designs, we provide a digital proof for your approval before production begins. Standard catalog items ship as shown on the website.'
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
          q: 'What is your return policy?',
          a: 'Due to the custom nature of our products, we cannot accept returns on personalized items unless they are defective or damaged. Non-personalized items may be returned within 14 days if unused and in original condition.'
        },
        {
          q: 'What if I receive a damaged or defective item?',
          a: 'We stand behind our quality! If you receive a damaged or defective item, contact us within 48 hours with photos of the issue. We\'ll send a replacement at no charge or provide a full refund.'
        },
        {
          q: 'How do I request a refund?',
          a: 'Contact us at support@gingerkare.com with your order number and reason for the refund request. Refunds are processed within 5-7 business days after approval.'
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
          a: 'You can reach us at support@gingerkare.com or through our Contact page. We typically respond within 24-48 hours during business days.'
        },
        {
          q: 'What are your business hours?',
          a: 'Our customer support team is available Monday through Friday, 9 AM to 5 PM EST. Orders placed outside business hours will be processed the next business day.'
        },
        {
          q: 'Do you have a physical store?',
          a: 'We are primarily an online store. This allows us to offer competitive prices and serve customers nationwide. Check our website for any upcoming pop-up events or local markets!'
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
      description: 'Find answers to common questions about GingerKare products, ordering, shipping, custom designs, and returns.',
      keywords: 'FAQ, custom printing questions, ordering help, shipping info, GingerKare help',
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
