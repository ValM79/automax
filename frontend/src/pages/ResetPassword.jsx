import React, { useState } from 'react';
import { Lock, Mail, KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/api/apiClient';

// Cognito's ForgotPassword flow emails a 6-digit code, not a clickable magic
// link, so this page collects email + code + new password directly instead
// of reading a reset token from the URL.
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const passwordsMatch = password === confirmPassword;
  const passwordLongEnough = password.length >= 8;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !code) {
      setError('Please enter your email and the code we sent you.');
      return;
    }
    if (!passwordLongEnough) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.resetPassword({ email, code, newPassword: password });
      setDone(true);
    } catch (err) {
      if (err.status === 400) {
        setError('This code is invalid or has expired. Please request a new one.');
      } else if (err.status === 422) {
        setError('Password does not meet the required security criteria.');
      } else {
        setError(err.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 w-full max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center mb-4 mx-auto">
            <CheckCircle className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">Password Reset</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Your password has been changed successfully. You can now sign in with your new password.
          </p>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 rounded-lg text-background font-semibold text-base bg-foreground hover:opacity-90 transition-opacity"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 w-full max-w-md relative">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Set New Password</h1>
          <p className="text-sm text-muted-foreground mt-1">Choose a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1.5">Reset code</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                required
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm pl-9 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
            {password && !passwordLongEnough && (
              <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
            )}
          </div>

          <div className="mb-5">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-destructive mt-1">Passwords do not match</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-background font-semibold text-base bg-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>

        {/* Footer */}
        <div className="flex justify-center mt-5">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Back to Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}