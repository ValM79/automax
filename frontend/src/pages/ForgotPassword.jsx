import React, { useState } from 'react';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '@/api/apiClient';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.auth.resetPasswordRequest(email);
      setDone(true);
    } catch (err) {
      // Don't reveal whether the email exists — show the same success state
      // for security, but log the actual error for debugging.
      console.error('Password reset request failed:', err);
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 w-full max-w-md relative">
        {/* Back to login */}
        <Link
          to="/login"
          className="absolute top-4 left-4 p-1.5 min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
          aria-label="Back to login"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Forgot Password?</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {done ? 'Check your inbox' : 'Enter your email to receive a reset link'}
          </p>
        </div>

        {done ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-accent bg-accent/5 border border-accent/20 rounded-lg px-4 py-3 w-full">
              <CheckCircle className="w-5 h-5 flex-shrink-0 text-accent" />
              <span>
                If an account exists for <strong>{email}</strong>, a password reset
                code has been sent. Check your inbox and spam folder.
              </span>
            </div>
            <Link
              to={`/reset-password?email=${encodeURIComponent(email)}`}
              className="w-full py-2.5 rounded-lg text-center text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity"
            >
              Enter reset code
            </Link>
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Back to Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-5">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-background font-semibold text-base bg-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        {/* Footer */}
        <div className="flex justify-center mt-5">
          <p className="text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link to="/login" className="text-foreground font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}