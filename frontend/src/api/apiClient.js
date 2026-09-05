// Client for the AWS API Gateway + Cognito backend. Talks to the AWS API
// Gateway + Cognito backend in ../../../backend instead of Base44's servers.
//
// Preserves the existing localStorage contract: src/lib/AuthContext.jsx and
// src/lib/app-params.js already read the token from
// `localStorage.getItem('base44_access_token')` — this file keeps writing to
// that same key so AuthContext needs no changes on that front.
//
// Required Vite env vars (see .env.example):
//   VITE_API_BASE_URL            e.g. https://abc123.execute-api.eu-west-1.amazonaws.com
//   VITE_COGNITO_USER_POOL_ID    e.g. eu-west-1_XXXXXXXXX
//   VITE_COGNITO_CLIENT_ID       e.g. 1a2b3c4d5e6f7g8h9i0j
//   VITE_COGNITO_REGION          e.g. eu-west-1
//   VITE_COGNITO_DOMAIN          e.g. autoguide-123456789012.auth.eu-west-1.amazoncognito.com
//   VITE_PHOTOS_CDN_URL          e.g. https://d111111abcdef8.cloudfront.net

const API_BASE = import.meta.env.VITE_API_BASE_URL;
const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION;
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN;
const COGNITO_IDP_URL = `https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`;

const TOKEN_KEY = 'base44_access_token'; // kept identical to the original app's key
const REFRESH_KEY = 'base44_refresh_token';
const EMAIL_KEY = 'base44_user_email';

// ---------------------------------------------------------------------------
// Low-level Cognito helpers (raw fetch — no aws-amplify dependency needed)
// ---------------------------------------------------------------------------

async function cognitoRequest(target, body) {
  const res = await fetch(COGNITO_IDP_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || data.__type || 'Cognito request failed');
    err.status = res.status;
    err.code = data.__type;
    throw err;
  }
  return data;
}

function storeSession(authResult) {
  localStorage.setItem(TOKEN_KEY, authResult.IdToken);
  if (authResult.RefreshToken) localStorage.setItem(REFRESH_KEY, authResult.RefreshToken);
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EMAIL_KEY);
}

function decodeJwt(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// API helper — attaches the Cognito ID token to entity/function calls
// ---------------------------------------------------------------------------

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await res.json() : await res.blob();

  if (!res.ok) {
    const err = new Error(payload?.error || `Request failed (${res.status})`);
    err.status = res.status;
    err.data = payload;
    throw err;
  }
  return payload;
}

// ---------------------------------------------------------------------------
// auth.*
// ---------------------------------------------------------------------------

const auth = {
  async me() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      const err = new Error('Not authenticated');
      err.status = 401;
      throw err;
    }
    const claims = decodeJwt(token);
    if (!claims || claims.exp * 1000 < Date.now()) {
      clearSession();
      const err = new Error('Session expired');
      err.status = 401;
      throw err;
    }
    // Merge Cognito identity claims with the app-specific profile (role, plus
    // the self-service fields updateMe() saves) stored in DynamoDB.
    const profile = await apiFetch(`/entities/User/${claims.sub}`).catch(() => ({}));
    return {
      ...profile,
      id: claims.sub,
      email: claims.email,
      full_name: claims.name || claims.email,
      role: profile?.role || 'user',
    };
  },

  /**
   * Backs Profile.jsx's "Save Changes" button. Goes through a dedicated
   * function (not entities.User.update()) because entity-api's User RLS is
   * deliberately admin-only, to stop a user setting role:'admin' on
   * themselves -- see backend/lambda/updateProfile/index.mjs.
   */
  async updateMe(data) {
    return apiFetch('/functions/updateProfile', { method: 'POST', body: JSON.stringify(data || {}) });
  },

  async loginViaEmailPassword(email, password) {
    const result = await cognitoRequest('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: COGNITO_CLIENT_ID,
      AuthParameters: { USERNAME: email, PASSWORD: password },
    });
    if (result.ChallengeName) {
      // e.g. NEW_PASSWORD_REQUIRED for admin-created users — surface to caller
      const err = new Error(`Additional step required: ${result.ChallengeName}`);
      err.challenge = result;
      throw err;
    }
    storeSession(result.AuthenticationResult);
    localStorage.setItem(EMAIL_KEY, email);
  },

  /** Starts Cognito sign-up. Account needs confirmRegistration() with the emailed code before first login. */
  async register(email, password, fullName) {
    await cognitoRequest('SignUp', {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: fullName || '' },
      ],
    });
  },

  async confirmRegistration(email, confirmationCode) {
    await cognitoRequest('ConfirmSignUp', {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: confirmationCode,
    });
  },

  async resendConfirmationCode(email) {
    await cognitoRequest('ResendConfirmationCode', { ClientId: COGNITO_CLIENT_ID, Username: email });
  },

  /**
   * Sends a 6-digit reset code by email via Cognito. NOTE: this is a code, not
   * a clickable link — Cognito's built-in ForgotPassword flow doesn't do magic
   * links out of the box, so ResetPassword.jsx collects the code directly
   * rather than reading a token from the URL.
   */
  async resetPasswordRequest(email) {
    await cognitoRequest('ForgotPassword', { ClientId: COGNITO_CLIENT_ID, Username: email });
  },

  async resetPassword({ email, code, newPassword }) {
    await cognitoRequest('ConfirmForgotPassword', {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code,
      Password: newPassword,
    });
  },

  /**
   * Redirects to the Cognito Hosted UI for federated login (Google/Apple).
   * Requires the identity provider to be configured in Cognito first (see
   * backend/README.md "Social login" section) — email/password login works
   * without it.
   */
  loginWithProvider(provider, redirectUrl) {
    const idp = provider === 'google' ? 'Google' : provider === 'apple' ? 'SignInWithApple' : provider;
    const callbackUrl = `${window.location.origin}/auth/callback`;
    sessionStorage.setItem('post_login_redirect', redirectUrl);
    const params = new URLSearchParams({
      identity_provider: idp,
      redirect_uri: callbackUrl,
      response_type: 'code',
      client_id: COGNITO_CLIENT_ID,
      scope: 'openid email profile',
    });
    window.location.href = `https://${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
  },

  /** Called from the /auth/callback route to finish the OAuth code exchange. */
  async completeOAuthLogin(code) {
    const callbackUrl = `${window.location.origin}/auth/callback`;
    const res = await fetch(`https://${COGNITO_DOMAIN}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: COGNITO_CLIENT_ID,
        code,
        redirect_uri: callbackUrl,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error_description || 'OAuth login failed');
    storeSession({ IdToken: data.id_token, RefreshToken: data.refresh_token });
    return sessionStorage.getItem('post_login_redirect') || '/';
  },

  logout(redirectUrl) {
    clearSession();
    if (redirectUrl) window.location.href = redirectUrl;
  },
};

// ---------------------------------------------------------------------------
// entities.<Entity>.*  — the entity SDK surface the app expects
// ---------------------------------------------------------------------------

function makeEntityClient(entityName) {
  return {
    async create(data) {
      return apiFetch(`/entities/${entityName}`, { method: 'POST', body: JSON.stringify(data) });
    },
    async get(id) {
      return apiFetch(`/entities/${entityName}/${id}`);
    },
    async update(id, data) {
      return apiFetch(`/entities/${entityName}/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },
    async delete(id) {
      return apiFetch(`/entities/${entityName}/${id}`, { method: 'DELETE' });
    },
    /** filter(queryObject, sort = '-created_date', limit = 50) — same signature as the original SDK */
    async filter(query = {}, sort = '-created_date', limit = 50) {
      const qs = new URLSearchParams({ filter: JSON.stringify(query), sort, limit: String(limit) });
      return apiFetch(`/entities/${entityName}?${qs.toString()}`);
    },
    /** list(sort, limit) — filter() with no query */
    async list(sort = '-created_date', limit = 50) {
      return this.filter({}, sort, limit);
    },
  };
}

const entities = {
  UserAd: makeEntityClient('UserAd'),
  Message: makeEntityClient('Message'),
  ReportAd: makeEntityClient('ReportAd'),
  VerificationCode: makeEntityClient('VerificationCode'),
  User: makeEntityClient('User'),
};

// ---------------------------------------------------------------------------
// functions.*  — one entry per Lambda in backend/lambda/
// ---------------------------------------------------------------------------

function makeFunctionClient(fnName) {
  return async (payload) => apiFetch(`/functions/${fnName}`, { method: 'POST', body: JSON.stringify(payload || {}) });
}

const functions = {
  contactSeller: makeFunctionClient('contactSeller'),
  createCheckoutSession: makeFunctionClient('createCheckoutSession'),
  deleteAccount: makeFunctionClient('deleteAccount'),
  getVehicleDetails: makeFunctionClient('getVehicleDetails'),
  sendVerificationCode: makeFunctionClient('sendVerificationCode'),
  submitContactForm: makeFunctionClient('submitContactForm'),
  verifyCode: makeFunctionClient('verifyCode'),
  // downloadReceipt returns a PDF blob, not JSON — call it directly (see below).
  async downloadReceipt(payload) {
    const token = localStorage.getItem(TOKEN_KEY);
    const res = await fetch(`${API_BASE}/functions/downloadReceipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload || {}),
    });
    if (!res.ok) throw new Error(`Failed to generate receipt (${res.status})`);
    return res.blob();
  },

  /**
   * Every call site in the real app (ContactFormModal, VerificationInput,
   * PlaceAd, Profile, VehicleDetail, PaymentHistory) calls
   * api.functions.invoke('name', payload) and reads the result off
   * `.data` -- matching Base44's original SDK shape, not this shim's plain
   * direct-call functions above. This wraps them to match rather than
   * requiring every call site to be rewritten.
   */
  async invoke(name, payload) {
    if (typeof this[name] !== 'function') {
      throw new Error(`Unknown function: ${name}`);
    }
    const data = await this[name](payload);
    return { data };
  },
};

// ---------------------------------------------------------------------------
// Uploads photos directly to S3 (replaces Base44's built-in file storage).
// ---------------------------------------------------------------------------

const integrations = {
  Core: {
    async UploadFile(file) {
      const { uploadUrl, publicUrl } = await apiFetch('/uploads/presign', {
        method: 'POST',
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      return { file_url: publicUrl };
    },
  },
};

export const api = { auth, entities, functions, integrations };
