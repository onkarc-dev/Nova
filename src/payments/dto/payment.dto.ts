import { IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MaxLength, Min } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;
}

export class VerifyPaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentId!: string;

  @IsString()
  @IsNotEmpty()
  providerOrderId!: string;

  @IsString()
  @IsNotEmpty()
  providerPaymentId!: string;

  @IsOptional()
  @IsString()
  providerRef?: string;

  @IsString()
  @IsNotEmpty()
  signature!: string;
}

export class RefundPaymentDto {
  @IsInt()
  @IsPositive()
  amountCents!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  idempotencyKey?: string;
}

export class ListPaymentsDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Min(1)
  limit?: number = 50;
}

export class ExpirePaymentsDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  limit?: number = 100;
}

export class RazorpayWebhookDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @IsNotEmpty()
  event!: string;

  @IsOptional()
  payload?: unknown;
}

