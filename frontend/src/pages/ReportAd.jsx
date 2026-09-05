import React, { useState, useEffect } from 'react';
import { ArrowLeft, Flag, CheckCircle } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';

const REPORT_REASONS = [
'Misleading description or photos',
'Prohibited item',
'Fraud or scam',
'Duplicate ad',
'Spam',
'Other'];


export default function ReportAd() {
  const { adId } = useParams();
  const navigate = useNavigate();
  const { user, isLoadingAuth } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      api.auth.redirectToLogin(`/report-ad/${adId}`);
    }
  }, [isLoadingAuth, user, adId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    try {
      await api.entities.ReportAd.create({
        ad_id: adId,
        ad_title: '',
        reason,
        details,
        reporter_email: user?.email || ''
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Report submission failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoadingAuth || !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" />
        </div>
        <Footer />
      </div>);

  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 hover:text-primary transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Report Ad</span>
        </div>

        {submitted ?
        <div className="bg-card rounded-xl border border-border shadow-sm p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Report Submitted</h1>
            <p className="text-sm text-muted-foreground mb-6">
              Thank you for helping keep AutoMax safe. Our team will review this ad and take appropriate action if necessary.
            </p>
            <Link
            to="/cars-for-sale"
            className="inline-flex items-center justify-center bg-primary text-primary-foreground text-sm font-medium px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity">
            
              Back to listings
            </Link>
          </div> :

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
            <div className="flex items-center gap-2 mb-1">
              <Flag className="w-5 h-5 text-[hsl(var(--primary))]" />
              <h1 className="text-2xl font-bold text-foreground">Report Ad</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              Help us keep AutoMax a safe marketplace. Tell us what's wrong with this ad and we'll look into it.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Reason for reporting *</label>
                <div className="flex flex-col gap-2">
                  {REPORT_REASONS.map((r) =>
                <label
                  key={r}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${
                  reason === r ? 'border-primary bg-primary/5' : 'border-border hover:bg-secondary'}`
                  }>
                  
                      <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                    className="accent-primary" />
                  
                      <span className="text-sm text-foreground">{r}</span>
                    </label>
                )}
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">Additional details (optional)</label>
                <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={5}
                placeholder="Provide any additional information that may help us understand the issue..."
                className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              
              </div>

              <button
              type="submit"
              disabled={!reason || submitting}
              className="text-destructive-foreground text-sm font-medium px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed bg-[hsl(var(--primary))]">
              
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        }
      </div>
      <Footer />
    </div>);

}