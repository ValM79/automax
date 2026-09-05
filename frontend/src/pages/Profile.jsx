import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { ArrowLeft, Info, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';

const counties = ['Dublin', 'Cork', 'Galway', 'Limerick', 'Waterford', 'Kilkenny', 'Mayo', 'Kerry', 'Clare', 'Tipperary', 'Roscommon', 'Westmeath', 'Wexford', 'Wicklow', 'Meath', 'Kildare'];

const areasByCounty = {
  Dublin: ['Dublin City Centre', 'North Dublin', 'South Dublin', 'West County', 'East Dublin'],
  Cork: ['Cork City', 'North Cork', 'South Cork', 'West Cork'],
  Galway: ['Galway City', 'Connemara', 'East Galway'],
  Limerick: ['Limerick City', 'North Limerick', 'South Limerick'],
  default: ['North', 'South', 'East', 'West', 'City Centre']
};

export default function Profile() {
  const { user, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const [sellerType, setSellerType] = useState('private');
  const [form, setForm] = useState({
    name: '',
    email: '',
    county: 'Dublin',
    area: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    vatNumber: '',
  });
  const [editingPhone, setEditingPhone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      navigate('/login?next=/profile', { replace: true });
      return;
    }
    setSellerType(user.seller_type || 'private');
    setForm((f) => ({
      ...f,
      name: user.display_name || user.full_name || '',
      email: user.email || '',
      county: user.county || 'Dublin',
      area: user.area || '',
      phone: user.phone || '',
      businessName: user.business_name || '',
      businessAddress: user.business_address || '',
      vatNumber: user.vat_number || '',
    }));
  }, [isLoadingAuth, user]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const areas = areasByCounty[form.county] || areasByCounty.default;

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const response = await api.functions.invoke('deleteAccount', {});
      if (response.data?.error) {
        throw new Error(response.data.error);
      }
      // Favorites, saved searches, and browsing history are stored client-side
      // only (never sent to the backend) -- clear them here so "browsing logs
      // and search history permanently cleared" is actually true.
      localStorage.removeItem('automax_favorites');
      localStorage.removeItem('automax_saved_searches');
      localStorage.removeItem('automax_browsing_history');
      await api.auth.logout(window.location.origin + '/');
    } catch (e) {
      setDeleting(false);
      setDeleteError(e.message || 'Failed to delete account. Please try again.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await api.auth.updateMe({
      display_name: form.name,
      county: form.county,
      area: form.area,
      phone: form.phone,
      seller_type: sellerType,
      business_name: form.businessName,
      business_address: form.businessAddress,
      vat_number: form.vatNumber,
    });
    setSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  if (isLoadingAuth || !user) {
    return (
      <div className="min-h-screen bg-muted">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <Navbar />
      <PullToRefresh onRefresh={async () => { await queryClientInstance.invalidateQueries(); }}>
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Profile</span>
        </div>

        {saveSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700">
            Profile updated successfully!
          </div>
        )}

        <div className="bg-card rounded-xl border border-border shadow-sm p-6 md:p-8">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
              <p className="text-sm text-primary mt-1">To store and update your profile information.</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-60 flex-shrink-0">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Seller type toggle */}
          <div className="grid grid-cols-2 gap-2 border border-border rounded-lg p-1 mb-6 max-w-md">
            {[{ key: 'private', label: 'Private Seller' }, { key: 'trader', label: 'Trader' }].map((t) => (
              <button
                key={t.key}
                onClick={() => setSellerType(t.key)}
                className={`py-2.5 rounded-md text-sm font-semibold transition-colors ${sellerType === t.key ? 'bg-secondary text-foreground border border-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="space-y-6">
            {/* Trader fields */}
            {sellerType === 'trader' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Business Name<span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={set('businessName')}
                    placeholder="Business name"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Business Address</label>
                  <input
                    type="text"
                    value={form.businessAddress || ''}
                    onChange={set('businessAddress')}
                    placeholder="Business address"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">VAT Number (if applicable)</label>
                  <input
                    type="text"
                    value={form.vatNumber}
                    onChange={set('vatNumber')}
                    placeholder="e.g. IE6439073E"
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Your Name<span className="text-destructive">*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">Phone<span className="text-destructive">*</span></label>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9 +\-()]/g, '') }))}
                  disabled={!editingPhone}
                  placeholder="e.g. 0862671554"
                  className="flex-1 px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground disabled:bg-secondary disabled:text-muted-foreground"
                />
                <button
                  onClick={() => setEditingPhone((v) => !v)}
                  className="border border-foreground text-foreground font-semibold px-6 py-3 rounded-lg hover:bg-secondary transition-colors text-sm flex-shrink-0 md:w-auto">
                  {editingPhone ? 'Done' : 'Edit'}
                </button>
              </div>
              {form.phone ? (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2"><Info className="w-3.5 h-3.5 text-primary" /> Your phone is verified</p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2"><Info className="w-3.5 h-3.5 text-primary" /> Add a phone number so buyers can contact you</p>
              )}
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-muted-foreground">Email</label>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="text-sm font-semibold text-primary hover:underline transition-colors">
                  Edit email
                </button>
              </div>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full px-4 py-3 border border-border rounded-lg bg-secondary text-muted-foreground cursor-not-allowed"
              />
            </div>

            {/* County + Area inline */}
            <div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">County<span className="text-destructive">*</span></label>
                  <div className="relative">
                    <select
                      value={form.county}
                      onChange={(e) => setForm((f) => ({ ...f, county: e.target.value, area: '' }))}
                      className="w-full appearance-none px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground pr-9">
                      {counties.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">Area<span className="text-destructive">*</span></label>
                  <div className="relative">
                    <select
                      value={form.area}
                      onChange={set('area')}
                      className="w-full appearance-none px-4 py-3 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground pr-9">
                      <option value="">Select area...</option>
                      {areas.map((a) => <option key={a}>{a}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2"><Info className="w-3.5 h-3.5 text-primary" /> Items will appear under the county you choose</p>
            </div>

          </div>
        </div>

        {/* Delete Account */}
        <div className="mt-6 bg-card rounded-xl border border-border shadow-sm p-6 md:p-8">
          <h2 className="text-lg font-bold text-foreground mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="bg-destructive text-destructive-foreground px-6 py-2.5 rounded-lg hover:bg-destructive/90 transition-colors font-medium text-sm">
            Delete Account
          </button>
        </div>
      </div>
      </PullToRefresh>

      {/* Edit Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowEmailModal(false)}>
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-4">Change Your Email</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <p>
                Please submit your request to <a href="mailto:changemyemail@automax.ie" className="text-foreground font-semibold hover:underline">changemyemail@automax.ie</a>
              </p>
              <p>
                For security reasons, we ask that you contact us directly from the email address that is currently registered to your AutoMax account.
              </p>
              <p>
                If you lost access to your old email address, <strong className="text-foreground">please refer to our Help Page article for more information.</strong>
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowEmailModal(false)}
                className="px-5 py-2.5 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-secondary transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-foreground mb-2">Delete Account?</h2>
            <p className="text-sm text-muted-foreground mb-4">This will permanently erase your account and all associated data. This action cannot be undone.</p>
            <ul className="text-sm text-muted-foreground mb-6 space-y-2 bg-secondary/50 rounded-lg p-4 border border-border">
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✕</span> All <strong className="text-foreground">live ads</strong> permanently removed from the database</li>
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✕</span> All <strong className="text-foreground">listing and package records</strong> removed from our database. Stripe separately retains a record of completed transactions for its own legal and tax obligations, independent of your AutoMax account</li>
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✕</span> All <strong className="text-foreground">browsing history and search history</strong> stored on this device permanently cleared</li>
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✕</span> All <strong className="text-foreground">saved listings and favorites</strong> stored on this device permanently cleared</li>
              <li className="flex items-start gap-2"><span className="text-destructive mt-0.5">✕</span> Your account, profile, and contact details irreversibly removed</li>
            </ul>
            {deleteError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-secondary transition-colors">
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-destructive/90 transition-colors disabled:opacity-60">
                {deleting ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}