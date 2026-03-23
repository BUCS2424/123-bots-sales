import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import { setSeoMetadata } from '../../lib/seo';

const AccessibilityPage = () => {
  useEffect(() => {
    setSeoMetadata({
      title: 'Accessibility Statement',
      description: 'GingerKare Custom Emporium accessibility commitment. Learn about our efforts to make shopping accessible for everyone.',
      keywords: 'accessibility, WCAG, accessible shopping',
      canonicalPath: '/accessibility',
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
            <Eye className="w-10 h-10 text-[#ff8c42]" />
            <h1 className="text-4xl font-bold">Accessibility Statement</h1>
          </div>
          <p className="text-[#ffd4b8] mt-2">Last updated: March 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-8">
          
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Commitment</h2>
            <p className="text-gray-600 leading-relaxed">
              GingerKare Custom Emporium is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards to ensure we provide equal access to all users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Standards</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              We aim to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards. These guidelines explain how to make web content more accessible for people with disabilities and more user-friendly for everyone.
            </p>
            <p className="text-gray-600 leading-relaxed">
              The guidelines have three levels of accessibility (A, AA, and AAA). We've chosen Level AA as our target for the GingerKare website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Measures We Take</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              GingerKare takes the following measures to ensure accessibility:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Include accessibility as part of our development process</li>
              <li>Provide text alternatives for non-text content</li>
              <li>Ensure sufficient color contrast throughout the website</li>
              <li>Make all functionality available from a keyboard</li>
              <li>Provide clear and consistent navigation</li>
              <li>Ensure forms are clearly labeled and error messages are descriptive</li>
              <li>Use proper heading structure for screen reader navigation</li>
              <li>Test with assistive technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Accessibility Features</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our website includes the following accessibility features:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>Keyboard Navigation:</strong> All interactive elements can be accessed using keyboard navigation</li>
              <li><strong>Screen Reader Compatibility:</strong> Our site is designed to work with popular screen readers</li>
              <li><strong>Text Resizing:</strong> Text can be resized up to 200% without loss of content or functionality</li>
              <li><strong>Alt Text:</strong> All images include descriptive alternative text</li>
              <li><strong>Color Contrast:</strong> We maintain sufficient color contrast ratios for text and interactive elements</li>
              <li><strong>Focus Indicators:</strong> Visible focus indicators help keyboard users navigate the site</li>
              <li><strong>Skip Links:</strong> Skip navigation links allow users to bypass repetitive content</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assistive Technologies</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Our website is designed to be compatible with the following assistive technologies:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>Screen readers (JAWS, NVDA, VoiceOver)</li>
              <li>Screen magnification software</li>
              <li>Speech recognition software</li>
              <li>Keyboard-only navigation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Known Limitations</h2>
            <p className="text-gray-600 leading-relaxed">
              While we strive to ensure accessibility of our website, there may be some limitations. We are actively working to identify and address any accessibility barriers. If you encounter any issues, please contact us so we can address them promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Feedback</h2>
            <p className="text-gray-600 leading-relaxed">
              We welcome your feedback on the accessibility of the GingerKare website. If you encounter any accessibility barriers or have suggestions for improvement, please contact us:
            </p>
            <div className="mt-4 p-4 bg-[#fff8f3] rounded-lg border border-[#ffe4d4]">
              <p className="font-semibold text-[#2c1810]">GingerKare Custom Emporium</p>
              <p className="text-[#ff8c42]">Email: support@gingerkare.com</p>
            </div>
            <p className="text-gray-600 leading-relaxed mt-4">
              We try to respond to accessibility feedback within 2 business days and will work to resolve any issues as quickly as possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Continuous Improvement</h2>
            <p className="text-gray-600 leading-relaxed">
              We are committed to continuously improving the accessibility of our website. We regularly review our site and content, and we update this statement as we make improvements or changes to our accessibility practices.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default AccessibilityPage;
