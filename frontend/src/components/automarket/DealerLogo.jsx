import React, { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';

// A dealer without a logo of their own shows the AutoMax logo (on their card, their page and in their Profile).
export const DEALER_LOGO_PLACEHOLDER = '/img/39fe51366_automax512png.png';

// The dealer's logo: a white square box, the picture fitted inside it. If their picture cannot be loaded the AutoMax logo
// is shown, and if that fails too a building icon.
export default function DealerLogo({ url, className = 'w-16 h-16 sm:w-20 sm:h-20', bordered = true }) {
  const [step, setStep] = useState(0); // 0 their logo, 1 the AutoMax logo, 2 an icon
  useEffect(() => { setStep(0); }, [url]);
  const src = step === 0 && url ? url : step <= 1 ? DEALER_LOGO_PLACEHOLDER : null;
  return (
    <div className={`${className} rounded-lg ${bordered ? 'border border-border' : ''} bg-white flex items-center justify-center overflow-hidden shrink-0`}>
      {src
        ? <img src={src} alt="" onError={() => setStep((s) => (s === 0 && url ? 1 : 2))} className="w-full h-full object-contain" />
        : <Building2 className="w-1/2 h-1/2 text-muted-foreground" strokeWidth={1.5} />}
    </div>
  );
}
