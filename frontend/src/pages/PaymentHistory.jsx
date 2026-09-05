import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { ArrowLeft, Download, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';

const PACKAGE_PRICES = { 'Basic': 1, 'Standard': 3, 'Premium': 7 };
const BIKE_PACKAGE_PRICES = { 'Basic': 0.50, 'Standard': 1, 'Premium': 3 };
const BIKE_SUBSECTIONS = ['Bikes & Bicycles', 'Car Extras', 'Car Parts', 'Boat Extras', 'Other items', 'Motorbike Extras'];

function getPaymentAmount(ad) {
  if (ad.paymentAmount != null) {
    return ad.paymentAmount / 100;
  }
  const isBike = BIKE_SUBSECTIONS.includes(ad.subsection);
  const prices = isBike ? BIKE_PACKAGE_PRICES : PACKAGE_PRICES;
  return prices[ad.packageName] || 0;
}

export default function PaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, isLoadingAuth } = useAuth();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      api.auth.redirectToLogin('/payment-history');
      return;
    }
    loadPayments();
  }, [isLoadingAuth, user]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const records = await api.entities.UserAd.filter({ created_by_id: user.id }, '-created_date');
      // Only show ads with proof of genuine payment: paymentAmount > 0 and a
      // receiptUrl, both set exclusively by the Stripe webhook after a verified
      // checkout.session.completed event. This prevents ads that were never
      // actually paid for from appearing as "Completed" payments.
      const completed = records
        .filter(ad => ad.packageName && ad.status === 'active' && ad.paymentAmount > 0 && ad.receiptUrl)
        .map(ad => {
          const amount = getPaymentAmount(ad);
          return {
            id: ad.id,
            type: ad.packageName ? `${ad.packageName} Ad Package` : 'Ad Listing',
            description: ad.title,
            amount,
            date: ad.created_date ? new Date(ad.created_date).toLocaleDateString('en-IE') : '',
            status: 'Completed',
            method: 'Card',
            receiptUrl: ad.receiptUrl || '',
          };
        });
      setPayments(completed);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const [downloadingId, setDownloadingId] = useState(null);

  const handleDownloadReceipt = async (payment) => {
    try {
      setDownloadingId(payment.id);
      const res = await api.functions.invoke('downloadReceipt', { adId: payment.id });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `automax-receipt-${payment.id.slice(-8).toUpperCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download receipt:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const totalSpent = payments.reduce((sum, p) => sum + p.amount, 0);

  if (isLoadingAuth || loading) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <PullToRefresh onRefresh={async () => { await queryClientInstance.invalidateQueries(); }}>
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Payment Records</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Payment Records</h1>
        </div>

        {payments.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No payments</p>
            <p className="text-sm text-muted-foreground">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-card rounded-xl border border-border shadow-sm">
            <table className="w-full">
              <thead className="!border-b border-border">
                <tr className="bg-secondary/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Type</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Method</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {payment.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{payment.description}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{payment.date}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{payment.method}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-foreground">€{payment.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDownloadReceipt(payment)}
                        disabled={downloadingId === payment.id}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary hover:bg-primary/10 rounded transition-colors disabled:opacity-60 min-h-[44px]">
                        <Download className="w-4 h-4" />
                        {downloadingId === payment.id ? 'Generating...' : 'Receipt'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </PullToRefresh>
      <Footer />
    </div>
  );
}