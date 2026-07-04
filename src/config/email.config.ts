import { registerAs } from '@nestjs/config';

export const emailConfig = registerAs('email', () => ({
  provider: process.env.EMAIL_PROVIDER ?? 'console',
  from: process.env.EMAIL_FROM ?? 'no-reply@nova.local',
  smtpUrl: process.env.SMTP_URL,
  resendApiKey: process.env.RESEND_API_KEY,
  awsSesRegion: process.env.AWS_SES_REGION,
}));
