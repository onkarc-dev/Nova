import { Injectable, Logger } from '@nestjs/common';

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  queue(message: EmailMessage): void {
    if (process.env.EMAIL_PROVIDER === 'console' || !process.env.EMAIL_PROVIDER) {
      this.logger.log({ to: message.to, subject: message.subject, metadata: message.metadata }, 'Queued dev email');
      return;
    }
    this.logger.warn('Production email provider is not configured; email was accepted as a no-op.');
  }

  signup(to: string) {
    this.queue({ to, subject: 'Welcome to Cadde Store', text: 'Your account has been created.' });
  }

  sellerApproval(to: string, approved: boolean) {
    this.queue({
      to,
      subject: approved ? 'Seller account approved' : 'Seller account update',
      text: approved ? 'Your seller account is approved.' : 'Your seller account status has changed.',
    });
  }

  orderPlaced(to: string, orderNumber: string) {
    this.queue({ to, subject: `Order ${orderNumber} placed`, text: `We received order ${orderNumber}.` });
  }

  paymentSuccess(to: string, orderNumber: string) {
    this.queue({ to, subject: `Payment confirmed for ${orderNumber}`, text: `Payment for order ${orderNumber} is confirmed.` });
  }

  returnStatus(to: string, status: string) {
    this.queue({ to, subject: `Return ${status}`, text: `Your return status is now ${status}.` });
  }
}
