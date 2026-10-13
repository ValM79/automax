// Counts one view of an ad, for the "views" number the seller sees on My Ads (and the ad page).
//
// Public: anyone, signed in or not, can open an ad. The site only calls this once per browser per ad
// per day, so refreshing the page does not pump the number. The seller's own visits are not counted,
// and only active ads are counted. Nothing else about the visitor is stored.
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json, getUserFromEvent } from '../_lib/common.mjs';

const AD_ID = /^[A-Za-z0-9_-]{8,64}$/;

export const handler = async (event) => {
  try {
    const { ad_id } = JSON.parse(event.body || '{}');
    if (!ad_id || !AD_ID.test(ad_id)) return json(400, { error: 'Invalid ad' });

    const user = await getUserFromEvent(event); // null when signed out
    let condition = 'attribute_exists(id) AND #s = :active';
    const values = { ':one': 1, ':active': 'active' };
    if (user) {
      condition += ' AND created_by_id <> :uid';
      values[':uid'] = user.id;
    }

    try {
      const res = await ddb.send(new UpdateCommand({
        TableName: TABLES.UserAd,
        Key: { id: ad_id },
        UpdateExpression: 'ADD view_count :one',
        ConditionExpression: condition,
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: values,
        ReturnValues: 'UPDATED_NEW',
      }));
      return json(200, { counted: true, view_count: res.Attributes?.view_count ?? null });
    } catch (e) {
      // not active, not found, or the seller looking at their own ad: nothing to count
      if (e.name === 'ConditionalCheckFailedException') return json(200, { counted: false });
      throw e;
    }
  } catch (error) {
    console.error('recordAdView error:', error);
    return json(500, { error: 'Could not record the view' });
  }
};
