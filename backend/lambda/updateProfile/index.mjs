// New function -- backs base44.auth.updateMe() in the frontend shim.
//
// entity-api's generic PUT /entities/User/{id} is deliberately admin-only
// (see entity-api/index.mjs) specifically so a user can't self-promote by
// sending { role: 'admin' }. That's still the right rule for the generic
// entity API. This function instead lets a user update their *own* profile
// fields directly -- explicitly ignoring `role` no matter what's in the
// request body, so self-service profile editing can't be used to bypass
// the same protection.
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json, getUserFromEvent, sanitize } from '../_lib/common.mjs';

// Whitelist of fields a user may set on their own profile. `role` is
// intentionally not here.
const EDITABLE_FIELDS = [
  'display_name',
  'county',
  'area',
  'phone',
  'seller_type',
  'business_name',
  'business_address',
  'vat_number',
  'notify_messages',
  'notify_saved_searches',
  'notify_promotions',
  'avatar_url',
  'cover_url',
  'opening_hours',
  'opening_times',
  'about',
  'contact_ways',
  'whatsapp_number',
  'contact_email',
  'business_address_2',
  'eircode',
];

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    const body = JSON.parse(event.body || '{}');

    // Profile photo / logo, and a business's cover photo (its dealer page banner and card background): only a picture
    // this user uploaded to our own photo storage (or empty, to remove it). Anything else could point at another
    // site, so it is refused.
    for (const field of ['avatar_url', 'cover_url']) {
      if (!(field in body)) continue;
      const v = body[field];
      const mine = `https://${process.env.PHOTOS_CDN_DOMAIN}/ads/${user.id}/`;
      if (v && !(typeof v === 'string' && v.startsWith(mine) && v.length < 300)) return json(400, { error: 'Invalid photo' });
      body[field] = v || '';
    }
    // Opening hours by day: { mon, tue, wed, thu, fri, sat, sun, bank }, each "09:00 - 18:00" or "Closed" (empty days are dropped).
    if ('opening_times' in body) {
      const t = body.opening_times;
      if (!t || typeof t !== 'object' || Array.isArray(t)) return json(400, { error: 'Invalid opening hours' });
      const clean = {};
      for (const key of ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'bank']) {
        const v = String(t[key] ?? '').trim();
        if (!v) continue;
        if (v !== 'Closed' && !/^\d{2}:\d{2} - \d{2}:\d{2}$/.test(v)) return json(400, { error: 'Invalid opening hours' });
        clean[key] = v;
      }
      body.opening_times = clean;
    }
    // How buyers may contact a Dealer: message / WhatsApp / email switches, a WhatsApp number and a contact email.
    if ('contact_ways' in body) {
      const w = body.contact_ways;
      if (!w || typeof w !== 'object' || Array.isArray(w)) return json(400, { error: 'Invalid contact options' });
      body.contact_ways = { message: w.message !== false, phone: w.phone !== false, whatsapp: w.whatsapp === true, email: w.email === true };
    }
    if ('whatsapp_number' in body) {
      const v = String(body.whatsapp_number || '').trim();
      if (v && !/^[+\d][\d\s()-]{5,24}$/.test(v)) return json(400, { error: 'Invalid WhatsApp number' });
      body.whatsapp_number = v;
    }
    if ('contact_email' in body) {
      const v = String(body.contact_email || '').trim();
      if (v && !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(v)) return json(400, { error: 'Invalid contact email' });
      body.contact_email = v.slice(0, 120);
    }
    // Eircode: 7 letters / digits written "A65 F4E2" (or empty).
    if ('eircode' in body) {
      const v = String(body.eircode || '').replace(/\s+/g, '').toUpperCase();
      if (v && !/^[A-Z0-9]{7}$/.test(v)) return json(400, { error: 'Invalid Eircode' });
      body.eircode = v ? `${v.slice(0, 3)} ${v.slice(3)}` : '';
    }
    if ('opening_hours' in body) body.opening_hours = String(body.opening_hours || '').slice(0, 200);

    // The account type can only be one of the four kinds.
    if ('seller_type' in body && !['private', 'trader', 'dealership', 'dealer'].includes(body.seller_type)) {
      return json(400, { error: 'Invalid account type' });
    }

    const names = {};
    const values = {};
    const setParts = [];
    for (const field of EDITABLE_FIELDS) {
      if (!(field in body)) continue;
      const raw = body[field];
      const value = typeof raw === 'string' ? sanitize(raw, 500) : raw;
      const nameKey = `#${field}`;
      const valueKey = `:${field}`;
      names[nameKey] = field;
      values[valueKey] = value;
      setParts.push(`${nameKey} = ${valueKey}`);
    }

    if (setParts.length === 0) return json(400, { error: 'No editable fields provided' });

    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.User,
        Key: { id: user.id },
        UpdateExpression: `SET ${setParts.join(', ')}`,
        ExpressionAttributeNames: names,
        ExpressionAttributeValues: values,
      })
    );

    return json(200, { success: true });
  } catch (error) {
    console.error('updateProfile error:', error.message || error);
    return json(500, { error: error.message || 'Failed to update profile' });
  }
};
