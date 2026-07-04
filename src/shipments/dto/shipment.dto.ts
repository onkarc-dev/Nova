import { IsDateString, IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { ShipmentStatus } from '@prisma/client';

export class UpdateShipmentStatusDto {
  @IsEnum(ShipmentStatus)
  status!: ShipmentStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;
}

export class UpdateShipmentTrackingDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  courierName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  trackingNumber?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(500)
  trackingUrl?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryAt?: string;
}
