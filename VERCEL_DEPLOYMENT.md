# Vercel + Supabase deployment

Production: https://den-global.vercel.app
Vercel project: `den-global` (team `team_f8u1LxnQr8BPy98rUSz9gv8M`)
Database: Supabase project `xhqxadhkcadxnzvbkfwr` (PostgreSQL 17, eu-west-1)

The Cloudflare Worker, its D1 database and the Worker preview deployment are retired. There
is no Wrangler configuration, no Worker proxy and no `workers.dev` hostname left in any
repository.

## What a release contains

`npm run pack:vercel` builds `.vercel-release`:

```
api/index.js            the single Vercel function entry point
src/                    backend request handler and domain modules
vendor/                 shared chat, tracking, payments, wallet and notification modules
migrations/postgres/    schema baseline and follow-ups
package.json            runtime dependencies only (pg, otpauth, web-push)
vercel.json             rewrites, security headers, no-store for /api
<app>/ …                the nine built workspaces plus the portal
```

Static assets come from `.preview/assets`, produced by `npm run prepare:preview` after
`npm run build:all` has compiled each application with Vite.

### Routing

Vercel registers every file in `api/` as its own function and does not support catch-all
filenames outside Next.js. The release therefore ships one entry point and maps the API to it:

```json
{ "rewrites": [{ "source": "/api/:path*", "destination": "/api/index" }] }
```

Vercel appends the captured path as a `path` query parameter but preserves the original
pathname, query string and body, so the handler still sees `/api/businesses?page=2` exactly
as the browser sent it. Do not remove `vendor/` from the release: `src/` imports it.

## Environment variables

| Variable | Type | Value |
| --- | --- | --- |
| `SUPABASE_DATABASE_URL` | sensitive | `postgresql://den_app.<ref>:<password>@aws-1-eu-west-1.pooler.supabase.com:6543/postgres` |
| `MFA_ENCRYPTION_KEY` | sensitive | base64 32-byte key; changing it invalidates TOTP secrets and push subscriptions |
| `VAPID_PRIVATE_KEY` | sensitive | base64url VAPID private key |
| `VAPID_PUBLIC_KEY` | plain | base64url VAPID public key |
| `VAPID_SUBJECT` | plain | `mailto:` contact for the push service |
| `APP_ORIGIN` | plain | `https://den-global.vercel.app` |
| `PRIMARY_ADMIN_ID` | plain | primary super-admin user id, or `disabled` |
| `DEN_SANDBOX_PAYMENTS` | plain | `false` |
| `SUPABASE_URL` | plain | `https://xhqxadhkcadxnzvbkfwr.supabase.co`, enables Supabase Auth as the code sender |
| `SUPABASE_ANON_KEY` | plain | publishable key (`sb_publishable_…`) used with `SUPABASE_URL` |
| `RESEND_API_KEY` | sensitive | alternative sender: posts to the Resend HTTP API instead |
| `SIGNIN_EMAIL_FROM` | plain | sender address; defaults to `onboarding@resend.dev` when unset |

`APP_ORIGIN` must match the browser origin exactly, otherwise state-changing requests are
rejected with `ORIGIN_REJECTED`.

## Database

Use the Supavisor pooler, not `db.<ref>.supabase.co`: the direct host is IPv6-only and
Vercel functions have no IPv6 egress. Supabase rotates the pooler host, so read it from
`GET /v1/projects/<ref>/config/database/pooler` rather than assuming `aws-0`.

The application connects as the dedicated `den_app` role (login, `USAGE`/`CREATE` on schema
`public`) instead of the `postgres` superuser role, so the function only owns what it needs.

Apply the schema before the first deploy, and after any new PostgreSQL migration:

```bash
SUPABASE_DATABASE_URL=... npm run db:migrate   # in den-backend
```

`den_schema_migrations` records each applied file with a SHA-256 checksum.

## Deploying

```bash
cd den-infrastructure
npm run build:all        # nine Vite builds
npm run prepare:preview  # pack static assets + manifest
npm run pack:vercel      # assemble .vercel-release
cd .vercel-release
vercel deploy --prod
```

The CLI cannot authenticate a team-scoped token with `vercel whoami`/`vercel link`, which
call `/v2/user` and return `User not found`. Write `.vercel/project.json` with `projectId`
and `orgId`, export `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID`, and deploy with
`vercel deploy --prod --yes --token …`.

## Verification performed

Against https://den-global.vercel.app:

- `GET /api/health` → 200 `{"status":"ok",...}`
- `GET /api/businesses` unauthenticated → 401 `SIGN_IN_REQUIRED`
- `POST /api/auth/login` → 200 with a session cookie and CSRF token
- `GET /api/auth/me`, `GET /api/services/wallet` → 200 through the Postgres pooler
- `POST /api/platform/addresses` with the CSRF token → 201, row persisted
- `GET /` → 200 portal, `GET /consumer/` → 200 application shell

Locally, `den-backend/scripts/check-postgres.mjs` passes 19/19 checks against the same
database, and `npm test` in `den-backend` is unchanged except for five added passing tests
(98 tests, 88 pass; the 10 failures are identical on the base branch).

## Known gaps

- Registration and email sign-in return `EMAIL_DELIVERY_NOT_CONFIGURED` until a sender is
  configured. Two paths exist, both already implemented:
  - **Supabase Auth** (`SUPABASE_URL` + `SUPABASE_ANON_KEY`): the function calls
    `POST /auth/v1/otp` to send and `POST /auth/v1/verify` to check the code. Requires custom
    SMTP in Supabase, because on the free tier with the default mailer Supabase refuses
    template edits (needed for `{{ .Token }}`), allows only 2 messages per hour per project,
    and delivers only to addresses on the Supabase team.
  - **Resend** (`RESEND_API_KEY`): sent and stored by the app itself, no rate limits beyond
    this platform's own, works immediately with any verified sender.
- Sign-up is two steps in every app that offers it (`/auth/register-code`, then
  `/auth/register` with `emailCode`), collecting name, email, phone, country and password.
  Pets, transport and shipment have no sign-up screen: they only sign in. Until a sender is
  configured the first step returns `503 EMAIL_DELIVERY_NOT_CONFIGURED` and the form says
  email verification is unavailable.
- Media is stored as inline data in the database; there is no object storage yet.
- Deployments are manual. `vercel git connect` and CI are not configured.
- Deployment Protection is `all_except_custom_domains`, so the production alias is public
  while preview deployments stay behind Vercel Authentication.
