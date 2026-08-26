import React, { useState } from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ContactFormModal from '../components/automarket/ContactFormModal';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactUs() {
  const [showContactForm, setShowContactForm] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Contact Us</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-8">Contact Us</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <Phone className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Phone</h3>
                <p className="text-muted-foreground text-sm">Mon–Fri, 9am–5:30pm</p>
                <a href="tel:+35314444444" className="text-primary hover:underline font-medium">+353 1 0000000</a>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <Mail className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Email</h3>
                <p className="text-muted-foreground text-sm">We'll respond within 24 hours</p>
                <a href="mailto:support@automax.ie" className="text-primary font-medium hover:underline">support@automax.ie</a>
              </div>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex items-start gap-4">
              <MapPin className="w-6 h-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-foreground mb-1">Office</h3>
                <p className="text-muted-foreground text-sm">17 Hallwell Square.
Adamstown
Lucan
Co Dublin</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <Mail className="w-10 h-10 text-primary mb-3" />
            <h2 className="text-lg font-bold text-foreground mb-2">Send a Message</h2>
            <p className="text-muted-foreground text-sm mb-4">Have a question? Click below to submit a request and we'll get back to you within 24 hours.</p>
            <button onClick={() => setShowContactForm(true)} className="bg-primary text-white font-semibold py-3 px-8 rounded-xl hover:bg-primary/90 transition-colors">
              Submit a Request
            </button>
          </div>
        </div>
      </div>
      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} defaultReason="Support / Help" />
      <Footer />
    </div>);}