# Nova Commerce

Nova is being evolved into a production-grade, enterprise e-commerce platform. This repository currently contains the foundational database and architecture contracts that future frontend and backend milestones must build on without duplicating domain concepts.

## Current milestone

The first milestone establishes the persistence foundation for core commerce domains:

- Identity, RBAC, refresh-token sessions, addresses, and auditability.
- Catalog management for products, categories, brands, variants, images, inventory, and warehouses.
- Shopper journeys for carts, wishlists, orders, payments, coupons, reviews, notifications, invoices, returns, refunds, search history, and recently viewed products.
- Operational capabilities for CMS pages, settings, analytics events, support tickets, activity logs, and audit logs.

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
npm run start:dev
```

### Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run db:validate
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
