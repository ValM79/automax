import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import ListingCard from '../components/automarket/ListingCard';
import { api } from '@/api/apiClient';

export default function SellerAds() {
  const { sellerId } = useParams();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sellerId) return;
    setLoading(true);
    api.entities.UserAd.filter({ created_by_id: sellerId, status: 'active' }, '-created_date', 100)
      .then(records => {
        const items = records.map(ad => ({
          id: ad.id,
          title: ad.title,
          price: `€${ad.price}`,
          mileage: ad.mileage,
          location: ad.location,
          year: ad.vehicleYear,
          engine: ad.vehicleFuel,
          image: (ad.photos && ad.photos[0]) || null,
          images: ad.photos || [],
          photos: ad.photos ? ad.photos.length : 1,
          sellerType: ad.isTrader ? 'Trader' : 'Private Seller',
          spotlight: ad.spotlight,
          description: ad.description,
          fullName: ad.fullName,
          email: ad.email,
          phone: ad.phone,
          sellerId: ad.created_by_id
        }));
        setAds(items);
      })
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  }, [sellerId]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-5">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Seller Ads</span>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-6">All Ads by This Seller</h1>
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" />
          </div>
        ) : ads.length === 0 ? (
          <p className="text-muted-foreground text-center py-20">No ads found from this seller.</p>
        ) : (
          <div className="space-y-4">
            {ads.map(ad => (
              <ListingCard key={ad.id} item={ad} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}