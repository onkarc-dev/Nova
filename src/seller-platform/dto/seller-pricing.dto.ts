import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSellerPricingDto {
  @IsInt()
  @Min(1)
  @Max(999999999)
  priceCents!: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(999999999)
  compareAtCents?: number;
}
