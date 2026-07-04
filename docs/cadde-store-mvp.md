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
- `POST /api/v1/payments/:paymentId/refund`
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

Set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` for Razorpay. With no Razorpay credentials, the backend uses the existing manual pending provider for local development. Webhooks must include `x-razorpay-signature`; local forwarding tools should preserve the raw request body.

## Search Notes

`MEILISEARCH_HOST`, `MEILISEARCH_API_KEY`, and `MEILISEARCH_INDEX_PRODUCTS` configure optional Meilisearch product indexing. When they are missing, Cadde Store uses the database search provider automatically so local development does not require a search service.

Search supports keyword relevance, category, brand, seller/store, price range, newest, name, and real minimum active variant price sorting. Autocomplete normalizes lowercase text, ranks exact prefix matches above contains matches, deduplicates normalized values, and returns product, category, brand, and store suggestions.

Product create/update/status flows schedule search indexing after the database mutation. Indexing failures are logged and do not block product or moderation workflows. `POST /api/v1/admin/search/reindex` rebuilds active products from verified stores.
