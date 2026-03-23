import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Gift } from 'lucide-react';
import { setSeoMetadata } from '../../lib/seo';

const TermsConditionsPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'Terms & Conditions',
      description: 'GingerKare Custom Emporium Terms and Conditions. Read our policies on ordering, custom products, and more.',
      keywords: 'terms and conditions, policies, GingerKare terms',
      canonicalPath: '/terms-conditions',
      noIndex: false,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2c1810] to-[#3a1f12] text-white py-16 pt-32">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-[#ffd4b8] hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <FileText className="w-10 h-10 text-[#ff8c42]" />
            <h1 className="text-4xl font-bold">Terms & Conditions</h1>
          </div>
          <p className="text-[#ffd4b8] mt-2">Last updated: March 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          
          {/* Welcome Notice */}
          <div className="bg-[#fff8f3] border-l-4 border-[#ff8c42] p-6 rounded-r-lg">
            <div className="flex items-start gap-3">
              <Gift className="w-6 h-6 text-[#ff8c42] flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-[#2c1810] text-lg">Welcome to GingerKare Custom Emporium</h3>
                <p className="text-gray-700 mt-2">
                  Thank you for choosing GingerKare for your custom printed products. 
                  We take pride in creating unique, personalized items made with care, just for you. 
                  Please review our terms and conditions below.
                </p>
              </div>
            </div>
          </div>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              By accessing and using the GingerKare Custom Emporium website and purchasing our products, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must not use our website or purchase our products.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Products and Services</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              GingerKare Custom Emporium offers custom printed products including but not limited to:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Custom t-shirts and apparel</li>
              <li>Personalized tumblers and drinkware</li>
              <li>Custom mugs and home goods</li>
              <li>Printable designs and digital products</li>
              <li>Specialty holiday and themed collections</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Custom Orders</h2>
            <p className="text-gray-600 leading-relaxed mb-4">For custom designed products:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>All custom designs must be approved before production begins</li>
              <li>We reserve the right to refuse any design that contains offensive, copyrighted, or trademarked material without proper authorization</li>
              <li>Production time varies based on order complexity and will be communicated at checkout</li>
              <li>Custom orders cannot be canceled once production has begun</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Purchaser Requirements</h2>
            <p className="text-gray-600 leading-relaxed mb-4">By making a purchase, you represent and warrant that:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>You are at least 18 years of age or have parental consent</li>
              <li>You have the legal authority to enter into this agreement</li>
              <li>All information provided during checkout is accurate and complete</li>
              <li>You have the right to use any images or designs submitted for custom orders</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Product Information</h2>
            <p className="text-gray-600 leading-relaxed">
              GingerKare strives to provide accurate product descriptions, including colors, sizes, and specifications. Colors may vary slightly due to monitor settings and printing processes. While we make every effort to ensure accuracy, we do not warrant that product descriptions or other content on our website are error-free, complete, or current.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Pricing and Payment</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              All prices are listed in US dollars and are subject to change without notice. We reserve the right to correct any pricing errors. Payment must be received in full before orders are processed and shipped.
            </p>
            <p className="text-gray-600 leading-relaxed">
              We accept various payment methods as displayed during checkout. All transactions are processed securely through our authorized payment processors.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Order Acceptance</h2>
            <p className="text-gray-600 leading-relaxed">
              We reserve the right to refuse or cancel any order for any reason, including but not limited to product availability, errors in product or pricing information, or suspected fraudulent activity. If we cancel an order after payment has been processed, we will issue a full refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-600 leading-relaxed">
              All content on the GingerKare Custom Emporium website, including text, graphics, logos, images, and software, is the property of GingerKare or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-600 leading-relaxed">
              To the maximum extent permitted by law, GingerKare Custom Emporium shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our products or website. Our total liability shall not exceed the amount paid for the specific product giving rise to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-600 leading-relaxed">
              You agree to indemnify, defend, and hold harmless GingerKare Custom Emporium and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including attorney's fees) arising from your use of our products, violation of these terms, or violation of any rights of a third party.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="text-gray-600 leading-relaxed">
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions. Any disputes arising under these terms shall be resolved in the appropriate courts.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-600 leading-relaxed">
              GingerKare Custom Emporium reserves the right to modify these Terms and Conditions at any time. Changes will be effective immediately upon posting to our website. Your continued use of the website following any changes constitutes acceptance of the revised terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
            <p className="text-gray-600 leading-relaxed">
              For questions regarding these Terms and Conditions, please contact us:
            </p>
            <div className="mt-4 p-4 bg-[#fff8f3] rounded-lg border border-[#ffe4d4]">
              <p className="font-semibold text-[#2c1810]">GingerKare Custom Emporium</p>
              <p className="text-[#ff8c42]">Email: support@gingerkare.com</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsConditionsPage;
