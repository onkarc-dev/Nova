# Nova Commerce

Nova is being evolved into a production-grade, full marketplace platform. It is not only a backend API: the target product includes a customer storefront, seller dashboard, admin dashboard, backend/API, and production operations track.

## Current milestone

The backend foundation establishes persistence and API contracts for core commerce domains:

- Identity, RBAC, refresh-token sessions, addresses, and auditability.
- Catalog management for products, categories, brands, variants, images, inventory, and warehouses.
- Shopper journeys for carts, wishlists, orders, payments, coupons, reviews, notifications, invoices, returns, refunds, search history, and recently viewed products.
- Operational capabilities for CMS pages, settings, analytics events, support tickets, activity logs, and audit logs.

Phase F1 introduces the production customer web foundation under `apps/web`, plus shared packages under `packages/api-client` and `packages/types`. Phase F2 connects the customer storefront to public catalog APIs for product browsing, category browsing, product detail pages, and search/filter foundations. Phase F3 connects login, signup, logout, refresh-token-ready session handling, and account overview surfaces to the real backend auth/account APIs. Phase F4 adds the buyer commerce foundation for wishlist, cart, checkout readiness, and read-only order history. Phase F5 creates real pending-payment orders with inventory reservation and pending payment architecture. The ShopNova Lovable prototype is a visual/product reference only; Nova's production frontend is built cleanly in this repository.

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

Checkout now creates real orders through the order API. Orders start as `PENDING_PAYMENT`, inventory is reserved, and a pending manual payment record is created. Nova still does not capture payment or mark an order paid in this phase.

See [`docs/phase-f5-order-processing.md`](docs/phase-f5-order-processing.md) for order flow, inventory rules, payment architecture, and remaining gaps.

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

Not implemented yet: payment capture, payment webhooks, reservation expiry/release jobs, shipping integrations, returns, coupons, seller dashboard, admin dashboard, and inventory management UI.

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
