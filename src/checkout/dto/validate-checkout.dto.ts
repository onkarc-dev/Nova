import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ValidateCheckoutDto {
  @IsString()
  @IsNotEmpty()
  shippingAddressId!: string;

  @IsOptional()
  @IsString()
  billingAddressId?: string;
}
