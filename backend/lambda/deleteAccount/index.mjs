// Ported 1:1 from base44/functions/deleteAccount/entry.ts, then extended:
// the original only deleted the User profile row + Cognito identity, leaving
// the user's ads and reports orphaned in the database despite the frontend's
// confirmation modal explicitly promising they'd be removed. Now actually
// deletes them first.
import { DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { ddb, TABLES, json, getUserFromEvent } from '../_lib/common.mjs';

const cognito = new CognitoIdentityProviderClient({});

/** Deletes every item in `tableName` owned by `userId`, via the byOwner GSI. */
async function deleteAllByOwner(tableName, userId) {
  let lastKey;
  let count = 0;
  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'byOwner',
        KeyConditionExpression: 'created_by_id = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        ExclusiveStartKey: lastKey,
      })
    );
    for (const item of res.Items || []) {
      await ddb.send(new DeleteCommand({ TableName: tableName, Key: { id: item.id } }));
      count++;
    }
    lastKey = res.LastEvaluatedKey;
  } while (lastKey);
  return count;
}

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    // Delete the user's own ads and reports first. Messages they *sent* are
    // intentionally left alone -- the seller they messaged has a legitimate
    // interest in keeping their own inbox intact, and erasure applies to the
    // requester's own data, not a record another party legitimately holds.
    const adsDeleted = await deleteAllByOwner(TABLES.UserAd, user.id);
    const reportsDeleted = await deleteAllByOwner(TABLES.ReportAd, user.id);

    await ddb.send(new DeleteCommand({ TableName: TABLES.User, Key: { id: user.id } }));

    try {
      await cognito.send(
        new AdminDeleteUserCommand({ UserPoolId: process.env.USER_POOL_ID, Username: user.email })
      );
    } catch (e) {
      console.warn('Cognito user deletion failed (profile row was still removed):', e.message);
    }

    console.log(`Deleted account ${user.id}: ${adsDeleted} ad(s), ${reportsDeleted} report(s) removed`);
    return json(200, { success: true });
  } catch (error) {
    console.error('Delete account error:', error.message || error);
    return json(500, { error: error.message || 'Failed to delete account' });
  }
};
