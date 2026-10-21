// Scheduled (EventBridge, daily). Emails every ad owner (Private, Trader, Dealership and Dealer accounts alike) when a live ad has 5 days
// or less left of its paid listing period, so they can renew it before it comes off AutoMax. The same warning is shown in My Ads.
//
// - One email per owner per run, listing all their ads that entered the 5-day window (an owner with several ads is not spammed).
// - Each ad is marked once it was warned: expiry_notice_for = the created_date of the period that was warned about. A renewal moves
//   created_date forward, so the renewed ad gets its own warning later. If the email fails nothing is marked and the next daily run
//   tries again, for as long as the ad is still inside the window.
// - Only 'active' ads that have a paid period (listingDays) are considered; sold, pending and expired ads are never warned about.
import { ScanCommand, GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, getSecrets, sanitize } from '../_lib/common.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;
export const WARN_DAYS = 5;

const formatDate = (ms) => new Date(ms).toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Dublin' });

// Ads that should be warned about now: active, paid period, ends within WARN_DAYS, not warned for this period yet.
export function dueForNotice(ads, now = Date.now()) {
  const due = [];
  for (const ad of ads) {
    if (ad.status !== 'active' || !ad.listingDays || !ad.created_date || !ad.created_by_id) continue;
    const endsAt = Date.parse(ad.created_date) + Number(ad.listingDays) * DAY_MS;
    if (!Number.isFinite(endsAt)) continue;
    const msLeft = endsAt - now;
    if (msLeft <= 0 || msLeft > WARN_DAYS * DAY_MS) continue;
    if (ad.expiry_notice_for === ad.created_date) continue;
    due.push({ ...ad, endsAt, daysLeft: Math.ceil(msLeft / DAY_MS) });
  }
  return due;
}

export function groupByOwner(due) {
  const owners = new Map();
  for (const ad of due) {
    if (!owners.has(ad.created_by_id)) owners.set(ad.created_by_id, []);
    owners.get(ad.created_by_id).push(ad);
  }
  for (const list of owners.values()) list.sort((a, b) => a.endsAt - b.endsAt);
  return owners;
}

const days = (n) => `${n} day${n === 1 ? '' : 's'}`;

export function buildEmail({ name, ads, origin }) {
  const lines = ads.map((a) => `• ${sanitize(a.title, 100) || 'Your ad'}: ${days(a.daysLeft)} left (ends ${formatDate(a.endsAt)})`);
  const single = ads.length === 1;
  const subject = single
    ? `Your AutoMax ad expires in ${days(ads[0].daysLeft)}: ${sanitize(ads[0].title, 80) || 'your ad'}`
    : `${ads.length} of your AutoMax ads expire soon`;
  const text = [
    `Hi ${sanitize(name, 60) || 'there'},`,
    '',
    single
      ? 'One of your ads is about to come to the end of its listing period:'
      : 'Some of your ads are about to come to the end of their listing period:',
    '',
    ...lines,
    '',
    'When the period ends the ad is taken off AutoMax. To keep it listed, renew it:',
    '1. Open My Ads.',
    '2. Press the three dots on the ad and choose Renew my Ad.',
    '3. Pick a package and pay. The new listing period starts when you renew.',
    '',
    `My Ads: ${origin}/my-ads`,
    '',
    'This is a service message about your ad, so it is sent to every account.',
    'Thank you for using AutoMax.',
  ].join('\n');
  return { subject, text };
}

async function scanActiveAds() {
  const ads = [];
  let key;
  do {
    const res = await ddb.send(new ScanCommand({
      TableName: TABLES.UserAd,
      FilterExpression: '#status = :active AND attribute_exists(listingDays) AND attribute_exists(created_date)',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':active': 'active' },
      ProjectionExpression: 'id, #status, title, listingDays, created_date, created_by_id, email, fullName, businessName, expiry_notice_for',
      ExclusiveStartKey: key,
    }));
    ads.push(...(res.Items || []));
    key = res.LastEvaluatedKey;
  } while (key);
  return ads;
}

async function sendEmail(to, subject, text, apiKey) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: 'AutoMax <noreply@automax.ie>', to, subject, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

async function markNoticed(ad) {
  try {
    await ddb.send(new UpdateCommand({
      TableName: TABLES.UserAd,
      Key: { id: ad.id },
      // only if the ad is still in the period that was warned about (a renewal in the meantime changes created_date)
      ConditionExpression: 'created_date = :c',
      UpdateExpression: 'SET expiry_notice_for = :c, expiry_notice_sent = :now',
      ExpressionAttributeValues: { ':c': ad.created_date, ':now': new Date().toISOString() },
    }));
  } catch (err) {
    if (err.name !== 'ConditionalCheckFailedException') throw err;
  }
}

export const handler = async () => {
  const now = Date.now();
  const origin = process.env.APP_ORIGIN || 'https://automax.ie';
  const due = dueForNotice(await scanActiveAds(), now);
  const owners = groupByOwner(due);
  let emails = 0;
  let failed = 0;
  let noAddress = 0;
  if (owners.size) {
    const { RESEND_API_KEY } = await getSecrets();
    for (const [ownerId, ads] of owners) {
      try {
        const profile = (await ddb.send(new GetCommand({ TableName: TABLES.User, Key: { id: ownerId } }))).Item;
        const to = profile?.email || ads.find((a) => a.email)?.email;
        if (!to) { noAddress += 1; continue; }
        const name = profile?.business_name || profile?.display_name || ads[0].businessName || ads[0].fullName;
        const { subject, text } = buildEmail({ name, ads, origin });
        await sendEmail(to, subject, text, RESEND_API_KEY);
        for (const ad of ads) await markNoticed(ad);
        emails += 1;
      } catch (err) {
        failed += 1;
        console.error(`Expiry notice for owner ${ownerId} failed (will retry on the next run):`, err.message);
      }
    }
  }
  console.log(`Ad expiry notices: ${due.length} ad(s) in the ${WARN_DAYS}-day window for ${owners.size} owner(s); ${emails} email(s) sent, ${failed} failed, ${noAddress} without an address`);
  return { ads: due.length, owners: owners.size, emails, failed, noAddress };
};
