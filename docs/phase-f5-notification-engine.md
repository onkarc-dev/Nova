# Phase 5 - Notification Engine

Phase 5 adds operational transactional notifications for commerce events. It is
not a marketing automation platform.

## Scope

- Customer notifications for payment success/failure, refunds, shipment
  lifecycle updates, returns, and delivery outcomes.
- Seller notifications for paid orders and product moderation.
- Admin visibility for notification failures plus retry controls.
- Console-first local email delivery with provider abstractions for Resend and
  AWS SES placeholders.
- Persisted in-app notifications for every event by default.

## Provider Design

`NotificationsService` owns idempotency, templates, persistence, status
transitions, attempts, and retries. `ConsoleNotificationProvider` delegates
email to an `EmailProvider` strategy selected by `EMAIL_PROVIDER`.

Supported provider options:

- `console`: local/dev provider; logs accepted emails.
- `resend`: placeholder strategy gated by `RESEND_API_KEY`.
- `aws-ses`: placeholder strategy for future SES transport.

SMS and WhatsApp delivery remain placeholders in this phase.

## Reliability

- Every notification has a unique `idempotencyKey`.
- Each channel gets its own key suffix, so `IN_APP` and `EMAIL` can coexist
  without duplicates.
- Delivery attempts are persisted in `NotificationAttempt`.
- Failed notifications can be retried from admin APIs.
- Hook failures are caught and logged so payment, shipment, order, refund, and
  moderation flows are not blocked by notification delivery.
- The current queue is an in-process fallback with priority ordering and
  exponential backoff math. BullMQ/Redis processing can replace it without
  changing commerce hooks.

## APIs

Customer:

- `GET /api/v1/notifications`
- `GET /api/v1/notifications/unread-count`
- `PATCH /api/v1/notifications/:notificationId/read`
- `PATCH /api/v1/notifications/read-all`

Admin:

- `GET /api/v1/admin/notifications`
- `GET /api/v1/admin/notifications/failures`
- `POST /api/v1/admin/notifications/:notificationId/retry`

## Environment

- `EMAIL_PROVIDER=console`
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `AWS_SES_REGION`
- `AWS_SES_ACCESS_KEY_ID`
- `AWS_SES_SECRET_ACCESS_KEY`
