import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Phone, MessageSquare, MessageCircle, Mail, ExternalLink, Star } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import BackButton from '../components/automarket/BackButton';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';

// A Dealer's own numbers: how many visited their dealer page and used its buttons, and how many messages and reviews came in.
// The counters come from the dealerStats function (totals per day only, nothing about who visited).
const CARDS = [
  ['views', 'Page views', 'Times your dealer page was opened', Eye],
  ['phone', 'Phone number shown', 'Buyers who pressed Show phone number', Phone],
  ['messages', 'Messages received', 'About your ads or from your page', MessageSquare],
  ['whatsapp', 'WhatsApp opened', 'Buyers who pressed WhatsApp', MessageCircle],
  ['email', 'Email opened', 'Buyers who pressed Email', Mail],
  ['website', 'Website visits', 'Buyers who pressed View Website', ExternalLink],
];

function Chart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.views));
  const label = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });
  return (
    <div>
      <div className="flex items-end gap-[3px] h-40" role="img" aria-label="Page views per day">
        {days.map((d) => (
          <div key={d.day} className="flex-1 min-w-0 h-full flex items-end" title={`${label(d.day)}: ${d.views} view${d.views === 1 ? '' : 's'}`}>
            <div className={`w-full rounded-t ${d.views ? 'bg-primary' : 'bg-border'}`} style={{ height: d.views ? `${Math.max(4, (d.views / max) * 100)}%` : '2px' }} />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2">
        <span>{label(days[0].day)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

export default function DealerStats() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const isDealer = user?.seller_type === 'dealer';

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) { navigate('/login?next=%2Fdealer-stats', { replace: true }); return; }
    if (!isDealer) return;
    let alive = true;
    api.functions.invoke('dealerStats', { action: 'get' })
      .then((res) => { if (alive) setData(res.data); })
      .catch((e) => { if (alive) setError(e?.message || 'Could not load your stats.'); });
    return () => { alive = false; };
  }, [isLoadingAuth, user, isDealer, navigate]);

  const totals = data ? (period === 7 ? data.last7 : data.last30) : null;
  const days = data ? data.days.slice(-period) : [];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Dealer Stats</span>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dealer Stats</h1>
            <p className="text-sm text-muted-foreground mt-1">How buyers use your dealer page.</p>
          </div>
          <div className="inline-flex rounded-lg border border-border overflow-hidden" role="tablist" aria-label="Period">
            {[7, 30].map((p) => (
              <button
                key={p}
                type="button"
                role="tab"
                aria-selected={period === p}
                onClick={() => setPeriod(p)}
                className={`px-4 h-9 text-sm font-medium transition-colors ${period === p ? 'bg-foreground text-background' : 'bg-card text-foreground hover:bg-secondary'}`}>
                Last {p} days
              </button>
            ))}
          </div>
        </div>

        {!isLoadingAuth && user && !isDealer && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-foreground">Dealer Stats are for Dealer accounts.</div>
        )}

        {error && <div className="bg-card border border-border rounded-2xl p-8 text-center text-sm text-red-600">{error}</div>}

        {isDealer && !data && !error && (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" /></div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {CARDS.map(([key, title, hint, Icon]) => (
                <div key={key} className="bg-card border border-border rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="w-4 h-4" /> {title}</div>
                  <p className="text-3xl font-bold text-foreground mt-2">{totals[key].toLocaleString('en-IE')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                </div>
              ))}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 mb-6">
              <h2 className="text-base font-bold text-foreground mb-4">Page views per day</h2>
              <Chart days={days} />
            </div>

            <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                {data.reviews.count > 0
                  ? <p className="text-sm text-foreground"><span className="font-bold">{data.reviews.average.toFixed(1)}</span> from {data.reviews.count} review{data.reviews.count === 1 ? '' : 's'}</p>
                  : <p className="text-sm text-foreground">No reviews yet</p>}
              </div>
              <Link to={`/seller-ads/${user.id}`} className="text-sm font-medium text-primary hover:underline">View my dealer page</Link>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Counting started on the day this page was introduced, so earlier visits are not included. A visit is counted once for each browsing session, and your own visits are not counted. Only totals are kept, never who visited.
              Messages are counted when they are sent to you, from your ads and from your dealer page.
            </p>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
