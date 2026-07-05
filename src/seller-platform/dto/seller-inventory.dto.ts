import { IsInt, Max, Min } from 'class-validator';

export class UpdateSellerInventoryDto {
  @IsInt()
  @Min(0)
  @Max(999999)
  onHand!: number;

  @IsInt()
  @Min(0)
  @Max(999999)
  safetyStock!: number;
}
