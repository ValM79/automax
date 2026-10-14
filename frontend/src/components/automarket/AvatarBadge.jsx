import React, { useState, useEffect } from 'react';
import { User, Building2 } from 'lucide-react';

// The round profile badge: the person's photo (or the trader's logo) when there is one, otherwise a black icon
// on light grey. Used on the Profile page, the ad page seller card and the dealer directory so they always look
// the same. If a picture cannot be loaded, the icon is shown instead of a broken image.
export default function AvatarBadge({ url, isTrader = false, className = 'w-12 h-12' }) {
  const Icon = isTrader ? Building2 : User;
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  return (
    <div className={`${className} rounded-full bg-secondary text-foreground flex items-center justify-center shrink-0 overflow-hidden`}>
      {url && !failed
        ? <img src={url} alt="" onError={() => setFailed(true)} className="w-full h-full object-cover" />
        : <Icon className="w-1/2 h-1/2" />}
    </div>
  );
}
