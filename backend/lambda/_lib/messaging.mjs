/**
 * Decides who a reply goes to. `orig` is the message being replied to.
 *
 * Only the person a message was addressed to may reply to it (a message's
 * `seller_user_id` is its recipient, for replies too -- see contactSeller), and
 * only within the same ad, so the endpoint can't be used to mail arbitrary users.
 * Returns { recipient } or { status, error }.
 */
export function resolveReply(orig, user, adId) {
  if (!orig) return { status: 404, error: 'Message not found' };
  if (orig.seller_user_id !== user.id) return { status: 403, error: 'You can only reply to messages sent to you' };
  if (orig.ad_id !== adId) return { status: 400, error: 'Message does not belong to this ad' };
  if (!orig.created_by_id) return { status: 400, error: 'This message cannot be replied to' };
  return {
    recipient: {
      userId: orig.created_by_id,
      email: orig.sender_email || '',
      name: orig.sender_name || '',
    },
  };
}
