// Ported 1:1 from base44/functions/sendVerificationCode/entry.ts
import { QueryCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, newId, nowIso, json, getUserFromEvent, getSecrets } from '../_lib/common.mjs';

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event); // optional — verification can happen pre-signup
    const { target, type } = JSON.parse(event.body || '{}');
    if (!target || !type || !['sms', 'email'].includes(type)) {
      return json(400, { error: 'target and type (sms/email) are required' });
    }

    // Rate limit: no more than 1 code per target per 60s
    const recentRes = await ddb.send(
      new QueryCommand({
        TableName: TABLES.VerificationCode,
        IndexName: 'byTarget',
        KeyConditionExpression: '#t = :t',
        ExpressionAttributeNames: { '#t': 'target' },
        ExpressionAttributeValues: { ':t': target },
        ScanIndexForward: false,
        Limit: 1,
      })
    );
    if (recentRes.Items?.length) {
      const ageMs = Date.now() - new Date(recentRes.Items[0].created_date).getTime();
      if (ageMs < 60000) return json(429, { error: 'Please wait 60 seconds before requesting another code' });
    }

    // IP-based rate limit: max 10 codes per IP per hour to prevent toll fraud
    const clientIp =
      (event.headers?.['x-forwarded-for'] || '').split(',')[0].trim() ||
      event.requestContext?.http?.sourceIp ||
      'unknown';
    const MAX_IP_HOURLY = 10;
    const ipRes = await ddb.send(
      new QueryCommand({
        TableName: TABLES.VerificationCode,
        IndexName: 'byIp',
        KeyConditionExpression: 'client_ip = :ip',
        ExpressionAttributeValues: { ':ip': clientIp },
        ScanIndexForward: false,
        Limit: MAX_IP_HOURLY,
      })
    );
    if ((ipRes.Items?.length || 0) >= MAX_IP_HOURLY) {
      const oldest = ipRes.Items[MAX_IP_HOURLY - 1];
      const oldestAgeMs = Date.now() - new Date(oldest.created_date).getTime();
      if (oldestAgeMs < 3600000) return json(429, { error: 'Too many verification requests. Please try again later.' });
    }

    // Cryptographically secure 6-digit code
    const randomBytes = new Uint32Array(1);
    crypto.getRandomValues(randomBytes);
    const code = (100000 + (randomBytes[0] % 900000)).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const createdDate = nowIso();

    await ddb.send(
      new PutCommand({
        TableName: TABLES.VerificationCode,
        Item: {
          id: newId(),
          target,
          code,
          type,
          expires_at: expiresAt,
          verified: false,
          attempts: 0,
          client_ip: clientIp,
          created_by_id: user?.id || 'anonymous',
          created_date: createdDate,
          ttl: Math.floor(Date.now() / 1000) + 3600, // auto-expire from table after 1h
        },
      })
    );

    const secrets = await getSecrets();

    if (type === 'sms') {
      const {
        TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN,
        TWILIO_API_KEY_SID,
        TWILIO_API_KEY_SECRET,
        TWILIO_PHONE_NUMBER,
      } = secrets;
      // Basic-auth as either an API Key (Basic <SK.../secret>) or the account
      // Auth Token (Basic <AC.../token>). Prefer an API key when both are present;
      // the AC... Account SID always stays in the URL path.
      const twilioUser = TWILIO_API_KEY_SID || TWILIO_ACCOUNT_SID;
      const twilioPass = TWILIO_API_KEY_SECRET || TWILIO_AUTH_TOKEN;
      if (!TWILIO_ACCOUNT_SID || !twilioUser || !twilioPass || !TWILIO_PHONE_NUMBER) {
        console.error('Twilio secrets missing');
        return json(500, { error: 'SMS service not configured' });
      }
      const twilioRes = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(`${twilioUser}:${twilioPass}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({ To: target, From: TWILIO_PHONE_NUMBER, Body: `Your AutoMax verification code is: ${code}` }),
      });
      if (!twilioRes.ok) {
        console.error('Twilio error:', await twilioRes.text());
        return json(502, { error: 'Failed to send SMS' });
      }
    } else {
      const { RESEND_API_KEY } = secrets;
      if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY missing');
        return json(500, { error: 'Email service not configured' });
      }
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'AutoMax <verify@automax.ie>',
          to: target,
          subject: 'Your AutoMax Verification Code',
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;"><h2 style="color:#1d4ed8;">AutoMax</h2><p>Your verification code is:</p><p style="font-size:32px;font-weight:bold;letter-spacing:4px;color:#1d4ed8;">${code}</p><p style="color:#666;font-size:13px;">This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.</p></div>`,
        }),
      });
      if (!resendRes.ok) {
        console.error('Resend error:', await resendRes.text());
        return json(502, { error: 'Failed to send email' });
      }
    }

    return json(200, { success: true, message: `Verification code sent to ${target}` });
  } catch (error) {
    console.error('sendVerificationCode error:', error);
    return json(500, { error: error.message });
  }
};
