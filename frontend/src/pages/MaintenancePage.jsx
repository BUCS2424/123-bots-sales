import React, { useState, useEffect } from 'react';
import { Wrench, Mail, Phone, Clock } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const MaintenancePage = () => {
  const [businessInfo, setBusinessInfo] = useState(null);

  useEffect(() => {
    const fetchBusinessInfo = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/settings/business`);
        setBusinessInfo(response.data);
      } catch (error) {
        console.error('Error fetching business info:', error);
      }
    };
    fetchBusinessInfo();
  }, []);

  const phoneDisplay = businessInfo?.phone || '(844) 589-PEPS (7377)';
  const emailDisplay = businessInfo?.email || 'support@gingerkare.com';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0a1e] via-[#1a1030] to-[#0f0a1e] flex items-center justify-center p-6" data-testid="maintenance-page">
      <div className="max-w-lg w-full text-center">
        {/* Animated Icon */}
        <div className="relative mx-auto w-24 h-24 mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-gold-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
          <div className="relative bg-void-surface border border-gold-500/30 rounded-full w-24 h-24 flex items-center justify-center">
            <Wrench className="w-12 h-12 text-gold-400 animate-bounce" />
          </div>
        </div>

        {/* Main Content */}
        <h1 className="text-4xl font-bold text-white mb-4">
          We'll Be Back Soon
        </h1>
        <p className="text-xl text-slate-300 mb-8">
          We're currently performing scheduled maintenance to improve your experience.
        </p>

        {/* Status Card */}
        <div className="bg-void-surface/50 backdrop-blur-sm border border-purple-800/50 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-center gap-2 text-gold-300 mb-4">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium uppercase tracking-wider">Estimated Duration</span>
          </div>
          <p className="text-slate-300">
            Our team is working hard to get things back up and running. 
            Please check back shortly.
          </p>
        </div>

        {/* Contact Info */}
        <div className="space-y-3">
          <p className="text-sm text-slate-400 uppercase tracking-wider mb-4">Need urgent assistance?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href={`tel:+1${phoneDisplay.replace(/\D/g, '')}`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <Phone className="w-4 h-4" />
              {phoneDisplay}
            </a>
            <a 
              href={`mailto:${emailDisplay}`}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <Mail className="w-4 h-4" />
              {emailDisplay}
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-12 text-xs text-slate-600">
          © {new Date().getFullYear()} Gingerkare Custom Emporium. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default MaintenancePage;
