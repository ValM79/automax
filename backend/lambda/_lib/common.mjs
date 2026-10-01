// Shared helpers used by every AutoMax Lambda function.
// Ported from what base44Client / createClientFromRequest used to do for you automatically.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { ulid } from 'ulid';

const ddbClient = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

export const TABLES = {
  UserAd: process.env.USERAD_TABLE,
  Message: process.env.MESSAGE_TABLE,
  ReportAd: process.env.REPORTAD_TABLE,
  VerificationCode: process.env.VERIFICATIONCODE_TABLE,
  User: process.env.USERPROFILE_TABLE,
  ApplePurchase: process.env.APPLEPURCHASE_TABLE,
};

export function newId() {
  return ulid();
}

export function nowIso() {
  return new Date().toISOString();
}

export function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

let cachedVerifier;
function getVerifier() {
  if (!cachedVerifier) {
    cachedVerifier = CognitoJwtVerifier.create({
      userPoolId: process.env.USER_POOL_ID,
      tokenUse: 'id',
      clientId: null, // validated at the API Gateway authorizer level for protected routes; here we just decode identity
    });
  }
  return cachedVerifier;
}

/**
 * Returns the calling user ({ id, email, full_name, role }) or null for anonymous
 * requests. Mirrors `base44.auth.me()` — never throws on a missing/invalid token,
 * since many routes (e.g. reading active ads) must work for logged-out visitors.
 */
export async function getUserFromEvent(event) {
  const authHeader =
    event.headers?.authorization || event.headers?.Authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);

  try {
    const payload = await getVerifier().verify(token);
    const profile = await getUserProfile(payload.sub);
    return {
      id: payload.sub,
      email: payload.email,
      full_name: payload.name || payload['cognito:username'] || payload.email,
      role: profile?.role || 'user',
    };
  } catch (err) {
    console.warn('Token verification failed:', err.message);
    return null;
  }
}

export async function getUserProfile(userId) {
  const res = await ddb.send(
    new GetCommand({ TableName: TABLES.User, Key: { id: userId } })
  );
  return res.Item || null;
}

let cachedSecrets;
export async function getSecrets() {
  if (cachedSecrets) return cachedSecrets;
  const client = new SecretsManagerClient({});
  const res = await client.send(
    new GetSecretValueCommand({ SecretId: process.env.APP_SECRETS_ARN })
  );
  cachedSecrets = JSON.parse(res.SecretString);
  return cachedSecrets;
}

/** Strips CRLF/control chars — used before echoing user input into email bodies. */
export function sanitize(str, maxLen = 200) {
  return String(str || '')
    .replace(/[\r\n\t<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}
