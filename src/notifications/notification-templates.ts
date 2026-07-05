import { Injectable } from '@nestjs/common';
import { NotificationPriority, NotificationType } from '@prisma/client';

export interface NotificationTemplateInput {
  orderNumber?: string;
  paymentId?: string;
  shipmentId?: string;
  productName?: string;
  returnId?: string;
  status?: string;
  amountCents?: number;
  currency?: string;
}

export interface RenderedNotificationTemplate {
  title: string;
  body: string;
  priority: NotificationPriority;
}

@Injectable()
export class NotificationTemplateService {
  render(type: NotificationType, input: NotificationTemplateInput = {}): RenderedNotificationTemplate {
    const order = input.orderNumber ? ` ${input.orderNumber}` : '';
    const amount = input.amountCents !== undefined ? ` for ${this.formatAmount(input.amountCents, input.currency ?? 'INR')}` : '';
    const templates: Record<NotificationType, RenderedNotificationTemplate> = {
      ORDER_PLACED: { title: `Order${order} placed`, body: `We received your order${order}.`, priority: NotificationPriority.NORMAL },
      PAYMENT_SUCCESS: { title: `Payment confirmed${order}`, body: `Your payment${amount} was successful.`, priority: NotificationPriority.HIGH },
      PAYMENT_FAILED: { title: `Payment failed${order}`, body: 'We could not complete the payment. Please try again.', priority: NotificationPriority.HIGH },
      REFUND_REQUESTED: { title: `Refund requested${order}`, body: 'Your refund request has been recorded.', priority: NotificationPriority.NORMAL },
      REFUND_PROCESSED: { title: `Refund processed${order}`, body: `Your refund${amount} has been processed.`, priority: NotificationPriority.HIGH },
      SHIPMENT_CREATED: { title: `Shipment created${order}`, body: 'A shipment has been created for your order.', priority: NotificationPriority.NORMAL },
      SHIPMENT_SHIPPED: { title: `Order shipped${order}`, body: 'Your order is on the way.', priority: NotificationPriority.HIGH },
      OUT_FOR_DELIVERY: { title: `Out for delivery${order}`, body: 'Your order is out for delivery today.', priority: NotificationPriority.HIGH },
      DELIVERED: { title: `Delivered${order}`, body: 'Your order was delivered.', priority: NotificationPriority.HIGH },
      FAILED_DELIVERY: { title: `Delivery failed${order}`, body: 'Delivery could not be completed. We will update you with next steps.', priority: NotificationPriority.CRITICAL },
      RETURN_REQUESTED: { title: `Return requested${order}`, body: 'Your return request has been received.', priority: NotificationPriority.NORMAL },
      RETURN_APPROVED: { title: `Return approved${order}`, body: 'Your return request was approved.', priority: NotificationPriority.HIGH },
      RETURN_REJECTED: { title: `Return update${order}`, body: 'Your return request was not approved.', priority: NotificationPriority.HIGH },
      SELLER_NEW_ORDER: { title: `New order${order}`, body: 'A paid order needs seller fulfillment.', priority: NotificationPriority.HIGH },
      SELLER_PRODUCT_APPROVED: { title: 'Product approved', body: `${input.productName ?? 'Your product'} is now approved.`, priority: NotificationPriority.NORMAL },
      SELLER_PRODUCT_REJECTED: { title: 'Product needs changes', body: `${input.productName ?? 'Your product'} was not approved.`, priority: NotificationPriority.NORMAL },
      SELLER_SETTLEMENT_GENERATED: { title: 'Settlement generated', body: 'A seller settlement is ready for review.', priority: NotificationPriority.NORMAL },
      SELLER_SETTLEMENT_PAID: { title: 'Settlement paid', body: 'A seller settlement was marked paid.', priority: NotificationPriority.HIGH },
      SELLER_SETTLEMENT_FAILED: { title: 'Settlement failed', body: 'A seller settlement needs attention.', priority: NotificationPriority.HIGH },
      SELLER_COMMISSION_REVERSED: { title: 'Commission reversed', body: 'A commission was reversed after a refund or return.', priority: NotificationPriority.HIGH },
      ADMIN_PAYMENT_FAILED: { title: 'Payment failure alert', body: `Payment ${input.paymentId ?? ''} failed and may need review.`, priority: NotificationPriority.CRITICAL },
      ADMIN_REFUND_ALERT: { title: 'Refund alert', body: `Refund ${input.returnId ?? input.paymentId ?? ''} needs review.`, priority: NotificationPriority.CRITICAL },
    };
    return templates[type];
  }

  private formatAmount(amountCents: number, currency: string): string {
    return `${currency} ${(amountCents / 100).toFixed(2)}`;
  }
}
