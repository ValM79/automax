import React, { useState, useEffect, useMemo, useRef } from 'react';
import BackButton from '../components/automarket/BackButton';
import { MessageSquare, Trash2, Flag, Ban, ChevronDown, ChevronUp, ChevronLeft, Send } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/automarket/Navbar';
import Footer from '../components/automarket/Footer';
import { useAuth } from '@/lib/AuthContext';
import { api } from '@/api/apiClient';
import PullToRefresh from '../components/automarket/PullToRefresh';
import { queryClientInstance } from '@/lib/query-client';
import { useToast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { getBlocked, isBlocked, blockUser, unblockUser } from '@/lib/blocklist';
import { buildThreads, isReceivedByMe, isSentByMe, latestReceived } from '@/lib/conversations';

const formatWhen = (iso) =>
  iso ? new Date(iso).toLocaleString('en-IE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(() => getBlocked());
  const [showBlocked, setShowBlocked] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [reportTarget, setReportTarget] = useState(null); // the message being reported
  const [reportText, setReportText] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const { user, isLoadingAuth } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeKey = searchParams.get('thread');
  const threadEndRef = useRef(null);

  useEffect(() => {
    if (isLoadingAuth) return;
    if (!user) {
      navigate('/login?next=/messages', { replace: true });
      return;
    }
    loadMessages();
  }, [isLoadingAuth, user]);

  const loadMessages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const records = await api.entities.Message.list('-created_date', 200);
      setMessages(records);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoading(false);
    }
  };

  // Conversations, hiding anything from senders the user has blocked.
  const threads = useMemo(() => {
    if (!user) return [];
    const visible = messages.filter((m) => m.sender_email === user.email || !isBlocked(m.sender_email));
    return buildThreads(visible, user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, user, blocked]);

  const activeThread = activeKey ? threads.find((t) => t.key === activeKey) : null;

  // Opening a conversation marks what was sent to me as read.
  useEffect(() => {
    if (!activeThread || !user) return;
    const unread = activeThread.messages.filter((m) => isReceivedByMe(m, user) && m.status !== 'read');
    if (unread.length === 0) return;
    const ids = new Set(unread.map((m) => m.id));
    setMessages((prev) => prev.map((m) => (ids.has(m.id) ? { ...m, status: 'read' } : m)));
    unread.forEach((m) => api.entities.Message.update(m.id, { status: 'read' }).catch(() => {}));
  }, [activeKey, messages]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ block: 'end' });
  }, [activeKey, activeThread?.messages.length]);

  const openThread = (key) => {
    setDraft('');
    setSendError('');
    setSearchParams({ thread: key });
  };
  const closeThread = () => setSearchParams({});

  // A reply is attached to the newest message addressed to me; if the other person has not
  // written yet, this is another message from me about the ad.
  const sendInThread = async () => {
    const text = draft.trim();
    if (!text || !activeThread || sending) return;
    setSending(true);
    setSendError('');
    try {
      const received = latestReceived(activeThread, user);
      await api.functions.invoke(
        'contactSeller',
        received
          ? { ad_id: activeThread.adId, message: text, reply_to_message_id: received.id }
          : { ad_id: activeThread.adId, message: text }
      );
      setDraft('');
      await loadMessages(true);
    } catch (err) {
      setSendError(err?.message || 'Could not send your message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async () => {
    if (!activeThread) return;
    if (!window.confirm('Delete this conversation? Its messages are removed for both of you.')) return;
    const ids = activeThread.messages.map((m) => m.id);
    try {
      await Promise.all(ids.map((id) => api.entities.Message.delete(id)));
      setMessages((prev) => prev.filter((m) => !ids.includes(m.id)));
      closeThread();
    } catch {
      toast({ title: 'Could not delete the conversation', description: 'Please try again.' });
    }
  };

  const handleBlock = (email, name) => {
    if (!email) return;
    if (!window.confirm(`Block ${name || email}? You will no longer see their messages on this device. You can unblock them any time from "Blocked users" at the top of Messages.`)) return;
    setBlocked(blockUser(email));
    closeThread();
    toast({
      title: `${name || email} blocked`,
      description: 'Their messages are hidden. You can unblock them from "Blocked users" at the top of Messages.',
      action: <ToastAction altText="Undo block" onClick={() => setBlocked(unblockUser(email))}>Undo</ToastAction>,
    });
  };

  const handleUnblock = (email) => {
    setBlocked(unblockUser(email));
    toast({ title: 'Unblocked', description: `${nameForBlocked(email)}'s messages are visible again.` });
  };

  // Blocked senders are hidden from the list, so look their name up from the loaded messages.
  const nameForBlocked = (email) =>
    messages.find((m) => m.sender_email === email && m.sender_name)?.sender_name || email;

  const submitReport = async () => {
    const msg = reportTarget;
    if (!msg) return;
    setReportSubmitting(true);
    // Reporting only reports: the person is not blocked (the user can block separately).
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
      // Nothing else protects the user here, so don't pretend it worked; keep the dialog open.
      setReportSubmitting(false);
      toast({ title: 'Could not send your report', description: 'Please check your connection and try again.' });
      return;
    }
    setReportSubmitting(false);
    setReportTarget(null);
    setReportText('');
    toast({
      title: 'Report submitted',
      description: 'Thanks for flagging this. Our team reviews reports within 24 hours. You can also block this person from the conversation.',
    });
  };

  if (isLoadingAuth || loading || !user) {
    return (
      <div className="min-h-screen flex flex-col bg-muted">
        <Navbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" />
        </div>
        <div className="mt-auto"><Footer /></div>
      </div>
    );
  }

  const received = activeThread ? latestReceived(activeThread, user) : null;
  const lastFromThem = activeThread
    ? [...activeThread.messages].reverse().find((m) => isReceivedByMe(m, user))
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-muted">
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

        {activeThread ? (
          /* ------------------------------ One conversation ------------------------------ */
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 p-3 border-b border-border">
              <button
                onClick={closeThread}
                aria-label="Back to all messages"
                className="min-w-[44px] min-h-[44px] flex items-center justify-center text-foreground hover:bg-secondary rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-foreground truncate">{activeThread.other.name || activeThread.other.email || 'AutoMax user'}</p>
                {activeThread.adTitle && (
                  <Link to={`/vehicle/${activeThread.adId}`} className="text-xs text-primary hover:underline truncate block">
                    Re: {activeThread.adTitle}
                  </Link>
                )}
              </div>
              {lastFromThem && (
                <>
                  <button
                    onClick={() => { setReportText(''); setReportTarget(lastFromThem); }}
                    title="Report this person"
                    aria-label="Report this person"
                    className="text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleBlock(lastFromThem.sender_email, lastFromThem.sender_name)}
                    title="Block this person"
                    aria-label="Block this person"
                    className="text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={deleteConversation}
                title="Delete conversation"
                aria-label="Delete conversation"
                className="text-muted-foreground hover:text-destructive transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-3 bg-muted/40">
              {activeThread.messages.map((m) => {
                const mine = isSentByMe(m, user);
                return (
                  <div key={m.id} className={`flex flex-col max-w-[85%] ${mine ? 'self-end items-end' : 'self-start items-start'}`}>
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                        mine ? 'bg-primary text-primary-foreground rounded-br-md' : 'bg-card border border-border text-foreground rounded-bl-md'
                      }`}
                    >
                      {m.message}
                    </div>
                    <span className="text-[11px] text-muted-foreground mt-1">{formatWhen(m.created_date)}</span>
                  </div>
                );
              })}
              <div ref={threadEndRef} />
            </div>

            <div className="p-3 border-t border-border bg-card">
              {activeThread.adId ? (
                <>
                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      maxLength={2000}
                      placeholder={received ? 'Write a reply…' : 'Write a message…'}
                      className="flex-1 rounded-lg border border-border bg-background p-2.5 text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
                    />
                    <button
                      onClick={sendInThread}
                      disabled={!draft.trim() || sending}
                      aria-label="Send"
                      className="min-w-[44px] min-h-[44px] rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-1.5 px-3 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                  {sendError && <p className="text-sm text-destructive mt-2">{sendError}</p>}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">This conversation is no longer linked to an ad, so it can't be replied to.</p>
              )}
            </div>
          </div>
        ) : (
          /* ------------------------------ Conversation list ------------------------------ */
          <>
            <h1 className="text-3xl font-bold text-foreground mb-6">Messages</h1>

            {/* Blocked users: shown right under the heading (open by default) so unblocking is easy to find. */}
            {blocked.length > 0 && (
              <div className="mb-6 bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <button
                  onClick={() => setShowBlocked((v) => !v)}
                  className="w-full flex items-center justify-between gap-2 p-4 text-left"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Ban className="w-4 h-4 text-muted-foreground" /> Blocked users ({blocked.length})
                  </span>
                  {showBlocked ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </button>
                {showBlocked && (
                  <div className="border-t border-border divide-y divide-border">
                    {blocked.map((email) => {
                      const name = nameForBlocked(email);
                      return (
                        <div key={email} className="flex items-center justify-between gap-3 p-4">
                          <span className="min-w-0">
                            <span className="block text-sm font-medium text-foreground truncate">{name}</span>
                            {name !== email && <span className="block text-xs text-muted-foreground truncate">{email}</span>}
                          </span>
                          <button
                            onClick={() => handleUnblock(email)}
                            className="flex-shrink-0 min-h-[44px] px-4 rounded-lg border border-foreground text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                          >
                            Unblock
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {threads.length === 0 ? (
              <div className="bg-card rounded-xl border border-border shadow-sm p-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">No messages yet</p>
                <p className="text-sm text-muted-foreground">Your conversations with buyers and sellers will appear here</p>
              </div>
            ) : (
              <div className="bg-card rounded-xl border border-border shadow-sm divide-y divide-border overflow-hidden">
                {threads.map((t) => {
                  const name = t.other.name || t.other.email || 'AutoMax user';
                  const mine = isSentByMe(t.last, user);
                  return (
                    <button
                      key={t.key}
                      onClick={() => openThread(t.key)}
                      className="w-full text-left flex items-center gap-3 p-4 hover:bg-secondary/60 transition-colors"
                    >
                      <span className="w-11 h-11 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center flex-shrink-0">
                        {name.charAt(0).toUpperCase()}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${t.unread ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>{name}</span>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">{formatWhen(t.last.created_date)}</span>
                        </span>
                        {t.adTitle && <span className="block text-xs text-muted-foreground truncate">Re: {t.adTitle}</span>}
                        <span className={`block text-sm truncate ${t.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                          {mine ? 'You: ' : ''}{t.last.message}
                        </span>
                      </span>
                      {t.unread > 0 && (
                        <span className="min-w-[22px] h-[22px] rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center px-1.5 flex-shrink-0">
                          {t.unread}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

          </>
        )}
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
              Reports are reviewed within 24 hours. This doesn't block them; you can do that separately from the conversation.
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
                {reportSubmitting ? 'Submitting…' : 'Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto"><Footer /></div>
    </div>
  );
}
