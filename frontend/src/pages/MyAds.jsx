import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Plus, Megaphone, Camera, EllipsisVertical, Eye, RotateCcw, SquarePen, CircleCheck, Trash2, Lock, Clock } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { adDaysLeft } from '@/lib/adTimeLeft';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// One style for every item in the three-dots menu so they always look and behave the same.
const MENU_ITEM = 'gap-3 px-3 py-2.5 text-sm cursor-pointer';

export default function MyAds() {
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadAds = async (silent = false) => {
    if (!user) {setLoading(false);return;}
    if (!silent) setLoading(true);
    try {
      const results = await api.entities.UserAd.filter({ created_by_id: user.id }, '-created_date', 100);
      // Ads are saved as 'pending' before checkout, and abandoned checkouts are
      // later flipped to 'expired'. Both activation paths (Stripe webhook, Apple
      // verify) stamp packageName, so a non-active ad without one was never paid for.
      setAds(results.filter((a) => a.status === 'active' || a.packageName));
    } catch (e) {
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {loadAds();}, [user?.id]);

  // My Ads is a main tab, so a signed-out visitor can land here: send them to sign in.
  useEffect(() => {
    if (!isLoadingAuth && !user) api.auth.redirectToLogin('/my-ads');
  }, [isLoadingAuth, user]);

  // Back from checkout (?renewed=1): the payment webhook can land a moment after the
  // redirect, so show a notice and refresh the list a couple of times.
  const [searchParams] = useSearchParams();
  const justRenewed = searchParams.get('renewed') === '1';
  useEffect(() => {
    if (!justRenewed) return;
    const timers = [3000, 8000].map((ms) => setTimeout(() => loadAds(true), ms));
    return () => timers.forEach(clearTimeout);
  }, [justRenewed, user?.id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    setDeletingId(id);
    await api.entities.UserAd.delete(id);
    setAds((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
  };

  // "Sold" takes the ad off the public listings (only active ads are shown there) but keeps it in My Ads.
  const handleMarkSold = async (id) => {
    if (!window.confirm('Mark this ad as sold? It will be removed from the listings.')) return;
    setDeletingId(id);
    try {
      await api.entities.UserAd.update(id, { status: 'sold' });
      setAds((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'sold' } : a)));
    } catch (e) {
      window.alert('Could not mark the ad as sold. Please try again.');
    }
    setDeletingId(null);
  };

  const handleEdit = (ad) => {
    navigate(`/edit-ad/${ad.id}`);
  };

  const handleRenew = (ad) => {
    navigate(`/renew-ad/${ad.id}`);
  };

  const getStatusColor = (status) => {
    if (status === 'active') return 'bg-primary/10 text-primary';
    if (status === 'expired') return 'bg-red-50 text-red-600';
    if (status === 'sold') return 'bg-secondary text-foreground';
    return 'bg-muted text-foreground';
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted">
      <Navbar />
      <PullToRefresh onRefresh={async () => {await queryClientInstance.invalidateQueries();}}>
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">My Ads</span>
        </div>

        <div className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-bold text-foreground">My Ads</h1>
          <button
              onClick={() => navigate('/place-ad')}
              className="flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-2 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm">
            <Plus className="w-4 h-4" /> Place New Ad
          </button>
        </div>

        {justRenewed &&
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            Payment received. Your ad is being uploaded again with a fresh countdown. If it still shows the old time, give it a few seconds.
          </div>
        }

        {loading ?
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
          </div> :
          ads.length === 0 ?
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
            <Megaphone className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No ads yet</p>
            <p className="text-sm text-muted-foreground mb-6">Start selling by placing your first ad</p>
            <button
              onClick={() => navigate('/place-ad')}
              className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
              Place Ad
            </button>
          </div> :

          <div className="space-y-4">
            {ads.map((ad) =>
            <div key={ad.id} className="bg-card rounded-xl border border-border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row">
                  <div className="flex-shrink-0 w-full sm:w-48">
                    <div className="relative aspect-square">
                      {ad.photos && ad.photos[0] ?
                        <img src={ad.photos[0]} alt={ad.title} className="w-full h-full object-cover" /> :
                        <div className="w-full h-full bg-secondary flex items-center justify-center"><span className="text-muted-foreground text-sm">No photo</span></div>
                      }
                      {ad.photos && ad.photos.length > 0 &&
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                          <Camera className="w-3 h-3" /> {ad.photos.length}
                        </div>
                      }
                    </div>
                  </div>
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0 relative">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="Ad actions"
                          disabled={deletingId === ad.id}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-foreground hover:bg-secondary transition-colors disabled:opacity-60">
                          <EllipsisVertical className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 rounded-xl p-1.5 shadow-lg">
                        <DropdownMenuItem className={MENU_ITEM} onSelect={() => navigate(`/vehicle/${ad.id}`)}>
                          <Eye /> View
                        </DropdownMenuItem>
                        {/* a sold ad can't be renewed (the payment step only accepts pending, active or expired ads) */}
                        {ad.status !== 'sold' && (
                          <DropdownMenuItem className={MENU_ITEM} onSelect={() => handleRenew(ad)}>
                            <RotateCcw /> Renew my Ad
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className={MENU_ITEM} onSelect={() => handleEdit(ad)}>
                          <SquarePen /> Edit
                        </DropdownMenuItem>
                        {ad.status === 'active' && (
                          <DropdownMenuItem className={MENU_ITEM} onSelect={() => handleMarkSold(ad.id)}>
                            <CircleCheck /> Mark as Sold
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem className={MENU_ITEM} onSelect={() => handleDelete(ad.id)}>
                          <Trash2 /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="pr-10">
                      <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2">{ad.title}</h3>
                      <p className="text-sm text-foreground mb-2">
                        Listed {ad.created_date ? new Date(ad.created_date).toLocaleDateString('en-IE') : ''}{ad.subsection ? ` · ${ad.subsection}` : ''}
                      </p>
                                      <div className="flex flex-col gap-1 text-sm text-foreground mb-2">
                        <span className="inline-flex items-center gap-1.5"><Eye className="w-4 h-4" /> Views: {Number(ad.view_count) || 0}</span>
                        <span className="inline-flex items-center gap-1.5"><Lock className="w-4 h-4" /> Saved: {Number(ad.save_count) || 0}</span>
                        {ad.status === 'active' && adDaysLeft(ad) != null && adDaysLeft(ad) > 0 &&
                          <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" /> Days left: {adDaysLeft(ad)}</span>
                        }
                      </div>
                    </div>
                    <div className="flex items-end justify-between gap-3 mt-4">
                      <span className={`min-w-[7rem] px-5 py-1.5 rounded-full text-xs font-medium text-center ${getStatusColor(ad.status)}`}>
                        {ad.status ? ad.status.charAt(0).toUpperCase() + ad.status.slice(1) : 'Active'}
                      </span>
                      <p className="text-xl font-normal text-foreground">{ad.currency || '€'}{ad.price}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          }
      </div>
      </PullToRefresh>
      <div className="mt-auto"><Footer /></div>
    </div>);

}