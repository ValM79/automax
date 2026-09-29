import React from 'react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { Link } from 'react-router-dom';

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">About Us</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-6">About AutoMax</h1>
        <div className="prose max-w-none space-y-6 text-muted-foreground">
          <p className="text-lg leading-relaxed">AutoMax is a new online vehicle marketplace built for Ireland, launched in 2026. Whether you're buying your first car, selling a motorbike, or listing a van for the business, we wanted a simple, modern place to do it — no clutter, no confusing pricing.</p>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-3">Our Mission</h2>
            <p>We're building AutoMax to make buying and selling any vehicle in Ireland as easy as it should be: post an ad in minutes, reach real buyers directly, and pay a fair, transparent listing fee — nothing hidden, nothing complicated.</p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-3">What We Offer</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Listings across cars, motorbikes, vans, trucks, campers, boats, and more</li>
              <li>Simple, affordable ad packages with no surprise fees</li>
              <li>Direct messaging between buyers and sellers — no middleman</li>
              <li>A clean, fast site that works just as well on your phone as your laptop</li>
            </ul>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-3">Who's Behind It</h2>
            <p>AutoMax is founder-led and based in Dublin. We're just getting started, and every piece of feedback shapes what we build next — if something's not working for you, tell us and we'll fix it.</p>
          </div>
        </div>
      </div>
      <Footer />
    </div>);

}