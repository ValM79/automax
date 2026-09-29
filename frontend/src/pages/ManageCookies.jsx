import React from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

// AutoMax only sets essential/functional cookies — no analytics, advertising, or
// social tracking. Keep in sync with CookieBanner.jsx, CookiePolicy.jsx, and
// PrivacyPolicy.jsx, which make the same statement.
const COOKIE_CONSENT_KEY = 'automax_cookie_consent';

export default function ManageCookies() {
  const handleReset = () => {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Manage Cookies</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Manage Cookie Preferences</h1>
        <p className="text-muted-foreground mb-8 text-sm">
          AutoMax only uses essential cookies required for the site to work — we don't use analytics, advertising, or social tracking cookies, so there's nothing else here to configure.
        </p>

        <div className="space-y-4 mb-8">
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground text-sm">Essential Cookies</h3>
                <p className="text-xs text-muted-foreground mt-1">Required for the site to function properly (e.g. keeping you signed in). These cannot be disabled.</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0 mt-1">Always on</span>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="w-full border border-border text-foreground font-semibold py-3 rounded-xl hover:bg-secondary transition-colors text-sm">
          Reset This Notice
        </button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Read our full <Link to="/cookie-policy" className="text-primary hover:underline">Cookie Policy</Link> and <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>.
        </p>
      </div>
      <Footer />
    </div>
  );
}
