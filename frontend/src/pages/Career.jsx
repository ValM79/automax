import React from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { Link } from 'react-router-dom';

export default function Career() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Careers</span>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-3">Join Our Team</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">AutoMax is brand new and currently run by a small, founder-led team based in Dublin. We're not actively hiring right now, but that'll change as AutoMax grows.</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 text-center">
          <p className="text-muted-foreground">If you're passionate about cars, marketplaces, or building great products and want to be first in line when we do start hiring, send your CV to <a href="mailto:careers@automax.ie" className="text-primary hover:underline">careers@automax.ie</a> — we'd love to hear from you.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}