import React, { useState, useEffect } from 'react';
import BackButton from '../components/automarket/BackButton';
import { MessageSquare, Trash2, Flag, Ban, ChevronDown, ChevronUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';
import { useToast } from '@/components/ui/use-toast';
import { getBlocked, isBlocked, blockUser, unblockUser } from '@/lib/blocklist';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(() => getBlocked());
  const [showBlocked, setShowBlocked] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // the message being reported
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const { user, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      navigate('/login?next=/messages', { replace: true });
      return;
    }
    loadMessages();
  }, [isLoadingAuth, user]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const records = await api.entities.Message.list('-created_date', 100);
      setMessages(records);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    await api.entities.Message.delete(id);
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const handleBlock = (email, name) => {
    if (!email) return;
    if (!window.confirm(`Block ${name || email}? You will no longer see messages from this person, and they cannot contact you about your ads.`)) return;
    setBlocked(blockUser(email));
    toast({ title: 'User blocked', description: `You will no longer receive messages from ${name || email}.` });
  };

  const handleUnblock = (email) => {
    setBlocked(unblockUser(email));
  };

  const submitReport = async () => {
    const msg = reportTarget;
    if (!msg) return;
    setReportSubmitting(true);
    // Best-effort forward to the AutoMax team. The block below is what actually
    // protects the user, so a failed send is not surfaced as an error.
    try {
      await api.functions.invoke('submitContactForm', {
        email: user?.email || 'unknown',
        name: user?.full_name || user?.name || user?.email || 'AutoMax user',
        mobile: user?.phone || user?.phone_number || 'Not provided',
        reason: 'Report a Problem',
        subject: 'Reported abusive message',
        description:
          `Reported sender: ${msg.sender_name || ''} <${msg.sender_email || ''}>\n` +
          `Ad: ${msg.ad_title || 'n/a'}\n` +
          `Message: ${msg.message || ''}\n` +
          `Reporter note: ${reportText || '(none)'}`,
      });
    } catch {
      /* ignore — the block still applies */
    }
    if (msg.sender_email) setBlocked(blockUser(msg.sender_email));
    setReportSubmitting(false);
    setReportTarget(null);
    setReportText('');
    toast({
      title: 'Report submitted',
      description: 'Thanks for flagging this. Our team reviews reports within 24 hours. This person has also been blocked.',
    });
  };

  const visibleMessages = messages.filter(
    m => m.sender_email === user?.email || !isBlocked(m.sender_email)
  );

  if (isLoadingAuth || loading) {
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

  if (!user) {
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
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <BackButton />
          <span>›</span>
          <Link to="/" className="hover:text-primary transition-colors">Home</Link>
          <span>›</span>
          <span className="text-foreground font-medium">Messages</span>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Messages</h1>

        {visibleMessages.length === 0 ? (
          <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">No messages yet</p>
            <p className="text-sm text-muted-foreground">Messages you send to sellers will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleMessages.map(msg => {
              const isSentByMe = msg.sender_email === user.email;
              return (
                <div key={msg.id} className="bg-card rounded-xl border border-border shadow-sm p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isSentByMe ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                          {isSentByMe ? 'Sent' : 'Received'}
                        </span>
                        <span className="text-sm font-medium text-foreground">{isSentByMe ? msg.seller_name : msg.sender_name}</span>
                      </div>
                      {msg.ad_title && <p className="text-xs text-muted-foreground mb-2">Re: {msg.ad_title}</p>}
                      <p className="text-sm text-foreground">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {msg.created_date ? new Date(msg.created_date).toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-center flex-shrink-0">
                      {!isSentByMe && (
                        <>
                          <button
                            onClick={() => { setReportText(''); setReportTarget(msg); }}
                            title="Report this message"
                            className="text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <Flag className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleBlock(msg.sender_email, msg.sender_name)}
                            title="Block this sender"
                            className="text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleDelete(msg.id)}
                        title="Delete"
                        className="text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Blocked users */}
        <div className="mt-8">
          <button
            onClick={() => setShowBlocked(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Blocked users ({blocked.length})
            {showBlocked ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showBlocked && (
            <div className="mt-3 bg-card rounded-xl border border-border shadow-sm divide-y divide-border">
              {blocked.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">You haven't blocked anyone.</p>
              ) : (
                blocked.map(email => (
                  <div key={email} className="flex items-center justify-between gap-3 p-4">
                    <span className="text-sm text-foreground truncate">{email}</span>
                    <button
                      onClick={() => handleUnblock(email)}
                      className="text-sm font-medium text-primary hover:underline flex-shrink-0 min-h-[44px]"
                    >
                      Unblock
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
      </PullToRefresh>

      {/* Report modal */}
      {reportTarget && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => !reportSubmitting && setReportTarget(null)}>
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <Flag className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-bold text-foreground">Report message</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Report this message from <span className="font-medium text-foreground">{reportTarget.sender_name || reportTarget.sender_email}</span> to the AutoMax team.
              The sender will also be blocked. Reports are reviewed within 24 hours.
            </p>
            <label className="text-sm font-semibold text-foreground mb-1 block">What's wrong? (optional)</label>
            <textarea
              value={reportText}
              onChange={e => setReportText(e.target.value)}
              rows={3}
              placeholder="Abusive, spam, scam, harassment…"
              className="w-full rounded-lg border border-border bg-background p-2 text-sm text-foreground mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setReportTarget(null)}
                disabled={reportSubmitting}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-50 min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={submitReport}
                disabled={reportSubmitting}
                className="px-4 py-2 text-sm font-medium bg-destructive text-white rounded-lg hover:opacity-90 disabled:opacity-50 min-h-[44px]"
              >
                {reportSubmitting ? 'Submitting…' : 'Report & block'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
