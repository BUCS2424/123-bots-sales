import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { toast } from '../hooks/use-toast';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const siteSettings = useSiteSettings();
  const navigate = useNavigate();
  const requiresVerification = siteSettings.requireEmailVerificationForRegistration;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    const result = await register(formData.email, formData.name, formData.password);
    setIsLoading(false);

    if (result.success) {
      if (result.requiresVerification) {
        // Redirect to verification page
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}&sent=${result.emailSent}`);
      } else {
        toast({
          title: 'Welcome to GingerKare!',
          description: 'Your account has been created.',
        });
        navigate('/shop');
      }
    } else {
      toast({
        title: 'Registration Failed',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2c1810] via-[#3a1f12] to-[#1a0f0a] flex items-center justify-center p-6" data-testid="register-page">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#ff8c42]/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#9370db]/20 rounded-full blur-3xl" />
      </div>

      {/* Top-left brand logo wired like homepage */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20"
        data-testid="register-top-left-logo-link"
      >
        <img
          src={siteSettings.logoUrl}
          alt={siteSettings.siteName}
          className="h-11 sm:h-12 w-auto object-contain"
          data-testid="register-top-left-logo-image"
        />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center group" data-testid="register-brand-logo-link">
            <img
              src={siteSettings.logoUrl}
              alt={siteSettings.siteName}
              className="h-16 sm:h-20 w-auto object-contain group-hover:drop-shadow-[0_0_18px_rgba(255,255,255,0.35)] transition-all duration-300"
              data-testid="register-brand-logo-image"
            />
          </Link>
        </div>

        {/* Register card */}
        <div className="bg-[#2c1810]/80 backdrop-blur-xl border border-[#ff8c42]/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="font-heading text-2xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-[#ffd4b8]">
              Register to view product prices and place orders
              {requiresVerification ? ' (email verification code required)' : ''}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name field */}
            <div>
              <label className="block text-sm text-[#ffd4b8] mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffd4b8]/60" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#1a0f0a]/50 border border-[#ff8c42]/30 rounded-xl text-white placeholder-[#ffd4b8]/40 focus:outline-none focus:border-[#ff8c42]/50 focus:ring-2 focus:ring-[#ff8c42]/20 transition-all"
                  placeholder="John Doe"
                  data-testid="register-name"
                />
              </div>
            </div>

            {/* Email field */}
            <div>
              <label className="block text-sm text-[#ffd4b8] mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffd4b8]/60" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#1a0f0a]/50 border border-[#ff8c42]/30 rounded-xl text-white placeholder-[#ffd4b8]/40 focus:outline-none focus:border-[#ff8c42]/50 focus:ring-2 focus:ring-[#ff8c42]/20 transition-all"
                  placeholder="you@example.com"
                  data-testid="register-email"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block text-sm text-[#ffd4b8] mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffd4b8]/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-[#1a0f0a]/50 border border-[#ff8c42]/30 rounded-xl text-white placeholder-[#ffd4b8]/40 focus:outline-none focus:border-[#ff8c42]/50 focus:ring-2 focus:ring-[#ff8c42]/20 transition-all"
                  placeholder="••••••••"
                  data-testid="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ffd4b8]/60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password field */}
            <div>
              <label className="block text-sm text-[#ffd4b8] mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffd4b8]/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#1a0f0a]/50 border border-[#ff8c42]/30 rounded-xl text-white placeholder-[#ffd4b8]/40 focus:outline-none focus:border-[#ff8c42]/50 focus:ring-2 focus:ring-[#ff8c42]/20 transition-all"
                  placeholder="••••••••"
                  data-testid="register-confirm-password"
                />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-[#ff8c42] to-[#ff6b1a] text-white font-heading font-bold uppercase tracking-wider rounded-xl hover:from-[#ff9a5a] hover:to-[#ff8c42] transition-all disabled:opacity-50"
              data-testid="register-submit"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="mt-6 text-center">
            <p className="text-[#ffd4b8]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#ff8c42] hover:text-white font-semibold transition-colors">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        {/* Footer notice */}
        <p className="mt-6 text-center text-sm text-[#ffd4b8]/60">
          By registering, you agree to our Terms & Conditions and Privacy Policy.
        </p>
      </motion.div>
    </div>
  );
};

export default RegisterPage;
