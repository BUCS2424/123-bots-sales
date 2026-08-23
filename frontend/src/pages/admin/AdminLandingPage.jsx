import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Store } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import AdminScreensaver from '../../components/AdminScreensaver';

const AdminLandingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { logoUrl, siteName } = useSiteSettings();
  const [showScreensaver, setShowScreensaver] = useState(false);
  const screensaverTimeoutRef = useRef(null);

  // Check for test mode (for demo/testing purposes)
  const testMode = searchParams.get('screensaver') === 'test';

  // Get screensaver timeout from localStorage
  const getScreensaverTimeout = () => {
    const saved = localStorage.getItem('admin_screensaver_timeout');
    return saved ? parseFloat(saved) : 2; // Default 2 minutes
  };

  // Reset screensaver timer
  const resetScreensaverTimer = useCallback(() => {
    if (testMode) return; // Don't reset in test mode
    
    setShowScreensaver(false);
    
    if (screensaverTimeoutRef.current) {
      clearTimeout(screensaverTimeoutRef.current);
    }

    const timeoutMinutes = getScreensaverTimeout();
    if (timeoutMinutes === 0) return; // Disabled

    const timeoutMs = timeoutMinutes * 60 * 1000;
    screensaverTimeoutRef.current = setTimeout(() => {
      setShowScreensaver(true);
    }, timeoutMs);
  }, [testMode]);

  // Enable test mode screensaver
  useEffect(() => {
    if (testMode) {
      setShowScreensaver(true);
    }
  }, [testMode]);

  // Set up activity listeners
  useEffect(() => {
    if (testMode) return; // Skip in test mode
    
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => {
      if (!showScreensaver) {
        resetScreensaverTimer();
      }
    };

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timer
    resetScreensaverTimer();

    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (screensaverTimeoutRef.current) {
        clearTimeout(screensaverTimeoutRef.current);
      }
    };
  }, [resetScreensaverTimer, showScreensaver, testMode]);

  const handleDismissScreensaver = () => {
    setShowScreensaver(false);
    if (testMode) {
      // Navigate away from test mode
      navigate('/admin');
    } else {
      resetScreensaverTimer();
    }
  };

  // Check if user has admin or super_admin role
  const isAdminOrAbove = user?.role === 'admin' || user?.role === 'super_admin';

  const allSections = [
    {
      id: 'pawn',
      title: 'Products',
      description: 'Manage products, orders, inventory & point of sale',
      icon: Store,
      path: '/admin/cart',
      gradient: 'from-amber-500 to-amber-600',
      hoverGradient: 'hover:from-amber-600 hover:to-amber-700',
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
      requiresAdmin: false,
    },
  ];

  // Filter sections based on user role
  const sections = allSections.filter(section => !section.requiresAdmin || isAdminOrAbove);

  return (
    <>
      {/* Screensaver Overlay */}
      {showScreensaver && <AdminScreensaver onDismiss={handleDismissScreensaver} />}

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[rgb(37, 99, 235)] to-gray-900 flex flex-col">
        {/* Header */}
        <header className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src={logoUrl || '/images/legacy-logo-placeholder.png'}
              alt={siteName || '123Bots'}
              className="h-12"
              data-testid="admin-landing-header-logo"
            />
          </div>
          <div className="text-white text-right">
            <p className="text-sm text-gray-300">Welcome back,</p>
            <p className="font-semibold">{user?.name}</p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 text-center" data-testid="admin-landing-title">
            Admin Dashboard
          </h1>
          <p className="text-gray-300 mb-12 text-center">Select a section to manage</p>

          {/* Section Cards */}
          <div className="grid grid-cols-1 gap-6 w-full max-w-xl">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => navigate(section.path)}
                data-testid={`admin-section-${section.id}`}
                className="group relative overflow-hidden rounded-2xl aspect-[4/3] md:aspect-square transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30"
              >
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundImage: `url(${section.image})` }}
                />
                
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${section.gradient} opacity-80 group-hover:opacity-90 transition-opacity duration-300`} />
                
                {/* Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:bg-white/30 transition-colors duration-300">
                    <section.icon className="w-10 h-10" />
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-2">{section.title}</h2>
                  <p className="text-sm text-white/80 text-center max-w-xs">{section.description}</p>
                </div>

                {/* Hover Arrow */}
                <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </main>

        {/* Footer */}
        <footer className="p-6 text-center text-gray-400 text-sm">
          <p>123Bots © {new Date().getFullYear()}</p>
        </footer>
      </div>
    </>
  );
};

export default AdminLandingPage;
