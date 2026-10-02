import { getSecrets, sanitize } from './common.mjs';

const DAY_MS = 24 * 60 * 60 * 1000;

const formatDate = (d) =>
  d.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Dublin' });

/**
 * "Your ad is live" email, sent after a verified payment activates or renews an ad.
 * Best effort: it never throws, because a failed email must not fail the payment
 * webhook (Stripe would retry and the payment is already recorded).
 */
export async function sendAdLiveEmail({ to, ad, packageName, listingDays, amountCents, paidAt, renewal }) {
  try {
    if (!to) return false;
    const title = sanitize(ad?.title, 120) || 'your ad';
    const name = sanitize(ad?.fullName, 60) || 'there';
    const liveUntil = formatDate(new Date(new Date(paidAt).getTime() + listingDays * DAY_MS));
    const origin = process.env.APP_ORIGIN || 'https://automax.ie';

    const lines = [
      `Hi ${name},`,
      '',
      renewal
        ? 'Your ad has been uploaded again and is live with a fresh countdown.'
        : 'Thank you for your payment. Your ad is now live on AutoMax.',
      '',
      `Ad: ${title}`,
      `Package: ${packageName} (${listingDays} days)`,
      ...(amountCents ? [`Amount paid: €${(amountCents / 100).toFixed(2)}`] : []),
      `Live until: ${liveUntil}`,
      '',
      `Manage your ads: ${origin}/my-ads`,
      `Payment records and receipts: ${origin}/payment-history`,
      '',
      'Thank you for using AutoMax.',
    ];

    const { RESEND_API_KEY } = await getSecrets();
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'AutoMax <noreply@automax.ie>',
        to,
        subject: renewal ? `Your AutoMax ad is live again: ${title}` : `Your AutoMax ad is live: ${title}`,
        text: lines.join('\n'),
      }),
    });
    if (!res.ok) console.error('Ad-live email failed:', res.status, await res.text());
    return res.ok;
  } catch (err) {
    console.error('Ad-live email error:', err.message);
    return false;
  }
}
