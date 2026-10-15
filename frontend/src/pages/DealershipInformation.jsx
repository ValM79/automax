import React, { useState } from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ContactFormModal from '../components/automarket/ContactFormModal';
import { Link } from 'react-router-dom';
import { Store, Building2, BadgeCheck, Receipt, Clock } from 'lucide-react';

const steps = [
  { title: 'Create a Dealer account', text: 'When you sign up, choose Dealer as the Account Type and enter your business name.' },
  { title: 'Complete your business profile', text: 'On your Profile page add your logo, business address, VAT number (if you have one), county and area. Buyers see your logo and business name on your ads.' },
  { title: 'Place your ads', text: 'Place your cars in Dealership Cars (or any section that fits). Each ad is paid for when you place it, and you get a receipt with your business details.' },
];

const benefits = [
  { Icon: Store, title: 'Your own showroom', text: 'Every ad links to a showroom page that lists all of your live stock in one place.' },
  { Icon: Building2, title: 'A place in Dealers Garage', text: 'As soon as you have a live ad, your dealership appears in the Dealers Garage directory with your logo, location, stock count and the sections you sell in.' },
  { Icon: BadgeCheck, title: 'Your business on every ad', text: 'The seller card on each of your ads shows your business name, your logo and a Dealer badge.' },
  { Icon: Receipt, title: 'Receipts for your records', text: 'Each ad receipt shows your business name, address and VAT number.' },
];

const comingSoon = [
  'Monthly dealer packages',
  'Ad performance statistics',
];

export default function DealershipInformation() {
  const [showContactForm, setShowContactForm] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Dealership information</span>
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">Dealership information</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">How dealerships advertise their stock on AutoMax and get found by buyers across Ireland.</p>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-4">How to get started</h2>
        <ol className="space-y-4 mb-10">
          {steps.map((s, i) => (
            <li key={s.title} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">{i + 1}</span>
              <div>
                <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <h2 className="text-xl font-bold text-foreground mb-4">What your dealership gets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          {benefits.map(({ Icon, title, text }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="font-bold text-foreground mb-1">{title}</h3>
              <p className="text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
          <Link to="/create-account" className="h-11 px-6 inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors">Create a Dealer account</Link>
          <Link to="/dealers-garage" className="h-11 px-6 inline-flex items-center justify-center rounded-xl border border-primary text-primary font-semibold text-sm hover:bg-primary/5 transition-colors">Browse Dealers Garage</Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Coming soon</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">We're working on more tools for dealerships:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {comingSoon.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Questions from a dealership?</h2>
          <p className="text-muted-foreground text-sm mb-4">Contact our dealer team and we'll be happy to help.</p>
          <button onClick={() => setShowContactForm(true)} className="border border-foreground text-foreground font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors mb-3">Contact us</button>
          <div><a href="mailto:dealers@automax.ie" className="text-primary font-semibold hover:underline">dealers@automax.ie</a></div>
        </div>
      </div>
      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} defaultReason="Dealer Inquiry" />
      <Footer />
    </div>
  );
}
