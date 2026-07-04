import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @IsOptional()
  @IsString()
  providerRef?: string;

  @IsOptional()
  @IsString()
  signature?: string;
}

export class RazorpayWebhookDto {
  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsOptional()
  payload?: unknown;
}

