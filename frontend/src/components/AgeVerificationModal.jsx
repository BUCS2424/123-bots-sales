import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles, Gift, X, Lock, Eye, EyeOff } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const SITE_PASSWORD = '8487';

const AgeVerificationModal = () => {
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const location = useLocation();
  const siteSettings = useSiteSettings();

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
  }, [location.pathname]);

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

  // Welcome Modal
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
          className={`relative bg-gradient-to-b from-[#2c1810] to-[#1a0f0a] rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden transform transition-all duration-300 ${
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

          {/* Orange accent line */}
          <div className="h-1 bg-gradient-to-r from-[#ff8c42] via-[#ff6b1a] to-[#ff8c42]" />
          
          {/* Content */}
          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src={siteSettings.logoUrl} 
                alt={siteSettings.siteName} 
                className="h-28 w-auto object-contain"
                data-testid="welcome-modal-logo-image"
              />
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              Welcome to 123Bots!
            </h2>
            
            {/* Subtitle */}
            <p className="text-center text-[#ffd4b8] mb-6">
              Your destination for custom printables and unique gifts
            </p>
            
            {/* Features Box */}
            <div className="bg-[#ff8c42]/10 border border-[#ff8c42]/30 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-white">
                  <Gift className="w-5 h-5 text-[#ff8c42]" />
                  <span className="text-sm">Custom Gifts</span>
                </div>
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="w-5 h-5 text-[#00bfff]" />
                  <span className="text-sm">Premium Quality</span>
                </div>
              </div>
            </div>
            
            {/* Tagline */}
            <p className="text-center text-gray-400 text-sm mb-6">
              Whatever your pleasure, here you'll find the perfect treasure!
            </p>
            
            {/* Button */}
            <button
              onClick={handleEnterWelcome}
              className="w-full py-4 bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] hover:from-[#ff9a5a] hover:to-[#ff8c42] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#ff8c42]/30 hover:shadow-[#ff8c42]/50 transform hover:-translate-y-0.5"
              data-testid="welcome-enter-btn"
            >
              Continue
            </button>
          </div>
          
          {/* Footer */}
          <div className="bg-black/30 px-8 py-4 border-t border-[#ff8c42]/20">
            <p className="text-center text-xs text-gray-500">
              {siteSettings.siteName}<br />
              <span className="text-[#ff8c42]/70">Custom Printables • Unique Gifts • Made with ❤️</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Coming Soon Password Modal
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
          className={`relative bg-gradient-to-b from-[#2c1810] to-[#1a0f0a] rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden transform transition-all duration-300 ${
            isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          {/* Orange accent line */}
          <div className="h-1 bg-gradient-to-r from-[#ff8c42] via-[#ff6b1a] to-[#ff8c42]" />
          
          {/* Content */}
          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img 
                src={siteSettings.logoUrl} 
                alt={siteSettings.siteName} 
                className="h-20 w-auto object-contain"
                data-testid="coming-soon-logo-image"
              />
            </div>
            
            {/* Coming Soon Badge */}
            <div className="flex justify-center mb-4">
              <span className="px-4 py-1.5 bg-[#ff8c42]/20 border border-[#ff8c42]/50 rounded-full text-[#ff8c42] text-sm font-semibold">
                Coming Soon
              </span>
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-center text-white mb-2">
              We're Almost Ready!
            </h2>
            
            {/* Subtitle */}
            <p className="text-center text-[#ffd4b8] mb-6">
              Our store is currently under construction. Enter the password to preview the site.
            </p>
            
            {/* Password Form */}
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ff8c42]">
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
                  className="w-full pl-12 pr-12 py-4 bg-black/30 border border-[#ff8c42]/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff8c42] transition-colors"
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
                className="w-full py-4 bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] hover:from-[#ff9a5a] hover:to-[#ff8c42] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#ff8c42]/30 hover:shadow-[#ff8c42]/50 transform hover:-translate-y-0.5"
                data-testid="coming-soon-submit-btn"
              >
                Enter Site
              </button>
            </form>
          </div>
          
          {/* Footer */}
          <div className="bg-black/30 px-8 py-4 border-t border-[#ff8c42]/20">
            <p className="text-center text-xs text-gray-500">
              Something special is on the way!<br />
              <span className="text-[#ff8c42]/70">Stay tuned for our grand opening</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AgeVerificationModal;
