// Turns the flat list of Message records into conversations.
//
// A message stores its recipient in the seller_* fields (for replies too, see
// backend contactSeller), so "the other person" in a message is the recipient if I
// sent it, otherwise the sender. A conversation is every message about one ad with
// one other person. Its key ("<adId>:<otherUserId>") is also what the notification
// email links to, so the backend builds the same string.

export function otherParty(message, me) {
  const sentByMe = message.created_by_id === me.id || message.sender_email === me.email;
  return sentByMe
    ? { id: message.seller_user_id || '', email: message.seller_email || '', name: message.seller_name || '' }
    : { id: message.created_by_id || '', email: message.sender_email || '', name: message.sender_name || '' };
}

export const isSentByMe = (message, me) =>
  message.created_by_id === me.id || message.sender_email === me.email;

export const isReceivedByMe = (message, me) => !isSentByMe(message, me);

export function threadKey(message, me) {
  const other = otherParty(message, me);
  return `${message.ad_id || ''}:${other.id || other.email}`;
}

/** Conversations, most recently active first; messages inside each are oldest first. */
export function buildThreads(messages, me) {
  const byKey = new Map();
  for (const message of messages) {
    const key = threadKey(message, me);
    if (!byKey.has(key)) {
      const other = otherParty(message, me);
      byKey.set(key, { key, adId: message.ad_id || '', adTitle: message.ad_title || '', other, messages: [] });
    }
    const thread = byKey.get(key);
    thread.messages.push(message);
    // Prefer a real name over an empty one if any message in the thread has it.
    const other = otherParty(message, me);
    if (!thread.other.name && other.name) thread.other = { ...thread.other, name: other.name };
    if (!thread.adTitle && message.ad_title) thread.adTitle = message.ad_title;
  }
  const threads = [...byKey.values()].map((thread) => {
    thread.messages.sort((a, b) => String(a.created_date).localeCompare(String(b.created_date)));
    const last = thread.messages[thread.messages.length - 1];
    const unread = thread.messages.filter((m) => isReceivedByMe(m, me) && m.status !== 'read').length;
    return { ...thread, last, unread };
  });
  threads.sort((a, b) => String(b.last.created_date).localeCompare(String(a.last.created_date)));
  return threads;
}

/** The newest message addressed to me in a thread -- the one a reply is attached to. */
export function latestReceived(thread, me) {
  for (let i = thread.messages.length - 1; i >= 0; i--) {
    const m = thread.messages[i];
    if (isReceivedByMe(m, me) && m.seller_user_id === me.id) return m;
  }
  return null;
}
