import React, { useState } from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ContactFormModal from '../components/automarket/ContactFormModal';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

const steps = [
{ title: 'Create your account', text: 'Sign up or sign in on AutoMax. One account is all you need to place and manage your ads.' },
{ title: 'Place your ad as a trader', text: 'Choose the Dealership Cars category when you place an ad, tick "Yes, I\'m a trader" and add your business name, address and VAT number.' },
{ title: 'Choose an ad package and pay', text: 'Each ad is paid for on its own when you place it. You get a VAT receipt for every trader ad.' }];


const comingSoon = [
'Monthly dealer packages',
'Dealer profile pages',
'A searchable dealer directory',
'Ad performance statistics'];


export default function DealersInformation() {
  const [showContactForm, setShowContactForm] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Dealers information</span>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">Dealers information</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Everything a motor dealer needs to know about advertising stock on AutoMax.</p>
        </div>

        <h2 className="text-xl font-bold text-foreground mb-4">How to advertise your stock</h2>
        <ol className="space-y-4 mb-10">
          {steps.map((s, i) =>
          <li key={s.title} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">{i + 1}</span>
              <div>
                <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.text}</p>
              </div>
            </li>
          )}
        </ol>
        <div className="text-center mb-12">
          <Link to="/place-ad" className="inline-block bg-primary text-white font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-primary/90 transition-colors">Place an ad</Link>
          <p className="text-sm text-muted-foreground mt-3">
            Your ads appear in <Link to="/dealership-cars" className="text-primary font-semibold hover:underline">Dealership Cars</Link> and in search results.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm mb-12">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-xl font-bold text-foreground">Coming soon</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-3">We're working on more tools for dealers:</p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            {comingSoon.map((f) => <li key={f}>{f}</li>)}
          </ul>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Questions from a dealer?</h2>
          <p className="text-muted-foreground text-sm mb-4">Contact our dealer team and we'll be happy to help.</p>
          <button onClick={() => setShowContactForm(true)} className="border border-foreground text-foreground font-semibold px-6 py-2.5 rounded-xl text-sm hover:bg-secondary transition-colors mb-3">Contact us</button>
          <div><a href="mailto:dealers@automax.ie" className="text-primary font-semibold hover:underline">dealers@automax.ie</a></div>
        </div>
      </div>
      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} defaultReason="Dealer Inquiry" />
      <Footer />
    </div>);

}
