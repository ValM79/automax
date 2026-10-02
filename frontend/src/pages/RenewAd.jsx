import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import BackButton from '../components/automarket/BackButton';
import AdPackageSelector, { isBikePackageSubsection } from '../components/automarket/AdPackageSelector';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { IAPPlugin, isIOSApp } from '@/lib/iap';
import { adDaysLeft } from '@/lib/adTimeLeft';

// "Upload your Ad": re-list an existing ad by buying a package for it. The live
// ad is untouched until payment succeeds; the backend (stripeWebhook /
// verifyAppleTransaction) then restarts its countdown and moves it to the top.
export default function RenewAd() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [ad, setAd] = useState(null);
  const [loadState, setLoadState] = useState('loading');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      api.auth.redirectToLogin(`/renew-ad/${id}`);
      return;
    }
    api.entities.UserAd.get(id)
      .then((found) => {
        if (found && found.created_by_id === user.id) {
          setAd(found);
          setLoadState('ready');
        } else {
          setLoadState('notfound');
        }
      })
      .catch(() => setLoadState('notfound'));
  }, [isLoadingAuth, user, id]);

  const isBikeCategory = isBikePackageSubsection(ad?.subsection);
  const daysLeft = ad ? adDaysLeft(ad) : null;
  const stillLive = ad?.status === 'active' && daysLeft != null && daysLeft > 0;

  const handleUpload = async () => {
    if (busy) return;
    if (!selectedPackage) {
      setError('Please select a package first.');
      return;
    }
    if (isIOSApp && !selectedPackage.iosProductId) {
      setError('This package is not available for purchase on iOS yet.');
      return;
    }
    if (stillLive && !window.confirm(`This ad is still live with ${daysLeft} day${daysLeft === 1 ? '' : 's'} left. Uploading it again starts a new ${selectedPackage.listingDays}-day countdown and replaces the remaining time. Continue?`)) {
      return;
    }

    setBusy(true);
    setError('');
    try {
      if (isIOSApp) {
        let purchase;
        try {
          purchase = await IAPPlugin.purchase({ productId: selectedPackage.iosProductId });
        } catch (purchaseErr) {
          const msg = String(purchaseErr?.message || '');
          if (msg.includes('userCancelled')) {
            setError('');
          } else if (msg.includes('pending')) {
            setError('Your purchase needs approval (e.g. Ask to Buy) before it can complete.');
          } else {
            setError('Purchase failed. Please try again.');
          }
          return;
        }
        try {
          await api.functions.invoke('verifyAppleTransaction', { adId: ad.id, transactionId: purchase.transactionId });
          await IAPPlugin.finishTransaction({ transactionId: purchase.transactionId });
          navigate('/my-ads?renewed=1');
        } catch {
          setError('We received your payment but could not update the ad yet. Please check My Ads in a moment, or contact support.');
        }
        return;
      }

      const res = await api.functions.invoke('createCheckoutSession', {
        packageName: selectedPackage.name,
        adId: ad.id,
      });
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        setError('Could not start checkout. Please try again.');
      }
    } catch (e) {
      setError(e?.message || 'Could not start checkout. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <Navbar />
      <div className="max-w-3xl w-full mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/my-ads" className="hover:text-primary transition-colors">My Ads</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Upload your Ad</span>
        </div>

        {loadState === 'loading' &&
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div>
        }

        {loadState === 'notfound' &&
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
            <p className="text-lg font-medium text-foreground mb-2">Ad not found</p>
            <p className="text-sm text-muted-foreground mb-6">We couldn't find that ad in your account.</p>
            <Link to="/my-ads" className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium">Back to My Ads</Link>
          </div>
        }

        {loadState === 'ready' && ad &&
          <div className="flex flex-col gap-4">
            <h1 className="text-xl font-bold text-foreground">Upload your Ad</h1>

            <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex">
              <div className="w-28 flex-shrink-0 aspect-square bg-secondary">
                {ad.photos && ad.photos[0] ?
                  <img src={ad.photos[0]} alt={ad.title} className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No photo</div>
                }
              </div>
              <div className="p-4 min-w-0">
                <h2 className="text-base font-bold text-foreground line-clamp-2">{ad.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {ad.status === 'expired' ? 'Expired' : stillLive ? `Live · ${daysLeft} day${daysLeft === 1 ? '' : 's'} left` : 'Live'}
                </p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Choose a package and pay to put this ad back at the top of the listings with a brand-new countdown, starting as soon as your payment goes through.
            </p>

            <AdPackageSelector
              isBikeCategory={isBikeCategory}
              selectedPackage={selectedPackage}
              onPackageSelected={setSelectedPackage}
              actionLabel="Upload now" />

            {error && <p className="text-sm text-destructive text-center">{error}</p>}

            <button
              onClick={handleUpload}
              disabled={busy}
              className="w-full bg-foreground text-background font-bold py-4 rounded-xl text-base hover:opacity-90 transition-opacity disabled:opacity-60">
              {busy ? (isIOSApp ? 'Completing purchase...' : 'Redirecting to payment...') : 'Upload now'}
            </button>
            <Link to="/my-ads" className="w-full text-center border border-foreground text-foreground font-semibold py-3 rounded-xl hover:bg-secondary transition-colors text-sm">
              Cancel
            </Link>
          </div>
        }
      </div>
      <div className="mt-auto"><Footer /></div>
    </div>
  );
}
