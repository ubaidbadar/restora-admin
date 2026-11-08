# Restora administration and WhatsApp — architecture, rollout plan and acceptance gates

## Objective

Build **self-service restaurant WhatsApp onboarding** and a **separate internal Restora platform console**. These must operate alongside the restaurant dashboard without conflating restaurant owners with Restora employees.

## Repository responsibilities

| Repository | Responsibility | Current implementation |
|---|---|---|
| `restora-backend` | Secure platform staff identity, restaurant data aggregation, Meta code exchange, connection lifecycle, signed webhooks and audit | Implemented on feature PR |
| `restora-web` | Restaurant settings, Meta signup popup, WhatsApp inbox and guarded staff replies | Implemented on feature PR |
| `restora-admin` | Internal company portal: overview, restaurant detail, WhatsApp connection health, team roles, access history, basic system readiness | Implemented on feature PR |

**Admin is intentionally not a literal fork of the restaurant UI.** It has different permissions, data scope, design surface and threat model.

## Authorization model

Platform owner:
- Bootstrapped from a server-owned, explicit verified-email allowlist
- Can see aggregates, restaurant summaries, Meta connection health, platform team and privilege history
- May enable/disable a registered verified employee's support or analyst role

Support/analyst:
- Can see platform-level operational summaries
- Cannot change platform team, restaurant orders, payment amounts or sensitive settings
- Are prevented from reading access-grant audit history

Restaurant owner:
- Controls the restaurant and its own WhatsApp numbers via `devices:manage`
- Has no platform access unless separately designated

POS employee:
- Only tenant-scoped workflows, not platform admin

## Data security

- Platform endpoints bypass tenant filtering **only** after verified platform-admin authorization.
- Platform summaries minimize customer personally identifying data.
- Meta access tokens are encrypted with AES-256-GCM. Raw values never appear in an HTTP response, UI, logs or screenshots.
- Meta registration PIN is used transiently and never persisted.
- Only authenticated owners may grant platform staff roles. Changes are audited, transactionally if Mongo supports it.
- Host the admin on a same-site, HTTPS domain; deny unknown CORS and application origins.
- Use non-destructive read-only views by default. Do not build platform-wide impersonation or arbitrary database-editing tools.

## Implementation sequence

### Phase 1 — Secure foundations (implemented in feature branches)
- Platform role guard, encrypted Meta credentials, tenant-bound phone IDs
- React admin UI, bootstrap access by verified email, owner-managed team roles
- Meta Embedded Signup v4 popup integration and backend code exchange
- Graph WABA/number validation, webhook subscription, 2FA PIN registration, reconnect/disconnect
- Staff chat inbox, 24-hour reply enforcement via existing backend
- Relevant backend tests and CI workflows

### Phase 2 — Technical validation (must pass before merging)
1. Backend `bun run check`, plus new platform and Meta integration tests.
2. Restaurant dashboard `yarn verify`.
3. Admin dashboard `npm run verify`.
4. API auth and tenant penetration tests using authorized test identities.
5. Browser checks on desktop, tablet and mobile.
6. Confirm expected CORS and Better Auth cookies from admin host.
7. Verify service error messages never expose Meta tokens, secrets, cookie contents or personal data.

### Phase 3 — Meta / staging acceptance (owner action required)
1. Complete Meta Business Portfolio, Facebook Login for Business Embedded Signup **v4** and permissions review.
2. Set real server-only Meta App ID/secret/config ID, webhook verify token and encryption key.
3. Subscribe the signed webhook and test a real authorized restaurant number.
4. Register pending numbers, test coexistence if needed.
5. Send customer `menu`, select a dish, confirm an order, receive a document invoice.
6. Verify inbox read/reply and 24-hour window; disconnect and reconnect.
7. Verify simultaneous restaurants cannot claim or receive each other's number.

### Phase 4 — Deployment approval
1. Review draft PRs and resolve conflicts.
2. Require green CI checks. If GitHub Actions is unavailable, collect signed local build logs.
3. Merge to `dev`; build staging applications.
4. Verify staging behavior against an isolated test database.
5. Run rollback and backup drills.
6. Owner approves merging `main` and deploying production only after all P0/P1 blockers are closed.

## Next product modules — not part of initial release

- Subscription plans, billing, invoice reconciliation and failed-payment handling
- Support tickets, consent-based customer support diagnostics
- Delivery/print queue incident monitoring
- Usage metering, event tracing, error aggregation, SLA and availability monitoring
- Policy-driven data exports and legal retention controls
- Approved, audited financial adjustments and escalation workflows

These require separate designs and privacy reviews. Do not imply they already exist.

## Release blockers as of initial implementation

- Backend and web regression suites have not been shown to pass across the new feature.
- The existing web CI and Firebase preview checks are failing and must be diagnosed.
- Meta credentials/approval and live business-number onboarding have not been provided.
- Admin frontend has passed a build, but it has not been deployed for authenticated browser testing.
- No live UI/UX or third-party webhook end-to-end acceptance has been performed.

**Definition of done:** all tests and staging acceptance checks pass, all P0/P1 issues resolved, business owners can connect their own number without developer intervention, Restora staff can access platform metrics only within their assigned permissions, and there is a verified deployment and rollback plan.
