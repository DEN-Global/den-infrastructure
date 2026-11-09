# Isolated Cloudflare preview artifact

Prepared on 2026-11-04 using cf 1.0.0-beta.27, Cloudflare Vite plugin 2.0.0-beta.v.11, Vite 8.3.5 and Node 24.22.0. No deployment or remote resource creation is performed by the preparation scripts.

## Prepared locally

`npm run prepare:preview` assembles the nine already-built sibling application distributions and snapshots only backend src, migrations, vendor modules and package metadata. It excludes local databases, QA users, credentials, environment files, secrets and node_modules. `npm run build:preview:local` builds the native Worker and static assets through the Cloudflare Vite plugin. `npm run verify:preview` uses isolated local workerd/D1, applies migrations in its ephemeral database, then verifies the portal, all nine workspaces, native ASSETS routing, real scrypt authentication, cookies/CSRF, unavailable live payments, locked trade, disabled wallets and absence of administrator bootstrap.

`npm run bundle:preview` creates `.preview/release`, a self-contained release directory containing configuration, exact dependency lock, snapshot source, migrations, all assets and verification scripts. Copy that entire directory to a separate machine and run `npm ci`, `npm run build:preview:local`, `npm run verify:preview`; no sibling repositories are needed to rebuild that release. The checked-in repository contains the assembler, not secret files or generated release outputs.

## Configuration gates

The configuration accepts development and preview modes only; production fails closed. Development uses an all-zero local database sentinel and disabled administration. It cannot create a named remote database through an unresolved binding. Every preview D1 binding uses an explicit database ID. Deploy with `--no-provision` even after configuration is verified.

For a remote isolated preview, set these environment variables from verified account/resource information:

- `DEN_PREVIEW_D1_ID`: UUID of a newly created isolated preview D1 database. Never reuse local QA or production data.
- `DEN_PREVIEW_WORKER_NAME`: isolated name beginning `den-global-preview`.
- `DEN_PREVIEW_ORIGIN`: exact HTTPS origin, without trailing slash, matching the preview's actual address.
- `DEN_PREVIEW_ADMIN_MODE=disabled`: safe initial preview with `PRIMARY_ADMIN_ID=disabled-preview-admin`, no admin assignments and no bootstrap. Administrative approvals and trade controls remain unavailable until secure owner enrollment is completed separately.
- Alternatively, `DEN_PREVIEW_ADMIN_MODE=enabled` requires `DEN_PREVIEW_PRIMARY_ADMIN_ID` of an actually approved and securely enrolled preview owner. The build does not create or approve that user.
- `DEN_PREVIEW_SECRETS_FILE`: absolute path outside the repository to a private JSON file containing only `MFA_ENCRYPTION_KEY`, a freshly generated canonical base64 encoding of 32 cryptographically random bytes. Do not reuse the local QA key or paste it into chat.

`npm run validate:preview-env` validates the variable and secret shapes without printing values. It cannot verify account ownership, database isolation, business approval or billing settings. `DEN_SANDBOX_PAYMENTS` is fixed to false in the preview config. Live money and carrier/customs integrations are not configured.

## Explicit later remote steps — not performed by artifact preparation

After account OAuth is authorized, inspect the selected account and newly isolated resource IDs, review current CLI schemas and dry-runs, and apply only the supplied additive migrations to that empty preview database:

```sh
npm exec cf -- d1 migrations apply "$DEN_PREVIEW_D1_ID" --dir .preview/backend/migrations --dry-run
```

The actual migration command is the same without `--dry-run`; it changes remote schema and must only be run after the target has been verified. A fresh empty preview requires no import of development data. Provisioning a database is a separate explicit account operation; the build never does it.

After environment/secret validation and migrations:

```sh
npm run build:preview
npm exec cf -- deploy --mode preview --no-provision --secrets-file "$DEN_PREVIEW_SECRETS_FILE" --dry-run
```

Only an authorized actual deployment omits `--dry-run`. No deployment command is embedded in npm preparation/build scripts. Do not deploy the development-mode output, which intentionally references a local-only sentinel. No account ID, origin or database identifier is guessed by this document.

After deployment verify HTTPS, exact-origin login/CSRF, portal and all role asset paths, no administrator bootstrap, locked trade, disabled funds, CSP/headers and monitoring. Do not report the preview online until the actual URL responds successfully. Record the previous Worker version and migration list; rollback by selecting a prior reviewed version, preserving append-only data and migration history. No destructive rollback SQL is included.

## Evidence for the build configuration

Installed `@cloudflare/config` types confirm `worker.assets.runWorkerFirst`, `bindings.assets()`, D1 id bindings and `observability.traces`. Cloudflare's [Vite static-assets documentation](https://developers.cloudflare.com/workers/vite-plugin/reference/static-assets/) confirms a non-empty Vite publicDir enables the client artifact and that asset paths are supplied by the plugin. The config uses `publicDir: '.preview/assets'`, native `ASSETS`, API-first `/api/*` routing, no SPA fallback for missing API paths, query-redacted logs and sampled traces. Static response CSP is supplied by the packed `_headers` file.
