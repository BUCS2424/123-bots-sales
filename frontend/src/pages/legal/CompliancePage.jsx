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
                <h3 className="font-bold text-[#2c1810] text-lg">Built for Reliable Performance</h3>
                <p className="text-gray-700 mt-2">
                  At 123Bots, every robot and part we sell is selected and supported with attention to quality.
                  We take pride in helping businesses automate with equipment they can depend on.
                </p>
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment to Quality</h2>
            <p className="text-gray-600 leading-relaxed">
              123Bots is committed to selling and supporting high-quality commercial cleaning and delivery robots that meet the highest standards. We maintain rigorous vendor selection and support processes to ensure every piece of equipment we sell meets our customers' expectations.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-8 h-8 text-[#ff8c42]" />
              <h2 className="text-2xl font-bold text-gray-900">Quality Assurance</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              Every robot and part we sell is backed by:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Manufacturer Standards:</strong> We sell equipment from established robotics manufacturers, including Pudu, Gausium, and Avidbots</li>
              <li><strong>Parts Compatibility:</strong> Replacement parts are matched to your specific robot model</li>
              <li><strong>Durability:</strong> Commercial-grade equipment built for daily operational use</li>
              <li><strong>Secure Packaging & Freight:</strong> Careful packaging and freight handling to protect equipment during shipping</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <FileCheck className="w-8 h-8 text-[#ff8c42]" />
              <h2 className="text-2xl font-bold text-gray-900">Business Compliance</h2>
            </div>
            <p className="text-gray-600 leading-relaxed mb-4">
              123Bots operates in compliance with all applicable regulations:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-6">Consumer Protection</h3>
            <p className="text-gray-600 leading-relaxed">
              We comply with all federal and state consumer protection laws, including clear pricing, honest advertising, and fair business practices.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-6">Product Safety</h3>
            <p className="text-gray-600 leading-relaxed">
              Robots and equipment we sell are manufactured to meet applicable safety standards for commercial and industrial use.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Responsibilities</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              By ordering from 123Bots, customers agree to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Provide accurate information for orders and shipping</li>
              <li>Operate equipment in accordance with manufacturer guidelines</li>
              <li>Review and approve order details and lease terms before purchase</li>
              <li>Follow maintenance instructions to keep equipment in good working order</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Questions or Concerns</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have questions about our quality standards or compliance practices, please contact us:
            </p>
            <div className="mt-4 p-4 bg-[#fff8f3] rounded-lg border border-[#ffe4d4]">
              <p className="font-semibold text-[#2c1810]">123Bots</p>
              <p className="text-[#ff8c42]">Email: support@123bots.com</p>
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
