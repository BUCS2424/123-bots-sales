import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { setSeoMetadata } from '../../lib/seo';

const PrivacyPolicyPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'Privacy Policy',
      description: 'GingerKare Custom Emporium Privacy Policy. Learn how we collect, use, and protect your personal information.',
      keywords: 'privacy policy, data protection, GingerKare privacy',
      canonicalPath: '/privacy-policy',
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
            <Shield className="w-10 h-10 text-[#ff8c42]" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-[#ffd4b8] mt-2">Last updated: March 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-600 leading-relaxed">
              GingerKare Custom Emporium ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and purchase our custom printed products. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Personal Data</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              We may collect personally identifiable information that you voluntarily provide when making a purchase or registering on our site, including:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Name and contact information (email address, phone number)</li>
              <li>Billing and shipping addresses</li>
              <li>Payment information (processed securely through our payment processors)</li>
              <li>Custom design preferences and order specifications</li>
              <li>Order history and preferences</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-6">Automatically Collected Data</h3>
            <p className="text-gray-600 leading-relaxed">
              When you access our website, we may automatically collect certain information about your device, including your IP address, browser type, operating system, access times, and the pages you have viewed directly before and after accessing the site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 leading-relaxed mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Process and fulfill your orders for custom printed products</li>
              <li>Send you order confirmations and shipping updates</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Improve our website and product offerings</li>
              <li>Comply with legal obligations and prevent fraudulent activity</li>
              <li>Send promotional communications (with your consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties except in the following circumstances:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Service Providers:</strong> We share information with third-party service providers who assist us in operating our website, processing payments, and delivering orders.</li>
              <li><strong>Legal Requirements:</strong> We may disclose information when required by law or to protect our rights, safety, or property.</li>
              <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
            <p className="text-gray-600 leading-relaxed">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 leading-relaxed mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Access and receive a copy of your personal data</li>
              <li>Request correction of inaccurate personal data</li>
              <li>Request deletion of your personal data</li>
              <li>Opt-out of marketing communications</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies</h2>
            <p className="text-gray-600 leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our website and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
            <p className="text-gray-600 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at:
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

export default PrivacyPolicyPage;
