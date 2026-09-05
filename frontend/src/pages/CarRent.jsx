import React, { useState } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';

export default function CarRent() {
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
          <span className="text-foreground font-medium">Rent a Car</span>
        </div>

        {/* Mobile: Title */}
        <h1 className="lg:hidden text-xl font-bold text-foreground mb-3">Rent a Car</h1>

        {/* Desktop: Title */}
        <h1 className="hidden lg:block text-2xl font-bold text-foreground whitespace-nowrap mb-5">Rent a Car</h1>

        {/* Banner */}
        <div className="mb-6 rounded-xl overflow-hidden border border-border h-36 sm:h-44 bg-card">
          <img
            src="/img/12a53ea6f_generated_image.jpg"
            alt="Car Rental Banner"
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
              placeholder="Search car rentals"
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
              placeholder="Search car rentals"
              className="w-full bg-card rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none border border-foreground outline-none" />
          </div>
          <p className="text-foreground text-base flex-1 text-right">Help us to improve this site: <a href="mailto:Info@automax.ie" className="text-primary hover:underline">Info@automax.ie</a></p>
        </div>

        <p className="text-sm text-muted-foreground py-8 text-center">No car rental listings found. Be the first to list your car rental.</p>
      </div>

      <Footer />
    </div>
  );
}