import React, { useState } from 'react';
import BackButton from '../components/automarket/BackButton';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ContactFormModal from '../components/automarket/ContactFormModal';

export default function Help() {
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [showContactForm, setShowContactForm] = useState(false);

  const faqs = [
    {
      id: 1,
      question: 'How do I post an ad?',
      answer: 'To post an ad, click "Place Ad" in the navbar, select your category, upload photos, add details about your vehicle, and publish. Your ad will be live within minutes.',
    },
    {
      id: 2,
      question: 'How much does it cost to list a vehicle?',
      answer: 'Standard listings are €19.99 for 30 days. Featured listings cost €49.99 and get premium placement. Check our pricing page for more options.',
    },
    {
      id: 3,
      question: 'Can I edit or delete my ad?',
      answer: 'Yes, you can edit or delete your ad anytime from the "My Ads" section in your account. Changes take effect immediately.',
    },
    {
      id: 4,
      question: 'How does the history check work?',
      answer: 'Our history check provides detailed vehicle information including mileage records, accident history, and ownership details. It costs €15.99 per report.',
    },
    {
      id: 5,
      question: 'How do I contact a seller?',
      answer: 'You can message sellers directly through their listings. Go to any ad and click "Contact Seller". Messages will appear in your Messages section.',
    },
    {
      id: 6,
      question: 'Is my personal information safe?',
      answer: 'Yes, we use industry-standard encryption and security measures to protect your data. Your phone number is only revealed to buyers if you choose.',
    },
    {
      id: 7,
      question: 'How do I report a suspicious listing?',
      answer: 'Click the "Report" button on any listing. Our team reviews all reports and removes suspicious or fraudulent ads within 24 hours.',
    },
    {
      id: 8,
      question: 'What payment methods do you accept?',
      answer: 'We accept credit cards, debit cards, and PayPal. All payments are processed securely.',
    },
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Help</span>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-2">Help & Support</h1>
        <p className="text-muted-foreground mb-8">Find answers to common questions or get in touch with our support team</p>

        {/* Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Email Support</h3>
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Reach us via email</p>
            <a href="mailto:support@automax.ie" className="text-sm font-medium text-primary hover:underline">support@automax.ie</a>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Send a Message</h3>
              <MessageSquare className="w-5 h-5 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Submit a request and we'll get back to you</p>
            <button onClick={() => setShowContactForm(true)} className="text-sm text-primary hover:underline font-medium">
              Start a conversation
            </button>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="border-b border-border p-6">
            <h2 className="text-xl font-semibold text-foreground">Frequently Asked Questions</h2>
          </div>

          <div className="divide-y divide-border">
            {faqs.map((faq) => (
              <div key={faq.id} className="p-6 hover:bg-secondary/20 transition-colors">
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="flex items-center justify-between w-full text-left">
                  <h3 className="font-medium text-foreground pr-4">{faq.question}</h3>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-primary flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Help */}
        <div className="bg-primary/5 rounded-xl border border-primary/20 p-6 mt-8">
          <h3 className="font-semibold text-foreground mb-2">Still need help?</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Can't find what you're looking for? Our support team is ready to help. Contact us through any of the channels above and we'll get back to you within 24 hours.
          </p>
          <button onClick={() => setShowContactForm(true)} className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
            Contact Support
          </button>
        </div>
      </div>
      <ContactFormModal isOpen={showContactForm} onClose={() => setShowContactForm(false)} defaultReason="Support / Help" />
      <Footer />
    </div>
  );
}