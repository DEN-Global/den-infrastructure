# DEN Global on Vercel

Live app: https://den-global.vercel.app
Dashboard screenshot gallery: https://den-global.vercel.app/design-preview/

Vercel project `den-global` belongs to `lekanay2005-coders-projects` (project ID `prj_pygRs4gJ7dLRYxn6s1o6CeUDCaFs`). Deployment `dpl_PmWNHP4CAq9yJW98mqrgZAhr3q9C` is READY in the production target. This is the current development application, not a declaration that all production release gates are complete.

All eight built frontends are served by Vercel. `/api/*` is proxied to the Cloudflare Worker `den-global-preview-vercel.lekanay2005.workers.dev`. Database storage stays in the existing isolated Cloudflare D1 preview database; local SQLite files, local accounts and configuration were not uploaded. Thirteen additive migrations are applied. Worker version: `137c2414-1e69-4213-ac94-e336b040e135`. Its exact write origin is `https://den-global.vercel.app`; use that stable URL rather than deployment-specific addresses for sign-in.

The older Cloudflare preview Worker remains separate, sharing the existing preview database. The new API uses disabled owner administration pending secure owner provisioning. Live payments, withdrawals and carrier bookings remain unavailable. Email codes need a configured sender. The screenshot gallery uses synthetic demonstration data and does not grant access to any live role.

## Rebuild and release

Build the eight sibling frontends with `npm run build:all`, then run `npm run prepare:preview` and `node scripts/pack-vercel.mjs` here. The generated, ignored `.vercel-release` contains only built frontends, the public screenshot gallery and Vercel routing/security headers. It excludes local databases and secrets. Verify the account/project, explicitly link this generated directory to `den-global`, and deploy it with the Vercel CLI in the production target. No automatic Git deployment is configured because source is split across repositories.

The API is built from the backend snapshot with the existing Cloudflare preview workflow. Select the verified D1 UUID from the private deployment settings, `DEN_PREVIEW_WORKER_NAME=den-global-preview-vercel`, `DEN_PREVIEW_ORIGIN=https://den-global.vercel.app` and `DEN_PREVIEW_ADMIN_MODE=disabled`. Preserve the existing private encryption secret and deploy with `--no-provision`. Do not copy local QA users or change owner authority as a side effect of release.

Do not set global `trailingSlash: true`: it changes `/api/auth/me` to `/api/auth/me/` and breaks exact API routing. API responses are private/no-store, including CDN headers. CSP and other browser security headers mirror the existing portal policy. `.env*` and `.vercel/` are excluded from deployment artifacts.

Twenty live smoke checks passed: all eight workspace HTML routes, API health, anonymous denial, credential-file exclusion, screenshot gallery, actual registration and password sign-in against D1, secure cookie, persisted account, no administrator grant, CSRF denial, logout and revocation. Synthetic test credentials were generated in memory and not recorded. See `den-docs/verification/vercel-smoke.json` for results.
