import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Bot, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { toast } from '../hooks/use-toast';
import SiteLogo from '../components/SiteLogo';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, verifyLoginTwoFactor, resendLoginTwoFactor, isAuthenticated, loading } = useAuth();
  const siteSettings = useSiteSettings();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [rememberBrowser, setRememberBrowser] = useState(true);
  const [twoFactorChallenge, setTwoFactorChallenge] = useState(null);

  // Redirect if already logged in
  if (!loading && isAuthenticated) {
    return <Navigate to="/admin/cart" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(email, password);

    if (result.success) {
      toast({
        title: 'Welcome back!',
        description: `Logged in as ${result.user.name}`,
      });
      navigate('/admin/cart');
    } else if (result.requiresTwoFactor) {
      setTwoFactorChallenge({ challengeId: result.challengeId, email: result.email });
      setVerificationCode('');
      toast({
        title: 'Check your email',
        description: result.message || 'Enter the 6-digit code we sent to finish signing in.',
      });
    } else {
      toast({
        title: 'Login Failed',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    if (!twoFactorChallenge) {
      return;
    }

    setIsLoading(true);
    const result = await verifyLoginTwoFactor(
      twoFactorChallenge.email,
      twoFactorChallenge.challengeId,
      verificationCode,
      rememberBrowser,
    );

    if (result.success) {
      toast({
        title: 'Signed in successfully',
        description: `Welcome back, ${result.user.name}`,
      });
      navigate('/admin/cart');
    } else {
      toast({
        title: 'Verification Failed',
        description: result.error,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const handleResendCode = async () => {
    if (!twoFactorChallenge) {
      return;
    }
    setIsLoading(true);
    const result = await resendLoginTwoFactor(twoFactorChallenge.email, twoFactorChallenge.challengeId);
    toast({
      title: result.success ? 'Code Sent' : 'Unable to resend code',
      description: result.success ? result.message : result.error,
      variant: result.success ? 'default' : 'destructive',
    });
    setIsLoading(false);
  };

  const handleBackToLogin = () => {
    setTwoFactorChallenge(null);
    setVerificationCode('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bots-dark">
        <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dark blue gradient background - 123Bots theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0a1929] via-[#0d1f35] to-[#051118]" />
      
      {/* Animated particles/orbs with green/blue hues */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 left-20 w-96 h-96 bg-green-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 right-20 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/10 rounded-full blur-3xl"
        />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full" style={{
          backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </div>

      {/* Main content */}
      <a
        href="https://www.facebook.com/123bots"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 z-20 text-blue-200 hover:text-green-300 transition-colors text-sm font-medium"
        data-testid="login-facebook-link"
      >
        Facebook
      </a>

      <div className="relative min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          {/* Logo and welcome section */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-10"
          >
            <div className="relative inline-block mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-full blur-xl"
              />
              <SiteLogo
                src={siteSettings.logoUrl}
                alt={siteSettings.siteName}
                className="h-24 relative z-10"
                data-testid="login-logo-image"
              />
            </div>
            <h1 className="font-heading text-3xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-blue-200">
              Enter your credentials to continue
            </p>
          </motion.div>

          {/* Login card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative"
          >
            {/* Card glow effect - green/blue gradient */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500 via-blue-500 to-green-500 rounded-2xl blur-lg opacity-30" />
            
            {/* Card */}
            <div className="relative bg-[#0d1f35]/90 backdrop-blur-xl border border-green-500/20 rounded-2xl p-8 shadow-2xl">
              {/* Decorative corners with green */}
              <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-green-500/50 rounded-tl-2xl" />
              <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-green-500/50 rounded-br-2xl" />

              {!twoFactorChallenge ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-blue-200 font-medium">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/60 group-focus-within:text-green-400 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-12 h-12 bg-[#051118]/80 border-green-500/30 text-white placeholder:text-blue-300/40 focus:border-green-500/50 focus:ring-green-500/20 transition-all"
                        data-testid="login-email-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-blue-200 font-medium">
                      Password
                    </Label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-300/60 group-focus-within:text-green-400 transition-colors" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-12 pr-12 h-12 bg-[#051118]/80 border-green-500/30 text-white placeholder:text-blue-300/40 focus:border-green-500/50 focus:ring-green-500/20 transition-all"
                        data-testid="login-password-input"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-green-400 transition-colors"
                        data-testid="login-password-visibility-button"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="w-full h-14 bg-gradient-to-r from-green-600 via-green-500 to-green-600 hover:from-green-500 hover:via-green-400 hover:to-green-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300"
                      disabled={isLoading}
                      data-testid="login-submit-button"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-3">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Signing in...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Zap className="w-5 h-5" />
                          Sign In
                        </span>
                      )}
                    </Button>
                  </motion.div>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-6" data-testid="login-two-factor-form">
                  <div className="rounded-2xl border border-green-500/30 bg-[#051118]/60 p-4 text-left">
                    <p className="text-sm uppercase tracking-[0.2em] text-green-400" data-testid="login-two-factor-step-label">
                      Extra security check
                    </p>
                    <p className="mt-2 text-white" data-testid="login-two-factor-email-copy">
                      Enter the 6-digit code sent to <span className="font-semibold">{twoFactorChallenge.email}</span>.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-two-factor-code" className="text-blue-200 font-medium">
                      Verification Code
                    </Label>
                    <Input
                      id="login-two-factor-code"
                      inputMode="numeric"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="h-12 bg-[#051118]/80 border-green-500/30 text-white placeholder:text-blue-300/40 focus:border-green-500/50 focus:ring-green-500/20 tracking-[0.35em] text-center"
                      data-testid="login-two-factor-code-input"
                      required
                    />
                  </div>

                  <label className="flex items-start gap-3 text-sm text-blue-200" data-testid="login-two-factor-trust-device-row">
                    <input
                      type="checkbox"
                      checked={rememberBrowser}
                      onChange={(e) => setRememberBrowser(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-green-500/40 bg-[#051118] text-green-500 focus:ring-green-500/20"
                      data-testid="login-two-factor-trust-device-checkbox"
                    />
                    <span>Trust this browser for 30 days so future logins don't need a code here.</span>
                  </label>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="w-full h-14 bg-gradient-to-r from-green-600 via-green-500 to-green-600 hover:from-green-500 hover:via-green-400 hover:to-green-500 text-white font-semibold text-lg rounded-xl shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all duration-300"
                      disabled={isLoading || verificationCode.length !== 6}
                      data-testid="login-two-factor-verify-button"
                    >
                      {isLoading ? 'Verifying...' : 'Verify and Sign In'}
                    </Button>
                  </motion.div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-green-500/40 text-blue-200 bg-transparent hover:bg-green-500/10"
                      onClick={handleResendCode}
                      data-testid="login-two-factor-resend-button"
                    >
                      Resend Code
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="flex-1 text-blue-200 hover:text-white hover:bg-white/10"
                      onClick={handleBackToLogin}
                      data-testid="login-two-factor-back-button"
                    >
                      Back to Login
                    </Button>
                  </div>
                </form>
              )}

              {/* Divider with robot icon */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                <Bot className="w-5 h-5 text-green-500/50" />
                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
              </div>

              {/* Features - Robot related */}
              <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-400">AI</p>
                  <p className="text-xs text-blue-200">Powered</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-400">24/7</p>
                  <p className="text-xs text-blue-200">Cleaning</p>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-green-400">Smart</p>
                  <p className="text-xs text-blue-200">Robots</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center text-blue-300/60 text-sm mt-8"
            data-testid="login-footer-copy"
          >
            &copy; {new Date().getFullYear()} {siteSettings.siteName}. All rights reserved.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
};

export default LoginPage;
