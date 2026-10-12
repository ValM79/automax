import React, { useState } from 'react';
import { MessageSquare, Phone, User, Building2, MapPin, Flag } from 'lucide-react';

const buttonClass =
  'w-full h-11 border border-primary text-primary bg-card rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors';

export default function SellerCard({ seller, onSendMessage, onViewAllAds, onReport, isOwnAd = false, onManage }) {
  const name = seller?.name || 'Private Seller';
  const location = seller?.location || '';
  const phone = seller?.phone || '';
  const isTrader = !!seller?.isTrader;
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [ownNote, setOwnNote] = useState(false);
  // "2026-09" -> "Sep 2026"
  const memberSinceText = (() => {
    const m = /^(\d{4})-(\d{2})$/.exec(seller?.memberSince || '');
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toLocaleDateString('en-IE', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : null;
  })();
  const hasFacts = memberSinceText || seller?.activeAds != null || seller?.totalAds != null;

  // The owner sees the same buttons a buyer sees. Message and phone can't be used on your own ad,
  // so pressing them only explains that.
  const onPhone = isOwnAd ? () => setOwnNote(true) : () => setPhoneRevealed(true);
  const onMessage = isOwnAd ? () => setOwnNote(true) : onSendMessage;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      {/* Who is selling */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {isTrader ? <Building2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground text-base truncate">{name}</h3>
          {location && (
            <p className="flex items-center gap-1 text-sm text-muted-foreground truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {location}
            </p>
          )}
          {isTrader && <span className="inline-block mt-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Trader</span>}
        </div>
      </div>

      {hasFacts && (
        <dl className="mt-4 space-y-1 text-sm">
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

      <div className="border-t border-border my-4" />

      <div className="flex flex-col gap-2.5">
        <button type="button" onClick={onPhone} className={buttonClass}>
          <Phone className="w-4 h-4" /> {!isOwnAd && phoneRevealed && phone ? phone : 'Show phone number'}
        </button>
        <button type="button" onClick={onMessage} className={buttonClass}>
          <MessageSquare className="w-4 h-4" /> Send message
        </button>
        <button type="button" onClick={onViewAllAds} className={buttonClass}>
          <User className="w-4 h-4" /> Show this seller's ads
        </button>
      </div>

      {isOwnAd ? (
        <p className="mt-3 text-center text-sm text-muted-foreground">
          {ownNote ? "You can't message or call your own ad. This is how buyers see it. " : 'This is your ad. '}
          <button type="button" onClick={onManage} className="text-primary font-medium hover:underline">Manage your ads</button>
        </p>
      ) : (
        <button type="button" onClick={onReport} className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <Flag className="w-3.5 h-3.5" /> Report this listing
        </button>
      )}
    </div>);

}
