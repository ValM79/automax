import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { api } from '@/api/apiClient';

// The Reviews tab of a dealer page: rating summary, the visitor's own review form, and the reviews with the dealer's
// replies. `data` is what the dealerReviews function's "list" action returned; `reload` fetches it again after a change.
// Who may review is decided by the server (a signed-in user who has messaged the dealer), this only shows the result.

export function Stars({ value, size = 'w-4 h-4' }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${size} ${value >= n - 0.25 ? 'text-amber-400 fill-amber-400' : value >= n - 0.75 ? 'text-amber-400 fill-amber-200' : 'text-border fill-transparent'}`} strokeWidth={1.5} />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="inline-flex items-center gap-1" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n === 1 ? '' : 's'}`}
          disabled={disabled}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(n)}
          className="p-0.5 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
          <Star className={`w-8 h-8 transition-colors ${shown >= n ? 'text-amber-400 fill-amber-400' : 'text-border fill-transparent'}`} strokeWidth={1.5} />
        </button>
      ))}
    </div>
  );
}

const RATING_WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const formatDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fieldClass = 'w-full px-3 py-2 text-sm border border-border rounded-md bg-card focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-y';
const primaryBtn = 'h-10 px-5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60';
const linkBtn = 'text-xs font-medium text-primary hover:underline';

function ReviewForm({ dealerId, existing, onDone, onRemoved }) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setError('Please choose a star rating.'); return; }
    setBusy(true); setError('');
    try {
      await api.functions.invoke('dealerReviews', { action: 'submit', dealer_id: dealerId, rating, comment });
      await onDone();
    } catch (err) {
      setError(err.message || 'Could not save your review. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Remove your review?')) return;
    setBusy(true); setError('');
    try {
      await api.functions.invoke('dealerReviews', { action: 'delete', review_id: existing.id });
      setRating(0); setComment('');
      await onRemoved();
    } catch (err) {
      setError(err.message || 'Could not remove your review.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-2xl p-5 sm:p-6">
      <h3 className="text-base font-bold text-foreground mb-3">{existing ? 'Your review' : 'Write a review'}</h3>
      <div className="flex items-center gap-3 mb-4">
        <StarPicker value={rating} onChange={setRating} disabled={busy} />
        <span className="text-sm text-muted-foreground">{RATING_WORDS[rating]}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={1000}
        rows={4}
        disabled={busy}
        placeholder="How was your experience with this dealer? (optional)"
        className={fieldClass} />
      <p className="text-xs text-muted-foreground mt-1">{comment.length}/1000. Your first name and the first letter of your last name are shown with your review.</p>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
      <div className="flex items-center gap-4 mt-4">
        <button type="submit" disabled={busy} className={primaryBtn}>{busy ? 'Saving…' : existing ? 'Update review' : 'Post review'}</button>
        {existing && <button type="button" onClick={remove} disabled={busy} className="text-sm text-muted-foreground hover:text-foreground hover:underline">Remove my review</button>}
      </div>
    </form>
  );
}

function ReplyForm({ review, onDone, onCancel }) {
  const [text, setText] = useState(review.reply || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async () => {
    setBusy(true); setError('');
    try {
      await api.functions.invoke('dealerReviews', { action: 'reply', review_id: review.id, reply: text });
      await onDone();
    } catch (err) {
      setError(err.message || 'Could not save your reply.');
      setBusy(false);
    }
  };
  return (
    <div className="mt-3">
      <textarea value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} rows={3} disabled={busy} placeholder="Write your reply" className={fieldClass} />
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      <div className="flex items-center gap-4 mt-2">
        <button type="button" onClick={save} disabled={busy || (!text.trim() && !review.reply)} className={primaryBtn}>{busy ? 'Saving…' : 'Post reply'}</button>
        <button type="button" onClick={onCancel} disabled={busy} className="text-sm text-muted-foreground hover:text-foreground hover:underline">Cancel</button>
      </div>
      {review.reply && <p className="text-xs text-muted-foreground mt-2">To remove your reply, clear the box and press Post reply.</p>}
    </div>
  );
}

function ReviewItem({ review, dealerName, isDealer, canReport, readOnly, reload }) {
  const [replying, setReplying] = useState(false);
  const [reported, setReported] = useState(false);

  const report = async () => {
    if (!window.confirm('Report this review to AutoMax? We will check it.')) return;
    try {
      await api.functions.invoke('dealerReviews', { action: 'report', review_id: review.id });
      setReported(true);
    } catch (err) {
      window.alert(err.message || 'Could not send your report.');
    }
  };

  return (
    <li className="bg-card border border-border rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Stars value={review.rating} />
        <span className="font-semibold text-foreground">{review.reviewer_name}</span>
        <span className="text-xs text-muted-foreground">{formatDate(review.created_date)}{review.updated_date ? ' (edited)' : ''}</span>
        {review.mine && <span className="text-xs font-medium text-primary">Your review</span>}
      </div>
      {review.comment && <p className="mt-2 text-sm text-foreground whitespace-pre-line break-words">{review.comment}</p>}

      {review.reply && !replying && (
        <div className="mt-4 border-l-2 border-primary/40 pl-4">
          <p className="text-xs font-semibold text-foreground">Reply from {dealerName} <span className="font-normal text-muted-foreground">· {formatDate(review.reply_date)}</span></p>
          <p className="mt-1 text-sm text-foreground whitespace-pre-line break-words">{review.reply}</p>
        </div>
      )}

      {replying && <ReplyForm review={review} onCancel={() => setReplying(false)} onDone={async () => { await reload(); setReplying(false); }} />}

      {!readOnly && !replying && (
        <div className="mt-3 flex items-center gap-4">
          {isDealer && <button type="button" onClick={() => setReplying(true)} className={linkBtn}>{review.reply ? 'Edit reply' : 'Reply'}</button>}
          {canReport && !review.mine && (reported
            ? <span className="text-xs text-muted-foreground">Reported. Thank you.</span>
            : <button type="button" onClick={report} className="text-xs text-muted-foreground hover:text-foreground hover:underline">Report</button>)}
        </div>
      )}
    </li>
  );
}

export default function DealerReviews({ dealerId, dealerName, data, loading, user, reload, onSignIn, onMessage, canMessage, readOnly = false }) {
  if (loading && !data) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-slate-800 rounded-full animate-spin" /></div>;
  }
  if (!data) {
    return (
      <div className="max-w-2xl mx-auto bg-card border border-border rounded-2xl p-8 text-center">
        <p className="text-sm text-muted-foreground">Reviews could not be loaded. Please try again later.</p>
      </div>
    );
  }

  const { summary, reviews, viewer } = data;
  const mine = reviews.find((r) => r.mine);

  let action = null;
  if (readOnly) {
    action = null;
  } else if (viewer.can_review) {
    action = <ReviewForm key={mine ? mine.id + (mine.updated_date || '') : 'new'} dealerId={dealerId} existing={mine} onDone={reload} onRemoved={reload} />;
  } else if (viewer.reason === 'sign_in') {
    action = (
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 text-center">
        <p className="text-sm text-foreground mb-3">Sign in and send {dealerName} a message to leave a review.</p>
        <button type="button" onClick={onSignIn} className={primaryBtn}>Sign in</button>
      </div>
    );
  } else if (viewer.reason === 'no_contact') {
    action = (
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 text-center">
        <p className="text-sm text-foreground mb-3">You can review {dealerName} once you have sent them a message through AutoMax.</p>
        {canMessage && <button type="button" onClick={onMessage} className={primaryBtn}>Message {dealerName}</button>}
      </div>
    );
  } else if (viewer.reason === 'own_page') {
    action = (
      <div className="bg-secondary rounded-2xl p-5 text-sm text-foreground text-center">
        Buyers who have messaged you can review your dealership here. Press <strong>Reply</strong> under a review to answer it.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 flex items-center gap-5">
        {summary.count > 0 ? (
          <>
            <div className="text-5xl font-bold text-foreground leading-none">{summary.average.toFixed(1)}</div>
            <div>
              <Stars value={summary.average} size="w-5 h-5" />
              <p className="text-sm text-muted-foreground mt-1">{summary.count} review{summary.count === 1 ? '' : 's'}</p>
            </div>
          </>
        ) : (
          <div>
            <p className="text-lg font-semibold text-foreground">No reviews yet</p>
            <p className="text-sm text-muted-foreground">Buyers who have messaged {dealerName} can review them here.</p>
          </div>
        )}
      </div>

      {action}

      {reviews.length > 0 && (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <ReviewItem key={r.id} review={r} dealerName={dealerName} isDealer={viewer.is_dealer} canReport={!!user} readOnly={readOnly} reload={reload} />
          ))}
        </ul>
      )}
    </div>
  );
}
