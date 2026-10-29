// Scheduled (EventBridge). Emails people about NEW ads that match one of their saved searches. Two schedules call it:
//   { mode: 'instant' }  every 15 minutes, for the searches saved with "Instant alerts"
//   { mode: 'daily' }    once a day, for "Daily alerts" (and for older alerts, which had no frequency)
// A search saved with "No alerts" is never emailed.
//
// A saved search matches an ad when the ad is live, went live after the search was last checked, belongs to someone else, and
//   - the ad is in the search's section (all the car sections count as one), when it has one;
//   - and, with a make, the ad has that make (and that model, if the search has one); with no make the search needs a section;
//   - and, when the search has them, the ad's model type is one of its model types, its year, price and mileage (in km; miles are converted) are inside its range and the ad is in its county.
// One email per person per run, listing the new ads under each search (an ad that fits two searches is listed once).
// After a successful email every alert of that person is marked as checked up to the start of this run; if the email fails nothing
// is marked, so the next run tries again. A renewed ad (it has more than one payment) is not "new" and is skipped.
import { ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, getSecrets, sanitize } from '../_lib/common.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const PER_ALERT = 5;
const lower = (v) => String(v ?? '').trim().toLowerCase();

const FREQUENCIES = ['instant', 'daily', 'off'];
// an alert from before saved searches had a frequency was emailed once a day
const frequencyOf = (a) => (FREQUENCIES.includes(a.frequency) ? a.frequency : 'daily');

// when the ad went live: paid for (the first payment), else placed. A pending ad is created long before it is paid for.
export const liveSince = (ad) => (Array.isArray(ad.paymentHistory) && ad.paymentHistory[0]?.date) || ad.created_date;

// "6,500" -> 6500; "6500.50" -> 6500; nothing usable -> null
const numberOf = (v) => {
  const n = parseInt(String(v ?? '').split('.')[0].replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};
const counted = (v) => v !== '' && v != null;

// the mileage of an ad in km: "88,000 km" -> 88000, "12,000 miles" -> 19312; nothing usable -> null
export const kmOf = (v) => {
  const n = numberOf(v);
  if (n == null) return null;
  return /mile/i.test(String(v)) ? Math.round(n * 1.609344) : n;
};

// the sections that sell cars are one family: a search for Cars also finds an electric, modified, vintage or dealership car
const CAR_SECTIONS = ['cars', 'electric & hybrid cars', 'modified cars', 'vintage cars', 'dealership cars'];
// a search with no section looks in all of them
export const sameSection = (wanted, actual) => {
  if (!lower(wanted)) return true;
  return lower(wanted) === lower(actual) || (CAR_SECTIONS.includes(lower(wanted)) && CAR_SECTIONS.includes(lower(actual)));
};

export function matches(alert, ad) {
  if (ad.created_by_id === alert.user_id) return false;
  if (!(liveSince(ad) > alert.last_checked)) return false;
  if (!sameSection(alert.subsection, ad.subsection)) return false;
  if (alert.make) {
    if (lower(ad.vehicleMake) !== lower(alert.make)) return false;
    if (alert.model && lower(ad.vehicleModel) !== lower(alert.model)) return false;
  } else if (!alert.subsection) {
    return false;
  }
  if (counted(alert.yearFrom) || counted(alert.yearTo)) {
    const y = numberOf(ad.vehicleYear);
    if (y == null || (counted(alert.yearFrom) && y < alert.yearFrom) || (counted(alert.yearTo) && y > alert.yearTo)) return false;
  }
  if (counted(alert.priceFrom) || counted(alert.priceTo)) {
    const p = numberOf(ad.price);
    if (p == null || (counted(alert.priceFrom) && p < alert.priceFrom) || (counted(alert.priceTo) && p > alert.priceTo)) return false;
  }
  if (counted(alert.mileageFrom) || counted(alert.mileageTo)) {
    const km = kmOf(ad.mileage);
    if (km == null || (counted(alert.mileageFrom) && km < alert.mileageFrom) || (counted(alert.mileageTo) && km > alert.mileageTo)) return false;
  }
  if (alert.county && lower(ad.county) !== lower(alert.county)) return false;
  if (Array.isArray(alert.trims) && alert.trims.length && !alert.trims.some((t) => lower(t) === lower(ad.vehicleTrim))) return false;
  return true;
}

// the searches a run looks at: the instant ones for the 15-minute run, the daily ones (and older alerts) for the daily run
export const dueFor = (alerts, mode) => alerts.filter((a) => (mode === 'instant' ? frequencyOf(a) === 'instant' : frequencyOf(a) === 'daily'));

const isLive = (ad, now) => {
  if (ad.status !== 'active') return false;
  if (Array.isArray(ad.paymentHistory) && ad.paymentHistory.length > 1) return false; // renewed, not new
  const endsAt = ad.listingDays && ad.created_date ? Date.parse(ad.created_date) + Number(ad.listingDays) * DAY_MS : null;
  return endsAt == null || !Number.isFinite(endsAt) || endsAt >= now;
};

// what to tell each person: alerts with their (deduplicated) new ads
export function buildDigests(alerts, ads, now = Date.now()) {
  const live = ads.filter((a) => isLive(a, now));
  const byUser = new Map();
  for (const alert of alerts) {
    const found = live.filter((ad) => matches(alert, ad)).sort((a, b) => (liveSince(a) < liveSince(b) ? 1 : -1));
    const entry = byUser.get(alert.user_id) || { userId: alert.user_id, alerts: [], seen: new Set() };
    const fresh = found.filter((ad) => !entry.seen.has(ad.id));
    fresh.forEach((ad) => entry.seen.add(ad.id));
    entry.alerts.push({ alert, ads: fresh });
    byUser.set(alert.user_id, entry);
  }
  return [...byUser.values()];
}

const priceText = (ad) => {
  const p = String(ad.price ?? '').replace(/[^0-9.,]/g, '');
  return p ? `${ad.currency || '€'}${p}` : '';
};

export function buildEmail({ name, groups, origin }) {
  const total = groups.reduce((n, g) => n + g.ads.length, 0);
  const lines = [];
  for (const g of groups.filter((x) => x.ads.length)) {
    lines.push(`${sanitize(g.alert.name, 80)}:`);
    for (const ad of g.ads.slice(0, PER_ALERT)) {
      const where = [ad.area, ad.county].filter(Boolean).join(', ') || ad.location || '';
      lines.push(`  • ${sanitize(ad.title, 90) || 'New ad'}${priceText(ad) ? ' – ' + priceText(ad) : ''}${where ? ' – ' + sanitize(where, 60) : ''}`);
      lines.push(`    ${origin}/vehicle/${ad.id}`);
    }
    if (g.ads.length > PER_ALERT) lines.push(`  …and ${g.ads.length - PER_ALERT} more`);
    lines.push('');
  }
  const subject = total === 1 ? `AutoMax: 1 new ad for your saved search` : `AutoMax: ${total} new ads for your saved searches`;
  const text = [
    `Hi ${sanitize(name, 60) || 'there'},`,
    '',
    total === 1 ? 'A new ad was placed that matches a search you saved:' : 'New ads were placed that match your saved searches:',
    '',
    ...lines,
    `Change how often we email you, or remove a saved search: ${origin}/notifications`,
    '',
    'You get this email because you saved a search on AutoMax. Thank you for using AutoMax.',
  ].join('\n');
  return { subject, text };
}

async function scanAll(params) {
  const items = [];
  let key;
  do {
    const res = await ddb.send(new ScanCommand({ ...params, ExclusiveStartKey: key }));
    items.push(...(res.Items || []));
    key = res.LastEvaluatedKey;
  } while (key);
  return items;
}

async function send(to, subject, text, apiKey) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'AutoMax <noreply@automax.ie>', to, subject, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

const markChecked = (alert, at) => ddb.send(new UpdateCommand({
  TableName: TABLES.SearchAlert,
  Key: { id: alert.id },
  UpdateExpression: 'SET last_checked = :t',
  ConditionExpression: 'attribute_exists(id)', // not if the person turned it off meanwhile
  ExpressionAttributeValues: { ':t': at },
})).catch((e) => { if (e.name !== 'ConditionalCheckFailedException') throw e; });

export const handler = async (event) => {
  const runStart = new Date().toISOString();
  const mode = event?.mode === 'instant' ? 'instant' : 'daily';
  const origin = process.env.APP_ORIGIN || 'https://automax.ie';
  const alerts = dueFor(await scanAll({ TableName: TABLES.SearchAlert }), mode);
  if (!alerts.length) { console.log(`Search alerts (${mode}): no saved searches`); return { mode, alerts: 0, emails: 0 }; }
  // every attribute is aliased (#name): several ad field names are DynamoDB reserved words (status, location...)
  const fields = ['id', 'title', 'price', 'currency', 'area', 'county', 'location', 'vehicleMake', 'vehicleModel', 'vehicleTrim', 'vehicleYear', 'mileage', 'subsection', 'created_by_id', 'created_date', 'listingDays', 'paymentHistory', 'status'];
  // all live ads, not only recent ones: an ad is created long before it is paid for, and "new" means when it went live (liveSince)
  const ads = await scanAll({
    TableName: TABLES.UserAd,
    FilterExpression: '#status = :active',
    ExpressionAttributeNames: Object.fromEntries(fields.map((x) => ['#' + x, x])),
    ExpressionAttributeValues: { ':active': 'active' },
    ProjectionExpression: fields.map((x) => '#' + x).join(', '),
  });
  const digests = buildDigests(alerts, ads, Date.now());
  let emails = 0; let failed = 0; let noAddress = 0;
  const secrets = digests.some((d) => d.alerts.some((g) => g.ads.length)) ? await getSecrets() : null;
  for (const d of digests) {
    try {
      const withAds = d.alerts.filter((g) => g.ads.length);
      if (withAds.length) {
        const profile = (await ddb.send(new GetCommand({ TableName: TABLES.User, Key: { id: d.userId } }))).Item;
        if (!profile?.email) { noAddress += 1; } else {
          const { subject, text } = buildEmail({ name: profile.business_name || profile.display_name, groups: withAds, origin });
          await send(profile.email, subject, text, secrets.RESEND_API_KEY);
          emails += 1;
        }
      }
      for (const g of d.alerts) await markChecked(g.alert, runStart);
    } catch (err) {
      failed += 1;
      console.error(`Search alert email for ${d.userId} failed (will retry on the next run):`, err.message);
    }
  }
  console.log(`Search alerts (${mode}): ${alerts.length} saved search(es), ${ads.length} live ad(s); ${emails} email(s) sent, ${failed} failed, ${noAddress} without an address`);
  return { mode, alerts: alerts.length, ads: ads.length, emails, failed, noAddress };
};
