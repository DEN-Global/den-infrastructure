# Isolated Cloudflare preview plan

The repository owner requested connecting their Cloudflare account for an online preview. Official CLI OAuth device authorization is the current pending prerequisite; never request account passwords or API tokens in chat.

Prepare a separate preview Worker and D1 database; never reuse the local QA database or real production data. Keep live payment and international booking capabilities disabled. Remote resource creation, migrations, secrets and deployment must be verified against the authenticated account and current CLI schema/dry-run before execution. This plan does not claim those actions have happened.

A deployable integrated preview requires the eight application builds copied into a single static-assets tree and native Worker ASSETS binding, plus an explicit preview origin, trusted administrator provisioning and fresh random encryption key supplied as an environment secret. Local Node routing is not the production implementation. Configure static assets securely, ensure all /api calls reach the authenticated Worker, preserve old hashed assets during upgrades, and run smoke tests on the resulting preview URL.

No pricing/provider credentials, live debits, actual identity approvals or international activation belong in this preview. Keep test users explicitly labelled and apply privacy/retention controls before inviting actual users. Verify billing/free-tier limits in the target account; no spend commitment is authorized by this plan.
