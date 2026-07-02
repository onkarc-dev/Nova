# Nova Database Schema

The Prisma schema in `prisma/schema.prisma` defines the normalized PostgreSQL persistence model for Nova's commerce domains.

## Identity and access

- `User` stores customer and staff identities with verification timestamps and lifecycle status.
- `Role`, `Permission`, `UserRole`, and `RolePermission` model RBAC without duplicating permission data.
- `RefreshToken` stores hashed refresh tokens with status, expiration, revocation, device, and network metadata.
- `Address` stores reusable billing and shipping addresses linked to users and historical orders.

## Catalog

- `Category` supports hierarchical category trees through a self relation.
- `Brand` stores optional product brand metadata.
- `Product` stores canonical product content and SEO fields.
- `Variant` stores sellable SKUs, pricing, currency, and attribute JSON.
- `ProductImage` stores ordered product media and primary-image flags.
- `Review` and `Rating` separate long-form moderation from aggregateable score data.

## Inventory

- `Warehouse` represents fulfillment locations.
- `Inventory` tracks variant stock per warehouse with on-hand, reserved, and safety-stock quantities.

## Shopper journey

- `Cart` and `CartItem` support authenticated users and anonymous sessions.
- `Wishlist` and `WishlistItem` support user-owned product lists.
- `SearchHistory` and `RecentlyViewed` support personalization, autocomplete, and recommendations.

## Checkout and orders

- `Order` stores immutable order totals and lifecycle status.
- `OrderItem` snapshots SKU and product names at purchase time.
- `Payment` and `Transaction` track provider-level payment state and raw provider metadata.
- `Coupon` and `CouponUsage` enforce code uniqueness, order usage, and user usage tracking.
- `Invoice`, `Return`, and `Refund` support post-purchase operations.

## Operations

- `Notification` stores email, SMS, push, and in-app delivery lifecycle state.
- `ActivityLog` stores user-visible behavioral events.
- `AuditLog` stores administrative or sensitive changes with before/after payloads.
- `CmsPage` stores structured CMS content.
- `Setting` stores operational configuration values.
- `AnalyticsEvent` stores product and funnel telemetry.
- `SupportTicket` supports customer support assignment and lifecycle state.

## Modeling guidelines

- Monetary amounts are stored as integer minor units (`*Cents`) to avoid floating-point rounding errors.
- External tokens are stored as hashes, never plaintext.
- Join tables use composite primary keys where the association itself is the identity.
- Slugs, SKUs, coupon codes, order numbers, invoice numbers, and provider-independent identifiers are unique.
- Indexes are added to user/status, category/status, brand, inventory, search, and audit access patterns used by production APIs.
