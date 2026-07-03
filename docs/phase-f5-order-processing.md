# Phase F5 Order Processing Foundation

Date: 2026-07-03

Status: COMPLETE

## Scope Delivered

- Real authenticated order creation with `POST /api/v1/orders`.
- Server-side cart ownership validation.
- Server-side address ownership and shipping/billing capability validation.
- Server-side price recalculation from current variant prices.
- Order item pricing and seller/store snapshots.
- Order status `PENDING_PAYMENT`.
- Inventory availability validation and reservation using `Inventory.reserved`.
- Duplicate order protection with a unique optional `Order.cartId`.
- Pending payment architecture with provider interfaces, `NullPaymentProvider`,
  `ManualPendingProvider`, and a pending `Payment` record.
- Frontend checkout order creation and redirect to `/account/orders/[id]`.
- Order detail lifecycle timeline, pricing snapshot, addresses, items, and
  payment-pending display.

## Order Flow

1. Buyer starts from an authenticated active cart.
2. Checkout loads cart, addresses, and server pricing.
3. Buyer selects a shipping address.
4. Frontend calls checkout validation and inventory validation.
5. Frontend calls `POST /api/v1/orders`.
6. Backend opens one database transaction.
7. Backend verifies the cart belongs to the buyer and is active.
8. Backend rejects duplicate order creation for the same cart.
9. Backend verifies products, variants, stores, quantities, and addresses.
10. Backend recalculates all totals from current database values.
11. Backend creates the order and order item snapshots.
12. Backend reserves inventory by incrementing `Inventory.reserved`.
13. Backend creates a pending manual payment record.
14. Backend marks the cart `CHECKED_OUT`.
15. Frontend redirects to the order detail page.

Cart items are not deleted. The cart is marked `CHECKED_OUT` only after the
order, reservation, and pending payment record are created in the same
transaction. This prevents duplicate order creation while preserving the source
cart for traceability.

## Payment Architecture

Phase F5 does not integrate a real payment gateway.

- `PaymentProviderAdapter` defines the provider boundary.
- `NullPaymentProvider` exists for architecture/testing.
- `ManualPendingProvider` creates a `PENDING` payment record.
- No provider marks payment successful.
- No card numbers or sensitive payment data are accepted or stored.
- No external payment secrets are required or hardcoded.

## Inventory Rules

- Availability is calculated as `onHand - reserved - safetyStock`.
- Order creation validates availability before writing the order.
- Reservation increments `Inventory.reserved`.
- Reservation updates are conditional so concurrent reservations cannot push
  available stock below zero.
- If a reservation race is detected, order creation fails and the transaction
  rolls back.

Current limitation: there is no separate reservation-expiry table or release
job. Future payment timeout/cancellation work must release reserved inventory
for unpaid or cancelled orders.

## Security Decisions

- Order creation requires `JwtAuthGuard`.
- Cart lookup is scoped to current `user.id`.
- Address lookup is scoped to current `user.id`.
- Prices and totals are never accepted from the frontend.
- Store/product/variant activity is rechecked at order creation time.
- Duplicate protection uses the database-level unique cart/order link.

## Still Not Implemented

- Real payment capture.
- Payment webhooks.
- Payment cancellation and retry screens.
- Inventory reservation expiry/release jobs.
- Shipping integrations.
- Returns.
- Coupons.
- Seller dashboard.
- Admin dashboard.
- Email or push notifications.

## Verification

Required verification commands for this phase:

- `npm install`
- `npm run db:generate`
- `npm run db:validate`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run build:web`
