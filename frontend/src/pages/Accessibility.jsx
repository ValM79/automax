import React from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { Link } from 'react-router-dom';

export default function Accessibility() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Accessibility</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Accessibility Statement</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 2026</p>
        <div className="space-y-6">
          {[
            { title: 'Our Commitment', text: 'AutoMax is committed to ensuring digital accessibility for people with disabilities. We continually improve the user experience for everyone and apply relevant accessibility standards.' },
            { title: 'Conformance Status', text: 'We aim to meet the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA. Where we fall short, we are actively working to resolve issues.' },
            { title: 'Technical Accessibility Features', text: 'Our platform supports keyboard navigation throughout; all images include descriptive alt text; colour contrast meets WCAG AA standards; forms include clear labels and error messages; the site is fully responsive for mobile and tablet devices.' },
            { title: 'Known Limitations', text: 'Some older PDF documents and third-party embedded content may not fully meet accessibility standards. We are working to address these progressively.' },
            { title: 'Feedback and Contact', content: <>We welcome your feedback on the accessibility of AutoMax. If you experience any barriers, please contact us at <a href="mailto:accessibility@automax.ie" className="text-primary hover:underline">accessibility@automax.ie</a>. We aim to respond within 2 business days.</> },
            { title: 'Formal Complaints', text: 'If you are not satisfied with our response, you may contact the Irish Human Rights and Equality Commission (IHREC) at ihrec.ie.' },
          ].map((s, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground mb-2">{s.title}</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.content || s.text}</p>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}