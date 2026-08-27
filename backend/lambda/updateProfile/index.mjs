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
];

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    const body = JSON.parse(event.body || '{}');

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
