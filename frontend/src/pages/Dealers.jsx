import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Building2, Car } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { api } from '@/api/apiClient';
import { IRISH_COUNTIES } from '@/lib/counties';

const PAGE_SIZE = 10;
const BANNER = '/img/b29eb1163_generated_image.jpg'; // the banner the old New Cars page had

// The dealer's logo, square, at the right of the card. Falls back to a building icon if it fails to load.
function DealerLogo({ url }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  return (
    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg border border-border bg-white flex items-center justify-center overflow-hidden shrink-0">
      {url && !failed
        ? <img src={url} alt="" onError={() => setFailed(true)} className="w-full h-full object-contain" />
        : <Building2 className="w-1/2 h-1/2 text-muted-foreground" strokeWidth={1.5} />}
    </div>
  );
}

// One dealership card. A dealer can add a photo of the business (cover): it becomes the card background, under a light
// wash so the text, in the blue of the AutoMax logo, stays readable on any photo, bright or dark. A dealer with a logo gets the logo box at the right. No cover = plain white card,
// no logo = no logo box, so a dealer with neither still gets a clean card.
function DealerCard({ dealer, onClick, example = false }) {
  const { name, trusted, county, area, stock, sections, avatarUrl, coverUrl } = dealer;
  const [coverFailed, setCoverFailed] = useState(false);
  useEffect(() => { setCoverFailed(false); }, [coverUrl]);
  const onPhoto = !!coverUrl && !coverFailed;
  const place = [county, area].filter(Boolean).join(', ');
  const muted = onPhoto ? 'text-[#0850f8] font-light' : 'text-muted-foreground';
  const Root = onClick ? 'button' : 'div';
  return (
    <Root
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`relative overflow-hidden w-full text-left rounded-lg shadow-sm p-5 sm:p-6 flex items-start justify-between gap-4 bg-card ${onClick ? 'hover:shadow-md transition-shadow' : ''}`}>
      {onPhoto && (
        <>
          <img src={coverUrl} alt="" onError={() => setCoverFailed(true)} className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-white/20" />
        </>
      )}
      <div className="relative min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={`text-xl ${onPhoto ? 'font-light text-[#0850f8]' : 'font-semibold text-foreground'}`}>{name}</h2>
          {example && <span className={`text-xs uppercase tracking-wide px-2 py-0.5 rounded ${onPhoto ? 'font-light bg-[#0850f8]/10 text-[#0850f8]' : 'font-semibold bg-secondary text-muted-foreground'}`}>Example</span>}
        </div>
        {trusted && (
          <p className={`flex items-center gap-1.5 text-sm mt-2 ${muted}`}>
            <ShieldCheck className={`w-4 h-4 ${onPhoto ? 'text-[#0850f8]' : 'text-primary'}`} /> Verified Dealer
          </p>
        )}
        {place && <p className={`text-sm mt-2 ${muted}`}>{place}</p>}
        <p className={`text-sm ${place ? 'mt-1' : 'mt-2'} ${muted}`}>{stock === 0 ? 'No cars listed yet' : `${stock} ${stock === 1 ? 'car' : 'cars'} in stock`}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          {sections.map((t) => (
            <span key={t} className={`text-xs px-2 py-1 rounded ${onPhoto ? 'font-light bg-white/90 text-[#0850f8] border border-[#0850f8]/25' : 'bg-secondary text-foreground'}`}>{t}</span>
          ))}
        </div>
      </div>
      <div className="relative flex flex-col items-end gap-2 shrink-0">
        {(avatarUrl || example) && <DealerLogo url={avatarUrl} />}
        <span className={`text-xs ${onPhoto ? 'font-light text-[#0850f8] bg-white/90 px-2 py-0.5 rounded' : 'font-medium text-primary'}`}>See Showroom</span>
      </div>
    </Root>
  );
}

// One sample card, shown under "No dealerships here yet", so a dealer can see what their own card will look like:
// a photo of the business as the background and a logo box. Clearly marked Example; it opens an example dealer page.
// Real dealers replace it as soon as the first one has a live ad.
const EXAMPLE_DEALER = {
  name: 'Your Dealership Name', trusted: true, county: 'Dublin', area: 'Swords', stock: 12,
  sections: ['Cars For Sale', 'Dealership Cars', 'Commercials'], avatarUrl: '', coverUrl: '/img/927787060_generated_image.jpg',
};

// Dealers Garage: the directory of dealerships. The list comes from real Trader accounts that have at least one live ad,
// so it fills itself as dealers sign up and place ads.
export default function Dealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [dealerId, setDealerId] = useState('');
  const [county, setCounty] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    api.functions.invoke('listDealers', {})
      .then((res) => { if (alive) setDealers(res?.data?.dealers || []); })
      .catch(() => { if (alive) { setError('Could not load dealerships. Please try again in a moment.'); setDealers([]); } });
    return () => { alive = false; };
  }, []);

  const names = useMemo(() => [...(dealers || [])].sort((a, b) => a.name.localeCompare(b.name)), [dealers]);

  const filtered = useMemo(() => (dealers || []).filter((d) => (
    (!dealerId || d.id === dealerId) &&
    (!county || d.county === county)
  )), [dealers, dealerId, county]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const selectClass = 'w-full h-12 rounded-lg px-4 text-sm text-foreground bg-white focus:outline-none focus:ring-2 focus:ring-white/60';
  const pick = (setter) => (e) => { setter(e.target.value); setPage(1); };

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />

      {/* Banner with the title and filters over it */}
      <div className="relative">
        <img src={BANNER} alt="" className="absolute inset-0 w-full h-full object-cover object-[center_60%]" />
        <div className="absolute inset-0 bg-black/45" />
        <div className="relative max-w-6xl mx-auto px-4 pt-4 pb-8 text-white">
          <div className="flex items-center gap-2 text-sm text-white/80 mb-6">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <span>›</span>
            <span className="text-white">Dealers Garages</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center mb-5">Dealers Garages</h1>
          <div className="max-w-2xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={dealerId} onChange={pick(setDealerId)} className={selectClass} aria-label="Dealership">
              <option value="">Search Dealers</option>
              {names.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={county} onChange={pick(setCounty)} className={selectClass} aria-label="County">
              <option value="">All Ireland</option>
              {IRISH_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {dealers === null && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        )}

        {error && <p className="text-center text-sm text-red-600 py-8">{error}</p>}

        {dealers && !error && dealers.length === 0 && (
          <div className="bg-card rounded-lg shadow-sm p-10 text-center">
            <Car className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-lg font-semibold text-foreground mb-1">No dealerships here yet</p>
            <p className="text-sm text-muted-foreground">Are you a dealer? Sign up and list your stock to appear here.</p>
          </div>
        )}

        {dealers && !error && dealers.length === 0 && (
          <div className="flex flex-col gap-4 mt-4">
            <DealerCard dealer={EXAMPLE_DEALER} example onClick={() => navigate('/seller-ads/example')} />
          </div>
        )}

        {dealers && dealers.length > 0 && (
          <>
            <p className="text-sm font-semibold text-foreground mb-4">
              {filtered.length} dealership{filtered.length === 1 ? '' : 's'} in {county || 'All Ireland'}
            </p>

            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground bg-card rounded-lg shadow-sm">No dealerships match your search.</div>
            )}

            <div className="flex flex-col gap-4">
              {shown.map((d) => (
                <DealerCard
                  key={d.id}
                  dealer={{ name: d.name, trusted: d.trusted, county: d.county, area: d.area, stock: d.stock, sections: d.sections, avatarUrl: d.avatar_url, coverUrl: d.cover_url }}
                  onClick={() => navigate(`/seller-ads/${d.id}`)} />
              ))}
            </div>

            {pages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-foreground hover:bg-secondary disabled:opacity-40">Prev</button>
                <span className="text-sm text-muted-foreground">Page {current} of {pages}</span>
                <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className="h-10 px-4 rounded-lg bg-card border border-border text-sm text-foreground hover:bg-secondary disabled:opacity-40">Next</button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}
