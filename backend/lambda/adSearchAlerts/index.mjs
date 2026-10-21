// Scheduled (EventBridge, daily). Emails people who pressed "Notify me" on an ad about NEW ads that match their alert.
//
// An alert matches an ad when the ad is live, was placed after the alert was last checked, belongs to someone else, and
//   - the alert has a make: the ad has that make (and that model, if the alert has one), in any category;
//   - or, with no make, the ad is in the alert's category.
// One email per person per run, listing the new ads under each alert (an ad that fits two alerts is listed once).
// After a successful email every alert of that person is marked as checked up to the start of this run; if the email fails nothing
// is marked, so the next run tries again. A renewed ad (it has more than one payment) is not "new" and is skipped.
import { ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, getSecrets, sanitize } from '../_lib/common.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
const PER_ALERT = 5;
const lower = (v) => String(v ?? '').trim().toLowerCase();

export function matches(alert, ad) {
  if (ad.created_by_id === alert.user_id) return false;
  if (!(ad.created_date > alert.last_checked)) return false;
  if (alert.make) {
    if (lower(ad.vehicleMake) !== lower(alert.make)) return false;
    return !alert.model || lower(ad.vehicleModel) === lower(alert.model);
  }
  return !!alert.subsection && lower(ad.subsection) === lower(alert.subsection);
}

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
    const found = live.filter((ad) => matches(alert, ad)).sort((a, b) => (a.created_date < b.created_date ? 1 : -1));
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
  const subject = total === 1 ? `AutoMax: 1 new ad for your alert` : `AutoMax: ${total} new ads for your alerts`;
  const text = [
    `Hi ${sanitize(name, 60) || 'there'},`,
    '',
    total === 1 ? 'A new ad was placed that matches an alert you set up:' : 'New ads were placed that match your alerts:',
    '',
    ...lines,
    `See your alerts, or switch one off: ${origin}/saved-searches?tab=alerts`,
    '',
    'You get this email because you asked for an alert on an ad. Thank you for using AutoMax.',
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

export const handler = async () => {
  const runStart = new Date().toISOString();
  const origin = process.env.APP_ORIGIN || 'https://automax.ie';
  const alerts = await scanAll({ TableName: TABLES.SearchAlert });
  if (!alerts.length) { console.log('Search alerts: no alerts'); return { alerts: 0, emails: 0 }; }
  const oldest = alerts.reduce((m, a) => (a.last_checked < m ? a.last_checked : m), runStart);
  // every attribute is aliased (#name): several ad field names are DynamoDB reserved words (status, location...)
  const fields = ['id', 'title', 'price', 'currency', 'area', 'county', 'location', 'vehicleMake', 'vehicleModel', 'subsection', 'created_by_id', 'created_date', 'listingDays', 'paymentHistory', 'status'];
  const ads = await scanAll({
    TableName: TABLES.UserAd,
    FilterExpression: '#status = :active AND #created_date > :since',
    ExpressionAttributeNames: Object.fromEntries(fields.map((x) => ['#' + x, x])),
    ExpressionAttributeValues: { ':active': 'active', ':since': oldest },
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
  console.log(`Search alerts: ${alerts.length} alert(s), ${ads.length} new live ad(s); ${emails} email(s) sent, ${failed} failed, ${noAddress} without an address`);
  return { alerts: alerts.length, ads: ads.length, emails, failed, noAddress };
};
