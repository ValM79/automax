import React, { Suspense, lazy, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Search, X } from 'lucide-react';
import BackButton from './BackButton';
import Navbar from './Navbar';
import Footer from './Footer';
import DealerLogo from './DealerLogo';
import { IRISH_COUNTIES } from '@/lib/counties';
import { openingStatus } from '@/lib/openingStatus';
import { SERVICE_CATEGORIES, SHOW_SERVICE_MAP } from '@/lib/serviceCategories';
import { useServiceProviders } from '@/hooks/useServiceProviders';

// The map (and its OpenStreetMap pictures) is only downloaded when a visitor asks for it.
const ServiceMap = lazy(() => import('./ServiceMap'));

const PAGE_SIZE = 10;
const fieldClass = 'h-11 rounded-lg border border-border bg-card px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40';

const isOpenNow = (p) => !!p.open_24_7 || !!openingStatus(p.opening_times)?.open;

function ServiceCard({ provider }) {
  const { id, name, county, area, services = [], open_24_7: all, opening_times: times, avatar_url: avatar } = provider;
  const place = [area, county].filter(Boolean).join(', ');
  const status = openingStatus(times);
  return (
    <Link to={`/service-business/${id}`} className="w-full rounded-lg bg-card border border-border shadow-sm p-5 flex gap-4 items-start hover:border-primary/50 hover:shadow-md transition">
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-foreground">{name}</h2>
        {place && <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1"><MapPin className="w-4 h-4 shrink-0" /> {place}</p>}
        {all ? (
          <p className="flex items-center gap-1.5 text-sm mt-1 text-foreground"><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" /> Open 24/7</p>
        ) : status && (
          <p className="flex items-center gap-1.5 text-sm mt-1 text-foreground"><span className={`w-2 h-2 rounded-full shrink-0 ${status.open ? 'bg-green-500' : 'bg-neutral-400'}`} /> {status.text}</p>
        )}
        {services.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {services.map((s) => <span key={s} className="text-xs px-2 py-1 rounded bg-white border border-border text-black">{s}</span>)}
          </div>
        )}
      </div>
      {avatar && <div className="shrink-0"><DealerLogo url={avatar} /></div>}
    </Link>
  );
}

// One directory page for a service category (Rent a Car, Recovery Service, HGV Repair & Servicing, Auto Repair & Servicing):
// search by name or town, county, service ticks, Open now and 24/7, and an optional map of the counties.
export default function ServiceDirectory({ category }) {
  const config = SERVICE_CATEGORIES[category];
  const providers = useServiceProviders(category);
  const [text, setText] = useState('');
  const [county, setCounty] = useState('');
  const [picked, setPicked] = useState([]);
  const [openNow, setOpenNow] = useState(false);
  const [all24, setAll24] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [page, setPage] = useState(1);

  const touch = (fn) => (...args) => { fn(...args); setPage(1); };
  const toggleService = touch((s) => setPicked((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s])));
  const anyFilter = !!(text || county || picked.length || openNow || all24);
  const clear = touch(() => { setText(''); setCounty(''); setPicked([]); setOpenNow(false); setAll24(false); });

  // Everything except the county: the map shows how many match per county, so picking a county must not empty the other circles.
  const beforeCounty = useMemo(() => {
    const q = text.trim().toLowerCase();
    return (providers || []).filter((p) => (
      (!q || p.name.toLowerCase().includes(q) || (p.area || '').toLowerCase().includes(q)) &&
      picked.every((s) => (p.services || []).includes(s)) &&
      (!openNow || isOpenNow(p)) &&
      (!all24 || p.open_24_7)
    ));
  }, [providers, text, picked, openNow, all24]);

  const counts = useMemo(() => beforeCounty.reduce((acc, p) => { if (p.county) acc[p.county] = (acc[p.county] || 0) + 1; return acc; }, {}), [beforeCounty]);
  const filtered = useMemo(() => beforeCounty.filter((p) => !county || p.county === county).sort((a, b) => a.name.localeCompare(b.name)), [beforeCounty, county]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const total = providers ? providers.length : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">{category}</span>
        </div>

        <h1 className="text-xl lg:text-2xl font-bold text-foreground mb-4 lg:mb-5">{category}</h1>

        {config.banner && (
          <div className="mb-6 rounded-xl overflow-hidden border border-border h-36 sm:h-44 bg-card">
            <img src={config.banner} alt="" className="w-full h-full object-cover" style={config.bannerPosition ? { objectPosition: config.bannerPosition } : undefined} />
          </div>
        )}

        {/* Search bar and filters */}
        <div className="bg-card border border-border rounded-lg p-4 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_14rem] gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={text}
                onChange={touch((e) => setText(e.target.value))}
                placeholder={config.placeholder}
                aria-label="Search by name or town"
                className={`${fieldClass} w-full pl-9`} />
            </div>
            <select value={county} onChange={touch((e) => setCounty(e.target.value))} className={fieldClass} aria-label="County">
              <option value="">All Ireland</option>
              {IRISH_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Services</p>
            <div className="flex flex-wrap gap-2">
              {config.services.map((s) => {
                const on = picked.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleService(s)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-secondary'}`}>
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4">
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={openNow} onChange={touch((e) => setOpenNow(e.target.checked))} className="w-4 h-4 accent-[hsl(var(--primary))]" />
              <Clock className="w-4 h-4 text-muted-foreground" /> Open now
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={all24} onChange={touch((e) => setAll24(e.target.checked))} className="w-4 h-4 accent-[hsl(var(--primary))]" />
              Open 24/7
            </label>
            {anyFilter && (
              <button type="button" onClick={clear} className="flex items-center gap-1 text-sm text-primary hover:underline ml-auto">
                <X className="w-4 h-4" /> Clear filters
              </button>
            )}
          </div>
        </div>

        {providers === null && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {providers && total === 0 && (
          <p className="text-muted-foreground text-sm mb-8">No {config.noun} listed yet.</p>
        )}

        {providers && total > 0 && (
          <>
            <div className="flex items-center justify-between gap-3 mb-4">
              <p className="text-sm font-semibold text-foreground">
                {filtered.length} {filtered.length === 1 ? 'result' : 'results'} in {county || 'All Ireland'}
              </p>
              {SHOW_SERVICE_MAP && (
                <button type="button" onClick={() => setShowMap((v) => !v)} className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-card text-sm text-foreground hover:bg-secondary">
                  <MapPin className="w-4 h-4" /> {showMap ? 'Hide map' : 'Show map'}
                </button>
              )}
            </div>

            <div className={showMap ? 'grid grid-cols-1 lg:grid-cols-[1fr_24rem] gap-6 items-start' : ''}>
              <div>
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground bg-card border border-border rounded-lg">
                    No {config.noun} match your search.
                    {anyFilter && <button type="button" onClick={clear} className="block mx-auto mt-2 text-primary hover:underline">Clear filters</button>}
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {shown.map((p) => <ServiceCard key={p.id} provider={p} />)}
                  </div>
                )}

                {pages > 1 && (
                  <div className="flex items-center justify-center gap-4 mt-8">
                    <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-foreground hover:bg-secondary disabled:opacity-40">Prev</button>
                    <span className="text-sm text-muted-foreground">Page {current} of {pages}</span>
                    <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-foreground hover:bg-secondary disabled:opacity-40">Next</button>
                  </div>
                )}
              </div>

              {SHOW_SERVICE_MAP && showMap && (
                <div className="lg:sticky lg:top-20 order-first lg:order-none">
                  <Suspense fallback={<div className="h-72 lg:h-[26rem] flex items-center justify-center text-sm text-muted-foreground">Loading map…</div>}>
                    <ServiceMap counts={counts} county={county} onPick={touch(setCounty)} />
                  </Suspense>
                  <p className="text-xs text-muted-foreground mt-2">Circles show how many match in each county. Click one to filter the list.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
