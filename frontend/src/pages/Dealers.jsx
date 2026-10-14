import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Car, ShieldCheck, Search } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import AvatarBadge from '../components/automarket/AvatarBadge';
import { api } from '@/api/apiClient';
import { IRISH_COUNTIES } from '@/lib/counties';

const PAGE_SIZE = 10;

// Dealers Garage: the directory of dealerships. The list comes from real Trader accounts that have at least one live ad,
// so it fills itself as dealers sign up and place ads.
export default function Dealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [county, setCounty] = useState('');
  const [section, setSection] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    api.functions.invoke('listDealers', {})
      .then((res) => { if (alive) setDealers(res?.data?.dealers || []); })
      .catch(() => { if (alive) { setError('Could not load dealerships. Please try again in a moment.'); setDealers([]); } });
    return () => { alive = false; };
  }, []);

  const sections = useMemo(() => [...new Set((dealers || []).flatMap((d) => d.sections))].sort((a, b) => (a === 'Cars' ? -1 : b === 'Cars' ? 1 : a.localeCompare(b))), [dealers]);

  const filtered = useMemo(() => (dealers || []).filter((d) => (
    (!name || d.name.toLowerCase().includes(name.trim().toLowerCase())) &&
    (!county || d.county === county) &&
    (!section || d.sections.includes(section))
  )), [dealers, name, county, section]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const selectClass = 'w-full h-11 border border-border rounded-lg px-3 text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary';
  const reset = () => { setName(''); setCounty(''); setSection(''); setPage(1); };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Dealers Garage</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground">Dealers Garage</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-5">Find dealerships across Ireland and browse their stock.</p>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setPage(1); }}
              placeholder="Search dealerships"
              className="w-full h-11 border border-border rounded-lg pl-9 pr-3 text-sm text-foreground bg-card focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <select value={county} onChange={(e) => { setCounty(e.target.value); setPage(1); }} className={selectClass} aria-label="County">
            <option value="">All Ireland</option>
            {IRISH_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={section} onChange={(e) => { setSection(e.target.value); setPage(1); }} className={selectClass} aria-label="Section">
            <option value="">All sections</option>
            {sections.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {dealers === null && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {error && <p className="text-center text-sm text-red-600 py-8">{error}</p>}

        {dealers && !error && dealers.length === 0 && (
          <div className="bg-card rounded-xl border border-border p-10 text-center">
            <Car className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-semibold text-foreground mb-1">No dealerships here yet</p>
            <p className="text-sm text-muted-foreground mb-5">Are you a dealer? Create a Trader account and list your stock to appear here.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/create-account" className="h-11 px-6 inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors">Create a Trader account</Link>
              <Link to="/dealers-information" className="h-11 px-6 inline-flex items-center justify-center rounded-lg border border-primary text-primary font-medium text-sm hover:bg-primary/5 transition-colors">Dealers information</Link>
            </div>
          </div>
        )}

        {dealers && dealers.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-foreground font-medium">
                {filtered.length} dealership{filtered.length === 1 ? '' : 's'} in {county || 'All Ireland'}
              </p>
              {(name || county || section) && <button type="button" onClick={reset} className="text-sm text-primary hover:underline">Reset search</button>}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-xl border border-border">No dealerships match your search.</div>
            )}

            <div className="flex flex-col gap-3">
              {shown.map((d) => (
                <div key={d.id} className="bg-card rounded-xl border border-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                  <AvatarBadge url={d.avatar_url} isTrader className="w-16 h-16" />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold text-foreground truncate">{d.name}</h2>
                    {d.trusted && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5" /> Trusted Dealer
                      </span>
                    )}
                    {(d.county || d.area) && (
                      <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" /> {[d.county, d.area].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <p className="flex items-center gap-1 text-sm text-foreground mt-1">
                      <Car className="w-3.5 h-3.5 flex-shrink-0" /> Stock: {d.stock}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {d.sections.map((s) => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full border border-border text-muted-foreground">{s}</span>
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/seller-ads/${d.id}`)}
                    className="sm:w-40 h-11 border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary/5 transition-colors flex-shrink-0">
                    See Showroom
                  </button>
                </div>
              ))}
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-secondary disabled:opacity-40">Prev</button>
                <span className="text-sm text-muted-foreground">Page {current} of {pages}</span>
                <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className="h-10 px-4 rounded-lg border border-border text-sm text-foreground hover:bg-secondary disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
