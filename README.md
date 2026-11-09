# DEN infrastructure

Shared same-origin preview orchestrator and workspace entry point. No paid resources or production deployments are created.

Clone all DEN repositories as siblings. Run `npm ci` and `npm run build` in each application (`den-consumer`, `den-manager`, `den-rider`, `den-dispatch`, `den-admin`, `den-transport`, `den-shipment`, `den-warehouse`). Then run `npm ci && npm run dev` in `den-backend`. Open http://localhost:8787 for the integrated portal. Each role uses the same HttpOnly session cookie and /api authorization, not independent identities.

`npm run build:all` builds installed sibling applications. `npm run check` validates portal navigation. To explicitly enable the LOCAL payment simulator only, start the backend with `DEN_SANDBOX_PAYMENTS=true npm run dev`; never set this flag for a real-money launch.

The backend-only Worker configuration remains in den-backend/cloudflare.config.ts. This repository now also contains an isolated integrated preview config (`cloudflare.config.ts` plus Vite) that packs all nine built applications with the snapshotted central API. Run `npm run prepare:preview`, `npm run build:preview:local`, `npm run verify:preview`, and `npm run bundle:preview`. The resulting `.preview/release` rebuilds independently of sibling repositories. See [PREVIEW_PLAN.md](PREVIEW_PLAN.md) for exact environment gates and separate explicitly authorized remote steps. Builds perform no remote provisioning or deployment. Initial preview administrator mode can be explicitly disabled: no QA identity is reused and no administrator is bootstrapped. Live payment simulation is off in the Cloudflare preview configuration.

Production must use same-origin asset routing (or an explicitly reviewed secure cross-origin design), HTTPS, unique environment keys, trusted Primary provisioning, verified email/recovery, approved providers, privacy/retention settings, external audit checkpoints and monitoring. The development server is localhost-only and is not a production server.

Rollback: restore previous application build without dropping database history; use additive forward fixes. Snapshot/backup the environment before migrations, verify restore in staging, and record immutable release checksums. Do not run destructive rollback SQL automatically.
