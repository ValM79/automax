import React from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { Link } from 'react-router-dom';

export default function CookiePolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Cookie Policy</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: October 2026</p>
        <div className="space-y-6">
          {[
            { title: 'What Are Cookies?', text: 'Cookies are small text files stored on your device when you visit a website. They help us remember your preferences, keep you logged in, and improve your overall experience on AutoMax.' },
            { title: 'How We Use Cookies', text: 'We use cookies only to keep the site working — for example, keeping you logged in during your session and remembering that you\'ve seen our cookie notice. We do not use cookies for analytics, advertising, or personalisation.' },
            { title: 'Types of Cookies We Use', text: 'Essential cookies: Required for the site to function correctly, such as session management and authentication. That\'s the only category we currently use — we do not set analytics, marketing, or advertising cookies.' },
            { title: 'Other Information Stored on Your Device', text: 'As well as cookies, AutoMax uses your browser\'s (or the app\'s) local storage on your own device so the features you use keep working. This includes your sign-in session, whether you\'ve dismissed the cookie notice, the ads you\'ve liked, your recent and saved searches, your browsing history, users you\'ve blocked, simple per-listing view counts, and the page history used by the back button. This information stays on your device. We don\'t use it for advertising or analytics, and it isn\'t used to track you.' },
            { title: 'Third-Party Cookies', text: 'When you make a payment, Stripe (our payment processor) may set its own cookies during checkout to process the transaction securely. See Stripe\'s privacy policy for details. We do not use any analytics or advertising cookies from third parties.' },
            { title: 'Managing Cookies', text: 'You can control and delete cookies, and clear the information stored on your device, through your browser settings (clear site data for automax.ie), or by uninstalling the app. Doing so will sign you out and remove your liked ads, saved searches and browsing history from that device. Disabling essential cookies may affect the functionality of AutoMax, such as staying signed in.' },
            { title: 'Contact', text: 'If you have any questions about our cookie policy, please contact us at privacy@automax.ie.' },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}