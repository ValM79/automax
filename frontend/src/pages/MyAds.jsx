import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { ArrowLeft, Edit2, Trash2, Plus, Megaphone, RefreshCw, Camera } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { api } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';

export default function MyAds() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadAds = async () => {
    if (!user) {setLoading(false);return;}
    setLoading(true);
    try {
      const results = await api.entities.UserAd.filter({ created_by_id: user.id }, '-created_date', 100);
      setAds(results);
    } catch (e) {
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {loadAds();}, [user?.id]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) return;
    setDeletingId(id);
    await api.entities.UserAd.delete(id);
    setAds((prev) => prev.filter((a) => a.id !== id));
    setDeletingId(null);
  };

  const handleEdit = (ad) => {
    navigate(`/edit-ad/${ad.id}`);
  };

  const handleRenew = (ad) => {
    navigate(`/place-ad?renew=${ad.id}`);
  };

  const getStatusColor = (status) => {
    if (status === 'active') return 'bg-green-50 text-green-700';
    if (status === 'expired') return 'bg-red-50 text-red-600';
    return 'bg-muted text-foreground';
  };

  return (
    <div className="min-h-screen bg-muted">
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
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(ad.status)}`}>
                          {ad.status ? ad.status.charAt(0).toUpperCase() + ad.status.slice(1) : 'Active'}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-foreground mb-1 line-clamp-2">{ad.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{[ad.county, ad.area].filter(Boolean).join(', ') || ad.location}</p>
                      <p className="text-xs text-muted-foreground">
                        Listed {ad.created_date ? new Date(ad.created_date).toLocaleDateString('en-IE') : ''}{ad.subsection ? ` · ${ad.subsection}` : ''}
                      </p>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                      <p className="text-xl font-normal text-foreground">{ad.currency || '€'}{ad.price}</p>
                      <div className="flex items-center gap-2">
                        {ad.status === 'expired' &&
                          <button
                            onClick={() => handleRenew(ad)}
                            className="flex items-center gap-1.5 border border-primary text-primary px-3 py-2 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" /> Renew
                          </button>
                        }
                        <button
                          onClick={() => handleEdit(ad)}
                          className="px-4 rounded-lg border border-border hover:bg-secondary transition-colors min-h-[44px] flex items-center justify-center text-sm font-medium text-foreground">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(ad.id)}
                          disabled={deletingId === ad.id}
                          className="p-2 rounded-lg border border-foreground hover:bg-secondary transition-colors disabled:opacity-60 min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <Trash2 className="w-4 h-4 text-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          }
      </div>
      </PullToRefresh>
      <Footer />
    </div>);

}