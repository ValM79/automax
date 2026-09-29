import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

// AutoMax does not run analytics, advertising, or social tracking scripts — only
// essential/functional cookies (session, auth). Keep this notice in sync with
// that reality; do not reintroduce "analytics/advertising/social" opt-ins unless
// those scripts are actually implemented (see PrivacyPolicy.jsx and
// CookiePolicy.jsx, which make the same no-tracking statement). Since there is
// nothing non-essential to opt into, this is an acknowledgement notice, not a
// consent choice.
const COOKIE_CONSENT_KEY = 'automax_cookie_consent';

export function getCookieConsent() {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ decided: true, timestamp: Date.now() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto" />

      <div className="relative pointer-events-auto w-full sm:max-w-xl mx-auto sm:rounded-2xl bg-card shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-border">
          <Cookie className="w-6 h-6 text-primary flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-base font-bold text-foreground">We use essential cookies</h2>
            <p className="text-xs text-muted-foreground mt-0.5">AutoMax only uses cookies required to keep the site working — we don't use analytics, advertising, or tracking cookies.</p>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <p className="text-sm text-muted-foreground mb-4">
            These essential cookies handle things like keeping you signed in and remembering this notice. They can't be disabled, and we don't set any other kind. You can read more in our{' '}
            <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-2">
          <button
            onClick={dismiss}
            className="w-full bg-foreground text-background font-semibold py-3 rounded-xl text-sm hover:opacity-90 transition-opacity">
            Got it
          </button>
          <p className="text-xs text-muted-foreground text-center mt-1">
            See our{' '}
            <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link>{' '}
            and{' '}
            <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
