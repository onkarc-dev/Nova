# Phase F4 Buyer Commerce Foundation

Date: 2026-07-03

Status: COMPLETE

## Scope Delivered

- Backend buyer wishlist APIs using the existing Prisma wishlist models:
  `GET /api/v1/wishlist`, `POST /api/v1/wishlist/items`, and
  `DELETE /api/v1/wishlist/items/:productId`.
- Backend buyer cart APIs using the existing Prisma cart models:
  `GET /api/v1/cart`, `POST /api/v1/cart/items`,
  `PATCH /api/v1/cart/items/:id`, `DELETE /api/v1/cart/items/:id`, and
  `DELETE /api/v1/cart`.
- Backend checkout readiness APIs:
  `GET /api/v1/checkout` and `POST /api/v1/checkout/validate`.
- Backend read-only buyer order APIs:
  `GET /api/v1/orders` and `GET /api/v1/orders/:id`.
- Shared API client functions for wishlist, cart, checkout, and orders.
- Shared DTOs for wishlist items, cart summaries, checkout drafts, checkout
  validation, order statuses, and order items.
- Customer web routes for `/cart`, `/checkout`, connected
  `/account/wishlist`, connected `/account/orders`, and
  `/account/orders/[id]`.
- Header cart badge, product wishlist action, and product detail add-to-cart
  action connected to the authenticated API client.
- Focused Jest coverage for cart service behavior and checkout validation.

## Database

No schema migration was required. Phase F4 used the existing `Cart`,
`CartItem`, `Wishlist`, `WishlistItem`, `Order`, `OrderItem`, and `Address`
Prisma models.

## Checkout Boundary

Checkout is intentionally a readiness foundation only. It validates a signed-in
buyer's cart and address selection, returns `paymentIntegrationStatus:
"PENDING"`, and does not place orders, capture payment, or simulate a completed
checkout.

## Still Not Implemented

- Real payment provider integration.
- Order placement from checkout.
- Shipping integrations.
- Returns.
- Coupons.
- Seller dashboard.
- Admin dashboard.
- Inventory management UI.
- Notification workflows.

## Next Phase Guidance

Phase F5 should be payment/order placement design or seller dashboard only after
explicit approval. The current checkout readiness screen is not production
checkout completion.
