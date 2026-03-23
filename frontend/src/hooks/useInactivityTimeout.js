import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const DEFAULT_TIMEOUT = 3; // 3 minutes default for first timeout
const DEFAULT_SCREENSAVER_TIMEOUT = 2; // 2 minutes default for screensaver

export const useInactivityTimeout = (redirectPath = '/admin') => {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);
  const warningTimeoutRef = useRef(null);
  const screensaverTimeoutRef = useRef(null);
  
  // Check for test mode via URL parameter
  const urlParams = new URLSearchParams(location.search);
  const testScreensaver = urlParams.get('screensaver') === 'test';
  const testModeRef = useRef(testScreensaver);
  
  // Get timeout from localStorage or use default
  const getTimeoutMinutes = () => {
    const saved = localStorage.getItem('admin_inactivity_timeout');
    return saved ? parseFloat(saved) : DEFAULT_TIMEOUT;
  };

  const getScreensaverTimeoutMinutes = () => {
    const saved = localStorage.getItem('admin_screensaver_timeout');
    return saved ? parseFloat(saved) : DEFAULT_SCREENSAVER_TIMEOUT;
  };

  const [timeoutMinutes, setTimeoutMinutes] = useState(getTimeoutMinutes);
  const [screensaverTimeoutMinutes, setScreensaverTimeoutMinutes] = useState(getScreensaverTimeoutMinutes);
  const [showWarning, setShowWarning] = useState(false);
  const [showScreensaver, setShowScreensaver] = useState(testScreensaver); // Enable immediately in test mode
  const [remainingSeconds, setRemainingSeconds] = useState(30);
  
  // In test mode, screensaver should be locked on and never dismiss
  const isTestModeLocked = testModeRef.current;

  // Save timeout to localStorage when changed
  const updateTimeout = useCallback((minutes) => {
    localStorage.setItem('admin_inactivity_timeout', minutes.toString());
    setTimeoutMinutes(minutes);
  }, []);

  const updateScreensaverTimeout = useCallback((minutes) => {
    localStorage.setItem('admin_screensaver_timeout', minutes.toString());
    setScreensaverTimeoutMinutes(minutes);
  }, []);

  // Reset the inactivity timer
  const resetTimer = useCallback(() => {
    // In test mode, keep screensaver locked on - ignore ALL activity
    if (isTestModeLocked) {
      setShowScreensaver(true);
      return;
    }
    
    setShowWarning(false);
    setShowScreensaver(false);
    setRemainingSeconds(30);

    // Clear existing timeouts
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    if (screensaverTimeoutRef.current) clearTimeout(screensaverTimeoutRef.current);

    // Always set screensaver timeout if enabled (on any admin page)
    if (screensaverTimeoutMinutes > 0) {
      const screensaverTime = screensaverTimeoutMinutes * 60 * 1000;
      screensaverTimeoutRef.current = setTimeout(() => {
        setShowScreensaver(true);
      }, screensaverTime);
    }

    // Don't set inactivity redirect timeout if we're on the landing page or timeout is 0 (disabled)
    if (location.pathname === redirectPath || timeoutMinutes === 0) {
      return;
    }

    // Set warning timeout (30 seconds before screensaver)
    const warningTime = (timeoutMinutes * 60 - 30) * 1000;
    if (warningTime > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowWarning(true);
        setRemainingSeconds(30);
      }, warningTime);
    }

    // After warning countdown, show screensaver instead of redirecting
    const screensaverTriggerTime = timeoutMinutes * 60 * 1000;
    timeoutRef.current = setTimeout(() => {
      setShowWarning(false);
      setShowScreensaver(true);
    }, screensaverTriggerTime);
  }, [timeoutMinutes, screensaverTimeoutMinutes, location.pathname, navigate, redirectPath, isTestModeLocked]);

  // Countdown effect when warning is shown
  useEffect(() => {
    if (!showWarning) return;

    const countdownInterval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [showWarning]);

  // Set up event listeners for user activity
  useEffect(() => {
    // Use click-based events only for screensaver (more intentional actions)
    // mousemove is too sensitive and constantly resets the timer
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    // Track last activity time for throttling
    let lastActivityTime = Date.now();
    const THROTTLE_MS = 1000; // Only reset timer once per second max

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityTime > THROTTLE_MS) {
        lastActivityTime = now;
        resetTimer();
      }
    };

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initialize timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
      if (screensaverTimeoutRef.current) clearTimeout(screensaverTimeoutRef.current);
    };
  }, [resetTimer]);

  // Reset timer when location changes (only on actual pathname change)
  const lastPathnameRef = useRef(location.pathname);
  useEffect(() => {
    if (location.pathname !== lastPathnameRef.current) {
      lastPathnameRef.current = location.pathname;
      resetTimer();
    }
  }, [location.pathname, resetTimer]);

  // Dismiss screensaver - but not in test mode
  const dismissScreensaver = useCallback(() => {
    if (isTestModeLocked) {
      return; // Can't dismiss in test mode
    }
    setShowScreensaver(false);
    resetTimer();
  }, [resetTimer, isTestModeLocked]);

  return {
    timeoutMinutes,
    updateTimeout,
    screensaverTimeoutMinutes,
    updateScreensaverTimeout,
    showWarning,
    showScreensaver,
    remainingSeconds,
    resetTimer,
    dismissWarning: () => {
      setShowWarning(false);
      resetTimer();
    },
    dismissScreensaver,
  };
};

export default useInactivityTimeout;
