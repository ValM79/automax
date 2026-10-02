// Activates a paid ad listing on iOS after an in-app StoreKit purchase.
//
// Apple Guideline 3.1.1 requires paid digital content on iOS to go through
// In-App Purchase, not Stripe. StoreKit purchases happen entirely on-device,
// so -- exactly like stripeWebhook does for Stripe -- we never trust the
// client's report that a purchase succeeded. Instead we take the transaction
// ID the client got from StoreKit and ask Apple's own App Store Server API
// whether it's real, unrevoked, and for which product. Only then do we
// activate the ad.
import { GetCommand, PutCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { createSign } from 'node:crypto';
import { ddb, TABLES, json, getUserFromEvent, getSecrets, nowIso } from '../_lib/common.mjs';
import { sendAdLiveEmail } from '../_lib/adEmails.mjs';

// Server-side product configuration, mirroring createCheckoutSession's
// PACKAGE_CONFIG -- the client sends only a transaction ID; every paid
// property (listing length, bumps, spotlight) is resolved here from the
// Apple product ID that transaction is actually for, so it can't be tampered
// with client-side. Product IDs must match what's created in App Store
// Connect -> Monetization -> In-App Purchases. Apple prices are picked from
// Apple's fixed price tiers (nearest to the Stripe price shown on web/Android).
const IAP_PRODUCT_CONFIG = {
  'ie.automax.app.listing.car.basic': { packageName: 'Basic', listingDays: 60, maxPhotos: 12, spotlightDays: 0 },
  'ie.automax.app.listing.car.standard': { packageName: 'Standard', listingDays: 72, maxPhotos: 12, spotlightDays: 0 },
  'ie.automax.app.listing.car.premium': { packageName: 'Premium', listingDays: 90, maxPhotos: 12, spotlightDays: 5 },
  'ie.automax.app.listing.bike.basic': { packageName: 'Basic', listingDays: 30, maxPhotos: 12, spotlightDays: 0 },
  'ie.automax.app.listing.bike.standard': { packageName: 'Standard', listingDays: 60, maxPhotos: 12, spotlightDays: 0 },
  'ie.automax.app.listing.bike.premium': { packageName: 'Premium', listingDays: 90, maxPhotos: 12, spotlightDays: 5 },
};

const BUNDLE_ID = 'ie.automax.app';

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Signs the ES256 JWT the App Store Server API requires for auth. Node's
// crypto module signs ES256 natively, so this doesn't need a jsonwebtoken
// dependency for the one call site that needs it.
function signAppleJwt({ keyId, issuerId, privateKey }) {
  const header = { alg: 'ES256', kid: keyId, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: issuerId, iat: now, exp: now + 300, aud: 'appstoreconnect-v1', bid: BUNDLE_ID };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const sign = createSign('SHA256');
  sign.update(signingInput);
  sign.end();
  // Node's default DER output isn't what JWS wants -- ieee-p1363 gives the
  // raw (r||s) format the App Store Server API expects.
  const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' });
  return `${signingInput}.${base64url(signature)}`;
}

async function fetchAppleTransaction(transactionId, jwt, useSandbox) {
  const base = useSandbox ? 'https://api.storekit-sandbox.itunes.apple.com' : 'https://api.storekit.itunes.apple.com';
  const res = await fetch(`${base}/inApps/v1/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${jwt}` },
  });
  return { res, body: res.ok ? await res.json() : await res.text() };
}

// Decodes (without re-verifying) the payload of Apple's signedTransactionInfo
// JWS. Re-verifying Apple's own signature would mean managing Apple's
// rotating signing certificate chain ourselves; instead the trust boundary is
// the HTTPS call above, authenticated with our own signed JWT, straight to
// Apple's servers -- the same trust model an SDK gives you for any API response.
function decodeSignedPayload(jws) {
  const payload = jws.split('.')[1];
  const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
}

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    const { adId, transactionId } = JSON.parse(event.body || '{}');
    if (!adId || !transactionId) return json(400, { error: 'adId and transactionId are required' });

    // Ownership + state check, same as createCheckoutSession.
    const adRes = await ddb.send(new GetCommand({ TableName: TABLES.UserAd, Key: { id: adId } }));
    const ad = adRes.Item;
    if (!ad) return json(404, { error: 'Ad not found' });
    if (ad.created_by_id !== user.id) return json(403, { error: 'Forbidden' });
    if (!['pending', 'active', 'expired'].includes(ad.status)) return json(400, { error: 'Ad is not in a payable state' });
    // A non-pending ad being paid for is a renewal ("Upload your Ad"): restarts its countdown.
    const renewal = ad.status !== 'pending';

    const { APPLE_IAP_KEY_ID, APPLE_IAP_ISSUER_ID, APPLE_IAP_PRIVATE_KEY } = await getSecrets();
    const jwt = signAppleJwt({
      keyId: APPLE_IAP_KEY_ID,
      issuerId: APPLE_IAP_ISSUER_ID,
      privateKey: APPLE_IAP_PRIVATE_KEY,
    });

    // Try production first; looking up a sandbox (TestFlight) transaction ID
    // against production returns an error -- Apple's documented signal to
    // retry against the sandbox environment.
    let { res, body } = await fetchAppleTransaction(transactionId, jwt, false);
    if (!res.ok) {
      ({ res, body } = await fetchAppleTransaction(transactionId, jwt, true));
    }
    if (!res.ok) {
      console.error('Apple transaction lookup failed:', res.status, body);
      return json(400, { error: 'Could not verify purchase with Apple' });
    }

    const info = decodeSignedPayload(body.signedTransactionInfo);

    if (String(info.transactionId) !== String(transactionId)) {
      return json(400, { error: 'Transaction ID mismatch' });
    }
    if (info.revocationDate) {
      return json(400, { error: 'This purchase was refunded and cannot activate a listing' });
    }
    const pkg = IAP_PRODUCT_CONFIG[info.productId];
    if (!pkg) return json(400, { error: 'Unrecognised product' });

    // Replay protection: one Apple transaction activates exactly one ad, ever.
    // The conditional Put is an atomic "claim" on the transaction ID -- if a
    // request is retried or replayed against a second ad, this fails and the
    // second activation is rejected before it touches UserAd.
    try {
      await ddb.send(
        new PutCommand({
          TableName: TABLES.ApplePurchase,
          Item: { transactionId: String(info.transactionId), adId, productId: info.productId, claimedAt: nowIso() },
          ConditionExpression: 'attribute_not_exists(transactionId)',
        })
      );
    } catch (err) {
      if (err.name === 'ConditionalCheckFailedException') {
        return json(409, { error: 'This purchase has already been used to activate a listing' });
      }
      throw err;
    }

    // Timestamp from Apple's own purchase date so the countdown start is deterministic.
    const paidAt = new Date(Number(info.purchaseDate) || Date.now()).toISOString();

    const updated = await ddb.send(
      new UpdateCommand({
        TableName: TABLES.UserAd,
        Key: { id: adId },
        ReturnValues: 'ALL_NEW',
        ConditionExpression: 'attribute_exists(id)',
        UpdateExpression:
          'SET #status = :status, packageName = :pkg, listingDays = :days, spotlight = :spotlight, appleTransactionId = :txId, paymentHistory = list_append(if_not_exists(paymentHistory, :emptyList), :entry)' +
          (renewal
            ? ', originalCreatedDate = if_not_exists(originalCreatedDate, created_date), created_date = :paidAt, renewCount = if_not_exists(renewCount, :zero) + :one'
            : ''),
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': 'active',
          ':pkg': pkg.packageName,
          ':days': pkg.listingDays,
          ':spotlight': pkg.spotlightDays > 0,
          ':txId': String(info.transactionId),
          ':emptyList': [],
          ':entry': [
            {
              date: paidAt,
              packageName: pkg.packageName,
              listingDays: pkg.listingDays,
              appleTransactionId: String(info.transactionId),
              renewal,
            },
          ],
          ...(renewal ? { ':paidAt': paidAt, ':zero': 0, ':one': 1 } : {}),
        },
      })
    );

    await sendAdLiveEmail({
      to: user.email || updated.Attributes?.email,
      ad: updated.Attributes,
      packageName: pkg.packageName,
      listingDays: pkg.listingDays,
      paidAt,
      renewal,
    });

    return json(200, { activated: true, renewed: renewal });
  } catch (error) {
    console.error('Apple transaction verification error:', error.message);
    return json(500, { error: error.message });
  }
};
