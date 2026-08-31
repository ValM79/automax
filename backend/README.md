# AutoMax: Base44 → AWS migration

This package rebuilds everything the `ValM79/auto-max` repo depended on Base44
for — database, auth, file storage, and all 9 backend functions — as native AWS
services, plus a drop-in replacement for the frontend's Base44 client so the
existing ~150 page/component files need minimal changes.

## What's in here

```
automax-aws-migration/
├── cdk/                    Infrastructure-as-code (AWS CDK, TypeScript)
│   └── lib/automax-stack.ts   The whole stack: Cognito, DynamoDB, S3, CloudFront, API Gateway, Lambda
├── lambda/                 The 9 Base44 backend functions, ported to Node.js, plus 2 new ones
│   ├── entity-api/            Generic CRUD replacing Base44's auto-generated entity endpoints
│   ├── presignUpload/         New — S3 photo uploads (Base44 handled this invisibly)
│   ├── contactSeller/
│   ├── createCheckoutSession/
│   ├── deleteAccount/
│   ├── downloadReceipt/
│   ├── getVehicleDetails/
│   ├── sendVerificationCode/
│   ├── stripeWebhook/
│   ├── submitContactForm/
│   ├── verifyCode/
│   └── _lib/common.mjs         Shared helpers (auth, DynamoDB, secrets)
├── frontend-shim/          Files to copy into the auto-max repo
│   ├── base44Client.js        Replaces src/api/base44Client.js
│   ├── AuthCallback.jsx       New page, needed only for Google/Apple login
│   └── .env.example
└── schema/
    └── entities.md          What each entity maps to + the RLS rules that were ported
```

## What maps to what

| Base44                                   | AWS                                                              |
|-------------------------------------------|-------------------------------------------------------------------|
| Managed NoSQL DB                          | DynamoDB (5 tables: UserAd, Message, ReportAd, VerificationCode, UserProfile) |
| Built-in auth                             | Cognito User Pool (email/password + optional Google/Apple)        |
| `base44/functions/*` (Deno)               | Lambda (Node.js 20), same file names, ported logic                |
| Auto-generated entity CRUD + RLS          | `entity-api` Lambda, RLS rules re-implemented from the `.jsonc` files |
| File storage (ad photos)                  | S3 + CloudFront, uploaded via presigned URLs (`presignUpload`)    |
| App hosting                               | S3 + CloudFront (static React/Vite build)                         |
| Secrets (Stripe/Twilio/Resend/NCR keys)   | Secrets Manager (`automax/app-secrets`)                           |

Everything was reverse-engineered directly from the public repo — the entity
schemas and RLS rules came from `base44/entities/*.jsonc`, and the 9 functions
were ported line-for-line from `base44/functions/*/entry.ts`, so behavior
should match the live app closely. Two things I could **not** see from the
repo and had to make reasonable assumptions about — verify both against the
live app before cutover:

1. **Account creation flow.** `Login.jsx` clearly calls
   `base44.auth.loginViaEmailPassword(email, password)` and
   `base44.auth.loginWithProvider('google'/'apple', ...)`. But `CreateAccount.jsx`'s
   submit handler doesn't call anything in the exported code — sign-up may happen
   through a different flow in the live app. The shim implements standard Cognito
   sign-up (`base44.auth.register`, `confirmRegistration`) — wire it into
   `CreateAccount.jsx`'s `handleSubmit` once you confirm what the real flow should be.
2. **Existing listing/user data.** The repo only contains code, not your actual
   car listings, messages, or user accounts — see "Migrating your data" below.

## 1. Deploy the infrastructure

Prerequisites: an AWS account, the AWS CLI configured with credentials that can
create IAM roles/Cognito/DynamoDB/Lambda/CloudFront, and Node.js 20+.

```bash
cd cdk
npm install
npx cdk bootstrap   # one-time per AWS account/region
```

If you already own automax.ie and want CloudFront to serve it directly,
request/validate an ACM certificate **in us-east-1** first (CloudFront requires
this region regardless of where the rest of the stack runs), then:

```bash
export AUTOMAX_DOMAIN_NAME=automax.ie
export AUTOMAX_CERT_ARN=arn:aws:acm:us-east-1:...:certificate/...
```

Otherwise skip those two exports and deploy to the auto-generated CloudFront
domain first — you can attach the real domain later.

```bash
cd ../lambda && npm install   # installs stripe/jspdf/aws-jwt-verify/ulid for bundling
cd ../cdk
npm run deploy
```

This provisions everything and prints outputs including `ApiUrl`,
`UserPoolId`, `UserPoolClientId`, `UserPoolDomain`, `FrontendBucketName`,
`FrontendDistributionDomain`, `PhotosBucketName`, `PhotosDistributionDomain`.
Save these — the frontend env file needs several of them.

## 2. Fill in the secrets

Base44 was holding your Stripe, Twilio, Resend, and Irish NCR API keys. Put
the real values into the secret CDK created:

```bash
aws secretsmanager put-secret-value \
  --secret-id automax/app-secrets \
  --secret-string '{
    "STRIPE_SECRET_KEY": "sk_live_...",
    "STRIPE_WEBHOOK_SECRET": "whsec_...",
    "TWILIO_ACCOUNT_SID": "AC...",
    "TWILIO_AUTH_TOKEN": "...",
    "TWILIO_PHONE_NUMBER": "+353...",
    "RESEND_API_KEY": "re_...",
    "IRISH_NCR_API_KEY": "..."
  }'
```

`sendVerificationCode` Basic-auths to Twilio as **either** an API Key or the
account Auth Token: it uses `TWILIO_API_KEY_SID` / `TWILIO_API_KEY_SECRET`
(`SK...`) when both are present, otherwise `TWILIO_ACCOUNT_SID` /
`TWILIO_AUTH_TOKEN`. `TWILIO_ACCOUNT_SID` is always required — it forms the
`/Accounts/<sid>/Messages.json` URL path. If you use an API Key, create it as
type **Standard** (not Restricted) in region **US1** so it works against
`api.twilio.com`. Resend sends from `verify@automax.ie` / `noreply@automax.ie`,
so `automax.ie` must be a verified sending domain in Resend (DKIM + SPF + DMARC).

**Twilio SMS to Irish numbers needs a registered Alphanumeric Sender ID, not
a phone number.** Confirmed live (2026-08-29): a US long code `TWILIO_PHONE_NUMBER`
sends successfully (Twilio accepts it, 200 from our Lambda) but never actually
arrives — Twilio's own delivery log shows `undelivered` / error 30003
"Unreachable destination handset" every time. Per Twilio's own Ireland
guidelines, international long codes aren't supported by the Meteor and Three
networks at all, and are unreliable elsewhere; the only real fix is
registering an Alphanumeric Sender ID (e.g. "AutoMax") for Ireland, which
takes about **2 weeks** to provision. Until that's done and confirmed working,
`PlaceAd.jsx`'s "Sell Now" gate deliberately checks only `emailVerified`, not
`phoneVerified` — restore `|| !phoneVerified` to that check once SMS is
actually landing on real Irish phones, not just returning 200.

**Cognito's own signup/password-reset emails are a separate email pathway from
Resend** and needed their own fix. They defaulted to `COGNITO_DEFAULT`, a
dev-only sender capped at ~50 emails/day shared across the whole user pool --
discovered live 2026-08-30 when a real user's confirmation email silently
never arrived, leaving them stuck ("user already exists" on re-signup, "user
not confirmed" on login; fixed for that one account with
`admin-confirm-sign-up`). The `AutomaxUserPool` construct now sets
`email: cognito.UserPoolEmail.withSES(...)` sending from `accounts@automax.ie`.
This needs `automax.ie` verified as an SES identity (DKIM only -- no MAIL FROM
domain / SPF changes, unlike Resend's setup) in the **same region as the
stack** (`eu-west-1`), and **SES production access requested** (Support Center
-> Service limit increase -> "SES Sending Limits"; usually approved within a
day, much lighter than Twilio's ComReg process) -- until that's granted, SES
is in sandbox mode and can only deliver to individually pre-verified email
addresses, which defeats the point for real signups.

Then in the Stripe Dashboard, add a webhook endpoint pointing at
`<ApiUrl>/webhooks/stripe` (from the CDK output) and copy the new signing
secret into `STRIPE_WEBHOOK_SECRET` above. The Stripe Price IDs hardcoded in
`lambda/createCheckoutSession/index.mjs` (`PACKAGE_CONFIG` /
`BIKE_PACKAGE_CONFIG`) are your **original** Base44/Stripe price IDs — if
they're in the same Stripe account you're keeping, leave them; if you're
moving to a new Stripe account, recreate the 6 prices there and swap the IDs
in, then redeploy.

## 3. Wire up the frontend

In your `auto-max` checkout:

```bash
cp ../automax-aws-migration/frontend-shim/base44Client.js src/api/base44Client.js
cp ../automax-aws-migration/frontend-shim/AuthCallback.jsx src/pages/AuthCallback.jsx
cp ../automax-aws-migration/frontend-shim/.env.example .env.local
# then edit .env.local with the real values from `cdk deploy`'s output
```

Add the callback route in `src/App.jsx` next to the other `<Route>` entries:

```jsx
import AuthCallback from '@/pages/AuthCallback';
// ...
<Route path="/auth/callback" element={<AuthCallback />} />
```

`src/lib/AuthContext.jsx` and `src/lib/app-params.js` need no changes — the
shim writes the session to the same `base44_access_token` localStorage key
they already read from `checkUserAuth()`.

Remove the now-unused `@base44/sdk` and `@base44/vite-plugin` packages from
`package.json`, then:

```bash
npm install
npm run build
aws s3 sync dist/ s3://<FrontendBucketName> --delete
aws cloudfront create-invalidation --distribution-id <dist-id> --paths "/*"
```

### Social login (Google/Apple)

Email/password login works out of the box. "Continue with Google/Apple" needs
one extra manual step: register an OAuth client in the Google Cloud Console
(and/or Apple Developer portal), then add a
`cognito.UserPoolIdentityProviderGoogle` (and/or `...Apple`) construct to
`cdk/lib/automax-stack.ts` with those credentials, list them in the user pool
client's `supportedIdentityProviders`, and redeploy. This can't be automated
without your own Google/Apple developer app credentials.

## 4. Migrating your existing data

The repo has your code, not your data. To bring over real listings, users, and
messages before cutover:

1. While the Base44 app is still live, write a short script using
   `@base44/sdk`'s `createClient` (same package the old frontend used) to page
   through `base44.entities.UserAd.list()`, `.Message.list()`, `.ReportAd.list()`
   with your app's service-role token, and write each record to the matching
   DynamoDB table via the AWS SDK — field names match 1:1 since the schemas
   were copied from `base44/entities/*.jsonc`.
2. User accounts: Base44's auth system doesn't expose password hashes for
   export (neither would any auth provider). Two practical options: (a) use
   Cognito's `AdminCreateUser` to pre-create every account with a temporary
   password and email them a reset link, or (b) let users re-register /
   "forgot password" themselves on first visit post-cutover. Ad ownership
   (`created_by_id`) will need to be re-mapped from Base44 user IDs to the new
   Cognito `sub` values as part of whichever path you choose.
3. Ad photos: copy the image files themselves into the new `automax-photos-*`
   S3 bucket and update each `UserAd.photos` URL array to point at the new
   CloudFront domain.

I can write this export/import script once you confirm which path you want
for user accounts — happy to do that as a follow-up.

## 5. DNS cutover

Once you've tested the AWS-hosted version end-to-end on the CloudFront domain:

1. Point `automax.ie` and `www.automax.ie` at the `FrontendDistributionDomain`
   (CNAME, or an ALIAS record if using Route 53).
2. If you migrated the domain's DNS to Route 53, redeploy with
   `AUTOMAX_DOMAIN_NAME`/`AUTOMAX_CERT_ARN` set so CloudFront serves the real
   domain with a valid cert (see step 1).
3. Update the Stripe webhook endpoint and any hardcoded `automax.ie` email
   addresses (already used as-is in `submitContactForm`/`downloadReceipt`) —
   no code change needed there, just DNS.

## Testing checklist before go-live

- [ ] Sign up, confirm email, log in, log out (email/password)
- [ ] Place an ad through checkout (Stripe test mode) → webhook flips it to `active`
- [ ] Upload ad photos → visible via CloudFront
- [ ] Message a seller → email delivered via Resend
- [ ] Report an ad
- [ ] Phone/email OTP verification flow (`sendVerificationCode`/`verifyCode`)
- [ ] Download a payment receipt PDF
- [ ] Delete account
- [ ] Vehicle registration lookup (Irish NCR)
- [ ] Anonymous browsing of active ads still works without logging in
- [ ] Admin role can see/moderate all ads and reports (set a user's `role` to
      `admin` via `aws dynamodb update-item` on `Automax-UserProfile` to test)

## Known limitations / scaling notes

- `entity-api`'s `filter()` falls back to a full **table Scan** when the query
  doesn't match one of the pre-built indexes (owner, status+subsection,
  target, IP). Fine at a few thousand listings; if `CarsForSale`/`FiltersSidebar`-style
  multi-attribute browsing (make + county + price range simultaneously) becomes
  slow at scale, the next step is either more targeted GSIs or moving `UserAd`
  to OpenSearch/Postgres for real filtering — DynamoDB isn't a great fit for
  that pattern long-term, it was chosen here to keep the initial migration
  simple and cheap.
- CORS on the API is currently locked to your domain in prod; during local dev
  point `AUTOMAX_DOMAIN_NAME` at `http://localhost:5173` or loosen it manually.
- Rough monthly cost at low-to-moderate traffic (a few thousand listings,
  tens of thousands of page views): mostly CloudFront + Lambda + DynamoDB
  on-demand, typically in the low tens of USD/month — get an estimate for
  your actual traffic with the [AWS Pricing Calculator](https://calculator.aws)
  before committing.
