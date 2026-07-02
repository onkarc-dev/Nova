# Nova Commerce Master Project Tracker

## Purpose

Single source of truth for the project. Update this file after every
coding session.

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
