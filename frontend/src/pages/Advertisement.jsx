import React, { useState } from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ContactFormModal from '../components/automarket/ContactFormModal';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const adOptions = [
{ name: 'Banner Ads', desc: 'High-visibility banner placements on our homepage and category pages. Ideal for brand awareness campaigns.', reach: '500k+ impressions/mo' },
{ name: 'Sponsored Listings', desc: 'Promote your vehicles at the top of search results pages. Pay-per-click model with full performance tracking.', reach: 'Top-of-search placement' },
{ name: 'Email Sponsorship', desc: 'Feature your brand in our weekly newsletter sent to 80,000+ subscribers.', reach: '80k+ subscribers' },
{ name: 'Category Takeover', desc: 'Exclusive ownership of a full category page — cars, motorbikes, trucks and more.', reach: 'Exclusive placement' }];


export default function Advertisement() {
  const [showContactForm, setShowContactForm] = useState(false);
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Advertisement</span>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">Advertise with AutoMax</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">Reach millions of car buyers and sellers across Ireland. AutoMax offers premium advertising solutions for automotive brands, insurers, finance providers and more.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {adOptions.map((opt, i) =>
          <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-foreground mb-2">{opt.name}</h3>
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{opt.desc}</p>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-foreground">{opt.reach}</span>
              </div>
            </div>
          )}
        </div>
        <div className="bg-primary text-white rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Get in Touch</h2>
          <p className="text-white/80 mb-5 text-sm">Our advertising team will put together a custom proposal tailored to your brand goals and budget.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="mailto:advertise@automax.ie" className="bg-card text-primary font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">advertise@automax.ie</a>
          </div>
        </div>
      </div>
      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} defaultReason="Advertising" />
      <Footer />
    </div>);

}