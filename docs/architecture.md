# Nova Architecture

## Mission

Nova is a commercial e-commerce platform that must grow from a small startup codebase into an enterprise-grade system. The project should evolve through coherent milestones, preserving working behavior while improving structure, type safety, security, and operability.

## Layered architecture

Nova uses a strict dependency direction:

```text
Presentation -> Application -> Domain -> Infrastructure
```

### Presentation layer

Responsibilities:

- TanStack Start routes and layouts.
- React components, forms, loading states, error states, empty states, and success states.
- Accessibility, responsive behavior, and SEO metadata.
- API controllers when a backend service is introduced.

Presentation code may call application use cases but must not contain persistence logic, payment-provider logic, or business invariants.

### Application layer

Responsibilities:

- Use-case orchestration such as add-to-cart, checkout, capture-payment, fulfill-order, and issue-refund.
- Transaction boundaries.
- Authorization checks and RBAC policy evaluation.
- Input DTO validation and output mapping.
- Queue dispatching for async workflows.

Application code depends on domain contracts and infrastructure interfaces, not concrete provider SDKs.

### Domain layer

Responsibilities:

- Entities, value objects, domain services, policies, and domain events.
- Invariants such as inventory reservation rules, coupon eligibility, order state transitions, and refund limits.
- Framework-independent TypeScript types.

Domain code must be portable and should not import Prisma, React, HTTP frameworks, queues, or provider SDKs.

### Infrastructure layer

Responsibilities:

- Prisma repositories and database transactions.
- Redis caching and BullMQ processors.
- Stripe, Razorpay, Cloudinary/S3, email, SMS, push, and search adapters.
- Observability, structured logging transports, and deployment-specific wiring.

Infrastructure implements interfaces defined by application/domain layers.

## Initial bounded contexts

- **Identity and Access**: users, roles, permissions, refresh tokens, OTP/OAuth extensions, activity logs, audit logs.
- **Catalog**: products, categories, brands, variants, product images, reviews, ratings, search metadata.
- **Inventory**: warehouses, stock on hand, reserved stock, safety stock, inventory updates.
- **Checkout**: carts, cart items, coupons, checkout orchestration, payment intents.
- **Orders**: orders, order items, invoices, returns, refunds, shipping lifecycle.
- **Engagement**: wishlist, recently viewed products, notifications, search history.
- **Operations**: CMS, settings, analytics, support tickets, reporting.

## Cross-cutting requirements

- **Security**: JWT, refresh-token rotation, RBAC, password hashing, rate limiting, Helmet, CORS, CSRF protection, secure cookies, input validation, environment validation, and audit logging.
- **Performance**: pagination, selective database indexes, lazy loading, image optimization, Redis caching, queue-backed jobs, and search-service integration when catalog scale requires it.
- **Reliability**: idempotent payment webhooks, transactional order creation, inventory reservation, retryable notification jobs, and immutable audit trails.
- **Observability**: structured logs, request correlation IDs, domain event logs, and operational metrics.

## Evolution plan

1. Establish normalized persistence schema and documentation.
2. Add backend application shell with environment validation, logging, security middleware, health checks, and Prisma access.
3. Implement identity and RBAC APIs.
4. Implement catalog read/write APIs with pagination, filtering, sorting, and admin controls.
5. Implement cart, wishlist, checkout, orders, payments, inventory, notifications, and admin modules in dependency order.

## Production infrastructure baseline

The backend shell is a NestJS application organized around Clean Architecture folders under `src/`:

- `config`: typed configuration modules and startup environment validation.
- `common`: shared DTOs, response envelopes, filters, interceptors, enums, interfaces, and utilities.
- `database`: Prisma service, connection lifecycle, health checks, transaction helper, seed infrastructure, and base repository utilities.
- `middlewares`: request ID propagation and structured request logging.
- `queues`: Redis connection management and reusable cache abstraction.
- `health`: operational health, readiness, version, database, and Redis endpoints.
- `modules`, `core`, `jobs`, `events`, `guards`, `decorators`, `types`, and `interfaces`: reserved architecture boundaries for future business modules and cross-cutting policies.

The application bootstrap configures Helmet, compression, CORS, cookie parsing, URI API versioning, strict validation, global exception handling, global response wrapping, graceful shutdown hooks, and trust-proxy support for production reverse proxies.

## API standards

All successful controller responses are wrapped as:

```json
{
  "success": true,
  "data": {},
  "metadata": { "requestId": "req_...", "timestamp": "...", "path": "/api/v1/...", "version": "1" }
}
```

All errors are wrapped as:

```json
{
  "success": false,
  "error": { "code": "VALIDATION_ERROR", "message": "..." },
  "metadata": { "requestId": "req_...", "timestamp": "..." }
}
```

Reusable DTOs standardize pagination, sorting, filtering, and search inputs before business modules are implemented.
