import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Twitter, Linkedin, Instagram, ArrowUp } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const Footer = () => {
  const { siteName, logoUrl, supportEmail } = useSiteSettings();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    products: [
      { label: 'PUDU CC1 PRO', href: '/products/pudu-cc1-pro' },
      { label: 'AVIDBOT KAS', href: '/products/ab-kas' },
      { label: 'PUDU MT1 MAX', href: '/products/pudu-mt1' },
      { label: 'PUDU SH1', href: '/products/pudu-sh1' },
      { label: 'Shop All', href: '/shop' },
    ],
    industries: [
      { label: 'Retail', href: '/industries/retail-uses' },
      { label: 'Warehouses', href: '/industries/warehouses' },
      { label: 'Hospitality', href: '/industries/hospitality' },
      { label: 'Education', href: '/industries/education' },
      { label: 'Healthcare', href: '/industries/healthcare' },
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Resources', href: '/123-bots-resources' },
      { label: 'Contact', href: '/contact' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Careers', href: '/careers' },
    ],
    support: [
      { label: 'Schedule a Demo', href: '/schedule-a-demo' },
      { label: 'Buy or Lease', href: '/rent-or-buy-a-cleaning-bot' },
      { label: 'Parts & Accessories', href: '/shop?category=parts' },
      { label: 'Technical Support', href: '/contact' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms & Conditions', href: '/terms-conditions' },
      { label: 'Accessibility', href: '/accessibility' },
      { label: 'Shipping & Returns', href: '/shipping-returns' },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com/123bots', label: 'Facebook' },
    { icon: Twitter, href: 'https://twitter.com/123bots', label: 'Twitter' },
    { icon: Linkedin, href: 'https://linkedin.com/company/123bots', label: 'LinkedIn' },
    { icon: Instagram, href: 'https://instagram.com/123bots', label: 'Instagram' },
  ];

  return (
    <footer className="bg-bots-darker border-t border-gray-800" data-testid="main-footer">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link to="/" className="inline-block mb-4">
              {logoUrl ? (
                <img src={logoUrl} alt={siteName || '123 Bots'} className="h-10" />
              ) : (
                <span className="text-2xl font-bold text-white">{siteName || '123 Bots'}</span>
              )}
            </Link>
            <p className="text-gray-400 text-sm mb-4">
              Transform your commercial cleaning with AI-powered robotic solutions.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2">
              <a 
                href="tel:8777022687" 
                className="flex items-center text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Phone className="w-4 h-4 mr-2" />
                (877) 702-2687
              </a>
              <a 
                href={`mailto:${supportEmail || 'info@123bots.com'}`}
                className="flex items-center text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Mail className="w-4 h-4 mr-2" />
                {supportEmail || 'info@123bots.com'}
              </a>
            </div>

            {/* Social Links */}
            <div className="flex space-x-3 mt-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-bots-surface rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-blue-500/20 transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h4 className="text-white font-semibold mb-4">Products</h4>
            <ul className="space-y-2">
              {footerLinks.products.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Industries */}
          <div>
            <h4 className="text-white font-semibold mb-4">Industries</h4>
            <ul className="space-y-2">
              {footerLinks.industries.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 text-sm">
              © {currentYear} {siteName || '123 Bots'}. All rights reserved.
            </p>
            
            {/* Back to Top Button */}
            <button
              onClick={scrollToTop}
              className="mt-4 md:mt-0 flex items-center text-gray-400 hover:text-white transition-colors text-sm"
              data-testid="back-to-top"
            >
              Back to top
              <ArrowUp className="w-4 h-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
