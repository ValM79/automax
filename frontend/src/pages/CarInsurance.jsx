import React, { useState } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, ShieldCheck, Truck, Search } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';

export default function CarInsurance() {
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Recovery Service</span>
        </div>

        {/* Mobile: Title */}
        <h1 className="lg:hidden text-xl font-bold text-foreground mb-3">Recovery Service</h1>

        {/* Desktop: Title */}
        <h1 className="hidden lg:block text-2xl font-bold text-foreground whitespace-nowrap mb-5">Recovery Service</h1>

        {/* Banner */}
        <div className="mb-6 rounded-xl overflow-hidden border border-border h-36 sm:h-44 bg-card">
          <img
            src="/img/0babdc7b0_generated_image.jpg"
            alt="Recovery Service Banner"
            className="w-full h-full object-cover" />
        </div>

        {/* Mobile: Search + help text */}
        <div className="lg:hidden mb-5">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recovery services"
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-border" />
          </div>
          <p className="text-foreground text-base text-center">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        {/* Desktop: Search + help text */}
        <div className="hidden lg:flex items-center gap-8 mb-5">
          <div className="relative flex-1 max-w-[35%]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search recovery services"
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-foreground outline-none" />
          </div>
          <p className="text-foreground text-base flex-1 text-right">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        {/* Info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">24/7 Availability</p>
              <p className="text-xs text-muted-foreground">Round-the-clock assistance</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Truck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Nationwide Coverage</p>
              <p className="text-xs text-muted-foreground">All counties in Ireland</p>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Fully Insured</p>
              <p className="text-xs text-muted-foreground">Certified & insured operators</p>
            </div>
          </div>
        </div>

      </div>

      <Footer />
    </div>
  );
}