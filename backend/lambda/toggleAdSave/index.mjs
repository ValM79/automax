// Counts how many people have saved an ad, for the "saved" number the seller sees on My Ads.
//
// Saving an ad on the site is stored in the visitor's own browser. For signed-in visitors the site also
// tells this function, so the seller's ad can show how many people saved it. The list of ads a person has
// saved is kept on their profile row (saved_ads), which makes the count exact: one person counts once
// however many times they tap the heart. Saves by signed-out visitors, saves made before this existed,
// and a seller saving their own ad are not counted.
import { TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json, getUserFromEvent } from '../_lib/common.mjs';

const AD_ID = /^[A-Za-z0-9_-]{8,64}$/;

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    const { ad_id, saved } = JSON.parse(event.body || '{}');
    if (!ad_id || !AD_ID.test(ad_id) || typeof saved !== 'boolean') return json(400, { error: 'Invalid request' });

    if (saved) {
      try {
        await ddb.send(new TransactWriteCommand({
          TransactItems: [
            {
              Update: {
                TableName: TABLES.User,
                Key: { id: user.id },
                UpdateExpression: 'ADD saved_ads :set',
                ConditionExpression: 'attribute_not_exists(saved_ads) OR NOT contains(saved_ads, :id)',
                ExpressionAttributeValues: { ':set': new Set([ad_id]), ':id': ad_id },
              },
            },
            {
              Update: {
                TableName: TABLES.UserAd,
                Key: { id: ad_id },
                UpdateExpression: 'ADD save_count :one',
                ConditionExpression: 'attribute_exists(id) AND #s = :active AND created_by_id <> :uid',
                ExpressionAttributeNames: { '#s': 'status' },
                ExpressionAttributeValues: { ':one': 1, ':active': 'active', ':uid': user.id },
              },
            },
          ],
        }));
        return json(200, { counted: true });
      } catch (e) {
        // already counted for this person, not an active ad, or their own ad
        if (e.name === 'TransactionCanceledException') return json(200, { counted: false });
        throw e;
      }
    }

    try {
      await ddb.send(new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName: TABLES.User,
              Key: { id: user.id },
              UpdateExpression: 'DELETE saved_ads :set',
              ConditionExpression: 'contains(saved_ads, :id)',
              ExpressionAttributeValues: { ':set': new Set([ad_id]), ':id': ad_id },
            },
          },
          {
            Update: {
              TableName: TABLES.UserAd,
              Key: { id: ad_id },
              UpdateExpression: 'ADD save_count :minus',
              ConditionExpression: 'attribute_exists(id) AND save_count > :zero',
              ExpressionAttributeValues: { ':minus': -1, ':zero': 0 },
            },
          },
        ],
      }));
      return json(200, { counted: true });
    } catch (e) {
      if (e.name !== 'TransactionCanceledException') throw e;
      // The ad may be gone or its count already 0: still forget it on the person's profile.
      await ddb.send(new UpdateCommand({
        TableName: TABLES.User,
        Key: { id: user.id },
        UpdateExpression: 'DELETE saved_ads :set',
        ConditionExpression: 'attribute_exists(id)',
        ExpressionAttributeValues: { ':set': new Set([ad_id]) },
      })).catch(() => {});
      return json(200, { counted: false });
    }
  } catch (error) {
    console.error('toggleAdSave error:', error);
    return json(500, { error: 'Could not update the saved count' });
  }
};
