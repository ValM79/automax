import React, { useState, useEffect } from 'react';

// The dealer's logo: a square box with the picture fitted inside it. A dealer who has not added a logo (or whose picture
// cannot be loaded) shows a plain light grey box, on their card, their page and in their Profile.
export default function DealerLogo({ url, className = 'w-16 h-16 sm:w-20 sm:h-20', bordered = true }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [url]);
  const showPicture = !!url && !failed;
  return (
    <div className={`${className} rounded-lg ${bordered ? 'border border-border' : ''} ${showPicture ? 'bg-white' : 'bg-secondary'} flex items-center justify-center overflow-hidden shrink-0`}>
      {showPicture && <img src={url} alt="" onError={() => setFailed(true)} className="w-full h-full object-contain" />}
    </div>
  );
}
