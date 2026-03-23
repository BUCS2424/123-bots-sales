import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import ButterflyIcon from '../components/icons/ButterflyIcon';
import { useAuth } from '../context/AuthContext';
import { toast } from '../hooks/use-toast';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const emailSent = searchParams.get('sent') === 'true';
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef([]);
  
  const { verifyEmail, resendVerification } = useAuth();
  const navigate = useNavigate();

  // Countdown for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleChange = (index, value) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every(digit => digit !== '') && newCode.join('').length === 6) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      const newCode = pastedData.split('');
      setCode(newCode);
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (verificationCode) => {
    setIsVerifying(true);
    const result = await verifyEmail(email, verificationCode);
    setIsVerifying(false);

    if (result.success) {
      toast({
        title: 'Email Verified!',
        description: 'Welcome to GingerKare. You can now view prices and place orders.',
      });
      navigate('/shop');
    } else {
      toast({
        title: 'Verification Failed',
        description: result.error,
        variant: 'destructive'
      });
      // Clear the code
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    const result = await resendVerification(email);
    setIsResending(false);

    if (result.success) {
      toast({
        title: 'Code Resent',
        description: result.emailSent ? 'Check your email for a new verification code.' : 'A new code has been generated.',
      });
      setResendCooldown(60);
    } else {
      toast({
        title: 'Failed to Resend',
        description: result.error,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-800 flex items-center justify-center p-6" data-testid="verify-email-page">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-400/20 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center group-hover:bg-white/20 transition-all">
              <ButterflyIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <span className="font-heading font-bold text-2xl text-white">Ginger</span>
              <span className="font-heading font-bold text-2xl text-[#ff8c42]">Kare</span>
            </div>
          </Link>
        </div>

        {/* Verification card */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Mail className="w-8 h-8 text-cyan-300" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-white mb-2">Verify Your Email</h1>
            <p className="text-purple-200">
              {emailSent 
                ? `We've sent a 6-digit code to` 
                : `Enter the verification code for`}
            </p>
            <p className="text-cyan-300 font-semibold">{email}</p>
          </div>

          {/* Email sent status */}
          {!emailSent && (
            <div className="mb-6 p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl">
              <div className="flex items-center gap-2 text-amber-300 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>SMTP not configured. Contact admin for your verification code.</span>
              </div>
            </div>
          )}

          {/* Code input */}
          <div className="flex justify-center gap-2 mb-6">
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="w-12 h-14 text-center text-2xl font-mono font-bold bg-white/10 border-2 border-white/20 rounded-xl text-white focus:border-cyan-400 focus:outline-none transition-all"
                data-testid={`verify-code-${index}`}
              />
            ))}
          </div>

          {/* Verifying indicator */}
          {isVerifying && (
            <div className="flex items-center justify-center gap-2 mb-4 text-cyan-300">
              <div className="w-5 h-5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
              <span>Verifying...</span>
            </div>
          )}

          {/* Resend button */}
          <div className="text-center">
            <p className="text-purple-200 text-sm mb-3">Didn't receive the code?</p>
            <button
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="inline-flex items-center gap-2 text-cyan-300 hover:text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              data-testid="resend-code-btn"
            >
              <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 
                ? `Resend in ${resendCooldown}s` 
                : isResending 
                  ? 'Sending...' 
                  : 'Resend Code'}
            </button>
          </div>
        </div>

        {/* Back to register */}
        <p className="mt-6 text-center text-purple-200">
          Wrong email?{' '}
          <Link to="/register" className="text-cyan-300 hover:text-white font-semibold transition-colors">
            Go back
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;
