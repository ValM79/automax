// Write rules for the UserAd entity that entity-api enforces on non-admin owners.
//
// An ad's owner may edit its ordinary fields (title, price, photos, ...) but never
// the ones that say what was paid for or how it has performed. Those are written
// only by the server-side lambdas that own them:
//   stripeWebhook / verifyAppleTransaction -> status, packageName, listingDays,
//     spotlight, paymentAmount, receiptUrl, lastStripeSessionId, appleTransactionId,
//     paymentHistory, originalCreatedDate, renewCount (and created_date on renewal)
//   recordAdView / toggleAdSave            -> view_count, save_count
//   adLifecycle                            -> status active -> expired, deleting abandoned drafts
// Without this an owner could PUT { status: 'active' } on an unpaid ad, stretch
// listingDays, or fake a payment record by calling the API directly.

const DAY_MS = 24 * 60 * 60 * 1000;

export const SERVER_CONTROLLED_FIELDS = [
  'packageName',
  'listingDays',
  'spotlight',
  'paymentAmount',
  'paymentHistory',
  'receiptUrl',
  'lastStripeSessionId',
  'appleTransactionId',
  'originalCreatedDate',
  'renewCount',
  'view_count',
  'save_count',
  'updated_date',
];

function stripServerFields(body) {
  const clean = { ...body };
  for (const field of SERVER_CONTROLLED_FIELDS) delete clean[field];
  return clean;
}

/** True once the ad's paid listing period (counted from created_date) has run out. */
function listingPeriodEnded(ad, now) {
  const endsAt = Date.parse(ad.created_date) + Number(ad.listingDays) * DAY_MS;
  // No readable paid period -> treat as ended, so a malformed ad can't be revived.
  return !Number.isFinite(endsAt) || endsAt <= now;
}

const forbidden = (message) => ({ error: { statusCode: 403, message } });

/**
 * Body for a new ad. Every ad starts 'pending' and unpaid; only a verified
 * payment (webhook / Apple verification) activates it.
 */
export function sanitizeUserAdCreate(body, user) {
  if (user?.role === 'admin') return body;
  return { ...stripServerFields(body), status: 'pending' };
}

/**
 * Body for an update by the ad's owner, or { error: { statusCode, message } }.
 * `existing` is the stored ad; `now` is epoch ms (injectable for tests).
 * Owner-allowed status changes:
 *   active -> sold
 *   sold   -> active   only if the ad was paid for (packageName) and its period has not ended
 *   sold   -> expired  only if paid and the period HAS ended (what My Ads sends when a sold
 *                      ad is "marked active" after its listing period lapsed, so Renew lists it again)
 * Server-controlled fields in the body are dropped; a status equal to the current one is a no-op.
 */
export function sanitizeUserAdUpdate(existing, body, user, now = Date.now()) {
  if (user?.role === 'admin') return { body };

  const clean = stripServerFields(body);
  if (!('status' in clean)) return { body: clean };

  const from = existing.status;
  const to = clean.status;
  delete clean.status;
  if (to === from) return { body: clean };

  if (from === 'active' && to === 'sold') return { body: { ...clean, status: 'sold' } };

  if (from === 'sold' && (to === 'active' || to === 'expired')) {
    if (!existing.packageName) return forbidden('This ad has not been paid for');
    const ended = listingPeriodEnded(existing, now);
    if (to === 'active' && ended) return forbidden('The listing period of this ad has ended');
    if (to === 'expired' && !ended) return forbidden('The listing period of this ad has not ended');
    return { body: { ...clean, status: to } };
  }

  return forbidden(`An ad cannot change from '${from}' to '${to}'`);
}
