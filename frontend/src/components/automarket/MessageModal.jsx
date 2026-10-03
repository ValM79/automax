import React, { useState } from 'react';
import { X, Send, CheckCircle2 } from 'lucide-react';

export default function MessageModal({ open, onClose, sellerName, adTitle, onSend, title = 'Send Message' }) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleSubmit = async () => {
    if (!message.trim()) return;
    setSending(true);
    setError('');
    try {
      await onSend(message);
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setMessage('');
        onClose();
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="min-w-[44px] min-h-[44px] flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        {sent ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-foreground font-medium">Message sent successfully!</p>
            <p className="text-sm text-muted-foreground mt-1">Your message has been emailed to {sellerName}.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-1">To: <span className="font-medium text-foreground">{sellerName}</span></p>
            <p className="text-sm text-muted-foreground mb-4">Regarding: <span className="font-medium text-foreground">{adTitle}</span></p>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={5}
              className="w-full border border-border rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={!message.trim() || sending}
              className="w-full mt-4 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {sending ? 'Sending...' : title}
            </button>
          </>
        )}
      </div>
    </div>
  );
}