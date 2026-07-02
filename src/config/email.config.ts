import { registerAs } from '@nestjs/config';

export const emailConfig = registerAs('email', () => ({
  from: process.env.EMAIL_FROM ?? 'no-reply@nova.local',
  smtpUrl: process.env.SMTP_URL,
}));
