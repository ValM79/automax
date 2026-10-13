import React from 'react';
import { User, Building2 } from 'lucide-react';

// The round profile badge: the person's photo (or the trader's logo) when there is one, otherwise a black icon
// on light grey. Used on the Profile page and on the ad page seller card so they always look the same.
export default function AvatarBadge({ url, isTrader = false, className = 'w-12 h-12' }) {
  const Icon = isTrader ? Building2 : User;
  return (
    <div className={`${className} rounded-full bg-secondary text-foreground flex items-center justify-center shrink-0 overflow-hidden`}>
      {url
        ? <img src={url} alt="" className="w-full h-full object-cover" />
        : <Icon className="w-1/2 h-1/2" />}
    </div>
  );
}
