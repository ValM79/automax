import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, X, AlertCircle } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkAppState } = useAuth();
  const nextUrl = searchParams.get('next') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleExit = () => {
    // Go back to the page the user was on before being sent to login,
    // NOT to the `next` URL (which may require auth and cause a redirect loop).
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      // Hard redirect (not SPA navigate) so the base44 client is re-initialized
      // with the new token from localStorage. On real mobile WebViews the
      // client's token is a static snapshot from page load — SPA navigation
      // keeps the stale null token, so the user appears logged out.
      // Use replace() so the Login page is removed from browser history —
      // otherwise pressing Back from the destination page returns to Login.
      window.location.replace(nextUrl);
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 w-full max-w-md relative">
        <button
          onClick={handleExit}
          className="absolute top-3 right-3 flex w-9 h-9 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors"
          aria-label="Exit"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <img
            src="https://media.base44.com/images/public/69ceb6b4f41f5a2cee0c7016/39fe51366_automax512png.png"
            alt="AutoMax logo"
            className="w-20 h-20 object-contain mb-3"
          />
          <h1 className="text-xl font-bold text-foreground">Welcome to AutoMax</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to continue</p>
        </div>

        {/* Email/password form */}
        <form onSubmit={handleEmailLogin}>
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

          <div className="mb-5">
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">Password</label>
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-background font-semibold text-base bg-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Footer links */}
        <div className="flex flex-col items-center gap-3 mt-5">
          <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Forgot password?
          </Link>
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/create-account" className="text-foreground font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}