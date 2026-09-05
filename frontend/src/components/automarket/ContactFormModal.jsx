import React, { useState, useEffect } from 'react';
import { X, Paperclip, CheckCircle } from 'lucide-react';
import { api } from '@/api/apiClient';
import MobileSelect from './MobileSelect';

const reasonOptions = [
  { value: 'General Inquiry', email: 'info@automax.ie' },
  { value: 'Support / Help', email: 'support@automax.ie' },
  { value: 'Privacy / GDPR', email: 'privacy@automax.ie' },
  { value: 'Dealer Inquiry', email: 'dealers@automax.ie' },
  { value: 'Advertising', email: 'advertise@automax.ie' },
  { value: 'Report a Problem', email: 'support@automax.ie' },
  { value: 'Other', email: 'info@automax.ie' }
];

export default function ContactFormModal({ isOpen, onClose, defaultReason }) {
  const [form, setForm] = useState({
    email: '',
    name: '',
    mobile: '',
    reason: '',
    subject: '',
    description: ''
  });
  const [attachments, setAttachments] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && defaultReason) {
      setForm(f => ({ ...f, reason: defaultReason }));
    }
  }, [isOpen, defaultReason]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.name || !form.mobile || !form.reason || !form.description) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const uploadedUrls = [];
      for (const file of attachments) {
        const result = await api.integrations.Core.UploadFile({ file });
        uploadedUrls.push(result.file_url);
      }

      const res = await api.functions.invoke('submitContactForm', {
        ...form,
        attachments: uploadedUrls
      });

      if (res.data.success) {
        setSubmitted(true);
      } else {
        setError(res.data.error || 'Failed to send message.');
      }
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmitted(false);
    setForm({ email: '', name: '', mobile: '', reason: '', subject: '', description: '' });
    setAttachments([]);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
      <div className="bg-card rounded-2xl shadow-xl w-full max-w-2xl max-h-[calc(100vh-4rem)] flex flex-col">
        <div className="flex items-center justify-between px-8 pt-7 pb-4 border-b border-border flex-shrink-0">
          <h1 className="text-2xl font-bold text-foreground">Submit a request</h1>
          <button onClick={handleClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="px-8 py-16 text-center">
            <CheckCircle className="w-12 h-12 text-accent mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">Request Submitted!</h3>
            <p className="text-muted-foreground text-sm mb-6">We'll get back to you within 24 hours.</p>
            <button onClick={handleClose} className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary/90 transition-colors">
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5 overflow-y-auto">
            <p className="text-sm text-muted-foreground">Fields marked with an asterisk (*) are required.</p>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Your email address *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Your name *</label>
              <p className="text-xs text-muted-foreground mb-1.5">This is what we'll call you.</p>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Mobile number *</label>
              <p className="text-xs text-muted-foreground mb-1.5">Please enter your current mobile number</p>
              <input
                type="tel"
                required
                value={form.mobile}
                onChange={(e) => setForm(f => ({ ...f, mobile: e.target.value }))}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Reason for Contact *</label>
              <p className="text-xs text-muted-foreground mb-1.5">Please select the reason for contact that best fits your request.</p>
              <MobileSelect
                value={form.reason}
                onChange={(val) => setForm(f => ({ ...f, reason: val }))}
                options={reasonOptions.map(opt => opt.value)}
                placeholder="-"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Description *</label>
              <textarea
                required
                rows={7}
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                className="w-full border border-border rounded-lg px-4 py-2.5 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Attachments</label>
              <div className="border border-dashed border-border rounded-lg p-4">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-primary hover:underline">
                  <Paperclip className="w-4 h-4" />
                  <span>Add file</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) {
                        setAttachments(prev => [...prev, ...Array.from(e.target.files)]);
                      }
                    }}
                  />
                </label>
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((file, i) => (
                      <div key={i} className="flex items-center justify-between text-sm bg-secondary/50 rounded px-3 py-1.5">
                        <span className="truncate flex-1">{file.name}</span>
                        <button type="button" onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive ml-2 flex-shrink-0 min-w-[44px] min-h-[44px] flex items-center justify-center">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="bg-primary text-white font-semibold px-8 py-2.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60"
            >
              {submitting ? 'Sending...' : 'Submit'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}