// Generic entity CRUD API — replaces the auto-generated entity endpoints Base44
// gave you for free (`base44.entities.<Entity>.create/get/filter/update/delete`).
// Re-implements the exact row-level-security (RLS) rules from
// base44/entities/*.jsonc so behavior matches the original app.
//
// Routes (API Gateway HTTP API, path params in {}):
//   GET    /entities/{entity}          filter/list  (query string: filter=<json>, sort=-created_date, limit=20)
//   POST   /entities/{entity}          create
//   GET    /entities/{entity}/{id}     get one
//   PUT    /entities/{entity}/{id}     update
//   DELETE /entities/{entity}/{id}     delete

import { QueryCommand, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, newId, nowIso, json, getUserFromEvent } from '../_lib/common.mjs';
import { sanitizeUserAdCreate, sanitizeUserAdUpdate } from './userAdRules.mjs';

// Mirrors base44/entities/*.jsonc "rls" blocks.
// Optional per-entity hooks narrow what a non-admin may write on top of canWrite:
//   sanitizeCreate(body, user) -> body
//   sanitizeUpdate(existing, body, user) -> { body } | { error: { statusCode, message } }
const ENTITY_CONFIG = {
  UserAd: {
    table: TABLES.UserAd,
    requireAuthCreate: true,
    defaults: () => ({ status: 'pending' }),
    canRead: (item, user) =>
      item.status === 'active' || (!!user && item.created_by_id === user.id) || user?.role === 'admin',
    canWrite: (item, user) => !!user && (item.created_by_id === user.id || user.role === 'admin'),
    sanitizeCreate: sanitizeUserAdCreate,
    sanitizeUpdate: sanitizeUserAdUpdate,
    gsis: {
      byOwner: { name: 'byOwner', pk: 'created_by_id', sk: 'created_date' },
      byStatusSubsection: { name: 'byStatusSubsection', pk: 'status', sk: 'subsection' },
    },
  },
  Message: {
    table: TABLES.Message,
    requireAuthCreate: true,
    defaults: () => ({ status: 'sent' }),
    canRead: (item, user) =>
      !!user && (item.created_by_id === user.id || item.seller_user_id === user.id || user.role === 'admin'),
    canWrite: (item, user) =>
      !!user && (item.created_by_id === user.id || item.seller_user_id === user.id || user.role === 'admin'),
    gsis: {
      byOwner: { name: 'byOwner', pk: 'created_by_id', sk: 'created_date' },
      bySeller: { name: 'bySeller', pk: 'seller_user_id', sk: 'created_date' },
    },
  },
  ReportAd: {
    table: TABLES.ReportAd,
    requireAuthCreate: true,
    defaults: () => ({ status: 'pending' }),
    canRead: (item, user) => !!user && (item.created_by_id === user.id || user.role === 'admin'),
    canWrite: (item, user) => !!user && (item.created_by_id === user.id || user.role === 'admin'),
    gsis: { byOwner: { name: 'byOwner', pk: 'created_by_id', sk: 'created_date' } },
  },
  VerificationCode: {
    table: TABLES.VerificationCode,
    requireAuthCreate: true,
    defaults: () => ({ verified: false, attempts: 0 }),
    canRead: (item, user) => !!user && item.created_by_id === user.id,
    canWrite: (item, user) => !!user && item.created_by_id === user.id,
    gsis: {
      byTarget: { name: 'byTarget', pk: 'target', sk: 'created_date' },
      byIp: { name: 'byIp', pk: 'client_ip', sk: 'created_date' },
    },
  },
  User: {
    // App-specific profile extension (just `role`). Identity itself lives in Cognito.
    table: TABLES.User,
    requireAuthCreate: true,
    defaults: () => ({ role: 'user' }),
    canRead: (item, user) => !!user && (item.id === user.id || user.role === 'admin'),
    canWrite: (item, user) => !!user && user.role === 'admin', // users can't self-promote to admin
    gsis: {},
  },
};

export const handler = async (event) => {
  const method = event.requestContext.http.method;
  const entityName = event.pathParameters?.entity;
  const id = event.pathParameters?.id;
  const config = ENTITY_CONFIG[entityName];

  if (!config) return json(404, { error: `Unknown entity '${entityName}'` });

  const user = await getUserFromEvent(event);

  try {
    if (method === 'POST' && !id) return await createItem(config, event, user);
    if (method === 'GET' && id) return await getItem(config, entityName, user, id);
    if (method === 'GET' && !id) return await listItems(config, event, user);
    if (method === 'PUT' && id) return await updateItem(config, entityName, event, user, id);
    if (method === 'DELETE' && id) return await deleteItem(config, entityName, user, id);
    return json(405, { error: 'Method not allowed' });
  } catch (err) {
    console.error(`entity-api error [${entityName} ${method}]:`, err);
    return json(500, { error: err.message });
  }
};

async function createItem(config, event, user) {
  if (config.requireAuthCreate && !user) return json(401, { error: 'Unauthorized' });
  let body = JSON.parse(event.body || '{}');
  if (config.sanitizeCreate) body = config.sanitizeCreate(body, user);
  const item = {
    ...config.defaults(),
    ...body,
    id: newId(),
    created_by_id: user.id,
    created_date: nowIso(),
    updated_date: nowIso(),
  };
  await ddb.send(new PutCommand({ TableName: config.table, Item: item }));
  return json(200, item);
}

async function getItem(config, entityName, user, id) {
  const res = await ddb.send(new GetCommand({ TableName: config.table, Key: { id } }));
  if (!res.Item) return json(404, { error: `${entityName} not found` });
  if (!config.canRead(res.Item, user)) return json(404, { error: `${entityName} not found` });
  return json(200, res.Item);
}

async function updateItem(config, entityName, event, user, id) {
  const res = await ddb.send(new GetCommand({ TableName: config.table, Key: { id } }));
  if (!res.Item) return json(404, { error: `${entityName} not found` });
  if (!config.canWrite(res.Item, user)) return json(403, { error: 'Forbidden' });

  let body = JSON.parse(event.body || '{}');
  // Never allow the client to overwrite ownership/system fields
  delete body.id;
  delete body.created_by_id;
  delete body.created_date;

  if (config.sanitizeUpdate) {
    const result = config.sanitizeUpdate(res.Item, body, user);
    if (result.error) return json(result.error.statusCode, { error: result.error.message });
    body = result.body;
  }

  const updated = { ...res.Item, ...body, updated_date: nowIso() };
  await ddb.send(new PutCommand({ TableName: config.table, Item: updated }));
  return json(200, updated);
}

async function deleteItem(config, entityName, user, id) {
  const res = await ddb.send(new GetCommand({ TableName: config.table, Key: { id } }));
  if (!res.Item) return json(404, { error: `${entityName} not found` });
  if (!config.canWrite(res.Item, user)) return json(403, { error: 'Forbidden' });
  await ddb.send(new DeleteCommand({ TableName: config.table, Key: { id } }));
  return json(200, { success: true });
}

async function listItems(config, event, user) {
  const qs = event.queryStringParameters || {};
  let filter = {};
  try {
    filter = qs.filter ? JSON.parse(qs.filter) : {};
  } catch {
    return json(400, { error: 'filter must be valid JSON' });
  }
  const sort = qs.sort || '-created_date';
  const limit = Math.min(parseInt(qs.limit || '50', 10) || 50, 200);
  const sortField = sort.replace(/^-/, '');
  const sortDesc = sort.startsWith('-');

  let items = await fetchCandidates(config, filter);

  // RLS: drop rows the caller isn't allowed to see
  items = items.filter((item) => config.canRead(item, user));

  // Apply any remaining equality filters not already covered by the DB query
  for (const [key, value] of Object.entries(filter)) {
    items = items.filter((item) => item[key] === value);
  }

  items.sort((a, b) => {
    const av = a[sortField],
      bv = b[sortField];
    if (av === bv) return 0;
    const cmp = av > bv ? 1 : -1;
    return sortDesc ? -cmp : cmp;
  });

  return json(200, items.slice(0, limit));
}

/** Picks the best available GSI for the given filter, falling back to a table Scan. */
async function fetchCandidates(config, filter) {
  for (const gsi of Object.values(config.gsis)) {
    if (filter[gsi.pk] !== undefined) {
      const res = await ddb.send(
        new QueryCommand({
          TableName: config.table,
          IndexName: gsi.name,
          KeyConditionExpression: '#pk = :pk',
          ExpressionAttributeNames: { '#pk': gsi.pk },
          ExpressionAttributeValues: { ':pk': filter[gsi.pk] },
          ScanIndexForward: false, // newest first when sort key is created_date
        })
      );
      return res.Items || [];
    }
  }
  // No matching index — fall back to a full table scan (fine at MVP scale;
  // move to OpenSearch/Postgres if listing volume grows large).
  const res = await ddb.send(new ScanCommand({ TableName: config.table }));
  return res.Items || [];
}
