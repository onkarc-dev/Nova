import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  cartId!: string;

  @IsString()
  @IsNotEmpty()
  shippingAddressId!: string;

  @IsOptional()
  @IsString()
  billingAddressId?: string;
}
