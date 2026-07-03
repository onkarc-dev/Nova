import { IsInt, IsString, Max, Min, MinLength } from 'class-validator';

export class AddCartItemDto {
  @IsString()
  @MinLength(1)
  variantId!: string;

  @IsInt()
  @Min(1)
  @Max(99)
  quantity!: number;
}
