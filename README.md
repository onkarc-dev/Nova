# Nova Commerce

Nova is being evolved into a production-grade, full marketplace platform. It is not only a backend API: the target product includes a customer storefront, seller dashboard, admin dashboard, backend/API, and production operations track.

## Current milestone

The backend foundation establishes persistence and API contracts for core commerce domains:

- Identity, RBAC, refresh-token sessions, addresses, and auditability.
- Catalog management for products, categories, brands, variants, images, inventory, and warehouses.
- Shopper journeys for carts, wishlists, orders, payments, coupons, reviews, notifications, invoices, returns, refunds, search history, and recently viewed products.
- Operational capabilities for CMS pages, settings, analytics events, support tickets, activity logs, and audit logs.

Phase F1 introduces the production customer web foundation under `apps/web`, plus shared packages under `packages/api-client` and `packages/types`. Phase F2 connects the customer storefront to public catalog APIs for product browsing, category browsing, product detail pages, and search/filter foundations. Phase F3 connects login, signup, logout, refresh-token-ready session handling, and account overview surfaces to the real backend auth/account APIs. Phase F4 adds the buyer commerce foundation for wishlist, cart, checkout readiness, and read-only order history. Phase F5 creates real pending-payment orders with inventory reservation. Phase 3 adds the production payment engine with Razorpay order creation, signature verification, idempotent webhooks, refunds, expiry cleanup, and admin payment visibility. The ShopNova Lovable prototype is a visual/product reference only; Nova's production frontend is built cleanly in this repository.

## Repository structure

```text
.
├── src/                    # Current NestJS backend, kept at root during gradual monorepo migration
├── prisma/                 # Prisma schema, migrations, and seed data
├── apps/
│   └── web/                # Next.js customer storefront foundation
└── packages/
    ├── api-client/         # Typed fetch client and normalized API errors
    └── types/              # Shared marketplace DTO and API envelope types
```

Future structure should move the backend to `apps/api` only after scripts, Prisma paths, Docker, CI, and deployment commands are proven safe.

## Architecture principles

Nova follows a layered architecture:

```text
Presentation -> Application -> Domain -> Infrastructure
```

- **Presentation** owns routes, UI components, controllers, request/response models, accessibility states, and SEO metadata.
- **Application** owns use cases, orchestration, transactions, authorization checks, and integration boundaries.
- **Domain** owns business entities, invariants, policies, value objects, and domain events.
- **Infrastructure** owns Prisma persistence, external providers, Redis, queues, object storage, email/SMS/push, and payment adapters.

See [`docs/architecture.md`](docs/architecture.md) for the decision record and module boundaries.

## Database

Prisma is the source of truth for the normalized PostgreSQL schema.

```bash
npm run db:validate
npm run db:format
```

The schema lives in [`prisma/schema.prisma`](prisma/schema.prisma). See [`docs/database-schema.md`](docs/database-schema.md) for domain coverage and relationship notes.

## Environment

Copy `.env.example` to `.env` and replace all secrets before running any service.

```bash
cp .env.example .env
```

Required baseline variables:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `REDIS_URL`
- `APP_URL`
- `API_URL`

Frontend environment:

```bash
cp apps/web/.env.example apps/web/.env.local
```

`apps/web/.env.example`:

```text
NEXT_PUBLIC_API_URL=http://localhost:4000
```

The web app calls the backend through `packages/api-client`. Public catalog calls currently target:

- `GET /api/v1/catalog/products`
- `GET /api/v1/catalog/products/search`
- `GET /api/v1/catalog/products/:slug`
- `GET /api/v1/catalog/categories`
- `GET /api/v1/catalog/brands`

If the backend is unavailable, storefront pages render an API-unavailable state instead of fake catalog data.

Cadde Store search calls currently target:

- `GET /api/v1/search/products`
- `GET /api/v1/search/autocomplete?q=`
- `POST /api/v1/admin/search/reindex`

Search uses the database provider by default. Configure optional Meilisearch with:

- `MEILISEARCH_HOST`
- `MEILISEARCH_API_KEY`
- `MEILISEARCH_INDEX_PRODUCTS`

When Meilisearch is not configured, product search, filters, price sorting, pagination, autocomplete, and admin reindex continue to run through the PostgreSQL fallback. Reindex pushes active products from verified stores when Meilisearch is configured; with the fallback provider it returns the current count of indexable products.

Auth/account calls currently target:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users/me`

Current frontend session storage is a temporary browser `localStorage` strategy because the backend currently returns access and refresh tokens in JSON and does not set HTTP-only session cookies. No secrets are stored in frontend code. A future hardening pass should move refresh-token handling to secure cookies or a BFF/session endpoint.

Buyer commerce calls currently target:

- `GET /api/v1/wishlist`
- `POST /api/v1/wishlist/items`
- `DELETE /api/v1/wishlist/items/:productId`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/:id`
- `DELETE /api/v1/cart/items/:id`
- `DELETE /api/v1/cart`
- `GET /api/v1/checkout`
- `POST /api/v1/checkout/validate`
- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `GET /api/v1/orders/:id`
- `GET /api/v1/inventory/cart/:cartId/validate`

Checkout now creates real orders through the order API. Orders start as `PENDING_PAYMENT`, inventory is reserved, and a payment record is created through the configured provider. Razorpay is used when `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are configured; otherwise Nova uses the `MANUAL_DEV` provider for local development without hardcoded gateway secrets.

Payment calls currently target:

- `POST /api/v1/payments/create`
- `POST /api/v1/payments/verify`
- `POST /api/v1/payments/webhook/razorpay`
- `GET /api/v1/payments/:paymentId/status`
- `POST /api/v1/payments/:paymentId/refund` (admin)
- `GET /api/v1/admin/payments`
- `GET /api/v1/admin/payments/:paymentId`
- `POST /api/v1/admin/payments/:paymentId/refund`
- `GET /api/v1/admin/refunds`
- `POST /api/v1/admin/payments/expire`

Razorpay webhooks must send the `x-razorpay-signature` header and preserve the raw request body. The payment service records `WebhookEvent` idempotency keys so duplicate captures, failures, refunds, and expiry runs do not double-deduct or double-release inventory. Schedule `POST /api/v1/admin/payments/expire` or call `PaymentService.expirePendingPayments()` from future queue infrastructure to release expired pending reservations.

See [`docs/phase-f5-order-processing.md`](docs/phase-f5-order-processing.md) for order flow, inventory rules, payment architecture, and remaining gaps.

See [`docs/phase-f5-notification-engine.md`](docs/phase-f5-notification-engine.md) for the transactional notification engine, provider design, idempotency, retry behavior, and notification APIs.

## Development standards

- Preserve backward compatibility and avoid rewrites.
- Refactor existing abstractions before adding new ones.
- Every API must include validation, structured errors, security controls, and logging.
- Every form and page must include loading, empty, error, and success states where applicable.
- Keep domain logic out of presentation and infrastructure code.
- Use schema validation and environment validation before bootstrapping services.

## Backend infrastructure

Milestone 2 adds a NestJS backend shell with production infrastructure before any business modules are introduced.

### API runtime

- Bootstrap entrypoint: `src/main.ts`.
- Root module: `src/app.module.ts`.
- API prefix/versioning: `/api/v1` by default.
- Health endpoints: `/api/v1/health`, `/api/v1/ready`, `/api/v1/version`, `/api/v1/database`, and `/api/v1/redis`.
- Global validation uses a strict whitelist and rejects unknown request properties.
- Global responses are wrapped in a consistent success/error envelope with request metadata.

### Development

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate:dev
npm run db:seed
npm run dev:api
```

Run the customer storefront:

```bash
npm run dev:web
```

Customer storefront routes:

- `/`
- `/products`
- `/products/[slug]`
- `/categories/[slug]`
- `/cart`
- `/checkout`
- `/login`
- `/signup`
- `/account`
- `/account/orders`
- `/account/orders/[id]`
- `/account/wishlist`
- `/account/payment-methods`
- `/account/notifications`

Not implemented yet: delivery integrations, seller payouts, advanced analytics, recommendation systems, email queue delivery, coupons, seller dashboard UI, admin dashboard UI, and inventory management UI.

Auth/account integration:

- `/login` submits to the backend login endpoint.
- `/signup` submits to the backend register endpoint.
- `/account` is protected by frontend session state and loads real profile data.
- Account subroutes are guarded by the same auth gate.

Buyer commerce integration:

- Wishlist is connected to authenticated backend wishlist APIs.
- Cart is connected to authenticated backend cart APIs and shows a header badge.
- Product detail pages can add the first active variant to the cart.
- Checkout validates cart, address, and inventory readiness before creating an order.
- Orders are created as pending-payment records and show existing backend orders for the signed-in buyer.

### Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run db:validate
npm run build
```

### Docker

```bash
npm run docker:dev
npm run docker:prod
```

The shared compose file defines PostgreSQL, Redis, persistent volumes, an isolated bridge network, and health checks. Development and production compose overlays adjust commands, mounts, restart policies, and runtime environment.

### Migrations and seed data

- Create local migrations with `npm run db:migrate:dev`.
- Apply production migrations with `npm run db:migrate:deploy`.
- Seed infrastructure RBAC data with `npm run db:seed`.

### Phase 4 Delivery & Shipment Engine

Nova now includes a production-safe shipment foundation for paid marketplace orders. Captured payments create per seller/store shipment placeholders with the manual provider, a default MVP ETA, and an initial tracking event. Seller, admin, and customer tracking APIs enforce ownership and a backend shipment state machine.

Shipment lifecycle: `PENDING -> PACKED -> READY_TO_SHIP -> SHIPPED -> IN_TRANSIT -> OUT_FOR_DELIVERY -> DELIVERED`, with supported failure/cancel and return-preparation statuses: `FAILED_DELIVERY`, `CANCELLED`, `RETURN_PICKUP_REQUESTED`, `RETURN_PICKED_UP`, `RETURN_IN_TRANSIT`, `RETURN_DELIVERED`.

Manual provider is the default. Future providers can implement the delivery provider contract for Shiprocket, Delhivery, Porter, or local courier APIs without changing API controllers.

### Phase 7 Analytics & Business Intelligence Engine

Nova includes a marketplace analytics/BI foundation computed live from operational data (orders, payments, shipments, returns, commissions, inventory) — not a separate data warehouse.

**Admin** (`/api/v1/admin/analytics/*`, requires `admin` role): `overview`, `revenue`, `orders`, `payments`, `shipments`, `returns`, `products`, `sellers`, `categories`, `inventory`, `export`.

**Seller** (`/api/v1/seller/analytics/*`, requires `seller` role): `overview`, `revenue`, `orders`, `products`, `inventory`, `shipments`, `returns`, `export`. Every seller query resolves the caller's own `sellerId` server-side from the authenticated user — a seller can never request platform-wide data or another seller's numbers, regardless of query parameters supplied.

Revenue/orders endpoints accept `from`, `to`, `granularity` (`day|week|month`), and (admin-only) `sellerId`, plus `storeId`/`categoryId`/`productId`, returning time-bucketed `{ bucketStart, bucketEnd, grossSalesCents, netSalesCents, commissionCents, refundCents, orderCount, itemQuantity }` series alongside a period summary.

`GET .../analytics/export?type=revenue|orders|products|settlements&from=&to=` streams a `text/csv` file directly (not the standard JSON envelope).

Known limitations: return reasons are grouped by exact free-text match (no structured taxonomy yet); product conversion rate is returned as `null` since no view/click event stream exists; analytics are computed live and bounded per request rather than pre-aggregated, which is fine at MVP scale but should move to a materialized rollup (e.g. an `AnalyticsSnapshot` table) if query volume grows.
