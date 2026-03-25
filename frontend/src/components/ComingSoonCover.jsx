import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const ComingSoonCover = ({ children }) => {
  const { logoUrl, siteName } = useSiteSettings();
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];
  
  const CORRECT_PIN = '8487';
  const STORAGE_KEY = 'aps_site_unlocked';

  useEffect(() => {
    // Check if already unlocked
    const unlocked = localStorage.getItem(STORAGE_KEY);
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handlePinChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    setError(false);

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }

    // Check PIN when all digits entered
    if (index === 3 && value) {
      const enteredPin = newPin.join('');
      if (enteredPin === CORRECT_PIN) {
        localStorage.setItem(STORAGE_KEY, 'true');
        setIsUnlocked(true);
      } else {
        setError(true);
        setPin(['', '', '', '']);
        inputRefs[0].current?.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 4);
    if (/^\d{1,4}$/.test(pastedData)) {
      const newPin = pastedData.split('').concat(['', '', '', '']).slice(0, 4);
      setPin(newPin);
      
      if (pastedData.length === 4) {
        if (pastedData === CORRECT_PIN) {
          localStorage.setItem(STORAGE_KEY, 'true');
          setIsUnlocked(true);
        } else {
          setError(true);
          setPin(['', '', '', '']);
          inputRefs[0].current?.focus();
        }
      } else {
        inputRefs[pastedData.length]?.current?.focus();
      }
    }
  };

  // If unlocked, show the actual website
  if (isUnlocked) {
    return children;
  }

  // Show coming soon cover
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f172a] flex items-center justify-center"
      data-testid="coming-soon-cover"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#c41e3a]/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#1e3a5f]/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-lg">
        {/* Logo */}
        <div className="mb-8">
          <img 
            src={logoUrl || '/images/gingerkare-logo.png'} 
            alt={siteName || '123Bots'} 
            className="h-20 mx-auto mb-6"
            data-testid="coming-soon-site-logo"
          />
        </div>

        {/* Coming Soon Text */}
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight">
          Coming Soon
        </h1>
        <p className="text-xl text-slate-300 mb-12">
          We're working hard to bring you something amazing. Stay tuned!
        </p>

        {/* PIN Entry */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-[#c41e3a]" />
            <span className="text-white font-medium">Admin Access</span>
          </div>

          <p className="text-slate-400 text-sm mb-6">Enter 4-digit PIN to preview site</p>

          {/* PIN Inputs */}
          <div className="flex justify-center gap-3 mb-4">
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={inputRefs[index]}
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`w-14 h-14 text-center text-2xl font-bold rounded-xl border-2 bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#c41e3a] transition-all ${
                  error 
                    ? 'border-red-500 shake-animation' 
                    : 'border-white/30 focus:border-[#c41e3a]'
                }`}
                data-testid={`pin-input-${index}`}
              />
            ))}
          </div>

          {/* Show/Hide PIN */}
          <button
            onClick={() => setShowPin(!showPin)}
            className="flex items-center gap-2 mx-auto text-slate-400 hover:text-white text-sm transition-colors"
          >
            {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPin ? 'Hide' : 'Show'} PIN
          </button>

          {/* Error Message */}
          {error && (
            <p className="text-red-400 text-sm mt-4 animate-pulse">
              Incorrect PIN. Please try again.
            </p>
          )}
        </div>

        {/* Footer */}
        <p className="text-slate-500 text-sm mt-8">
          123Bots &bull; Custom Prints &amp; Personalized Gifts
        </p>
      </div>

      {/* Shake animation style */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .shake-animation {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default ComingSoonCover;
