import React, { useState, useEffect, useRef } from 'react';
import BackButton from '../components/automarket/BackButton';
import { Info, User, Mail, Phone, Building2, Store, Shield, Trash2, Bell, Calendar, Camera } from 'lucide-react';
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
import { squareImage, coverImage } from '@/lib/avatar';
import AvatarBadge from '../components/automarket/AvatarBadge';

export default function Profile() {
  const { user, isLoadingAuth, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    county: '',
    area: '',
    phone: '',
    businessName: '',
    businessAddress: '',
    vatNumber: '',
    openingHours: '',
  });
  const [editingPhone, setEditingPhone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [notify, setNotify] = useState({ messages: true, savedSearches: false, promotions: false });
  const [memberSince, setMemberSince] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const photoInput = useRef(null);
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverError, setCoverError] = useState('');
  const coverInput = useRef(null);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      navigate('/login?next=/profile', { replace: true });
      return;
    }
    setNotify({
      // Message alerts are ON unless the user switched them off; the other two are OFF until opted in
      messages: user.notify_messages !== false,
      savedSearches: user.notify_saved_searches === true,
      promotions: user.notify_promotions === true,
    });
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
      openingHours: user.opening_hours || '',
    }));
  }, [isLoadingAuth, user]);

  // "Member since" comes from the account system through the public seller-facts function.
  useEffect(() => {
    if (!user?.id) return;
    api.functions.invoke('getSellerStats', { seller_id: user.id })
      .then((res) => {
        const m = /^(\d{4})-(\d{2})$/.exec(res?.data?.member_since || '');
        setMemberSince(m ? new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toLocaleDateString('en-IE', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '');
      })
      .catch(() => setMemberSince(''));
  }, [user?.id]);

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

  // The photo (or logo, for a trader) is stored as soon as it is chosen; it does not wait for "Save Changes".
  const changePhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setPhotoError('Please choose a picture (JPG or PNG).'); return; }
    setPhotoBusy(true);
    setPhotoError('');
    try {
      const small = await squareImage(file, { fit: ['trader', 'dealer'].includes(user.seller_type) ? 'contain' : 'cover' });
      const { file_url } = await api.integrations.Core.UploadFile({ file: small });
      await api.auth.updateMe({ avatar_url: file_url });
      await refreshUser();
    } catch (err) {
      setPhotoError(err?.message || 'Could not upload the picture. Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };

  const removePhoto = async () => {
    setPhotoBusy(true);
    setPhotoError('');
    try {
      await api.auth.updateMe({ avatar_url: '' });
      await refreshUser();
    } catch (err) {
      setPhotoError(err?.message || 'Could not remove the picture. Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };

  // A business's cover photo: the background of its Dealers Garage card and the banner of its dealer page.
  // Stored as soon as it is chosen, like the logo.
  const changeCover = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { setCoverError('Please choose a picture (JPG or PNG).'); return; }
    setCoverBusy(true);
    setCoverError('');
    try {
      const wide = await coverImage(file);
      const { file_url } = await api.integrations.Core.UploadFile({ file: wide });
      await api.auth.updateMe({ cover_url: file_url });
      await refreshUser();
    } catch (err) {
      setCoverError(err?.message || 'Could not upload the picture. Please try again.');
    } finally {
      setCoverBusy(false);
    }
  };

  const removeCover = async () => {
    setCoverBusy(true);
    setCoverError('');
    try {
      await api.auth.updateMe({ cover_url: '' });
      await refreshUser();
    } catch (err) {
      setCoverError(err?.message || 'Could not remove the picture. Please try again.');
    } finally {
      setCoverBusy(false);
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
        notify_messages: notify.messages,
        notify_saved_searches: notify.savedSearches,
        notify_promotions: notify.promotions,
        business_name: form.businessName,
        business_address: form.businessAddress,
        vat_number: form.vatNumber,
        ...(['trader', 'dealer'].includes(user.seller_type) ? { opening_hours: form.openingHours } : {}),
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

  // Fixed when the account was created: a private account sees the private form, a trader the trader form.
  const isTrader = ['trader', 'dealer'].includes(user.seller_type); // business account
  const accountKind = user.seller_type === 'dealer' ? 'Dealer' : 'Trader';

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

        {/* Profile header card: a person for a private seller, the business for a trader */}
        <div className="bg-card rounded-xl border border-border mb-6 px-5 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <AvatarBadge url={user.avatar_url} isTrader={isTrader} className="w-16 h-16" />
            <input ref={photoInput} type="file" accept="image/*" className="hidden" onChange={changePhoto} />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">
                {isTrader ? (form.businessName || 'Your Business') : (form.name || 'Your Name')}
              </h2>
              <p className="text-xs text-muted-foreground truncate">
                {isTrader ? `${accountKind} account${form.name ? ' · ' + form.name : ''}` : 'Private account'}
              </p>
              <p className="text-xs mt-1.5 flex items-center gap-3">
                <button type="button" onClick={() => photoInput.current && photoInput.current.click()} disabled={photoBusy} className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline disabled:opacity-60">
                  <Camera className="w-3.5 h-3.5" />
                  {photoBusy ? 'Uploading…' : user.avatar_url ? 'Change Logo' : 'Add Logo'}
                </button>
                {user.avatar_url && !photoBusy && (
                  <button type="button" onClick={removePhoto} className="text-muted-foreground hover:text-foreground hover:underline">Remove</button>
                )}
              </p>
              {photoError && <p className="text-xs text-red-600 mt-1">{photoError}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Trader fields */}
          {isTrader && (
            <section className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Business Details</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">Business Name</label>
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

          {/* Dealer page: the photo behind the dealership card and the dealer page banner, and the opening hours */}
          {isTrader && (
            <section className="bg-card rounded-xl border border-border p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <Store className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">Your Dealer Page</h2>
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-foreground">Business Photo</label>
                <input ref={coverInput} type="file" accept="image/*" className="hidden" onChange={changeCover} />
                <div className="relative w-full h-36 sm:h-44 rounded-lg border border-border bg-secondary overflow-hidden flex items-center justify-center">
                  {user.cover_url
                    ? <img src={user.cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    : <span className="text-sm text-muted-foreground">No business photo yet</span>}
                </div>
                <p className="text-xs flex items-center gap-3 pt-1">
                  <button type="button" onClick={() => coverInput.current && coverInput.current.click()} disabled={coverBusy} className="inline-flex items-center gap-1.5 text-primary font-medium hover:underline disabled:opacity-60">
                    <Camera className="w-3.5 h-3.5" />
                    {coverBusy ? 'Uploading…' : user.cover_url ? 'Change Business Photo' : 'Add Business Photo'}
                  </button>
                  {user.cover_url && !coverBusy && (
                    <button type="button" onClick={removeCover} className="text-muted-foreground hover:text-foreground hover:underline">Remove</button>
                  )}
                </p>
                {coverError && <p className="text-xs text-red-600">{coverError}</p>}
                <p className="text-xs text-muted-foreground">A photo of your premises or stock. It is the background of your card in Dealers Garage and the banner of your dealer page.</p>
              </div>
              <div className="space-y-1.5 mt-5">
                <label className="block text-sm font-medium text-foreground">Opening Hours</label>
                <input
                  type="text"
                  value={form.openingHours}
                  onChange={set('openingHours')}
                  maxLength={200}
                  placeholder="e.g. Mon-Fri 9:00-18:00, Sat 10:00-14:00"
                  className="w-full h-10 px-3 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                />
                <p className="text-xs text-muted-foreground">Shown in the Contact Us tab of your dealer page.</p>
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
                <label className="block text-sm font-medium text-foreground">{isTrader ? 'Contact Name' : 'Full Name'}</label>
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
                <label className="block text-sm font-medium text-foreground">Phone Number</label>
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
                <label className="block text-sm font-medium text-foreground">County</label>
                <Select value={form.county} onValueChange={(v) => setForm((f) => ({ ...f, county: v, area: '' }))}>
                  <SelectTrigger className="h-10 bg-card"><SelectValue placeholder="Select your county" /></SelectTrigger>
                  <SelectContent>
                    {IRISH_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <label className="block text-sm font-medium text-foreground">Area / Town</label>
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

          {/* Notification Preferences */}
          <section className="bg-card rounded-xl border border-border p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Bell className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Notification Preferences</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'messages', title: 'Message alerts', text: 'Email me when someone sends a message about my listings' },
                { key: 'savedSearches', title: 'Saved search alerts', text: 'Email me when new listings match my saved searches' },
                { key: 'promotions', title: 'Promotions & offers', text: 'Email me about featured ad deals and platform promotions' },
              ].map((row, i) => (
                <React.Fragment key={row.key}>
                  {i > 0 && <div className="border-t border-border" />}
                  <label className="flex items-center justify-between gap-4 cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-foreground">{row.title}</p>
                      <p className="text-xs text-muted-foreground">{row.text}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notify[row.key]}
                      onChange={(e) => setNotify((n) => ({ ...n, [row.key]: e.target.checked }))}
                      className="w-5 h-5 rounded accent-primary shrink-0"
                    />
                  </label>
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* Account Info (read-only) */}
          <section className="bg-card rounded-xl border border-border p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Account Info</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 min-w-0">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Email:</span>
                <span className="text-foreground font-medium truncate">{form.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Role:</span>
                <span className="text-foreground font-medium capitalize">{user.role || 'user'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">Account type:</span>
                <span className="text-foreground font-medium">{isTrader ? accountKind : 'Private'}</span>
              </div>
              {memberSince && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="text-foreground font-medium">{memberSince}</span>
                </div>
              )}
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