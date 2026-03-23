import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, Zap, X, Lock, Eye, EyeOff } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { useSiteFeatureFlags } from '../hooks/useSiteFeatureFlags';

const AgeVerificationModal = () => {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const siteSettings = useSiteSettings();
  const featureFlags = useSiteFeatureFlags();
  
  // Get password from feature flags
  const SITE_PASSWORD = featureFlags.coming_soon_password || '8487';
  const COMING_SOON_ENABLED = featureFlags.coming_soon_enabled;

  useEffect(() => {
    // Skip modals for admin and dev routes
    const isAdminRoute = location.pathname.startsWith('/admin') || 
                         location.pathname.startsWith('/dev');
    
    if (isAdminRoute) {
      setShowWelcomeModal(false);
      setShowComingSoon(false);
      document.body.style.overflow = 'auto';
      return;
    }

    // If coming soon is disabled, don't show any modals
    if (!COMING_SOON_ENABLED) {
      setShowWelcomeModal(false);
      setShowComingSoon(false);
      document.body.style.overflow = 'auto';
      return;
    }
    
    // Check if user has already unlocked the site
    const siteUnlocked = localStorage.getItem('123Bots_unlocked');
    if (siteUnlocked) {
      setShowWelcomeModal(false);
      setShowComingSoon(false);
      document.body.style.overflow = 'auto';
      return;
    }
    
    // Check if user has already seen welcome
    const welcomed = localStorage.getItem('123Bots_welcomed');
    if (!welcomed) {
      setShowWelcomeModal(true);
      document.body.style.overflow = 'hidden';
    } else {
      // Show coming soon if welcomed but not unlocked
      setShowComingSoon(true);
      document.body.style.overflow = 'hidden';
    }
  }, [location.pathname, COMING_SOON_ENABLED]);

  const handleEnterWelcome = () => {
    localStorage.setItem('123Bots_welcomed', 'true');
    localStorage.setItem('123Bots_welcomed_date', new Date().toISOString());
    setIsExiting(true);
    setTimeout(() => {
      setShowWelcomeModal(false);
      setIsExiting(false);
      setShowComingSoon(true);
    }, 300);
  };

  const handleCloseWelcome = () => {
    handleEnterWelcome();
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (password === SITE_PASSWORD) {
      localStorage.setItem('123Bots_unlocked', 'true');
      setIsExiting(true);
      setTimeout(() => {
        setShowComingSoon(false);
        document.body.style.overflow = 'auto';
      }, 300);
    } else {
      setError('Incorrect password. Please try again.');
      setPassword('');
    }
  };

  // Welcome Modal - 123Bots Dark Tech Theme
  if (showWelcomeModal) {
    return (
      <div 
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
          isExiting ? 'opacity-0' : 'opacity-100'
        }`}
        data-testid="welcome-modal"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleCloseWelcome} />
        
        {/* Modal */}
        <div 
          className={`relative bg-gradient-to-b from-[#0a1929] to-[#050f17] rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden transform transition-all duration-300 border border-blue-500/20 ${
            isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* Close button */}
          <button 
            onClick={handleCloseWelcome}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10"
            data-testid="welcome-close-btn"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Blue accent line */}
          <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />
          
          {/* Content */}
          <div className="p-8">
            {/* Robot Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30">
                <Bot className="w-12 h-12 text-blue-400" />
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              Welcome to 123Bots!
            </h2>
            
            {/* Subtitle */}
            <p className="text-center text-blue-200 mb-6">
              Transform your commercial cleaning with AI-powered robots
            </p>
            
            {/* Features Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-white">
                  <Bot className="w-5 h-5 text-blue-400" />
                  <span className="text-sm">AI Cleaning Robots</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Zap className="w-5 h-5 text-green-400" />
                  <span className="text-sm">Autonomous Tech</span>
                </div>
              </div>
            </div>
            
            {/* Tagline */}
            <p className="text-center text-gray-400 text-sm mb-6">
              Revolutionizing floor cleaning solutions for modern spaces
            </p>
            
            {/* Button */}
            <button
              onClick={handleEnterWelcome}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:-translate-y-0.5"
              data-testid="welcome-enter-btn"
            >
              Continue
            </button>
          </div>
          
          {/* Footer */}
          <div className="bg-black/30 px-8 py-4 border-t border-blue-500/20">
            <p className="text-center text-xs text-gray-500">
              123 Bots<br />
              <span className="text-blue-400/70">Commercial Cleaning Robots • AI-Powered • (877) 702-2687</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Coming Soon Password Modal - 123Bots Dark Tech Theme
  if (showComingSoon) {
    return (
      <div 
        className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-300 ${
          isExiting ? 'opacity-0' : 'opacity-100'
        }`}
        data-testid="coming-soon-modal"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
        
        {/* Modal */}
        <div 
          className={`relative bg-gradient-to-b from-[#0a1929] to-[#050f17] rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 border border-blue-500/20 ${
            isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* Blue accent line */}
          <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600" />
          
          {/* Content */}
          <div className="p-8">
            {/* Robot Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/30">
                <Bot className="w-10 h-10 text-blue-400" />
              </div>
            </div>
            
            {/* Coming Soon Badge */}
            <div className="flex justify-center mb-4">
              <span className="px-4 py-1.5 bg-blue-500/20 border border-blue-500/50 rounded-full text-blue-400 text-sm font-semibold">
                Preview Mode
              </span>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              123 Bots Preview
            </h2>
            
            {/* Subtitle */}
            <p className="text-center text-blue-200 mb-6">
              Enter the password to access the site preview.
            </p>
            
            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter password"
                  className="w-full pl-12 pr-12 py-4 bg-black/30 border border-blue-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  data-testid="coming-soon-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              
              {error && (
                <p className="text-red-400 text-sm text-center" data-testid="coming-soon-error">
                  {error}
                </p>
              )}
              
              <button
                type="submit"
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transform hover:-translate-y-0.5"
                data-testid="coming-soon-submit-btn"
              >
                Enter Site
              </button>
            </form>
          </div>
          
          {/* Footer */}
          <div className="bg-black/30 px-8 py-4 border-t border-blue-500/20">
            <p className="text-center text-xs text-gray-500">
              AI-Powered Commercial Cleaning<br />
              <span className="text-blue-400/70">Schedule a Demo: (877) 702-2687</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AgeVerificationModal;
