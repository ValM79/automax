import React, { useState } from 'react';
import { MessageSquare, Phone, Eye } from 'lucide-react';

export default function SellerCard({ seller, onSendMessage, onViewAllAds, isOwnAd = false, onManage }) {
  const name = seller?.name || 'Private Seller';
  const location = seller?.location || '';
  const phone = seller?.phone || '';
  const [phoneRevealed, setPhoneRevealed] = useState(false);

  return (
    <div className="p-4">
      <div className="mb-3">
        {location && <p className="font-semibold text-foreground text-base truncate">{location}</p>}
        <h3 className="font-semibold text-foreground text-base truncate">{name}</h3>
      </div>

      {/* You can't message or call yourself, so your own ad gets management actions instead. */}
      {isOwnAd ? (
        <div className="flex flex-col gap-2 items-start max-w-xs">
          <p className="text-sm text-muted-foreground mb-1">This is your ad.</p>
          <button
            onClick={onManage}
            className="w-full text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2e59d9' }}>
            Manage your ads
          </button>
          <button
            onClick={onViewAllAds}
            className="w-full text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2e59d9' }}>
            <Eye className="w-4 h-4" /> View all ads
          </button>
        </div>
      ) : (
      /* Action buttons - equal length, left-aligned */
      <div className="flex flex-col gap-2 items-start max-w-xs">
        <button
          onClick={onSendMessage}
          className="w-full text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2e59d9' }}>
          
          <MessageSquare className="w-4 h-4" /> Send Message
        </button>
        <button
          onClick={() => setPhoneRevealed(true)}
          className="w-full text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2e59d9' }}>
          
          <Phone className="w-4 h-4" /> {phoneRevealed && phone ? phone : 'Show phone number'}
        </button>
        <button
          onClick={onViewAllAds}
          className="w-full text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2e59d9' }}>
          
          <Eye className="w-4 h-4" /> View all ads
        </button>
      </div>
      )}
    </div>);

}