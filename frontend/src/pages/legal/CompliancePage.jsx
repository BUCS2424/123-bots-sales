import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Heart, FileCheck, Sparkles } from 'lucide-react';

const CompliancePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2c1810] to-[#3a1f12] text-white py-16 pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-[#ffd4b8] hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-[#ff8c42]" />
            <h1 className="text-4xl font-bold">Quality & Compliance</h1>
          </div>
          <p className="text-[#ffd4b8] mt-2">Our Commitment to Quality & Business Standards</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          
          {/* Welcome Notice */}
          <div className="bg-[#fff8f3] border-l-4 border-[#ff8c42] p-6 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Heart className="w-6 h-6 text-[#ff8c42] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-[#2c1810] text-lg">Made With Care, Just For You</h3>
                <p className="text-gray-700 mt-2">
                  At GingerKare Custom Emporium, every product is crafted with attention to detail and quality. 
                  We take pride in delivering unique, personalized items that exceed your expectations.
                </p>
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment to Quality</h2>
            <p className="text-gray-600 leading-relaxed">
              GingerKare Custom Emporium is committed to delivering high-quality custom printed products that meet the highest standards. We maintain rigorous quality control processes and ethical business practices to ensure every item we create meets our customers' expectations.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-[#ff8c42]" />
              <h2 className="text-2xl font-bold text-gray-900">Quality Assurance</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Every product created by GingerKare undergoes quality inspection to ensure:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Print Quality:</strong> Vibrant colors, accurate designs, and crisp details on every item</li>
              <li><strong>Material Standards:</strong> Premium quality apparel, drinkware, and gift items</li>
              <li><strong>Design Accuracy:</strong> Your custom designs are reproduced exactly as approved</li>
              <li><strong>Durability:</strong> Products built to last with proper care instructions provided</li>
              <li><strong>Secure Packaging:</strong> Careful packaging to protect items during shipping</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileCheck className="w-8 h-8 text-[#ff8c42]" />
              <h2 className="text-2xl font-bold text-gray-900">Business Compliance</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              GingerKare operates in compliance with all applicable regulations:
            </p>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-6">Consumer Protection</h3>
            <p className="text-gray-600 leading-relaxed">
              We comply with all federal and state consumer protection laws, including clear pricing, honest advertising, and fair business practices.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-6">Product Safety</h3>
            <p className="text-gray-600 leading-relaxed">
              All products meet applicable safety standards. Our drinkware is food-safe and our apparel is manufactured following industry safety guidelines.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-6">Intellectual Property</h3>
            <p className="text-gray-600 leading-relaxed">
              We respect intellectual property rights and do not reproduce copyrighted or trademarked material without proper authorization. Customers must ensure they have the right to use any images or designs submitted for custom orders.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Responsibilities</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              By ordering from GingerKare, customers agree to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Provide accurate information for orders and shipping</li>
              <li>Submit only designs and images they have the right to use</li>
              <li>Not submit offensive, illegal, or harmful content for printing</li>
              <li>Review and approve custom designs before production</li>
              <li>Follow care instructions to maintain product quality</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Content Guidelines</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We reserve the right to refuse orders containing:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Copyrighted or trademarked material without authorization</li>
              <li>Hate speech or discriminatory content</li>
              <li>Obscene or explicit material</li>
              <li>Content promoting illegal activities</li>
              <li>Content that violates others' privacy rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Environmental Responsibility</h2>
            <p className="text-gray-600 leading-relaxed">
              GingerKare is committed to reducing our environmental impact. We use eco-friendly packaging materials where possible and work with suppliers who share our commitment to sustainability.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions or Concerns</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about our quality standards or compliance practices, please contact us:
            </p>
            <div className="mt-4 p-4 bg-[#fff8f3] rounded-lg border border-[#ffe4d4]">
              <p className="font-semibold text-[#2c1810]">GingerKare Custom Emporium</p>
              <p className="text-[#ff8c42]">Email: support@gingerkare.com</p>
            </div>
            <p className="text-gray-600 leading-relaxed mt-4">
              We value your feedback and are committed to continuous improvement in everything we do.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default CompliancePage;
