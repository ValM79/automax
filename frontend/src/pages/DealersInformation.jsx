import React from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { Link } from 'react-router-dom';

export default function DealersInformation() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Dealers information</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Dealers information</h1>
        <p className="text-muted-foreground">Information for dealers will be added here soon.</p>
      </div>
      <Footer />
    </div>
  );
}
