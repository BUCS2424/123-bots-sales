import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter, ArrowRight, Send, Shield, Award } from 'lucide-react';
import ButterflyIcon from './icons/ButterflyIcon';
import { Button } from './ui/button';
import { Input } from './ui/input';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const Footer = () => {
  const [businessInfo, setBusinessInfo] = useState(null);
  const [siteSettings, setSiteSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [businessRes, siteRes] = await Promise.all([
          axios.get(`${API_URL}/api/settings/business`),
          axios.get(`${API_URL}/api/settings/site`)
        ]);
        setBusinessInfo(businessRes.data);
        setSiteSettings(siteRes.data);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  // Default logo URL
  const logoUrl = siteSettings?.logo_url || "https://customer-assets.emergentagent.com/job_35efb418-d957-4303-979f-4e5863096b08/artifacts/hzi2b2xm_amino-chain-logo-final-1.png";
  const siteName = siteSettings?.site_name || "123Bots";

  // Format phone for tel: link
  const phoneLink = businessInfo?.phone?.replace(/\D/g, '') || '8445897377';
  const phoneDisplay = businessInfo?.phone || '(844) 589-PEPS (7377)';
  const emailDisplay = businessInfo?.email || 'support@123bots.com';
  
  // Format address
  const getFormattedAddress = () => {
    if (!businessInfo) return ['Research facilities in USA'];
    const parts = [];
    if (businessInfo.address) parts.push(businessInfo.address);
    if (businessInfo.city || businessInfo.state || businessInfo.zip_code) {
      let line2 = '';
      if (businessInfo.city) line2 += businessInfo.city;
      if (businessInfo.state) line2 += (line2 ? ', ' : '') + businessInfo.state;
      if (businessInfo.zip_code) line2 += ' ' + businessInfo.zip_code;
      if (line2) parts.push(line2);
    }
    return parts.length > 0 ? parts : ['Research facilities in USA'];
  };

  const addressLines = getFormattedAddress();

  return (
    <footer className="bg-void-base text-white" data-testid="footer">
      {/* Newsletter Section */}
      <div className="border-b border-purple-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="font-heading text-2xl font-bold text-white">Stay Updated</h3>
              <p className="text-slate-300 mt-1">Get research updates and special offers delivered to your inbox.</p>
            </div>
            <div className="flex w-full lg:w-auto gap-3">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-purple-900/30 border-purple-700/50 text-white placeholder:text-slate-400 rounded-xl px-5 h-12 w-full lg:w-72 focus:border-gold-500 focus:ring-gold-500/30"
              />
              <Button className="bg-gradient-to-r from-purple-600 to-gold-500 hover:from-purple-700 hover:to-gold-600 text-white h-12 px-6 rounded-xl font-semibold whitespace-nowrap">
                <Send className="w-4 h-4 mr-2" />
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <img
              src={logoUrl}
              alt={siteName}
              className="h-16 w-auto mb-6"
            />
            <p className="text-slate-300 mb-6 leading-relaxed">
              Premium custom products crafted with quality and care.
            </p>
            <div className="flex gap-3">
              <a 
                href="#" 
                className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-all hover:-translate-y-1"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5 text-white" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-all hover:-translate-y-1"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5 text-white" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 bg-purple-900/50 rounded-lg flex items-center justify-center hover:bg-purple-600 transition-all hover:-translate-y-1"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5 text-white" />
              </a>
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-6 text-gold-300">Products</h3>
            <ul className="space-y-4">
              {[
                { to: '/shop', label: 'All Products' },
                { to: '/shop?category=healing', label: 'Healing & Recovery' },
                { to: '/shop?category=cognitive', label: 'Cognitive & Neuro' },
                { to: '/shop?category=metabolic', label: 'Metabolic Research' },
                { to: '/research', label: 'Research Library' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-slate-300 hover:text-gold-300 transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all text-gold-400" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-6 text-gold-300">Support</h3>
            <ul className="space-y-4">
              {[
                { to: '/contact', label: 'Contact Us' },
                { to: '/faq', label: 'FAQ' },
                { to: '/shipping-returns', label: 'Shipping & Returns' },
                { to: '/compliance', label: 'Research Compliance' },
                { to: '/about', label: 'About Us' },
              ].map((link) => (
                <li key={link.to}>
                  <Link 
                    to={link.to} 
                    className="text-slate-300 hover:text-gold-300 transition-colors flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-4 h-4 opacity-0 -ml-6 group-hover:opacity-100 group-hover:ml-0 transition-all text-gold-400" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="font-heading text-lg font-bold mb-6 text-gold-300">Contact Us</h3>
            <ul className="space-y-5">
              <li>
                <a href={`tel:+1${phoneLink}`} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 transition-colors">
                    <Phone className="w-5 h-5 text-gold-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Phone</p>
                    <p className="text-slate-300 text-sm">{phoneDisplay}</p>
                  </div>
                </a>
              </li>
              <li>
                <a href={`mailto:${emailDisplay}`} className="flex items-start gap-4 group">
                  <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-600 transition-colors">
                    <Mail className="w-5 h-5 text-gold-400 group-hover:text-white transition-colors" />
                  </div>
                  <div>
                    <p className="text-white font-medium">Email</p>
                    <p className="text-slate-300 text-sm">{emailDisplay}</p>
                  </div>
                </a>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Location</p>
                  {addressLines.map((line, i) => (
                    <p key={i} className="text-slate-300 text-sm">{line}</p>
                  ))}
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-600/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-gold-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Hours</p>
                  <p className="text-slate-300 text-sm">Mon-Fri: 9AM-6PM EST</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 pt-8 border-t border-purple-800/30">
          <div className="flex flex-wrap justify-center gap-8">
            <div className="flex items-center gap-2 text-slate-300">
              <Shield className="w-5 h-5 text-[#ff8c42]" />
              <span className="text-sm">Quality Guaranteed</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <ButterflyIcon className="w-5 h-5 text-[#ff8c42]" />
              <span className="text-sm">Custom Made With Care</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Award className="w-5 h-5 text-[#ff8c42]" />
              <span className="text-sm">Satisfaction Guaranteed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-purple-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p className="text-slate-300">
              © {new Date().getFullYear()} 123Bots. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link to="/privacy-policy" className="text-slate-300 hover:text-gold-300 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-conditions" className="text-slate-300 hover:text-gold-300 transition-colors">
                Terms of Service
              </Link>
              <Link to="/accessibility" className="text-slate-300 hover:text-gold-300 transition-colors">
                Accessibility
              </Link>
              <Link to="/compliance" className="text-slate-300 hover:text-gold-300 transition-colors">
                Compliance
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
