# DEN infrastructure

Shared same-origin preview orchestrator and workspace entry point. No paid resources or production deployments are created.

Clone all DEN repositories as siblings. Run `npm ci` and `npm run build` in each application (`den-consumer`, `den-manager`, `den-rider`, `den-dispatch`, `den-admin`, `den-transport`, `den-shipment`, `den-warehouse`). Then run `npm ci && npm run dev` in `den-backend`. Open http://localhost:8787 for the integrated portal. Each role uses the same HttpOnly session cookie and /api authorization, not independent identities.

`npm run build:all` builds installed sibling applications. `npm run check` validates portal navigation. To explicitly enable the LOCAL payment simulator only, start the backend with `DEN_SANDBOX_PAYMENTS=true npm run dev`; never set this flag for a real-money launch.

Cloudflare Worker configuration remains in den-backend/cloudflare.config.ts, the authoritative API deployment artifact. D1 migrations must be applied in order after backup and staging verification. Node SQLite is local-only. Cloudflare login, remote database provisioning, R2 private verification storage, queues, real-time Durable Objects, provider credentials, secrets and reviewed preview deployment remain outstanding. No free-tier capacity or cost guarantee is made.

Production must use same-origin asset routing (or an explicitly reviewed secure cross-origin design), HTTPS, unique environment keys, trusted Primary provisioning, verified email/recovery, approved providers, privacy/retention settings, external audit checkpoints and monitoring. The development server is localhost-only and is not a production server.

Rollback: restore previous application build without dropping database history; use additive forward fixes. Snapshot/backup the environment before migrations, verify restore in staging, and record immutable release checksums. Do not run destructive rollback SQL automatically.
