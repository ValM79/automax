import React, { useState } from 'react';
import { MessageSquare, Phone, Eye } from 'lucide-react';

export default function SellerCard({ seller, onSendMessage, onViewAllAds, isOwnAd = false, onManage }) {
  const name = seller?.name || 'Private Seller';
  const location = seller?.location || '';
  const phone = seller?.phone || '';
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [ownNote, setOwnNote] = useState(false);
  // "2026-09" -> "Sep 2026"
  const memberSinceText = (() => {
    const m = /^(\d{4})-(\d{2})$/.exec(seller?.memberSince || '');
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toLocaleDateString('en-IE', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : null;
  })();

  return (
    <div className="p-4">
      <div className="mb-3">
        {location && <p className="font-semibold text-foreground text-base truncate">{location}</p>}
        <h3 className="font-semibold text-foreground text-base truncate">{name}</h3>
        {seller?.isTrader && <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Trader</span>}
        {(memberSinceText || seller?.activeAds != null || seller?.totalAds != null) && (
          <dl className="mt-3 space-y-1 text-sm">
            {memberSinceText && (
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Member since</dt><dd className="font-medium text-foreground">{memberSinceText}</dd></div>
            )}
            {seller?.activeAds != null && (
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Active ads</dt><dd className="font-medium text-foreground">{seller.activeAds}</dd></div>
            )}
            {seller?.totalAds != null && (
              <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Total ads</dt><dd className="font-medium text-foreground">{seller.totalAds}</dd></div>
            )}
          </dl>
        )}
      </div>

      {/* The owner sees the same three buttons a buyer sees. Message and phone can't be used on your own ad,
          so pressing them just explains that; "Manage your ads" stays available underneath. */}
      <div className="flex flex-col gap-2 items-start max-w-xs">
        <button
          onClick={isOwnAd ? () => setOwnNote(true) : onSendMessage}
          className="w-full text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2e59d9' }}>
          <MessageSquare className="w-4 h-4" /> Send Message
        </button>
        <button
          onClick={isOwnAd ? () => setOwnNote(true) : () => setPhoneRevealed(true)}
          className="w-full text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2e59d9' }}>
          <Phone className="w-4 h-4" /> {!isOwnAd && phoneRevealed && phone ? phone : 'Show phone number'}
        </button>
        <button
          onClick={onViewAllAds}
          className="w-full text-white text-sm font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#2e59d9' }}>
          <Eye className="w-4 h-4" /> View all ads
        </button>
        {isOwnAd && (
          <p className="text-sm text-muted-foreground">
            {ownNote ? "You can't message or call your own ad. This is how buyers see it. " : 'This is your ad. '}
            <button type="button" onClick={onManage} className="text-primary font-medium hover:underline">Manage your ads</button>
          </p>
        )}
      </div>
    </div>);

}