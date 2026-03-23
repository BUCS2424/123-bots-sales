import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const FRONTEND_ORIGIN = typeof window !== 'undefined' ? window.location.origin : '';
const API_BASE = (typeof window !== 'undefined' && window.location.hostname.endsWith('gingerkare.com'))
  ? FRONTEND_ORIGIN
  : BACKEND_URL;
const API = `${API_BASE}/api`;
const IMPERSONATION_ORIGINAL_TOKEN_KEY = 'impersonation_original_token';
const IMPERSONATION_ORIGINAL_USER_KEY = 'impersonation_original_user';
const getTrustedDeviceStorageKey = (email) => `trusted_email_2fa:${String(email || '').trim().toLowerCase()}`;

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [customerTier, setCustomerTier] = useState(null); // { customer_type, custom_discount_percentage, minimum_order_amount }
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isImpersonating, setIsImpersonating] = useState(Boolean(localStorage.getItem(IMPERSONATION_ORIGINAL_TOKEN_KEY)));
  const [impersonationAdmin, setImpersonationAdmin] = useState(() => {
    const raw = localStorage.getItem(IMPERSONATION_ORIGINAL_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (error) {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const clearImpersonationState = useCallback(() => {
    localStorage.removeItem(IMPERSONATION_ORIGINAL_TOKEN_KEY);
    localStorage.removeItem(IMPERSONATION_ORIGINAL_USER_KEY);
    setIsImpersonating(false);
    setImpersonationAdmin(null);
  }, []);

  // Set axios default header
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Fetch customer tier info when user is authenticated
  const fetchCustomerTier = useCallback(async (userId) => {
    try {
      const response = await axios.get(`${API}/users/customers/${userId}`);
      setCustomerTier({
        customer_type: response.data.customer_type || 'retail',
        custom_discount_percentage: response.data.custom_discount_percentage,
        minimum_order_amount: response.data.minimum_order_amount || 0
      });
    } catch (error) {
      // Default to retail if tier info can't be fetched
      setCustomerTier({ customer_type: 'retail', custom_discount_percentage: null, minimum_order_amount: 0 });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setCustomerTier(null);
      return null;
    }

    const response = await axios.get(`${API}/auth/me`);
    setUser(response.data);
    if (response.data?.id) {
      fetchCustomerTier(response.data.id);
    }
    return response.data;
  }, [token, fetchCustomerTier]);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          await refreshUser();
        } catch (error) {
          console.error('Auth check failed:', error);
          // Clear invalid token
          localStorage.removeItem('token');
          clearImpersonationState();
          setToken(null);
          setUser(null);
          setCustomerTier(null);
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, [token, refreshUser, clearImpersonationState]);

  const login = useCallback(async (email, password) => {
    try {
      const trustedDeviceToken = localStorage.getItem(getTrustedDeviceStorageKey(email));
      const response = await axios.post(`${API}/auth/login`, { email, password, trusted_device_token: trustedDeviceToken || undefined });

      if (response.data?.requires_two_factor) {
        return {
          success: false,
          requiresTwoFactor: true,
          challengeId: response.data.challenge_id,
          email: response.data.email || email,
          message: response.data.message,
        };
      }

      const { access_token, user: userData } = response.data;
      
      clearImpersonationState();
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      
      // Fetch customer tier info after login
      if (userData?.id) {
        fetchCustomerTier(userData.id);
      }
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      return { success: false, error: message };
    }
  }, [fetchCustomerTier, clearImpersonationState]);

  const verifyLoginTwoFactor = useCallback(async (email, challengeId, code, trustDevice) => {
    try {
      const response = await axios.post(`${API}/auth/verify-login-2fa`, {
        email,
        challenge_id: challengeId,
        code,
        trust_device: trustDevice,
      });

      const { access_token, user: userData, trusted_device_token: trustedDeviceToken } = response.data;
      clearImpersonationState();
      localStorage.setItem('token', access_token);
      if (trustedDeviceToken) {
        localStorage.setItem(getTrustedDeviceStorageKey(email), trustedDeviceToken);
      }
      setToken(access_token);
      setUser(userData);

      if (userData?.id) {
        fetchCustomerTier(userData.id);
      }

      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Verification failed' };
    }
  }, [fetchCustomerTier, clearImpersonationState]);

  const resendLoginTwoFactor = useCallback(async (email, challengeId) => {
    try {
      const response = await axios.post(`${API}/auth/resend-login-2fa`, {
        email,
        challenge_id: challengeId,
      });
      return { success: true, message: response.data?.message || 'A new code has been sent.' };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Unable to resend verification code' };
    }
  }, []);

  const register = useCallback(async (email, name, password) => {
    try {
      const response = await axios.post(`${API}/auth/register`, { email, name, password });

      if (response.data?.access_token && response.data?.user) {
        const { access_token, user: userData } = response.data;
        clearImpersonationState();
        localStorage.setItem('token', access_token);
        setToken(access_token);
        setUser(userData);
        if (userData?.id) {
          fetchCustomerTier(userData.id);
        }
        return {
          success: true,
          requiresVerification: false,
          user: userData,
        };
      }

      return { 
        success: true, 
        requiresVerification: true,
        email: response.data.email,
        emailSent: response.data.email_sent,
        message: response.data.message
      };
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      return { success: false, error: message };
    }
  }, [fetchCustomerTier, clearImpersonationState]);

  const verifyEmail = useCallback(async (email, code) => {
    try {
      const response = await axios.post(`${API}/auth/verify-email`, { email, code });
      const { access_token, user: userData } = response.data;
      
      clearImpersonationState();
      localStorage.setItem('token', access_token);
      setToken(access_token);
      setUser(userData);
      
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.detail || 'Verification failed';
      return { success: false, error: message };
    }
  }, []);

  const resendVerification = useCallback(async (email) => {
    try {
      const response = await axios.post(`${API}/auth/resend-verification`, { email });
      return { 
        success: true, 
        emailSent: response.data.email_sent,
        message: response.data.message 
      };
    } catch (error) {
      const message = error.response?.data?.detail || 'Failed to resend';
      return { success: false, error: message };
    }
  }, [clearImpersonationState]);

  const startImpersonation = useCallback(async (impersonationToken, impersonatedUser) => {
    if (!token || !user) {
      return { success: false, error: 'Admin session missing. Please log in again.' };
    }

    if (!localStorage.getItem(IMPERSONATION_ORIGINAL_TOKEN_KEY)) {
      localStorage.setItem(IMPERSONATION_ORIGINAL_TOKEN_KEY, token);
      localStorage.setItem(IMPERSONATION_ORIGINAL_USER_KEY, JSON.stringify(user));
    }

    localStorage.setItem('token', impersonationToken);
    setToken(impersonationToken);
    setUser(impersonatedUser || null);
    setCustomerTier(null);
    setIsImpersonating(true);
    setImpersonationAdmin(user);
    return { success: true };
  }, [token, user]);

  const exitImpersonation = useCallback(async () => {
    const originalToken = localStorage.getItem(IMPERSONATION_ORIGINAL_TOKEN_KEY);
    if (!originalToken) {
      return { success: false, error: 'No active impersonation session.' };
    }

    localStorage.setItem('token', originalToken);
    setToken(originalToken);
    clearImpersonationState();
    return { success: true };
  }, [clearImpersonationState]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    clearImpersonationState();
    setToken(null);
    setUser(null);
    setCustomerTier(null);
    delete axios.defaults.headers.common['Authorization'];
  }, [clearImpersonationState]);

  const isAuthenticated = !!user;
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin';
  const isWholesale = customerTier?.customer_type === 'wholesale';

  const value = {
    user,
    token,
    loading,
    login,
    register,
    verifyEmail,
    resendVerification,
    verifyLoginTwoFactor,
    resendLoginTwoFactor,
    logout,
    isAuthenticated,
    isSuperAdmin,
    isAdmin,
    customerTier,
    isWholesale,
    startImpersonation,
    exitImpersonation,
    isImpersonating,
    impersonationAdmin,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
