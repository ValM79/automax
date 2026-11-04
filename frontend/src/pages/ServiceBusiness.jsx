import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ExternalLink, Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import BackButton from '../components/automarket/BackButton';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import DealerLogo from '../components/automarket/DealerLogo';
import { DAY_KEYS } from '@/lib/openingHours';
import { openingStatus } from '@/lib/openingStatus';
import { whatsappLink } from '@/lib/contactWays';
import { SERVICE_CATEGORIES } from '@/lib/serviceCategories';
import { useServiceProvider } from '@/hooks/useServiceProvider';

const buttonClass = 'w-full h-11 border border-primary text-primary bg-card rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors';

// The page of one listed Service Business (opened from a card in its category's directory): who they are, what they do,
// when they are open, and the ways they chose to be contacted on their Profile.
export default function ServiceBusiness() {
  const { id } = useParams();
  const { provider, state } = useServiceProvider(id);
  const [phoneShown, setPhoneShown] = useState(false);

  const config = provider ? SERVICE_CATEGORIES[provider.category] : null;
  const crumb = (last) => (
    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
      <BackButton />
      <span>›</span>
      <Link to="/" className="hover:text-primary transition-colors">Home</Link>
      {config && (<><span>›</span><Link to={config.path} className="hover:text-primary transition-colors">{provider.category}</Link></>)}
      <span>›</span>
      <span className="text-foreground font-medium truncate">{last}</span>
    </div>
  );

  if (state !== 'ready') {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
          {crumb('Business')}
          {state === 'loading'
            ? <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
            : (
              <div className="text-center py-16 bg-card border border-border rounded-lg">
                <h1 className="text-lg font-semibold text-foreground mb-2">This business is not listed</h1>
                <p className="text-sm text-muted-foreground mb-4">It may no longer be listed on AutoMax.</p>
                <Link to="/" className="text-primary hover:underline text-sm">Back to home</Link>
              </div>
            )}
        </div>
        <Footer />
      </div>
    );
  }

  const { name, county, area, about, services, open_24_7: all, opening_times: times, avatar_url: avatar, website, phone, whatsapp, email } = provider;
  const place = [area, county].filter(Boolean).join(', ');
  const status = openingStatus(times);
  const waLink = whatsapp ? whatsappLink(whatsapp, `Hello ${name}, I found you on AutoMax.`) : null;
  const hasContact = !!(phone || waLink || email || website);
  const hours = DAY_KEYS.filter(([key]) => times && times[key]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl w-full mx-auto px-4 py-6">
        {crumb(name)}

        <div className="bg-card border border-border rounded-xl shadow-sm p-5 sm:p-6 flex gap-4 items-start">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-1">{provider.category}</p>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground break-words">{name}</h1>
            {place && <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1.5"><MapPin className="w-4 h-4 shrink-0" /> {place}</p>}
            {all ? (
              <p className="flex items-center gap-1.5 text-sm mt-1.5 text-foreground"><span className="w-2 h-2 rounded-full bg-green-500 shrink-0" /> Open 24/7</p>
            ) : status && (
              <p className="flex items-center gap-1.5 text-sm mt-1.5 text-foreground"><span className={`w-2 h-2 rounded-full shrink-0 ${status.open ? 'bg-green-500' : 'bg-neutral-400'}`} /> {status.text}</p>
            )}
          </div>
          {avatar && <div className="shrink-0"><DealerLogo url={avatar} className="w-20 h-20" /></div>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_16rem] gap-5 mt-5 items-start">
          <div className="space-y-5">
            {about && (
              <section className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-bold text-foreground mb-2">About</h2>
                <p className="text-sm text-foreground whitespace-pre-line break-words">{about}</p>
              </section>
            )}
            {services.length > 0 && (
              <section className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-bold text-foreground mb-3">Services</h2>
                <div className="flex flex-wrap gap-2">
                  {services.map((s) => <span key={s} className="text-sm px-3 py-1 rounded-full bg-white border border-border text-black">{s}</span>)}
                </div>
              </section>
            )}
            {(all || hours.length > 0) && (
              <section className="bg-card border border-border rounded-xl p-5">
                <h2 className="text-base font-bold text-foreground mb-3">Opening hours</h2>
                {all ? <p className="text-sm text-foreground">Open 24 hours a day, 7 days a week.</p> : (
                  <dl className="text-sm space-y-1.5">
                    {hours.map(([key, label]) => (
                      <div key={key} className="flex justify-between gap-4"><dt className="text-muted-foreground">{label}</dt><dd className="text-foreground">{times[key]}</dd></div>
                    ))}
                  </dl>
                )}
              </section>
            )}
          </div>

          {hasContact && (
            <section className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-base font-bold text-foreground mb-3">Contact</h2>
              <div className="flex flex-col gap-2.5">
                {phone && (
                  <button type="button" onClick={() => setPhoneShown(true)} className={buttonClass}>
                    <Phone className="w-4 h-4" /> {phoneShown ? phone : 'Show phone number'}
                  </button>
                )}
                {waLink && <a href={waLink} target="_blank" rel="noopener noreferrer" className={buttonClass}><MessageCircle className="w-4 h-4" /> WhatsApp</a>}
                {email && <a href={`mailto:${email}`} className={buttonClass}><Mail className="w-4 h-4" /> Email</a>}
                {website && <a href={website} target="_blank" rel="noopener noreferrer nofollow" className={buttonClass}><ExternalLink className="w-4 h-4" /> View Website</a>}
              </div>
            </section>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
