import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { AlertCircle, CheckCircle2, Clock, Store } from 'lucide-react';
import { api } from '@/api/apiClient';
import { DAY_KEYS, normalizeTime } from '@/lib/openingHours';
import { normalizeWebsite } from '@/lib/website';
import { SERVICE_CATEGORIES, LISTING_PERIODS, euro } from '@/lib/serviceCategories';

const hasCategory = (c) => Object.prototype.hasOwnProperty.call(SERVICE_CATEGORIES, c);
const longDate = (iso) => new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' });
const inputClass = 'w-full px-3 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground';

// "Your Business Listing" on the Profile page of a Service Business account: the details shown in its category's directory
// (category, services, 24/7, opening hours, description), and the paid listing period. County, area, phone and logo are
// the ordinary profile fields further down the page. The listing shows in the directory once the name, category and county
// are saved and a period is paid for (see backend/lambda/_lib/serviceListing.mjs).
export default function ServiceListingPanel({ user, refreshUser }) {
  const saved = {
    category: hasCategory(user.service_category) ? user.service_category : '',
    services: Array.isArray(user.service_list) ? user.service_list : [],
    all24: user.open_24_7 === true,
    times: user.opening_times && typeof user.opening_times === 'object' ? user.opening_times : {},
    about: user.about || '',
    website: user.website || '',
  };
  const snapshot = JSON.stringify(saved);
  const [form, setForm] = useState(saved);
  const [timeErrors, setTimeErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null); // { ok, text }
  const [months, setMonths] = useState(null);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState('');
  const [returned, setReturned] = useState('');

  // Start again from what is saved whenever the saved values change (not on every refresh of the profile, so typing is not lost)
  useEffect(() => { setForm(JSON.parse(snapshot)); }, [snapshot]);

  // Back from Stripe: the payment is confirmed by Stripe's message to our server a moment later, so look again a few times
  useEffect(() => {
    const result = new URLSearchParams(window.location.search).get('listing');
    if (result !== 'paid' && result !== 'cancelled') return undefined;
    setReturned(result);
    window.history.replaceState(null, '', window.location.pathname);
    if (result !== 'paid') return undefined;
    const timers = [3000, 8000, 15000].map((ms) => setTimeout(() => { refreshUser(); }, ms));
    return () => timers.forEach(clearTimeout);
  }, []);

  const listedUntil = Date.parse(user.listed_until || '');
  const active = Number.isFinite(listedUntil) && listedUntil > Date.now();
  const missing = [];
  if (!String(user.business_name || '').trim()) missing.push('your business name (Business Details)');
  if (!saved.category) missing.push('a category (below)');
  if (!user.county) missing.push('your county (Business Details)');
  const dirty = JSON.stringify(form) !== snapshot;
  const category = hasCategory(form.category) ? SERVICE_CATEGORIES[form.category] : null;

  const setTime = (key, value) => setForm((f) => ({ ...f, times: { ...f.times, [key]: value } }));
  const tidyTime = (key) => {
    const n = normalizeTime(form.times[key]);
    setTimeErrors((e) => ({ ...e, [key]: n === null }));
    if (n !== null) setTime(key, n);
  };
  const chooseCategory = (name) => setForm((f) => (f.category === name ? f : { ...f, category: name, services: [] }));
  const toggleService = (s) => setForm((f) => ({ ...f, services: f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s] }));

  const save = async () => {
    setSaveMsg(null);
    const times = {};
    const errors = {};
    for (const [key] of DAY_KEYS) {
      const n = normalizeTime(form.times[key]);
      if (n === null) errors[key] = true; else if (n) times[key] = n;
    }
    setTimeErrors(errors);
    if (Object.keys(errors).length) {
      setSaveMsg({ ok: false, text: 'Opening hours: write each time like 09:00 - 18:00, or type Closed.' });
      return;
    }
    const website = normalizeWebsite(form.website);
    if (website === null) {
      setSaveMsg({ ok: false, text: 'Website: please enter your website address, for example www.yourcompany.ie.' });
      return;
    }
    setSaving(true);
    try {
      await api.auth.updateMe({
        service_category: form.category,
        service_list: form.services,
        open_24_7: form.all24,
        opening_times: times,
        about: form.about,
        website,
      });
      await refreshUser();
      setSaveMsg({ ok: true, text: 'Listing details saved.' });
    } catch (e) {
      setSaveMsg({ ok: false, text: e?.message || 'Could not save your listing. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const pay = async () => {
    setPayError('');
    setPayBusy(true);
    try {
      const res = await api.functions.invoke('createServiceCheckout', { months });
      if (res?.data?.url) window.location.href = res.data.url;
      else setPayError('Could not start the payment. Please try again.');
    } catch (e) {
      setPayError(e?.message || 'Could not start the payment. Please try again.');
    } finally {
      setPayBusy(false);
    }
  };

  // The paid listing is bought with a card on the website; the iPhone app has no purchase for it yet, so it shows no payment there.
  const canBuy = Capacitor.getPlatform() !== 'ios';

  return (
    <section className="bg-card rounded-xl border border-border p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-5">
        <Store className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground">Your Business Listing</h2>
      </div>

      {returned === 'paid' && (
        <div className="mb-4 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 text-sm text-primary">Thank you. Your payment is being confirmed, your listing will appear in a moment.</div>
      )}
      {returned === 'cancelled' && (
        <div className="mb-4 bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground">Payment cancelled. You have not been charged.</div>
      )}

      {/* Status */}
      {user.service_hidden === true ? (
        <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Your listing has been hidden by AutoMax. Please contact support.</span>
        </div>
      ) : active ? (
        <div className="mb-5 flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{missing.length ? 'Paid until' : `Listed in ${saved.category} until`} <strong>{longDate(user.listed_until)}</strong>.{missing.length ? ` It shows once you add ${missing.join(' and ')}.` : ''}</span>
        </div>
      ) : (
        <div className="mb-5 flex items-start gap-2 bg-secondary border border-border rounded-lg px-4 py-3 text-sm text-foreground">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
          <span>
            {Number.isFinite(listedUntil) ? `Your listing ended on ${longDate(user.listed_until)}. ` : 'Not listed yet. '}
            Your business shows in its category once the details are complete and a listing period is paid for.
            {missing.length > 0 && <> Still needed: {missing.join(', ')}.</>}
          </span>
        </div>
      )}

      <div className="space-y-5">
        {/* Category */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Category</label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category">
            {Object.keys(SERVICE_CATEGORIES).map((name) => {
              const on = form.category === name;
              return (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => chooseCategory(name)}
                  className={`text-sm px-3 py-2 rounded-lg border transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-secondary'}`}>
                  {name}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">One category per account. A business that does two things needs a second account.</p>
        </div>

        {/* Services */}
        {category && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Services you offer</label>
            <div className="flex flex-wrap gap-2">
              {category.services.map((s) => {
                const on = form.services.includes(s);
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
            <p className="text-xs text-muted-foreground">Customers can filter the directory by these.</p>
          </div>
        )}

        {/* Opening hours */}
        <div className="space-y-2">
          <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /><label className="text-sm font-medium text-foreground">Opening hours</label></div>
          <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
            <input type="checkbox" checked={form.all24} onChange={(e) => setForm((f) => ({ ...f, all24: e.target.checked }))} className="w-4 h-4 accent-primary cursor-pointer" />
            Open 24/7
          </label>
          {!form.all24 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">For each day type your hours like 09:00 - 18:00, or press Closed. A day you leave empty is not shown.</p>
              {DAY_KEYS.map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="w-28 sm:w-32 shrink-0 text-sm font-medium text-foreground">{label}</span>
                  <input
                    type="text"
                    value={form.times[key] || ''}
                    onChange={(e) => setTime(key, e.target.value)}
                    onBlur={() => tidyTime(key)}
                    maxLength={20}
                    placeholder="09:00 - 18:00"
                    aria-label={`${label} opening hours`}
                    className={`${inputClass} flex-1 min-w-0 sm:flex-none sm:w-44 h-10 ${timeErrors[key] ? 'border-red-500' : ''}`} />
                  <button type="button" onClick={() => { setTime(key, 'Closed'); setTimeErrors((e) => ({ ...e, [key]: false })); }} className="text-xs font-medium text-primary hover:underline shrink-0">Closed</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground" htmlFor="service-about">About your business</label>
          <textarea
            id="service-about"
            value={form.about}
            onChange={(e) => setForm((f) => ({ ...f, about: e.target.value }))}
            maxLength={500}
            rows={4}
            placeholder="What you do, areas you cover, how long you have been in business"
            className={`${inputClass} py-2 resize-y`} />
          <p className="text-xs text-muted-foreground">{form.about.length}/500. Your county, area, phone and logo are in Business Details below.</p>
        </div>

        {/* Website */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground" htmlFor="service-website">Link your Website (optional)</label>
          <input
            id="service-website"
            type="text"
            inputMode="url"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            onBlur={() => { const n = normalizeWebsite(form.website); if (n) setForm((f) => ({ ...f, website: n })); }}
            maxLength={200}
            placeholder="www.yourcompany.ie"
            className={`${inputClass} h-10 ${normalizeWebsite(form.website) === null ? 'border-red-500' : ''}`} />
          <p className="text-xs text-muted-foreground">Shown as a View Website link on your business page.</p>
        </div>

        {saveMsg && (
          <div className={`rounded-lg px-4 py-3 text-sm border ${saveMsg.ok ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-red-50 border-red-200 text-red-700'}`}>{saveMsg.text}</div>
        )}
        <button
          type="button"
          onClick={save}
          disabled={saving || !dirty}
          className="w-full sm:w-auto sm:px-8 bg-primary text-primary-foreground h-11 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-60">
          {saving ? 'Saving...' : 'Save listing details'}
        </button>

        {/* Paid listing */}
        {canBuy && (
          <div className="border-t border-border pt-5 space-y-3">
            <h3 className="text-base font-bold text-foreground">{active ? 'Extend your listing' : 'List your business'}</h3>
            <p className="text-xs text-muted-foreground">
              One payment by card, no subscription.{active ? ' The months you buy are added to the end of your current listing.' : ' Your listing starts as soon as the payment is confirmed.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup" aria-label="Listing period">
              {LISTING_PERIODS.map((p) => {
                const on = months === p.months;
                return (
                  <button
                    key={p.months}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setMonths(p.months)}
                    className={`rounded-lg border px-3 py-3 text-center transition-colors ${on ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-secondary'}`}>
                    <span className="block text-sm font-semibold">{p.months} {p.months === 1 ? 'month' : 'months'}</span>
                    <span className="block text-sm">{euro(p.cents)}</span>
                  </button>
                );
              })}
            </div>
            {payError && <div className="rounded-lg px-4 py-3 text-sm border bg-red-50 border-red-200 text-red-700">{payError}</div>}
            {(missing.length > 0 || dirty) && (
              <p className="text-xs text-muted-foreground">
                {missing.length > 0 ? `Before you pay, add ${missing.join(' and ')}, and save.` : 'Save your listing details first.'}
              </p>
            )}
            <button
              type="button"
              onClick={pay}
              disabled={!months || payBusy || missing.length > 0 || dirty}
              className="w-full sm:w-auto sm:px-8 bg-primary text-primary-foreground h-11 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-60">
              {payBusy ? 'Redirecting to payment...' : months ? `Pay ${euro(LISTING_PERIODS.find((p) => p.months === months).cents)} by card` : 'Choose a listing period'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
