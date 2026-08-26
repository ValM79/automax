import React, { useState } from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ContactFormModal from '../components/automarket/ContactFormModal';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const plans = [
{ name: 'Starter', price: '€99/mo', features: ['Up to 25 listings', 'Dealer profile page', 'Basic analytics', 'Email support'] },
{ name: 'Professional', price: '€199/mo', features: ['Up to 100 listings', 'Featured dealer badge', 'Advanced analytics', 'Priority support', 'Social media integration'] },
{ name: 'Enterprise', price: 'Custom', features: ['Unlimited listings', 'Premium placement', 'Dedicated account manager', 'API access', 'Custom branding'] }];


export default function DealersInformation() {
  const [showContactForm, setShowContactForm] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Dealers Information</span>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">Information for Dealers</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Reach thousands of active buyers every day. AutoMax offers flexible dealer packages designed to grow your business.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, i) =>
          <div key={i} className={`bg-card border-2 rounded-2xl p-6 shadow-sm flex flex-col ${i === 1 ? 'border-primary' : 'border-border'}`}>
              {i === 1 && <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-3 self-start">Most Popular</div>}
              <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-2xl font-bold text-primary mb-4">{plan.price}</p>
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f, j) =>
              <li key={j} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />{f}
                  </li>
              )}
              </ul>
              <button onClick={() => setShowContactForm(true)} className={`w-full text-center font-semibold py-2.5 rounded-xl transition-colors text-sm ${i === 1 ? 'bg-primary text-white hover:bg-primary/90' : 'border border-foreground text-foreground hover:bg-secondary'}`}>
                Get Started
              </button>
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Want to become a dealer?</h2>
          <p className="text-muted-foreground text-sm mb-4">Contact our dealer team today and we'll find the right package for you.</p>
          <a href="mailto:dealers@automax.ie" className="text-primary font-semibold hover:underline">dealers@automax.ie</a>
        </div>
      </div>
      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} defaultReason="Dealer Inquiry" />
      <Footer />
    </div>);

}