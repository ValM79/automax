import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, AlertCircle, KeyRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '@/api/apiClient';

function PasswordInput({ id, label, placeholder, value, onChange, hint }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full border border-input rounded-lg px-3 py-2.5 text-sm pl-9 pr-10 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          tabIndex={-1}
        >
          {show ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-xs mt-1.5 text-blue-600 leading-relaxed">{hint}</p>}
    </div>
  );
}

export default function CreateAccount() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    agreeMarketing: false,
  });
  const [step, setStep] = useState('form'); // 'form' | 'confirm'
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.fullName) {
      setError('Please fill in your name and email.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.auth.register(form.email, form.password, form.fullName);
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.auth.confirmRegistration(form.email, code);
      // Log the new account straight in and land on the home page, same as
      // a normal email/password sign-in — see Login.jsx for why this is a
      // hard redirect rather than an SPA navigate.
      await api.auth.loginViaEmailPassword(form.email, form.password);
      window.location.replace('/');
    } catch (err) {
      setError(err.message || 'Invalid or expired code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await api.auth.resendConfirmationCode(form.email);
    } catch (err) {
      setError(err.message || 'Failed to resend code.');
    }
  };

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 w-full max-w-md">
          <div className="mb-6">
            <button
              onClick={() => setStep('form')}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-5"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </button>
            <h1 className="text-2xl font-bold text-foreground text-center">Confirm your email</h1>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Enter the 6-digit code we sent to <strong>{form.email}</strong>
            </p>
          </div>

          <form onSubmit={handleConfirm}>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5 mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="mb-5">
              <label htmlFor="code" className="block text-sm font-medium text-foreground mb-1.5">Confirmation code</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-background font-semibold text-base bg-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Confirming…' : 'Confirm account'}
            </button>
          </form>

          <div className="flex justify-center mt-5">
            <button onClick={handleResend} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Resend code
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-lg p-6 md:p-8 w-full max-w-md">
        <div className="mb-6">
          <Link to="/" className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-5">
            <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to sign in
          </Link>
          <h1 className="text-2xl font-bold text-foreground text-center">Create your account</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div className="mb-5">
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="fullName"
                type="text"
                value={form.fullName}
                onChange={set('fullName')}
                placeholder="Your full name"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          {/* Email */}
          <div className="mb-5">
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="you@example.com"
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm pl-9 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>
          </div>

          <PasswordInput
            id="password"
            label="Password"
            placeholder="Min. 8 characters"
            hint="At least 8 characters, one upper and lower character, one number and one symbol."
            value={form.password}
            onChange={set('password')}
          />

          {/* Confirm Password */}
          <PasswordInput
            id="confirmPassword"
            label="Confirm password"
            placeholder="Re-enter password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
          />

          {/* Marketing consent */}
          <div className="mb-5">
            <p className="text-sm text-foreground leading-relaxed mb-3">
              To get the most from AutoMax, we'll send you members-only updates via email,{' '}
              <span className="text-blue-600">push notifications</span> and on site messaging. You can{' '}
              <span className="text-blue-600">update your preferences</span> at any time from your My AutoMax page.
            </p>
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="agreeMarketing"
                checked={form.agreeMarketing}
                onChange={(e) => setForm((f) => ({ ...f, agreeMarketing: e.target.checked }))}
                className="w-4 h-4 border border-input rounded accent-primary cursor-pointer"
              />
              <label htmlFor="agreeMarketing" className="text-sm font-medium cursor-pointer">
                Yes, I agree
              </label>
            </div>
          </div>

          {/* reCAPTCHA notice */}
          <div className="bg-muted border border-border rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              This site is protected by reCAPTCHA and the{' '}
              <a href="#" className="text-blue-600 hover:underline">Google Privacy Policy</a>{' '}
              and{' '}
              <a href="#" className="text-blue-600 hover:underline">Terms of Services apply</a>
            </p>
          </div>

          {/* Terms */}
          <p className="text-xs text-foreground mb-5 leading-relaxed">
            By clicking Continue, I agree to the{' '}
            <a href="#" className="text-blue-600 hover:underline">AutoMax Terms of Use</a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-background font-semibold text-base bg-foreground hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? 'Creating account…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
