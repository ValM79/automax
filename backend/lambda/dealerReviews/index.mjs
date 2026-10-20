// Reviews of a Dealer, shown in the Reviews tab of the dealer page.
//
// One endpoint, several actions (POST /functions/dealerReviews, body { action, ... }):
//   list    public. The dealer's reviews, the rating summary, and what the caller may do (review / reply).
//   submit  a signed-in user writes (or edits) their one review of a dealer: 1-5 stars and an optional comment.
//   delete  the reviewer removes their own review (an admin may remove any).
//   reply   the dealer answers a review on their own page (an empty reply removes it).
//   report  a signed-in user flags a review; it is emailed to support to be checked by hand.
//
// Who may review: a signed-in user who has sent this dealer a message through AutoMax (from the dealer page, or from one
// of the dealer's ads), never the dealer themselves. One review per person per dealer: writing again edits it.
// A review is public, but it never carries the reviewer's id or email, only "First L.".
import { createHash } from 'node:crypto';
import { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, nowIso, json, getUserFromEvent, getSecrets, sanitize } from '../_lib/common.mjs';

const MAX_REVIEWS = 500;
const COMMENT_MAX = 1000;
const REPLY_MAX = 1000;
const ID_RE = /^[A-Za-z0-9-]{8,64}$/;

// The review id is a hash of dealer + reviewer: one review per pair, and the id gives nothing away about the reviewer.
const reviewId = (dealerId, reviewerId) => createHash('sha256').update(`${dealerId}:${reviewerId}`).digest('hex').slice(0, 32);

// "Karina White" -> "Karina W."; anything that looks like an email (or is empty) -> "AutoMax user".
export function publicName(raw) {
  const text = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!text || text.includes('@')) return 'AutoMax user';
  const parts = text.split(' ');
  const first = parts[0].slice(0, 30);
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return last ? `${first} ${last.toUpperCase()}.` : first;
}

// Comment text: control characters out, spaces tidied, at most one blank line in a row.
export function cleanText(value, max) {
  return String(value ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, '')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

async function getDealer(dealerId) {
  if (!ID_RE.test(String(dealerId || ''))) return null;
  const res = await ddb.send(new GetCommand({ TableName: TABLES.User, Key: { id: dealerId } }));
  return res.Item && res.Item.seller_type === 'dealer' ? res.Item : null;
}

// Has this user sent the dealer a message (about any of the dealer's ads, or from the dealer page)?
async function hasMessagedDealer(userId, dealerId) {
  let key;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.Message,
      IndexName: 'byOwner',
      KeyConditionExpression: 'created_by_id = :u',
      FilterExpression: 'seller_user_id = :d',
      ExpressionAttributeValues: { ':u': userId, ':d': dealerId },
      ProjectionExpression: 'id',
      ExclusiveStartKey: key,
    }));
    if ((res.Items || []).length) return true;
    key = res.LastEvaluatedKey;
  } while (key);
  return false;
}

async function reviewsOf(dealerId) {
  const items = [];
  let key;
  do {
    const res = await ddb.send(new QueryCommand({
      TableName: TABLES.Review,
      IndexName: 'byDealer',
      KeyConditionExpression: 'dealer_id = :d',
      ExpressionAttributeValues: { ':d': dealerId },
      ScanIndexForward: false,
      ExclusiveStartKey: key,
    }));
    items.push(...(res.Items || []));
    key = res.LastEvaluatedKey;
  } while (key && items.length < MAX_REVIEWS);
  return items.filter((r) => !r.hidden);
}

const shape = (r, viewerId) => ({
  id: r.id,
  rating: r.rating,
  comment: r.comment || '',
  reviewer_name: r.reviewer_name || 'AutoMax user',
  created_date: r.created_date,
  ...(r.updated_date && r.updated_date !== r.created_date ? { updated_date: r.updated_date } : {}),
  ...(r.reply ? { reply: r.reply, reply_date: r.reply_date } : {}),
  mine: !!viewerId && r.reviewer_id === viewerId,
});

async function list(user, body) {
  const dealer = await getDealer(body.dealer_id);
  if (!dealer) return json(404, { error: 'Dealer not found' });
  const dealerId = dealer.id;
  // A dealer who switched reviews off shows no reviews (they are kept, and come back if it is switched on again).
  if (dealer.reviews_enabled === false) {
    return json(200, { enabled: false, summary: { count: 0, average: 0 }, reviews: [], viewer: { can_review: false, reason: 'disabled', is_dealer: !!user && user.id === dealerId } });
  }
  const items = await reviewsOf(dealerId);
  const count = items.length;
  const average = count ? Math.round((items.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10 : 0;

  let canReview = false;
  let reason = null;
  if (!user) reason = 'sign_in';
  else if (user.id === dealerId) reason = 'own_page';
  else if (await hasMessagedDealer(user.id, dealerId)) canReview = true;
  else reason = 'no_contact';

  return json(200, {
    summary: { count, average },
    reviews: items.map((r) => shape(r, user?.id)),
    viewer: { can_review: canReview, reason, is_dealer: !!user && user.id === dealerId },
  });
}

async function notifyDealer(dealer, review) {
  try {
    if (!dealer.email) return;
    const { RESEND_API_KEY } = await getSecrets();
    const origin = process.env.APP_ORIGIN || 'https://automax.ie';
    const stars = `${review.rating} star${review.rating === 1 ? '' : 's'}`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'AutoMax <noreply@automax.ie>',
        to: dealer.email,
        subject: `AutoMax: New ${stars} review on your dealer page`,
        text: `Hi ${sanitize(dealer.business_name || dealer.display_name) || 'there'},\n\n${review.reviewer_name} left a ${stars} review on your dealer page.${review.comment ? `\n\n"${sanitize(review.comment, 500)}"` : ''}\n\nRead it and reply here:\n${origin}/seller-ads/${dealer.id}`,
      }),
    });
    if (!res.ok) console.error('Review notification email failed:', res.status, await res.text());
  } catch (e) {
    console.log('Review notification email skipped:', e.message);
  }
}

async function submit(user, body) {
  if (!user) return json(401, { error: 'Please sign in to leave a review' });
  const dealer = await getDealer(body.dealer_id);
  if (!dealer) return json(404, { error: 'Dealer not found' });
  if (user.id === dealer.id) return json(403, { error: "You can't review your own dealership" });
  if (dealer.reviews_enabled === false) return json(403, { error: 'This dealer is not taking reviews' });
  if (!(await hasMessagedDealer(user.id, dealer.id))) {
    return json(403, { error: 'You can review a dealer once you have sent them a message through AutoMax' });
  }
  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return json(400, { error: 'Please choose 1 to 5 stars' });
  const comment = cleanText(body.comment, COMMENT_MAX);

  const profile = await ddb.send(new GetCommand({ TableName: TABLES.User, Key: { id: user.id } }));
  const id = reviewId(dealer.id, user.id);
  const existing = (await ddb.send(new GetCommand({ TableName: TABLES.Review, Key: { id } }))).Item;
  const now = nowIso();
  const item = {
    ...(existing || {}),
    id,
    dealer_id: dealer.id,
    reviewer_id: user.id,
    reviewer_name: publicName(profile.Item?.display_name || user.full_name),
    rating,
    comment,
    created_date: existing?.created_date || now,
    updated_date: now,
  };
  await ddb.send(new PutCommand({ TableName: TABLES.Review, Item: item }));
  if (!existing) await notifyDealer(dealer, item);
  return json(200, { success: true, review: shape(item, user.id) });
}

async function remove(user, body) {
  if (!user) return json(401, { error: 'Please sign in' });
  const id = String(body.review_id || '');
  const review = (await ddb.send(new GetCommand({ TableName: TABLES.Review, Key: { id } }))).Item;
  if (!review) return json(404, { error: 'Review not found' });
  if (review.reviewer_id !== user.id && user.role !== 'admin') return json(403, { error: 'You can only remove your own review' });
  await ddb.send(new DeleteCommand({ TableName: TABLES.Review, Key: { id } }));
  return json(200, { success: true });
}

async function reply(user, body) {
  if (!user) return json(401, { error: 'Please sign in' });
  const id = String(body.review_id || '');
  const review = (await ddb.send(new GetCommand({ TableName: TABLES.Review, Key: { id } }))).Item;
  if (!review) return json(404, { error: 'Review not found' });
  if (review.dealer_id !== user.id) return json(403, { error: 'Only the dealer can reply to a review' });
  const text = cleanText(body.reply, REPLY_MAX);
  if (!text) {
    await ddb.send(new UpdateCommand({ TableName: TABLES.Review, Key: { id }, UpdateExpression: 'REMOVE reply, reply_date' }));
    return json(200, { success: true });
  }
  await ddb.send(new UpdateCommand({
    TableName: TABLES.Review,
    Key: { id },
    UpdateExpression: 'SET reply = :r, reply_date = :d',
    ExpressionAttributeValues: { ':r': text, ':d': nowIso() },
  }));
  return json(200, { success: true, reply: text });
}

async function report(user, body) {
  if (!user) return json(401, { error: 'Please sign in to report a review' });
  const id = String(body.review_id || '');
  const review = (await ddb.send(new GetCommand({ TableName: TABLES.Review, Key: { id } }))).Item;
  if (!review) return json(404, { error: 'Review not found' });
  if (review.reviewer_id === user.id) return json(400, { error: "You can't report your own review" });
  const already = review.reported_by instanceof Set && review.reported_by.has(user.id);
  if (!already) {
    await ddb.send(new UpdateCommand({
      TableName: TABLES.Review,
      Key: { id },
      UpdateExpression: 'ADD reported_by :u SET last_reported = :now',
      ExpressionAttributeValues: { ':u': new Set([user.id]), ':now': nowIso() },
    }));
    try {
      const { RESEND_API_KEY } = await getSecrets();
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'AutoMax <noreply@automax.ie>',
          to: 'support@automax.ie',
          subject: 'AutoMax: A dealer review was reported',
          text: `A review was reported by ${sanitize(user.email, 200)}.\n\nReview id: ${id}\nDealer id: ${review.dealer_id}\nRating: ${review.rating}\nReviewer: ${sanitize(review.reviewer_name)}\nReason given: ${sanitize(body.reason, 300) || '(none)'}\n\nComment:\n${sanitize(review.comment, 1000)}\n\nTo hide it, set hidden = true on this item in the Automax-DealerReview table.`,
        }),
      });
    } catch (e) {
      console.log('Report email skipped:', e.message);
    }
  }
  return json(200, { success: true });
}

const ACTIONS = { list, submit, delete: remove, reply, report };
export const actions = ACTIONS; // for tests

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body || '{}');
    const action = ACTIONS[body.action];
    if (!action) return json(400, { error: 'Unknown action' });
    const user = await getUserFromEvent(event);
    return await action(user, body);
  } catch (error) {
    console.error('dealerReviews error:', error);
    return json(500, { error: 'Something went wrong' });
  }
};
