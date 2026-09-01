import React from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { Link } from 'react-router-dom';

export default function ReviewsGallery() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Reviews Gallery</span>
        </div>
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-foreground mb-2">Customer Reviews</h1>
          <p className="text-muted-foreground">See what our customers say about AutoMax</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-10 text-center">
          <p className="text-foreground font-medium mb-1">No reviews yet</p>
          <p className="text-sm text-muted-foreground">Check back soon — reviews from real AutoMax users will appear here.</p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
