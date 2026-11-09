# Restora Admin

A **separate internal operations portal** for Restora platform employees, not a restaurant dashboard clone. Built with React, TypeScript and Vite. Data comes exclusively from `/api/v1/platform/*` backend endpoints.

## Current screens

- Platform overview: restaurant, branch, order, customer and WhatsApp connection counts
- Restaurant directory: search, pagination, recent registrations
- Restaurant detail: branches, recent order statuses and WhatsApp number health (read-only)
- Platform team: owner-only grant/revoke access by **verified Restora account email**
- Security audit: historical platform-team grants and revocations, owner-only
- System health: guarded database and Meta configuration readiness indicators

The backend enforces verified sessions and platform-specific roles. A restaurant owner is **not** a platform administrator automatically.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
npm run verify
```

Configure `VITE_API_URL` to the development API. In local development, the Vite proxy forwards `/api` to the API; in a hosted build the API origin is taken from `VITE_API_URL`.

## Backend security configuration

The Restora backend must set:

- `PLATFORM_ADMIN_BOOTSTRAP_EMAILS`: comma-separated email addresses of verified Restora accounts allowed to manage the internal platform. **Default is no access.** Protect this variable and never commit it.
- `PLATFORM_ADMIN_ORIGINS`: exact HTTPS origins allowed for the admin portal, e.g. `https://admin.restora.live`.
- `CLIENT_ORIGIN`: include the same origin along with the restaurant dashboard domain so credentialed browser API requests pass CORS.
- Existing `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, database and cookie configuration for the API.

**Hosting recommendation:** Deploy at `https://admin.restora.live` (same site as `https://restora.live`). Cross-site browsers may block authenticated cookies when hosting at a distinct `.web.app` domain. Never store session tokens in localStorage. Use HTTPS only.

## Roles

- **owner** — bootstrap via a server-only allowlist. Can view the platform and grant/revoke support and analyst roles.
- **support / analyst** — read-only aggregated restaurant operations. Cannot access platform team provisioning.
- Restaurant employees and owners cannot access the portal unless they have separate platform authorization.

To add a teammate, have them register and verify their normal Restora account first, then enter their email under **Platform team**. There is no public admin signup.

## Deployment

1. Deploy the backend platform API to a staging environment.
2. Confirm admin API origins, session cookies and database are isolated from production.
3. Build the app with the matching `VITE_API_URL` value, point hosting to `dist/`.
4. Log in as a configured bootstrap owner; verify a normal restaurant account receives HTTP 403 from `/api/v1/platform/me`.
5. Confirm platform routes never leak secrets or customer contact information.
6. Run mobile and desktop visual QA, verify build checks, then authorize production deployment separately.

**Do not put secrets, password values or authorization tokens into Vite environment variables. Vite variables are public.**

## Limitations / release gate

This is the initial read-only operations console, not a billing, subscription, impersonation or disaster-recovery tool. It does not yet provide infrastructure metrics, customer-support tickets, audit search, billing control or cross-system incident timelines. Those should be separately designed, authorized and tested before introduction.
