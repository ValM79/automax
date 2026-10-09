import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { ArrowLeft, Info, User, Mail, Phone, Building2, Store, Shield, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';

import { IRISH_COUNTIES } from '@/lib/counties';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AreaSelect from '../components/automarket/AreaSelect';
import { IRISH_TOWNS } from '@/lib/irishTowns';

export default function Profile() {
  const { user, isLoadingAuth, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [sellerType, setSellerType] = useState('private');
  const [form, setForm] = useState({
    name: '',
    email: '',
    county: '',
    area: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    vatNumber: '',
  });
  const [editingPhone, setEditingPhone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [requestSent, setRequestSent] = useState(false);

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
      county: user.county || '',
      area: user.area || '',
      phone: user.phone || '',
      businessName: user.business_name || '',
      businessAddress: user.business_address || '',
      vatNumber: user.vat_number || '',
    }));
  }, [isLoadingAuth, user]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const areas = IRISH_TOWNS[form.county] || [];

  // Account deletion is handled by the support team, not instantly: this only emails the request to
  // support@automax.ie (via the contact form backend) so the request can be checked before anything is removed.
  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      const response = await api.functions.invoke('submitContactForm', {
        email: form.email,
        name: form.name || form.email,
        mobile: form.phone || 'Not provided',
        reason: 'Support / Help',
        subject: 'Account deletion request',
        description:
          `Please delete my AutoMax account.\nAccount email: ${form.email}\nAccount ID: ${user.id || 'n/a'}\nRequested from the Profile page.`,
      });
      if (response?.data?.error || response?.data?.success === false) {
        throw new Error(response.data.error || 'Could not send the request');
      }
      setRequestSent(true);
      setShowDeleteModal(false);
      setDeleting(false);
    } catch (e) {
      setDeleting(false);
      setDeleteError(e.message || 'Could not send your request. Please try again.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await api.auth.updateMe({
        display_name: form.name,
        county: form.county,
        area: form.area.trim(),
        phone: form.phone,
        seller_type: sellerType,
        business_name: form.businessName,
        business_address: form.businessAddress,
        vat_number: form.vatNumber,
      });
      // Re-read the saved profile so leaving and coming back to this page shows what was saved.
      await refreshUser();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      setSaveError(e?.message || 'Could not save your changes. Please try again.');
    } finally {
      setSaving(false);
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
      </div>
    );
  }

  const initials = (form.name || form.email || '?').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <PullToRefresh onRefresh={async () => { await queryClientInstance.invalidateQueries(); }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Profile</span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-6">My Profile</h1>

        {requestSent && (
          <div className="mb-6 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 text-sm text-primary">
            Your delete request has been sent to our support team. We will contact you by email to confirm.
          </div>
        )}

        {saveError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-6 bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 text-sm text-primary">
            Profile updated successfully!
          </div>
        )}

        {/* Seller type: chosen first, the identity card below follows it */}
        <section className="bg-card rounded-xl border border-border p-5 sm:p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Seller Type</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { key: 'private', label: 'Private Seller', text: 'I sell occasionally as a private individual', Icon: User },
              { key: 'trader', label: 'Trader', text: 'I sell professionally as a business', Icon: Store },
            ].map(({ key, label, text, Icon }) => (
              <div key={key} className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSellerType(key)}
                  aria-pressed={sellerType === key}
                  className={`w-full h-10 flex items-center gap-2 px-3 rounded-md border text-sm transition-colors ${sellerType === key ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary' : 'border-border bg-card text-foreground hover:bg-secondary'}`}>
                  <Icon className={`w-4 h-4 ${sellerType === key ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className="font-medium">{label}</span>
                </button>
                <p className="text-xs text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Profile header card: a person for a private seller, the business for a trader */}
        <div className="bg-card rounded-xl border border-border mb-6 px-5 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full border-2 border-border bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground shrink-0">
              {sellerType === 'trader' ? <Building2 className="w-5 h-5" /> : initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">
                {sellerType === 'trader' ? (form.businessName || 'Your Business') : (form.name || 'Your Name')}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {sellerType === 'trader' ? `Trader account${form.name ? ' · ' + form.name : ''}` : form.email}
              </p>
            </div>
            {user.role === 'admin' && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold bg-secondary text-foreground rounded-full px-2.5 py-1 shrink-0">
                <Shield className="w-3 h-3" /> Admin
              </span>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {/* Trader fields */}
          {sellerType === 'trader' && (
            <section className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Business Details</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">Business Name<span className="text-destructive">*</span></label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={set('businessName')}
                    placeholder="Business name"
                    className="w-full h-10 px-3 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">VAT Number (if applicable)</label>
                  <input
                    type="text"
                    value={form.vatNumber}
                    onChange={set('vatNumber')}
                    placeholder="e.g. IE6439073E"
                    className="w-full h-10 px-3 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground">Business Address</label>
                  <input
                    type="text"
                    value={form.businessAddress || ''}
                    onChange={set('businessAddress')}
                    placeholder="Business address"
                    className="w-full h-10 px-3 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                  />
                </div>
              </div>
            </section>
          )}

          {/* Account Details */}
          <section className="bg-card rounded-xl border border-border p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Account Details</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Full Name<span className="text-destructive">*</span></label>
                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Your name"
                  className="w-full h-10 px-3 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="w-full h-10 pl-10 pr-3 text-sm border border-border rounded-md bg-secondary text-muted-foreground cursor-not-allowed"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-card rounded-xl border border-border p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Phone className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Phone Number<span className="text-destructive">*</span></label>
                <div className="flex items-center gap-3">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/[^0-9 +\-()]/g, '') }))}
                    disabled={!editingPhone}
                    placeholder="e.g. 086 123 4567"
                    className="flex-1 min-w-0 h-10 px-3 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground disabled:bg-secondary disabled:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={() => setEditingPhone((v) => !v)}
                    className="border border-foreground text-foreground font-semibold px-4 h-10 rounded-md hover:bg-secondary transition-colors text-sm flex-shrink-0">
                    {editingPhone ? 'Done' : 'Edit'}
                  </button>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="w-3.5 h-3.5 text-primary" /> {form.phone ? 'Buyers see this number when you allow contact by phone' : 'Add a phone number so buyers can contact you'}</p>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">County<span className="text-destructive">*</span></label>
                <Select value={form.county} onValueChange={(v) => setForm((f) => ({ ...f, county: v, area: '' }))}>
                  <SelectTrigger className="h-10 bg-card"><SelectValue placeholder="Select your county" /></SelectTrigger>
                  <SelectContent>
                    {IRISH_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-sm font-medium text-foreground">Area / Town<span className="text-destructive">*</span></label>
                <AreaSelect
                  value={form.area}
                  onChange={(v) => setForm((f) => ({ ...f, area: v }))}
                  options={areas}
                  listDisabled={!form.county}
                  placeholder="Type your area or town"
                />
                <p className="text-xs text-muted-foreground">Type your own area or town, or press the arrow to pick from the towns in your county. Used so buyers can gauge collection distance.</p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground h-12 rounded-lg hover:bg-primary/90 transition-colors font-medium text-base disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Delete Account */}
        <div className="mt-6 bg-card rounded-xl border border-border p-5 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Trash2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-bold text-foreground">Make Request Delete My Account</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Permanently delete your account and all associated data. This action cannot be undone.</p>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={requestSent}
            className="border border-border text-foreground px-4 py-2 rounded-md hover:bg-secondary transition-colors font-medium text-sm disabled:opacity-60">
            {requestSent ? 'Request sent' : 'Make Request'}
          </button>
        </div>
      </div>
      </PullToRefresh>

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
                {deleting ? 'Sending...' : 'Make Delete Requests'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}