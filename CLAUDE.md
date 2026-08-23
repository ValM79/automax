# automax — automax.ie, live on AWS

## What this project is

The real `automax.ie` (Irish car/vehicle marketplace), rebuilt as a fully
self-hosted AWS application. It replaces a prior Base44-hosted version — Base44
gave you the frontend only; DB, auth, and backend functions stayed on Base44's
managed platform, so this was a full backend rebuild, not a re-host. The
Base44-hosted site is being retired; there are no real customers on it.

- This repo consolidates two previously separate repos:
  - `github.com/ValM79/auto-max` — the original Base44 frontend export
  - `github.com/ValM79/automax-aws-migration` — the AWS backend package
    (CDK + Lambda), reverse-engineered directly from
    `base44/entities/*.jsonc` and `base44/functions/*/entry.ts` in the
    frontend export
- Both source repos still exist standalone but are superseded by this one.
- This repo itself was renamed from `AutoGuide` to `automax` once the real
  domain was cut over, to avoid the two names causing confusion going forward.

## Architecture decision: monorepo

Chosen over keeping frontend/backend as two repos because this is a rewrite
where the two sides have to match exactly (API shape, entity fields, RLS
rules) — one repo means atomic commits across both instead of version drift.
See `README.md` for the full rationale and layout.

## Current live status

- **Deployed to AWS** (`eu-west-1`), CloudFormation stack `AutomaxStack`.
- **`automax.ie` and `www.automax.ie`** point at the CloudFront distribution
  (DNS managed via Cloudflare, records set to DNS-only rather than proxied).
- **`autoguide.ie`** was the staging domain used during development
  (DNS at Register365) — now configured to redirect to `automax.ie` rather
  than serve a second live copy.
- **Signup verified working end-to-end** against the real Cognito pool
  (confirmed via `aws cognito-idp list-users`, not just "it compiled").
- **Stripe: live mode, in progress.** Same Stripe account as the original
  Base44 site, so the 6 hardcoded Price IDs in
  `backend/lambda/createCheckoutSession/index.mjs` already work as-is. A
  *second*, separate webhook endpoint (alongside Base44's existing one —
  never touched/removed) needs to be added in the Stripe Dashboard pointing
  at `<ApiUrl>/webhooks/stripe` for `checkout.session.completed` and
  `checkout.session.expired`. `stripeWebhook/index.mjs` uses a
  `ConditionExpression` guard so events for ad IDs from the shared Base44
  Stripe account (which fire to *every* webhook on the account, not just the
  one that created the session) are safely ignored rather than creating
  bogus records.
- **Twilio/Resend/Irish NCR: intentionally deferred.** Both
  `sendVerificationCode` and `submitContactForm` already fail cleanly (a
  proper error response, not a crash) when these secrets are missing —
  confirmed by reading the code. Phone/email OTP verification, the contact
  form, and vehicle registration lookup won't work until these are added,
  but nothing else breaks. `contactSeller`'s Resend call is also already
  wrapped so messaging a seller still works even without it (message just
  won't also trigger an email).

## Open items

1. **Google/Apple social login** needs your own OAuth app credentials
   registered in Cognito before "Continue with Google/Apple" will work —
   email/password works without it.
2. **Twilio/Resend/Irish NCR** — add real keys to Secrets Manager
   (`automax/app-secrets`) when ready; see "Current live status" above for
   what's degraded in the meantime.
3. **Production data migration** — not done. Given no real customers were on
   the Base44 site, this may not be needed at all; confirm before spending
   effort on it. See `backend/README.md` § "Migrating your existing data" if
   it turns out to matter.
4. **Full testing checklist** (`backend/README.md`) — only signup, anonymous
   browsing, and the live-deploy pipeline have been verified end-to-end so
   far. Login, placing an ad through checkout, messaging, delete-account,
   etc. still want walking through for real.

## A reusable skill exists for this class of task

`.claude/skills/base44-to-aws-migration/` (if present) captures the general
Base44→AWS migration process as a skill, generalized beyond this one project.
