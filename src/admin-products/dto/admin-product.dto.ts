import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class ListAdminProductsDto {
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  sellerId?: string;
}

export class AdminProductStatusDto {
  @IsEnum(ProductStatus)
  status!: ProductStatus;
}

