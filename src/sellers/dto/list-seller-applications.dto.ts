import { SellerStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class ListSellerApplicationsDto {
  @IsOptional()
  @IsEnum(SellerStatus)
  status?: SellerStatus;
}
