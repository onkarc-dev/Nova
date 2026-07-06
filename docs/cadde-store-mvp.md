# Cadde Store MVP Status

Nova is being evolved into Cadde Store with an API-first backend boundary. Lovable/frontend remains responsible for UI, forms, responsive layout, frontend state, and API integration only. Backend modules own auth, roles, seller workflows, products, inventory, orders, payments, search, analytics, returns, validations, and database workflows.

## Added API Areas

- `POST /api/v1/seller/products`
- `GET /api/v1/seller/products`
- `GET /api/v1/seller/products/:id`
- `PATCH /api/v1/seller/products/:id`
- `DELETE /api/v1/seller/products/:id`
- `GET /api/v1/seller/inventory`
- `PATCH /api/v1/seller/inventory/:variantId`
- `GET /api/v1/admin/sellers`
- `POST /api/v1/admin/sellers/:sellerId/approve`
- `POST /api/v1/admin/sellers/:sellerId/reject`
- `POST /api/v1/admin/sellers/:sellerId/suspend`
- `GET /api/v1/admin/products`
- `POST /api/v1/admin/products/:productId/approve`
- `POST /api/v1/admin/products/:productId/reject`
- `PATCH /api/v1/admin/products/:productId/status`
- `POST /api/v1/payments/create`
- `POST /api/v1/payments/verify`
- `POST /api/v1/payments/webhook/razorpay`
- `GET /api/v1/payments/:paymentId/status`
- `POST /api/v1/payments/:paymentId/refund`
- `GET /api/v1/admin/payments`
- `GET /api/v1/admin/payments/:paymentId`
- `POST /api/v1/admin/payments/:paymentId/refund`
- `GET /api/v1/admin/refunds`
- `POST /api/v1/admin/payments/expire`
- `GET /api/v1/search/products`
- `GET /api/v1/search/autocomplete?q=`
- `POST /api/v1/admin/search/reindex`
- `GET /api/v1/admin/analytics/revenue`
- `GET /api/v1/admin/analytics/categories`
- `GET /api/v1/admin/analytics/products`
- `GET /api/v1/seller/analytics/revenue`
- `GET /api/v1/seller/analytics/products`
- `POST /api/v1/returns`
- `GET /api/v1/returns`
- `GET /api/v1/returns/:id`
- `POST /api/v1/admin/returns/:id/approve`
- `POST /api/v1/admin/returns/:id/reject`
- `POST /api/v1/admin/returns/:id/refund`

## Local Checks

Run:

```bash
npm install
npm run db:generate
npm run db:validate
npm run db:seed
npm run typecheck
npm run lint
npm run test
npm run build
```

Use `npm run db:migrate:dev` when a local PostgreSQL database is available and schema changes need migration.

## Payment Notes

Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` for Razorpay. With no Razorpay credentials, the backend uses the `MANUAL_DEV` provider for local development. Webhooks must include `x-razorpay-signature`; local forwarding tools should preserve the raw request body.

Payment state transitions are enforced in code:

- `CREATED` -> `PENDING` -> `AUTHORIZED` -> `CAPTURED`
- failure exits: `FAILED`, `CANCELLED`, `EXPIRED`
- refund exits after capture: `PARTIALLY_REFUNDED`, `REFUNDED`

Webhook idempotency is stored in `WebhookEvent` with provider/event uniqueness. Transaction and refund idempotency keys prevent duplicate captures, inventory deductions, inventory releases, and refunds. The expiry cleanup is implemented as service-level job logic and exposed through `POST /api/v1/admin/payments/expire`; wire this endpoint or `PaymentService.expirePendingPayments()` to future queue/scheduler infrastructure.

## Search Notes

`MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`, and `MEILISEARCH_INDEX_PRODUCTS` configure optional Meilisearch product indexing. When they are missing, Cadde Store uses the database search provider automatically so local development does not require a search service.

Search supports keyword relevance, category, brand, seller/store, price range, newest, name, and real minimum active variant price sorting. Autocomplete normalizes lowercase text, ranks exact prefix matches above contains matches, deduplicates normalized values, and returns product, category, brand, and store suggestions.

Product create/update/status flows schedule search indexing after the database mutation. Indexing failures are logged and do not block product or moderation workflows. `POST /api/v1/admin/search/reindex` rebuilds active products from verified stores.

## Phase 4 — Delivery & Shipment Engine

Implemented a shipment domain around orders and payments:

- `Shipment` stores provider, seller/store ownership, status, tracking fields, ETA, and lifecycle timestamps.
- `ShipmentEvent` stores append-only status/tracking timeline events sorted by occurrence time.
- Seller APIs: `GET /api/v1/seller/shipments`, `GET /api/v1/seller/shipments/:shipmentId`, `PATCH /api/v1/seller/shipments/:shipmentId/status`, `PATCH /api/v1/seller/shipments/:shipmentId/tracking`.
- Admin APIs: `GET /api/v1/admin/shipments`, `GET /api/v1/admin/shipments/:shipmentId`, `PATCH /api/v1/admin/shipments/:shipmentId/status`, `PATCH /api/v1/admin/shipments/:shipmentId/tracking`, `POST /api/v1/admin/shipments/:shipmentId/cancel`.
- Customer APIs: `GET /api/v1/orders/:orderId/tracking`, `GET /api/v1/shipments/:shipmentId/tracking`.

The manual provider is intentionally lightweight. It assigns a default ETA of five days, records manual tracking updates, and leaves paid courier API integration for a future logistics phase.

## Phase 5 - Notification Engine

Implemented transactional notifications for customer, seller, and admin
operations:

- Persisted `Notification` records with type, channel, priority, status,
  idempotency key, read/sent/failed timestamps, and metadata.
- Persisted `NotificationAttempt` rows for provider delivery attempts.
- Default active channels are `IN_APP` and console-backed `EMAIL`.
- Customer APIs: `GET /api/v1/notifications`, `GET
  /api/v1/notifications/unread-count`, `PATCH
  /api/v1/notifications/:notificationId/read`, `PATCH
  /api/v1/notifications/read-all`.
- Admin APIs: `GET /api/v1/admin/notifications`, `GET
  /api/v1/admin/notifications/failures`, `POST
  /api/v1/admin/notifications/:notificationId/retry`.

Notification hooks are non-blocking for payment, shipment, return, refund, and
product moderation flows. SMS, WhatsApp, Resend, and AWS SES are provider
placeholders until real credentials and production delivery policies are
approved.

## Phase 7 — Analytics & Business Intelligence Engine

Implemented a marketplace analytics/BI foundation on top of existing operational
tables (orders, order items, payments, refunds, returns, shipments, commission
records, inventory) — not a separate data warehouse.

Architecture:

- `AnalyticsAggregationService` — pure, Prisma-free helpers: period resolution,
  day/week/month bucket construction, O(1) direct-addressing bucket index lookup,
  top-N ranking, and CSV serialization.
- `BaseAnalyticsQueryService` — abstract class holding the actual Prisma queries
  (revenue series, order status breakdown, shipment breakdown, return/refund
  stats, top products, category/brand breakdown, inventory health) so the query
  logic is written exactly once.
- `AdminAnalyticsService` — extends the base with no scope restriction (platform-wide).
- `SellerAnalyticsService` — extends the base, resolving `sellerId`/store ids from
  the authenticated user and injecting that scope into every query. A seller can
  never see another seller's data or platform-wide totals; no endpoint accepts a
  client-supplied seller id.

Admin APIs (`admin` role required): `GET /api/v1/admin/analytics/overview`,
`.../revenue`, `.../orders`, `.../payments`, `.../shipments`, `.../returns`,
`.../products`, `.../sellers`, `.../categories`, `.../inventory`, `.../export`.

Seller APIs (`seller` role required): `GET /api/v1/seller/analytics/overview`,
`.../revenue`, `.../orders`, `.../products`, `.../inventory`, `.../shipments`,
`.../returns`, `.../export`.

Time-series (`revenue`, and `orders` when `granularity` is passed) accept `from`,
`to`, `granularity` (`day|week|month`), and (admin-only) `sellerId`, plus
`storeId`/`categoryId`/`productId`, returning per-bucket
`{ bucketStart, bucketEnd, grossSalesCents, netSalesCents, commissionCents, refundCents, orderCount, itemQuantity }`
plus a period summary.

`GET .../analytics/export?type=revenue|orders|products|settlements&from=&to=`
streams a `text/csv` response directly (`@Res({ passthrough: false })`), bypassing
the standard JSON success envelope.

Metric definitions:

- **GMV** = sum of order `totalCents` for orders placed in the period, excluding `CANCELLED` orders.
- **Net revenue** = GMV − processed refund amount.
- **Commission revenue** = sum of `CommissionRecord.commissionAmountCents` for records not `REVERSED`.
- **Payment success rate** = captured/succeeded payments ÷ all payments created in the period.
- **Return rate / refund rate** = return count / refund count ÷ total orders placed in the period.
- **Low stock** = `0 < (onHand − reserved) <= safetyStock` at the product level (summed across variants/warehouses); **out of stock** = `(onHand − reserved) <= 0`.

Limitations (documented, not silently papered over):

- No `AnalyticsSnapshot`/materialized rollup table was added. Every request computes
  live from bounded, indexed queries over the requested `from`/`to` window. This is
  the right MVP tradeoff (always-fresh numbers, no new migration) but will need a
  pre-aggregated rollup if BI query volume or history length grows significantly.
- `Return.reason` and `Refund.reason` are free text, not a structured enum, so
  "top return reasons" is an exact-string grouping rather than a true taxonomy.
- No product view/click event stream exists yet, so product conversion rate is
  returned as `null` rather than a fabricated number.
- Category/brand and inventory rollups group in memory over a bounded, capped
  result set (a few thousand rows); very large catalogs should page by
  store/category or move to a materialized rollup in a later phase.
- Recommendations, coupons/promotions, reviews/ratings, ML personalization, and a
  full data warehouse are explicitly out of scope for this phase.
