# Nova Commerce Master Project Tracker

## Purpose

Single source of truth for the project. Update this file after every
coding session.

## Full Platform Direction Update - 2026-07-03

Nova is a full marketplace platform, not only a backend API. The backend
foundation remains important, but the product goal is a complete buyer,
seller, admin, and operations platform comparable in scope to Trendyol, Amazon,
and Flipkart.

The project now runs on five parallel tracks:

- Track A: Backend/API
- Track B: Customer Web Frontend
- Track C: Seller Dashboard
- Track D: Admin Dashboard
- Track E: DevOps/Production

The ShopNova Lovable app at `https://shop-nova-global.lovable.app` is a
visual and product reference only. It is not production code and should not be
copied into the repository as an implementation source. Nova's production
frontend must be built cleanly inside this repo with typed integration points,
owned UI components, tested workflows, and production-ready environment
configuration.

Preferred architecture is a monorepo so the platform can share UI,
API-client, DTO/type, and config contracts without duplicating marketplace
concepts. The recommended future structure is:

- `apps/api`
- `apps/web`
- `apps/seller`
- `apps/admin`
- `packages/ui`
- `packages/api-client`
- `packages/types`
- `packages/config`

Immediate architecture decision: move to a monorepo gradually without breaking
the existing backend. Keep the current NestJS backend at the repository root
temporarily. Add new frontend and shared packages first, beginning with:

- `apps/web`
- `packages/api-client`
- `packages/types`

Future migration can move the current backend into `apps/api` after the
workspace scripts, CI, Docker, Prisma paths, and deployment commands are proven
safe.

### Updated Full-Platform Roadmap

Backend:

- Phase 1: Engineering foundation - COMPLETE
- Phase 2: Production hardening - COMPLETE
- Phase 3A: Catalog backend - IN PROGRESS
- Phase 4: Inventory/pricing
- Phase 5: Cart/wishlist
- Phase 6: Checkout/orders
- Phase 7: Payments
- Phase 8: Shipping/returns
- Phase 9: Search/performance

Frontend:

- Phase F1: Frontend foundation - COMPLETE
- Phase F2: Customer storefront and catalog integration - COMPLETE
- Phase F3: Auth/account integration - COMPLETE
- Phase F4: Buyer commerce foundation - COMPLETE
- Phase F5: Order processing foundation - COMPLETE
- Phase F6: Seller dashboard
- Phase F7: Admin dashboard
- Phase F8: UX/performance polish

DevOps:

- CI/CD
- Monitoring
- Security
- Deployment
- Backups
- Scaling

### Full-Platform Gap Analysis - 2026-07-03

Backend status:

- Present: NestJS API shell, health/readiness endpoints, typed environment
  validation, Prisma/PostgreSQL foundation, Redis/cache foundation, response
  envelope, error handling, auth/register/login/refresh/logout/me, JWT guard,
  role guard, user profile/address APIs, seller application/review/store
  foundation, seller/store ownership schema, migrations, seed data, catalog
  product/category/brand read endpoints, and focused unit/integration tests.
- Partial or missing: full product CRUD, variant management, inventory/pricing
  workflows, cart APIs, wishlist APIs, checkout/order creation, payments,
  reviews, notifications, admin moderation beyond seller review, full search,
  image upload/object storage, rate-limit tuning, audit-log writes for
  sensitive admin actions, and database-backed integration coverage for every
  business flow.

Frontend status:

- Missing before Phase F1: production Next.js app, customer storefront,
  seller dashboard, admin dashboard, auth screens, product listing UI, product
  detail UI, cart, checkout, account pages, orders, wishlist, payment methods,
  notifications, responsive layout, and shared UI conventions.

Integration status:

- Present: API envelope conventions and backend CORS/env settings.
- Missing before Phase F1: shared API client, shared DTO/type package,
  frontend environment example, auth token attach support, refresh-token-ready
  client structure, frontend loading/empty/error states, and typed contract
  reuse between apps.

Phase F4 buyer commerce details are documented in
`docs/phase-f4-buyer-commerce.md`.

Phase F5 order processing details are documented in
`docs/phase-f5-order-processing.md`.

Phase 5 notification engine details are documented in
`docs/phase-f5-notification-engine.md`.

## Vision

Build a production-grade regional marketplace inspired by Trendyol,
Amazon and Flipkart.

### Markets

-   Solapur
-   Pune
-   Maharashtra
-   India

## Tech Stack

-   NestJS
-   TypeScript
-   Prisma
-   PostgreSQL
-   Redis
-   Docker
-   GitHub Actions
-   Future: Next.js, Razorpay, Meilisearch, S3

# Roadmap

## Phase 1 (Current)

Status: IN PROGRESS

Completed: - Architecture defined - Clean layering - Prisma foundation -
Docker foundation - Health endpoints - Environment validation - Redis
foundation - RBAC groundwork

Remaining: - Seller/Store domain - Seller ownership of products - Auth
APIs - User APIs - RBAC guards - Seller onboarding - CI/CD - Real
tests - Documentation

Definition of Done: - Build passes - Typecheck passes - Lint passes -
Tests pass - Prisma validates - Docker works - Auth works - Seller
onboarding works

## Phase 2

Marketplace frontend: - Home - Categories - Products - Search -
Filters - Wishlist - Cart - Checkout

## Phase 3

Seller Platform: - Dashboard - Inventory - Orders - Reports

## Phase 4

Commerce: - Payments - Coupons - Taxes - Returns - Refunds -
Notifications

## Phase 5

Admin: - Dashboard - CMS - Analytics - Moderation - Commissions

## Phase 6

Scale: - Caching - Search engine - Queues - Monitoring - Security - Load
testing - Deployment

# Rules

1.  Never rewrite working code.
2.  Preserve architecture.
3.  Update this document after every session.
4.  Run:

-   npm run db:validate
-   npm run typecheck
-   npm run lint
-   npm run test
-   npm run build

# Session Template

Date:

Completed:

Files Changed:

Database Changes:

APIs Added:

Tests Added:

Remaining:

Next Goal:

---

# Implementation Session - 2026-07-05 - Phase 5 Notification Engine

Completed:

- Added transactional notification architecture with provider, email-provider,
  template, in-process queue fallback, service, and controller boundaries.
- Added persisted in-app and console email notifications for payment,
  shipment, return, refund, seller order, and product moderation events.
- Added customer and admin notification APIs with ownership checks, unread
  counts, mark-read, mark-all-read, failure listing, and retry.
- Added notification idempotency keys, priority ordering, attempt tracking, and
  safe non-blocking hook behavior.

Files Changed:

- `prisma/schema.prisma`
- `prisma/migrations/20260705011500_notification_engine/migration.sql`
- `src/notifications/*`
- `src/payments/*`
- `src/shipments/*`
- `src/returns/*`
- `src/admin-products/*`
- `src/app.module.ts`
- `src/config/*`
- `packages/types/src/index.ts`
- `packages/api-client/src/index.ts`
- `.env.example`
- `README.md`
- `docs/cadde-store-mvp.md`
- `docs/phase-f5-notification-engine.md`

Database Changes:

- Added `NotificationType` and `NotificationPriority`.
- Extended `NotificationStatus` with `CANCELLED`.
- Renamed notification `subject` to `title`.
- Added notification `type`, `priority`, `idempotencyKey`, `failedAt`,
  `updatedAt`, and indexes.
- Added `NotificationAttempt`.

APIs Added:

- `GET /api/v1/notifications`
- `GET /api/v1/notifications/unread-count`
- `PATCH /api/v1/notifications/:notificationId/read`
- `PATCH /api/v1/notifications/read-all`
- `GET /api/v1/admin/notifications`
- `GET /api/v1/admin/notifications/failures`
- `POST /api/v1/admin/notifications/:notificationId/retry`

Tests Added:

- Notification provider tests.
- Notification service tests for creation, unread count, ownership protection,
  and retry behavior.

Remaining:

- Replace in-process queue fallback with BullMQ worker if Redis job processing
  is adopted.
- Implement real Resend/AWS SES transport after production email policy and
  credentials are approved.
- Keep SMS/WhatsApp as placeholders until paid provider configuration exists.

Next Goal:

- Build the next commerce phase only after this notification engine is
  verified, committed, and pushed.

---

# Audit Session - 2026-07-02

## Current Audit Date

2026-07-02

## Current Repo Status

Audit-only review completed for `C:\Nova\ShopNova-main`.

Nova / ShopNova is currently a backend foundation repository for a NestJS,
TypeScript, Prisma, PostgreSQL, Redis, and Docker based commerce platform. The
repository has a clean infrastructure shell, a broad Prisma commerce schema,
typed configuration, health endpoints, request middleware, response/error
wrapping, Docker compose files, and architecture documentation.

Phase 1 is not complete. The project is still pre-feature/API for marketplace
business flows. There are no auth controllers, user APIs, seller/store domain
models, product ownership rules, RBAC guards, catalog APIs, migrations, real
tests, CI/CD workflow, frontend, or deployment-grade production configuration.

The working tree currently reports `PROJECT_MEMORY.md` as untracked. No source
code was modified during this audit.

## Folder Structure Audit

Current structure is small and understandable:

- Root: package/config files, Dockerfile, compose files, README,
  `PROJECT_MEMORY.md`, TypeScript, ESLint, Jest, Nest config.
- `docs/`: architecture, infrastructure, and database schema notes.
- `prisma/`: Prisma schema and seed script.
- `src/config/`: typed configuration factories and Zod environment validation.
- `src/common/`: shared DTOs, response envelope, exception filter, utilities,
  interfaces, and error codes.
- `src/database/`: global Prisma module, Prisma service, and base repository.
- `src/health/`: health/readiness/version/database/redis endpoints.
- `src/middlewares/`: request ID and request logging middleware.
- `src/queues/`: Redis service and JSON cache abstraction.

Missing expected Phase 1 folders:

- `src/modules/` for auth, users, sellers/stores, catalog, and RBAC.
- `src/guards/`, `src/decorators/`, `src/auth/`, or equivalent auth boundary.
- `tests/` or colocated `*.spec.ts` tests.
- `.github/workflows/` for CI.
- `prisma/migrations/`.

## Architecture Audit

Good:

- Architecture direction is documented as Presentation -> Application ->
  Domain -> Infrastructure.
- Nest bootstrap includes global validation, exception filtering, response
  envelope, versioning, API prefixing, security middleware, CORS, compression,
  cookies, and graceful shutdown hooks.
- Prisma and Redis are isolated behind services/modules.
- Shared DTOs and pagination utilities are present before business modules.

Gaps:

- The documented clean architecture is mostly aspirational. There are no domain,
  application, use-case, policy, event, job, guard, or module boundaries yet.
- Current code is infrastructure-first, not marketplace-feature-ready.
- RBAC exists only in the schema and seed data; it is not enforced anywhere.
- No auth/session lifecycle exists despite JWT and refresh-token config.
- No seller/store ownership boundary exists, which is mandatory for a regional
  marketplace.

## Code Quality Audit

Good:

- Strict TypeScript settings are enabled.
- ESLint is strict and forbids explicit `any`.
- Environment validation uses Zod.
- DTO validation is configured globally with whitelist and unknown-property
  rejection.
- Response and error envelopes are consistent.
- Utility code is simple and readable.

Risks:

- `BaseRepository.softDelete()` writes `deletedAt`, but most schema models do
  not define `deletedAt`; using it against current models will fail.
- `PrismaService` always configures query logging events and checks
  `NODE_ENV` inside the callback instead of using typed config.
- `RedisService` connects lazily and is only forced by health/cache usage; it
  does not connect during module startup.
- `CacheService.get()` does not catch invalid JSON or Redis read errors.
- Health endpoints always return HTTP 200 even when readiness is `not_ready`.
- Error handling maps all Prisma known request errors to HTTP 409, which will
  misclassify not-found and constraint-specific failures.

## Backend Readiness

Ready:

- NestJS app shell.
- Health/readiness endpoints.
- Global request validation.
- Global error and response wrapping.
- Prisma service and transaction helper.
- Redis service and cache helper.
- Environment validation.

Not ready:

- No auth routes, login/register/logout/refresh APIs, password hashing, or JWT
  guards.
- No user profile or address APIs.
- No seller onboarding or store management.
- No product/category/variant APIs.
- No cart, wishlist, checkout, order, payment, inventory, support, CMS, or
  admin APIs.
- No integration tests, API tests, or service tests.
- No real queue/job processor despite Redis foundation.

## Security Audit

Good:

- Helmet enabled.
- CORS origin allowlist is configured from env.
- Cookie parser installed.
- Strict validation pipe enabled.
- JWT secrets require minimum length in environment validation.
- Refresh tokens are modeled as hashes.

Risks and missing controls:

- No authentication implementation.
- No RBAC guards, decorators, permission policies, or enforcement.
- No password hashing implementation.
- No rate limiting/throttling.
- No CSRF protection despite cookie support and credentialed CORS.
- No secure cookie strategy.
- No request body size limits.
- No audit-log writer tied to sensitive actions.
- No production secret-management guidance beyond `.env.example`.
- Compose uses default local Postgres credentials and production overlay does
  not override them.

## Database Design Audit

Good:

- Broad normalized marketplace schema covering users, roles, permissions,
  refresh tokens, addresses, catalog, variants, inventory, carts, wishlists,
  orders, payments, coupons, reviews, notifications, invoices, returns,
  refunds, CMS, settings, analytics, support, activity, and audit logs.
- Monetary fields use integer cents.
- RBAC join tables use composite keys.
- Important slugs, SKUs, coupon codes, order numbers, invoice numbers, and token
  hashes are unique.
- Basic indexes exist for several access patterns.

Risks and gaps:

- No seller/store/vendor/merchant model.
- `Product` has no seller/store ownership, approval workflow, moderation owner,
  commission model, or marketplace listing boundary.
- No tenant/regional service area model for Solapur, Pune, Maharashtra, India.
- No shipment/carrier/tracking model.
- Return/refund statuses are plain strings instead of enums.
- No soft-delete fields despite repository helper expecting `deletedAt`.
- No migrations are present.
- No database constraints for positive prices, quantities, stock, ratings, or
  monetary totals.
- Anonymous carts allow `sessionId` but no uniqueness rule for active session
  carts.
- Wishlist has no uniqueness for one named wishlist per user.
- Product image primary image uniqueness is not enforced.
- Search likely needs full-text/search-service strategy before scale.

## Prisma Schema Audit

Good:

- Prisma schema validates conceptually as a comprehensive first draft.
- Relations are explicit and mostly use appropriate cascade/set-null behavior.
- `DIRECT_URL` is configured for migration/direct database access.

Risks:

- Could not run Prisma validation because dependencies are not installed in the
  checkout.
- No `prisma/migrations/` folder exists, so schema is not migration-backed yet.
- Schema is marketplace-broad but not seller-marketplace-correct yet.
- Some operational states should become enums.
- No generated Prisma client is present locally.

## Docker Setup Audit

Good:

- Multi-stage Dockerfile.
- Non-root production user.
- PostgreSQL and Redis compose services with health checks.
- Named volumes and isolated bridge network.
- Dev and prod compose overlays exist.

Blocking issues:

- Dockerfile uses `npm ci`, but the repo has no `package-lock.json`; Docker
  builds will fail until a lockfile is committed.
- Production compose still depends on `.env` and does not provide production
  secret injection guidance.
- Compose database credentials are local defaults and unsuitable for production.
- API container does not run migrations before startup.
- Docker health check targets `/api/v1/health`, which may pass even when DB or
  Redis are down; readiness should be used for dependency health.
- No `.dockerignore` was found, so Docker build context may include unnecessary
  files once the repo grows.

## Deployment Readiness

Not deployment-ready.

Missing:

- Lockfile.
- Installed/verified dependency state.
- CI pipeline.
- Production environment/secrets strategy.
- Migration deployment command in release flow.
- Observability beyond Nest logger.
- Metrics, tracing, structured JSON logging transport, log redaction.
- Cloud deployment docs.
- Backup/restore guidance for Postgres and Redis.
- Health/readiness status-code semantics.

## Scalability Audit

Good foundation:

- PostgreSQL normalized model.
- Redis base service.
- Pagination DTOs/utilities.
- Indexes for some common queries.
- Future architecture calls out queues/search/caching.

Scale gaps:

- No queue library or processors yet.
- No search engine integration.
- No read-model or catalog denormalization strategy.
- No inventory reservation concurrency design in code.
- No idempotency keys for checkout/payment/webhook flows.
- No cache key/versioning/invalidation policy.
- No file/object storage implementation.
- No load testing.

## Missing Marketplace Features

Critical missing features:

- Seller/store domain.
- Seller onboarding and verification.
- Seller-owned products, variants, inventory, and orders.
- Buyer auth and profile management.
- Admin/staff auth and RBAC enforcement.
- Catalog CRUD and public catalog browsing APIs.
- Category/brand management APIs.
- Cart and wishlist APIs.
- Checkout/order creation.
- Payment provider integration and webhooks.
- Coupons/taxes/shipping.
- Returns/refunds operational flow.
- Notifications.
- Search and filters.
- Reviews moderation.
- Support tickets workflow.
- Admin moderation and analytics.
- Frontend/web marketplace.

## Technical Debt

- Memory file is untracked.
- No lockfile.
- No tests.
- No migrations.
- No CI.
- Documentation describes future modules that do not yet exist.
- Base repository has a soft-delete assumption not reflected in schema.
- Some config factories use raw `process.env` after validation instead of using
  injected typed config everywhere.
- Docker production setup is still local-development oriented.

## Bugs Or Risks Found

- Docker build likely fails because `npm ci` requires a lockfile.
- All quality scripts currently fail locally because dependencies are not
  installed: Prisma, TypeScript, ESLint, Jest, and Nest CLIs are unavailable.
- Initial PowerShell `npm` invocation is blocked by execution policy; use
  `npm.cmd` on this machine.
- `PROJECT_MEMORY.md` is untracked according to `git status --short`.
- Health endpoint can report API up while readiness dependencies are down.
- Prisma errors are over-generalized to conflict responses.
- Soft delete helper is incompatible with current schema models.

## Phase 1 Completion Gaps

Phase 1 remaining tasks:

- Commit/package-lock dependency baseline.
- Add Prisma migrations.
- Add test suite skeleton and first real tests.
- Add CI workflow for install, Prisma validate, typecheck, lint, test, build.
- Implement auth module: register, login, refresh, logout, password hashing,
  token rotation, auth guard.
- Implement users module: profile and address APIs.
- Implement RBAC decorators/guards and permission checks.
- Add seller/store schema and module.
- Link products/inventory/orders to seller/store ownership.
- Add catalog APIs after ownership is modeled.
- Harden Docker/deployment path.
- Update docs to distinguish completed implementation from planned design.

## What Is Already Good

- Strong backend technology choice.
- Clear architecture intent.
- Clean small folder structure.
- Strict TypeScript posture.
- Good environment validation baseline.
- Good response/error standardization.
- Good Prisma schema breadth for a commerce platform.
- Health and readiness concepts are present.
- Redis and cache foundation exist.
- Docker foundation exists.

## What Is Missing

- Real marketplace business modules.
- Seller/store marketplace ownership model.
- Auth/RBAC enforcement.
- Database migrations.
- Dependency lockfile.
- Automated tests.
- CI/CD.
- Production-ready Docker/deployment strategy.
- Operational observability.

## Technical Risks

- Building APIs on the current product schema before adding seller/store
  ownership would create expensive rework.
- Shipping Docker without a lockfile blocks reproducible builds.
- Lack of migrations blocks safe database evolution.
- Lack of auth/RBAC guards blocks any secure admin or seller functionality.
- Lack of tests makes future refactors risky.
- Broad schema without implemented use cases may drift from actual product
  behavior unless Phase 1 narrows to identity, seller, and catalog ownership.

## Recommended Next Coding Task

Create the Phase 1 dependency and verification baseline:

1. Add/commit `package-lock.json` using the current `package.json`.
2. Run and fix `npm.cmd run db:validate`.
3. Run and fix `npm.cmd run typecheck`.
4. Run and fix `npm.cmd run lint`.
5. Run and fix `npm.cmd run test`.
6. Run and fix `npm.cmd run build`.
7. Add CI workflow after local checks pass.

After the baseline is green, the next feature task should be the seller/store
schema and ownership model before product APIs.

## Clear Checklist For Next Codex Loop

- [ ] Confirm `PROJECT_MEMORY.md` should be tracked and commit it if intended.
- [ ] Install dependencies and generate `package-lock.json`.
- [ ] Validate Prisma schema.
- [ ] Add initial Prisma migration.
- [ ] Fix any typecheck/lint/build errors.
- [ ] Add minimum health/app test coverage.
- [ ] Add GitHub Actions CI.
- [ ] Design seller/store schema changes.
- [ ] Update Product/Inventory/Order ownership relationships.
- [ ] Only then start seller onboarding/auth API implementation.

## Audit Verification Notes

Files inspected:

- `PROJECT_MEMORY.md`
- `package.json`
- `README.md`
- `.env.example`
- `.prettierrc.json`
- `Dockerfile`
- `docker-compose.yml`
- `docker-compose.dev.yml`
- `docker-compose.prod.yml`
- `tsconfig.json`
- `tsconfig.build.json`
- `eslint.config.js`
- `jest.config.cjs`
- `nest-cli.json`
- `docs/architecture.md`
- `docs/database-schema.md`
- `docs/infrastructure.md`
- `prisma/schema.prisma`
- `prisma/seed.ts`
- All files under `src/`

Commands attempted:

- `git status --short`
- `rg --files`
- `npm run db:validate`, `typecheck`, `lint`, `test`, `build` failed through
  PowerShell execution policy.
- `npm.cmd run db:validate`, `typecheck`, `lint`, `test`, `build` reached the
  scripts but failed because dependencies are not installed.

Source code changes made: none.

---

# Baseline Session - 2026-07-02

## Completed

Created the Phase 1 dependency and verification baseline before adding
marketplace features.

- Tracked `PROJECT_MEMORY.md` in git with `git add PROJECT_MEMORY.md`.
- Ran `npm.cmd install` and generated `package-lock.json`.
- Updated Prisma npm scripts to load `.env.example` through Node 22
  `--env-file` so local and CI schema generation/validation have required
  `DATABASE_URL` and `DIRECT_URL` values.
- Converted the TypeScript module baseline from ESM/NodeNext to standard
  NestJS CommonJS/Node resolution because the codebase uses Nest-style
  extensionless imports and TS path aliases.
- Renamed ESLint config to `eslint.config.mjs` so ESLint can remain ESM while
  the app package runs as CommonJS.
- Added `tsconfig.eslint.json` for type-aware linting of `src/` and
  `prisma/seed.ts` without breaking app typecheck.
- Added `.dockerignore` to keep Docker build contexts clean.
- Added GitHub Actions CI at `.github/workflows/ci.yml` using Node 22.
- Fixed baseline type/lint errors in existing infrastructure code only.
- Verified all requested commands pass.

## Files Changed

- `PROJECT_MEMORY.md`
- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `tsconfig.eslint.json`
- `eslint.config.mjs`
- Removed/renamed: `eslint.config.js`
- `.dockerignore`
- `.gitignore`
- `.github/workflows/ci.yml`
- `src/common/filters/global-exception.filter.ts`
- `src/common/utils/async.ts`
- `src/database/prisma.service.ts`
- `src/database/repositories/base.repository.ts`
- `src/health/health.service.ts`
- `src/main.ts`
- `src/queues/cache.service.ts`
- `src/queues/redis.service.ts`

## Commands Run

Passed:

- `npm.cmd install`
- `npm.cmd run db:generate`
- `npm.cmd run db:validate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`
- `git add PROJECT_MEMORY.md`

Notes:

- `npm.cmd run test` passes because Jest is configured with
  `--passWithNoTests`; there are still no real tests.
- Prisma commands pass but emit a non-blocking deprecation warning that
  `package.json#prisma` should eventually move to a Prisma config file before
  Prisma 7.
- `npm.cmd install` reports 24 dependency audit vulnerabilities
  (3 low, 14 moderate, 7 high). No `npm audit fix` was run in this baseline
  loop because it may introduce broader dependency changes.

## Remaining Issues

- No real tests yet.
- No Prisma migrations yet.
- Dependency audit vulnerabilities remain.
- Prisma `package.json#prisma` deprecation remains.
- Auth, RBAC enforcement, seller/store ownership, and marketplace APIs remain
  intentionally untouched.

## Next Recommended Task

Add the first real test coverage and CI confidence layer before adding features:

1. Add minimal unit tests for `HealthService`, `CacheService`, pagination
   helpers, and response builders.
2. Add an app bootstrap or health controller smoke test.
3. Keep `npm.cmd run test`, `typecheck`, `lint`, and `build` green.

After that, create the first Prisma migration, then design the seller/store
ownership schema before implementing seller onboarding or product APIs.

---

# Quality Baseline Session - 2026-07-02

## Completed

Added real Phase 1 quality coverage and created the first Prisma migration
baseline from the current schema.

- Removed fake test confidence by changing `npm.cmd run test` from
  `jest --passWithNoTests` to `jest`.
- Added fast isolated unit tests that do not require real Postgres or Redis.
- Added a basic Nest controller/service smoke test for the health controller.
- Created initial Prisma migration SQL from the current `prisma/schema.prisma`
  without changing the business schema.
- Re-ran the full baseline gate successfully.

## Tests Added

- `src/health/health.service.spec.ts`
  - process health
  - readiness success
  - readiness dependency failure
  - version metadata
- `src/health/health.controller.spec.ts`
  - controller delegates to `HealthService` through a Nest testing module
- `src/queues/cache.service.spec.ts`
  - JSON get
  - cache miss
  - JSON set with TTL
  - delete
- `src/common/utils/pagination.spec.ts`
  - skip/take conversion
  - input clamping
  - pagination metadata
  - empty result metadata
- `src/common/utils/response-builder.spec.ts`
  - metadata builder
  - success response envelope
  - error response envelope with details
- `src/config/environment.spec.ts`
  - valid environment parsing
  - default values
  - useful invalid-config error

Total test result: 6 suites, 19 tests passing.

## Migration Created

- `prisma/migrations/20260702190000_init/migration.sql`

Migration status:

- Created from the current Prisma schema using Prisma migrate diff from empty.
- No business schema changes were made.
- The migration is a baseline for the existing schema only.

## Files Changed

- `PROJECT_MEMORY.md`
- `package.json`
- `package-lock.json`
- `prisma/migrations/20260702190000_init/migration.sql`
- `src/health/health.service.spec.ts`
- `src/health/health.controller.spec.ts`
- `src/queues/cache.service.spec.ts`
- `src/common/utils/pagination.spec.ts`
- `src/common/utils/response-builder.spec.ts`
- `src/config/environment.spec.ts`

## Commands Run

Passed:

- `npm.cmd install`
- `npm.cmd run db:generate`
- `npm.cmd run db:validate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

Additional command:

- Generated migration SQL with Prisma migrate diff from empty to
  `prisma/schema.prisma`.

Notes:

- Prisma still emits a non-blocking warning that `package.json#prisma` is
  deprecated and should move to a Prisma config file before Prisma 7.
- `npm.cmd install` still reports 24 dependency audit vulnerabilities
  (3 low, 14 moderate, 7 high). No dependency audit fix was performed in this
  task.

## Remaining Issues

- Dependency audit vulnerabilities remain.
- Prisma config deprecation remains.
- No auth implementation yet.
- No seller/store ownership schema yet.
- No frontend yet.
- No real database-backed integration tests yet.

## Next Recommended Task

Design the seller/store ownership schema before adding marketplace APIs:

1. Add seller/store/vendor models to Prisma.
2. Add seller ownership relationships for products, variants, inventory, and
   orders.
3. Add a migration for that schema change.
4. Add focused tests around ownership assumptions before implementing seller
   onboarding or product APIs.

---

# Marketplace Ownership Schema Session - 2026-07-02

## Completed

Designed the production-grade marketplace ownership model at the database layer
only. No APIs, controllers, services, auth flows, seller onboarding logic, or
frontend work were added.

## Seller Architecture

Added `Seller` as the commercial account tied to exactly one platform `User`.

Decisions:

- `Seller.userId` is unique, creating a one-to-one seller profile for a user.
- `Seller.status` uses `SellerStatus`: `PENDING`, `APPROVED`, `REJECTED`,
  `SUSPENDED`.
- `businessName`, `legalName`, `gstNumber`, `panNumber`, `email`, and `phone`
  are first-class seller identity/compliance fields.
- `gstNumber`, `panNumber`, `email`, and `phone` are unique to prevent duplicate
  marketplace seller identities.
- `commissionRate` is stored as `Decimal(5,2)` so payout and settlement math can
  use a seller-level commission policy.
- A seller can own multiple stores.

## Store Architecture

Added `Store` as the buyer-visible storefront and operational owner of products
and inventory.

Decisions:

- `Store.sellerId` supports multiple stores per seller.
- `Store.slug` is unique for public storefront routing.
- `logo`, `banner`, and `description` are optional storefront presentation
  fields.
- `city`, `state`, `country`, `address`, `postalCode`, `latitude`, and
  `longitude` support regional marketplace discovery and future geo features.
- `isVerified` supports future store verification/moderation workflows.
- Store deletion is restricted while products, inventory, or order lines depend
  on it.

## Database Decisions

- Every `Product` now belongs to exactly one `Store` through required
  `Product.storeId`.
- `Store -> Product` is one-to-many.
- `Inventory` now has required `storeId`, making stock explicitly owned by a
  store while still supporting multiple warehouses.
- Inventory uniqueness changed to `[storeId, variantId, warehouseId]`.
- `OrderItem` now preserves marketplace ownership with required `sellerId` and
  `storeId`.
- `OrderItem` snapshots `storeNameSnapshot`, `sellerNameSnapshot`,
  `commissionRateSnapshot`, and `commissionAmountCents` for future payout and
  settlement calculations.
- Added indexes for seller status, seller business name, store verification,
  store geography, store product lookup, store inventory lookup, and order item
  seller/store reporting.
- Used `Restrict` deletes for seller/store/product ownership references so
  historical commerce records remain stable.

## Migration Notes

Created:

- `prisma/migrations/migration_lock.toml`
- `prisma/migrations/20260702203000_seller_store_ownership/migration.sql`

The migration:

- Creates `SellerStatus`.
- Creates `Seller`.
- Creates `Store`.
- Adds `Product.storeId`.
- Adds `Inventory.storeId`.
- Adds seller/store/commission snapshot fields to `OrderItem`.
- Adds marketplace ownership indexes and foreign keys.

Important note:

- This migration is strict and adds required ownership columns. It is correct
  for the current pre-production baseline migration chain. If applied to a
  populated production database later, it should be converted into an
  expand/backfill/contract migration.

## Relationship Summary

- `User 1 -> 0..1 Seller`
- `Seller 1 -> many Store`
- `Store 1 -> many Product`
- `Product 1 -> many Variant`
- `Store 1 -> many Inventory`
- `Warehouse 1 -> many Inventory`
- `Variant 1 -> many Inventory`
- `Order 1 -> many OrderItem`
- `Seller 1 -> many OrderItem`
- `Store 1 -> many OrderItem`
- `Product 1 -> many OrderItem`
- `Variant 1 -> many OrderItem`

## Commands Run

Passed:

- `npm.cmd run db:format`
- `npm.cmd run db:generate`
- `npm.cmd run db:validate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

Additional migration generation:

- Generated the seller/store migration using Prisma migrate diff from the
  previous schema snapshot to the updated schema.

Notes:

- Prisma still emits the non-blocking `package.json#prisma` deprecation warning
  for Prisma 7.
- Existing dependency audit vulnerabilities remain unchanged.

## Files Changed

- `PROJECT_MEMORY.md`
- `prisma/schema.prisma`
- `prisma/migrations/migration_lock.toml`
- `prisma/migrations/20260702203000_seller_store_ownership/migration.sql`

## Remaining Phase 1 Tasks

- Review whether seller GST/PAN should be required at `PENDING` onboarding or
  made nullable until verification.
- Add database-backed migration application testing when a disposable Postgres
  environment is available.
- Design auth and RBAC enforcement for seller access.
- Implement seller onboarding APIs after auth exists.
- Implement store management APIs after seller onboarding exists.
- Implement product APIs using required `storeId` ownership.
- Add payout/settlement tables only when payout workflow requirements are
  finalized.
- Add admin moderation and verification workflows.

---

# Authentication And RBAC Foundation Session - 2026-07-02

## Completed

Implemented the Phase 1 authentication and RBAC foundation. No seller
onboarding, product APIs, frontend, or marketplace business APIs were added.

## Endpoints Added

All endpoints sit under the existing API prefix/version envelope:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## Auth Decisions

- Passwords are hashed with Node `crypto.scrypt` using per-password random
  salts.
- Access tokens are JWT-compatible HS256 tokens signed with
  `JWT_ACCESS_SECRET`.
- Refresh tokens are opaque random tokens generated with Node `crypto`.
- Refresh tokens are stored only as SHA-256 hashes in `RefreshToken.tokenHash`.
- Login/register issue an access token and a persisted refresh token.
- Refresh token rotation revokes the used refresh token and issues a new token
  pair.
- Logout revokes the supplied active refresh token.
- Registration creates active customer users and assigns the default
  `customer` role.
- No auth secrets are hardcoded in production code; secrets come from validated
  environment config.

## RBAC Decisions

- Added `JwtAuthGuard` for bearer token verification and request user context.
- Added `RolesGuard` for role checks against authenticated user roles.
- Added `@CurrentUser()` decorator for controller access to authenticated user
  context.
- Added `@Roles(...roles)` decorator for future role-protected handlers.
- Added `@Public()` decorator for explicitly public routes.
- Seed data now ensures a `customer` role and customer profile permission exist,
  while preserving future seller/admin role support through the database.

## Files Changed

- `PROJECT_MEMORY.md`
- `prisma/seed.ts`
- `src/app.module.ts`
- `src/auth/auth.controller.ts`
- `src/auth/auth.module.ts`
- `src/auth/auth.service.ts`
- `src/auth/auth.types.ts`
- `src/auth/constants.ts`
- `src/auth/decorators/current-user.decorator.ts`
- `src/auth/decorators/public.decorator.ts`
- `src/auth/decorators/roles.decorator.ts`
- `src/auth/dto/login.dto.ts`
- `src/auth/dto/refresh-token.dto.ts`
- `src/auth/dto/register.dto.ts`
- `src/auth/guards/jwt-auth.guard.ts`
- `src/auth/guards/roles.guard.ts`
- `src/auth/interfaces/auth-user.interface.ts`
- `src/auth/utils/password.util.ts`
- `src/auth/utils/token.util.ts`

## Tests Added

- `src/auth/auth.service.spec.ts`
  - register customer and issue tokens
  - duplicate registration conflict
  - login success
  - invalid login rejection
  - refresh token rotation
  - logout revocation
- `src/auth/utils/token.util.spec.ts`
  - access token create/verify
  - bad secret rejection
  - refresh token generation/hash
  - refresh expiry helper
- `src/auth/utils/password.util.spec.ts`
  - password hash/verify
  - malformed hash rejection
- `src/auth/guards/auth.guards.spec.ts`
  - public route bypass
  - JWT request user attachment
  - missing token rejection
  - role allow/deny
- `src/auth/decorators/auth.decorators.spec.ts`
  - public metadata
  - role metadata

Total test result after this session: 11 suites, 38 tests passing.

## Commands Run

Passed:

- `npm.cmd run db:generate`
- `npm.cmd run db:validate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

Notes:

- Prisma still emits the non-blocking `package.json#prisma` deprecation warning
  for Prisma 7.
- Existing dependency audit vulnerabilities remain unchanged.

## Remaining Phase 1 Tasks

- Add user profile/address APIs on top of authenticated user context.
- Add seller onboarding APIs after auth/RBAC integration is reviewed.
- Add store management APIs after seller onboarding.
- Add product APIs using required `storeId` ownership.
- Decide where to apply global auth vs per-controller guards as modules grow.
- Add database-backed auth integration tests when disposable Postgres is
  available.

## Next Recommended Task

Implement the user profile foundation:

1. Add authenticated `GET /users/me`.
2. Add authenticated profile update endpoint.
3. Add address CRUD for the current user.
4. Keep RBAC ready but avoid seller onboarding until user APIs are green.

---

# Seller Onboarding Foundation Session - 2026-07-02

## Completed

Implemented the Phase 1 seller onboarding foundation. No product/catalog APIs,
frontend, checkout, orders, or payment workflows were added.

## Seller Endpoints Added

Authenticated seller self-service:

- `POST /api/v1/sellers/applications`
- `GET /api/v1/sellers/me`
- `PATCH /api/v1/sellers/me`
- `GET /api/v1/sellers/me/stores`
- `POST /api/v1/sellers/me/stores`
- `PATCH /api/v1/sellers/me/stores/:storeId`

Admin seller review:

- `GET /api/v1/admin/sellers/applications`
- `POST /api/v1/admin/sellers/:sellerId/approve`
- `POST /api/v1/admin/sellers/:sellerId/reject`
- `POST /api/v1/admin/sellers/:sellerId/suspend`

## RBAC And Security Decisions

- Seller application routes require an authenticated bearer token through
  `JwtAuthGuard`.
- Admin seller review routes require both `JwtAuthGuard` and `RolesGuard` with
  the `admin` role.
- No admin users are hardcoded; admin access depends on roles already attached
  to the authenticated user token.
- Approving a seller sets `Seller.status` to `APPROVED` and assigns the
  database-backed `seller` role to the seller's user.
- Reject and suspend actions update seller status without assigning seller
  privileges.
- Only sellers with `APPROVED` status can create stores.
- Self-service seller and store access is scoped by the current authenticated
  `user.id`; store updates require `store.id` and the current user's
  `seller.id` to match.
- Cross-seller store access returns not found instead of exposing ownership
  details.

## Validation

- Added strict seller application DTO validation for business identity, GST,
  PAN, email, and phone.
- Added seller profile update DTO validation.
- Added store create/update DTO validation for slug, URLs, location, postal
  code, latitude, and longitude.
- Added admin seller application status filter DTO validation.
- Existing global validation pipe and response/error envelope remain unchanged.

## Files Changed

- `PROJECT_MEMORY.md`
- `prisma/seed.ts`
- `src/app.module.ts`
- `src/sellers/dto/seller-application.dto.ts`
- `src/sellers/dto/update-seller-profile.dto.ts`
- `src/sellers/dto/create-store.dto.ts`
- `src/sellers/dto/update-store.dto.ts`
- `src/sellers/dto/list-seller-applications.dto.ts`
- `src/sellers/sellers.controller.ts`
- `src/sellers/sellers.module.ts`
- `src/sellers/sellers.service.ts`
- `src/sellers/sellers.service.spec.ts`

## Tests Added

- `src/sellers/sellers.service.spec.ts`
  - seller application creation
  - duplicate seller prevention
  - approve flow with seller role assignment
  - reject and suspend flow
  - approved seller store creation
  - unapproved seller store creation blocking
  - cross-seller store update protection

Total test result after this session: 12 suites, 45 tests passing.

## Commands Run

Passed:

- `npm.cmd run db:generate`
- `npm.cmd run db:validate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

Notes:

- Prisma still emits the non-blocking `package.json#prisma` deprecation warning
  for Prisma 7.
- Existing dependency audit vulnerabilities remain unchanged.

## Remaining Phase 1 Tasks

- Add user profile/address APIs on top of authenticated user context.
- Add database-backed seller onboarding integration tests when disposable
  Postgres is available.
- Add audit-log writes for admin seller approval, rejection, and suspension.
- Add seller rejection reason/history fields if moderation requirements need
  durable review notes.
- Implement product APIs only after seller/store ownership and onboarding are
  stable.
- Keep frontend, checkout, orders, and payments out of Phase 1 seller
  onboarding foundation work.

## Next Recommended Task

Implement the user profile foundation:

1. Add authenticated `GET /api/v1/users/me`.
2. Add authenticated profile update endpoint.
3. Add address CRUD scoped to the current user.
4. Keep seller/product/catalog work unchanged until user APIs are green.

---

# User Profile And Address Foundation Session - 2026-07-02

## Completed

Implemented the Phase 1 user profile and address foundation. No
product/catalog APIs, frontend, checkout, orders, or payment workflows were
added.

## User Endpoints Added

All endpoints sit under the existing API prefix/version envelope:

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `GET /api/v1/users/me/addresses`
- `POST /api/v1/users/me/addresses`
- `PATCH /api/v1/users/me/addresses/:addressId`
- `DELETE /api/v1/users/me/addresses/:addressId`
- `POST /api/v1/users/me/addresses/:addressId/default`

## Security Decisions

- All user profile and address routes require `JwtAuthGuard`.
- Controllers use the existing `@CurrentUser()` decorator and authenticated
  request user context.
- Profile reads and writes are scoped only to the authenticated `user.id`.
- Address reads list only addresses owned by the authenticated user.
- Address update, delete, and set-default operations first verify ownership by
  querying with both `address.id` and `user.id`.
- Attempts to manage another user's address return not found instead of
  exposing ownership details.

## Address Behavior Decisions

- Address types use the existing Prisma `AddressType` enum:
  `BILLING`, `SHIPPING`, and `BOTH`.
- Address creation defaults to `SHIPPING` when no type is supplied.
- Address country defaults to `IN` when no country code is supplied.
- `isDefault` is supported on create and update.
- Creating, updating, or setting an address as default unsets previous default
  addresses for the same user inside a transaction.
- Address schema does not include `deletedAt`, so address delete uses a scoped
  hard delete after ownership verification.

## Validation

- Added strict profile update DTO validation for first name, last name, phone,
  and avatar URL.
- Added strict address create/update DTO validation for address type, phone,
  postal code, country code, and address fields.
- Existing global validation pipe and response/error envelope remain unchanged.

## Files Changed

- `PROJECT_MEMORY.md`
- `src/app.module.ts`
- `src/users/dto/update-user-profile.dto.ts`
- `src/users/dto/create-address.dto.ts`
- `src/users/dto/update-address.dto.ts`
- `src/users/users.controller.ts`
- `src/users/users.module.ts`
- `src/users/users.service.ts`
- `src/users/users.service.spec.ts`

## Tests Added

- `src/users/users.service.spec.ts`
  - get current user without exposing password hash
  - update current user profile
  - create address
  - update owned address
  - prevent access to another user's address
  - set default address and unset previous defaults for same user
  - delete owned address

Total test result after this session: 13 suites, 52 tests passing.

## Commands Run

Passed:

- `npm.cmd run db:generate`
- `npm.cmd run db:validate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`

Notes:

- Prisma still emits the non-blocking `package.json#prisma` deprecation warning
  for Prisma 7.
- Jest still emits a non-blocking worker teardown warning after all tests pass.
- Existing dependency audit vulnerabilities remain unchanged.

## Remaining Phase 1 Tasks

- Add database-backed integration tests for auth, users, seller onboarding, and
  address ownership when disposable Postgres is available.
- Add audit-log writes for sensitive admin seller review actions.
- Add seller rejection reason/history fields if moderation requirements need
  durable review notes.
- Implement product/catalog APIs only after ownership and onboarding foundations
  are stable.
- Keep frontend, checkout, orders, and payments out of Phase 1 foundation work.

## Next Recommended Task

Add database-backed integration test coverage for the implemented foundations:

1. Auth register/login/me.
2. User profile and address ownership flows.
3. Seller application and admin review flows.
4. Keep product/catalog APIs untouched until these integration tests are green.

---

# Full Platform Frontend Foundation Session - 2026-07-03

## Completed

Updated Nova's project direction from backend-first to full marketplace
platform and implemented the safe Phase F1 customer frontend foundation.

## Direction Update

- Nova is now documented as a full marketplace platform, not only a backend
  API.
- Added five parallel tracks: Backend/API, Customer Web Frontend, Seller
  Dashboard, Admin Dashboard, and DevOps/Production.
- Documented the ShopNova Lovable app as a visual/product reference only, not
  production source code.
- Confirmed the preferred architecture is a gradual monorepo migration.
- Kept the current NestJS backend at the repository root to avoid breaking
  scripts, Prisma paths, Docker, tests, or deployment assumptions.
- Added `apps/web`, `packages/api-client`, and `packages/types` as the first
  monorepo step.

## Full-Platform Gap Analysis

Backend present:

- NestJS shell, health/readiness, environment validation, Prisma/PostgreSQL,
  Redis/cache, API envelopes, auth, JWT/RBAC guards, users/profile/address,
  seller application/review/store foundation, seller/store ownership schema,
  migrations, seed data, catalog read endpoints, and tests.

Backend gaps:

- Product CRUD, variant management, inventory/pricing workflows, cart,
  wishlist, checkout/orders, payments, reviews, notifications, richer admin
  workflows, search, uploads/images, audit-log writes for sensitive actions,
  and broad database-backed integration coverage.

Frontend gaps before this session:

- No production Next.js customer app, seller dashboard, admin dashboard, auth
  screens, storefront screens, account pages, cart, checkout, wishlist, payment
  methods, or notification UI.

Integration gaps before this session:

- No shared API client, shared DTO/type package, frontend env example, auth
  token attach support, refresh-token-ready client structure, or typed frontend
  contract reuse.

## Frontend Added

Created `apps/web` using Next.js, TypeScript, Tailwind CSS, and a
shadcn/ui-ready structure.

Routes added:

- `/`
- `/login`
- `/signup`
- `/account`
- `/account/orders`
- `/account/wishlist`
- `/account/payment-methods`
- `/account/notifications`

UI added:

- Header with search, account, wishlist, notifications, cart, and department
  navigation.
- Home hero inspired by the ShopNova marketplace direction.
- Product grid shell with responsive product cards.
- Footer.
- Login and signup shells.
- Account dashboard, orders, wishlist, payment methods, and notifications
  shells.

## Shared Packages Added

`packages/types`:

- API envelope types.
- Pagination types.
- Product, Category, Brand, User, Seller, Store, product image, and variant DTO
  types.

`packages/api-client`:

- Environment-based API URL resolution.
- Typed request helper.
- Error normalization with `NovaApiError`.
- Bearer token attachment hook.
- Unauthorized callback hook for refresh-token-ready auth integration.

## Root Scripts Updated

Added:

- `npm run dev:api`
- `npm run dev:web`
- `npm run build:api`
- `npm run build:web`

Updated full-repo scripts:

- `npm run build` now builds backend and web.
- `npm run typecheck` now checks backend and all workspaces.
- `npm run lint` now lints backend and all workspaces.

Preserved existing backend commands:

- `npm run start:dev`
- `npm run db:generate`
- `npm run db:validate`
- `npm run db:migrate:dev`
- `npm run db:seed`

## Files Changed

- `.gitignore`
- `PROJECT_MEMORY.md`
- `README.md`
- `eslint.config.mjs`
- `package.json`
- `package-lock.json`
- `apps/web/**`
- `packages/api-client/**`
- `packages/types/**`

## Verification

Passed:

- `npm.cmd install`
- `npm.cmd run db:generate`
- `npm.cmd run db:validate`
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test`
- `npm.cmd run build`
- `Invoke-WebRequest http://localhost:3000 -UseBasicParsing`

Local dev server:

- `npm.cmd run dev:web` started successfully in the background.
- `http://localhost:3000` returned HTTP 200.

Notes:

- Prisma still emits the non-blocking `package.json#prisma` deprecation warning
  for Prisma 7.
- Jest still emits the existing non-blocking worker teardown warning after
  tests pass.
- `npm install` reports 26 dependency audit vulnerabilities
  (3 low, 16 moderate, 7 high). No audit fix was run because it may introduce
  broader dependency changes.

## Remaining Risks

- Frontend pages are static shells and are not yet connected to live backend
  data.
- Auth forms do not yet submit to the API or persist tokens.
- Cart, checkout, payments, and seller/admin dashboards are intentionally out
  of scope for Phase F1.
- Shared DTOs should be reconciled against exact backend response shapes as
  catalog and account integration proceeds.

## Next Recommended Batch

Proceed to Phase F2 Customer Storefront:

1. Connect home/category/product listing shells to catalog endpoints.
2. Add loading, empty, and error states around API calls.
3. Add product detail route shell and typed API fetches.
4. Add auth token storage/session handling only when moving into Phase F3.

GO for continuing Phase F2. NO-GO for cart, checkout, payments, seller
dashboard, or admin dashboard until storefront/catalog integration is stable.

---

# Customer Storefront Catalog Integration Session - 2026-07-03

## Completed

Implemented Phase F2 customer storefront and catalog integration only. Work was
performed inside the Nova repository and did not touch other projects.

## Repository Identity And Safety

- Confirmed working directory:
  `C:\Users\Admin\Documents\Codex\2026-07-03\onkarc-dev-nova-https-github-com\work\Nova`.
- Confirmed git remote: `https://github.com/onkarc-dev/Nova.git`.
- Confirmed package identity: `nova-commerce`.
- Ran the forbidden wrong-project term scan before coding and found zero
  matches.

## Backend Catalog APIs Used

Public catalog endpoints found and integrated:

- `GET /api/v1/catalog/products`
- `GET /api/v1/catalog/products/search`
- `GET /api/v1/catalog/products/:slug`
- `GET /api/v1/catalog/categories`
- `GET /api/v1/catalog/brands`

Admin catalog endpoints remain guarded and were not used by the customer
frontend:

- `GET /api/v1/admin/catalog/categories`
- `GET /api/v1/admin/catalog/brands`

## Frontend Added Or Updated

Routes added/updated:

- `/`
- `/products`
- `/products/[slug]`
- `/categories/[slug]`

Existing Phase F1 routes preserved:

- `/login`
- `/signup`
- `/account`
- `/account/orders`
- `/account/wishlist`
- `/account/payment-methods`
- `/account/notifications`

Customer storefront behavior:

- Home page now loads live products and categories from the backend catalog API.
- Product listing page supports keyword search, category slug, brand slug,
  store slug, sort, and page query foundations supported by the backend DTO.
- Category page filters products through `categorySlug`.
- Product detail page loads products by slug.
- Loading route states were added for catalog pages.
- Empty states were added for no products/categories.
- Error states were added for backend/API-unavailable conditions.
- UI remains Nova marketplace-focused and does not implement cart, checkout,
  payments, seller dashboard, or admin dashboard.

## Shared Package Changes

`packages/api-client`:

- Added typed catalog functions for products, product search, product detail,
  categories, and brands.
- Added backend API envelope support for the real `success: true` /
  `success: false` response shape.
- Preserved legacy envelope tolerance.
- Added normalized offline handling with `NovaApiError` status `0` and
  `API_UNAVAILABLE`.
- Kept `NEXT_PUBLIC_API_URL` / `API_URL` environment-based base URL handling.

`packages/types`:

- Aligned API envelopes with backend `ApiSuccessResponse` and
  `ApiErrorResponse`.
- Aligned product/category/brand/store DTOs with backend catalog shapes such as
  `imageUrl`, `logoUrl`, `altText`, and `compareAtCents`.
- Added `ListProductsQuery` and `ListCatalogQuery` types.
- Kept pagination compatible with backend `page`, `limit`, `total`, and
  `totalPages`.

## Documentation Updated

- `README.md` now documents Phase F2 catalog integration, public catalog
  endpoints, storefront routes, and out-of-scope areas.
- `apps/web/.env.example` now clarifies that `NEXT_PUBLIC_API_URL` is the
  backend root URL.
- `PROJECT_MEMORY.md` records this Phase F2 session.

## Remaining Storefront Gaps

- Product listing depends on seeded active products from verified stores.
- Product detail images rely on backend image URLs; upload/storage integration
  remains future work.
- Category detail uses the slug route and product filter; dedicated category
  metadata detail API does not exist yet.
- Price sorting is accepted by the backend DTO but currently only newest and
  name sorting are implemented in service ordering.
- Auth/session integration remains Phase F3.
- Cart, checkout, payments, seller dashboard, and admin dashboard remain
  intentionally out of scope.

## Verification

Required verification to run after this session:

- `npm install`
- `npm run db:generate`
- `npm run db:validate`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run build:web`

## Next Recommended Batch

Proceed to Phase F3 only after Phase F2 is accepted:

1. Wire login/signup forms to auth APIs.
2. Add token/session storage strategy.
3. Connect account overview to `/auth/me` and user profile APIs.
4. Preserve cart, checkout, payments, seller dashboard, and admin dashboard for
   later phases.

---

# Auth And Account Integration Session - 2026-07-03

## Completed

Implemented the Phase F3 auth/account integration batch only. Work was
performed inside the Nova repository on branch
`phase-f3-auth-marketplace-foundation`.

## Safety

- Started from latest `main`.
- Confirmed git remote is `https://github.com/onkarc-dev/Nova.git`.
- Ran the wrong-project forbidden-term scan before coding and found zero
  matches.
- Did not touch any repository outside Nova.

## Backend APIs Used

Existing backend endpoints integrated:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users/me`

No new backend endpoints were required for Phase F3.

## Frontend Auth Work

- Login form now submits to the real backend login API.
- Signup form now submits to the real backend register API.
- Logout revokes the current refresh token when available.
- Added a client-side auth provider.
- Added refresh-token-ready session restore:
  - load current session with `GET /auth/me` and `GET /users/me`
  - if access token is expired, call `POST /auth/refresh`
  - store rotated access/refresh tokens
- Added account route protection with loading, unauthenticated, and error
  states.
- Connected `/account` to backend current-user/profile data.
- Guarded existing account subroutes with the same auth gate.

## Token Storage Decision

The backend currently returns access and refresh tokens in JSON response bodies
and does not set HTTP-only cookies. The frontend therefore uses browser
`localStorage` as a temporary token storage strategy for this phase.

Security risk:

- Browser token storage is exposed to XSS if an injection vulnerability is
  introduced.

Mitigation in this phase:

- No secrets are hardcoded in frontend code.
- Tokens are scoped to the current browser and cleared on logout or invalid
  refresh.
- This is documented as temporary.

Future hardening:

- Move refresh-token handling to HTTP-only secure cookies or a backend-for-
  frontend session endpoint.
- Add CSRF strategy if cookie-backed auth is introduced.

## Shared Package Changes

`packages/api-client`:

- Added typed auth functions: login, register, refresh, logout, me.

---

# Phase 3 Production Payment Engine - 2026-07-04

Status: COMPLETE

## Scope Delivered

- Upgraded the existing payment foundation into a production payment engine.
- Added provider-driven payment creation through `PaymentProviderAdapter`.
- Added Razorpay order creation, payment signature verification, and webhook
  signature verification using raw request bodies.
- Added `MANUAL_DEV` fallback provider for safe local development when
  Razorpay credentials are absent.
- Added payment state-machine enforcement for `CREATED`, `PENDING`,
  `AUTHORIZED`, `CAPTURED`, `FAILED`, `CANCELLED`, `REFUNDED`,
  `PARTIALLY_REFUNDED`, and `EXPIRED`.
- Added webhook idempotency through `WebhookEvent` uniqueness.
- Added transaction/refund idempotency keys to prevent duplicate captures,
  inventory deductions, inventory releases, and refunds.
- Added payment audit events for created, verified/captured, failed, expired,
  refund, duplicate webhook, and invalid webhook outcomes.
- Added full and partial refund support with refund history and status
  tracking.
- Added service-level expiry cleanup that is safe to rerun and releases
  reserved inventory once.

## APIs Added Or Changed

- `POST /api/v1/payments/create`
- `POST /api/v1/payments/verify`
- `POST /api/v1/payments/webhook/razorpay`
- `GET /api/v1/payments/:paymentId/status`
- `POST /api/v1/payments/:paymentId/refund` (admin-only)
- `GET /api/v1/admin/payments`
- `GET /api/v1/admin/payments/:paymentId`
- `POST /api/v1/admin/payments/:paymentId/refund`
- `GET /api/v1/admin/refunds`
- `POST /api/v1/admin/payments/expire`

## OOP And SOLID Decisions

- Kept controllers thin and moved orchestration into `PaymentService`.
- Kept gateway-specific behavior inside provider classes.
- Used the provider/strategy pattern for Razorpay and manual development
  fallback.
- Added `PaymentStateMachine` as a small explicit domain policy object.
- Preserved existing order and inventory service boundaries instead of
  rewriting checkout or order creation.

## Data Model Changes

- Extended `Payment` with provider order/payment references, lifecycle
  timestamps, refund totals, expiry, and metadata.
- Added `WebhookEvent` for provider event deduplication.
- Added `PaymentAuditEvent` for simple operational audit history.
- Added `RefundStatus`.
- Added transaction and refund idempotency keys.

## Verification

Passed:

- `npm install`
- `npm run db:format`
- `npm run db:generate`
- `npm run db:validate`
- `npm run typecheck`
- `npm run lint`
- `npm test`

Database-dependent checks:

- `npm run db:migrate:dev` and `npm run db:seed` still require a reachable
  local PostgreSQL database using `.env`.

## Remaining Limitations

- Expiry cleanup is implemented as service-level job logic and an admin
  endpoint. It should be wired into queue/scheduler infrastructure later.
- No seller payouts, delivery, recommendations, advanced analytics, or email
  queue work was added in this phase.
- Razorpay capture is supported at the provider boundary, but current order
  creation requests automatic capture through Razorpay order creation.

## Next Recommended Phase

Build a focused shipping/delivery or admin payment operations phase only after
Phase 3 is reviewed. Seller payouts should remain separate from this payment
engine foundation.
- Added account profile functions: get profile and update profile.
- Existing bearer token attachment is now used by the web app.

`packages/types`:

- Added auth request/response DTOs.
- Added authenticated user/profile DTOs.
- Added address DTOs.
- Added placeholder DTOs for wishlist, cart, order, checkout, payment method,
  and return request so later phases have typed targets without fake
  production behavior.

## Deferred

Wishlist backend integration:

- Deferred. Prisma has wishlist tables, but there are no wishlist controllers
  or services yet.

Cart foundation:

- Deferred. Prisma has cart tables, but there are no cart controllers or
  services yet.

Orders foundation:

- Deferred. Prisma has order tables, but customer order APIs are not yet
  implemented.

Checkout, payments, shipping, and returns:

- Deferred. No fake checkout, fake payment success, card collection, or
  logistics integration was added.

## Verification

Required verification for this session:

- `npm install`
- `npm run db:generate`
- `npm run db:validate`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run build:web`

## Next Recommended Batch

GO for wishlist backend integration only after Phase F3 is accepted.

NO-GO for cart, orders, checkout, payments, shipping, or returns until the
wishlist batch is implemented and verified.

## Phase 4 — Delivery & Shipment Engine

- Added shipment provider architecture with `DeliveryProvider` and default `ManualDeliveryProvider`.
- Added Prisma `ShipmentProvider`, `ShipmentStatus`, `Shipment`, and `ShipmentEvent`.
- Captured payments now create shipment placeholders inside the payment transaction after inventory deduction and order confirmation.
- Added backend-only shipment state machine and append-only event timeline with sort/dedupe for customer tracking responses.
- Added seller/admin/customer shipment APIs and API client/types support.
- Notification phase preparation is represented as internal shipment event metadata hooks; no email/SMS queue was added.
- Current limitation: no real Shiprocket/Delhivery/Porter API calls; manual provider is the only active provider.
