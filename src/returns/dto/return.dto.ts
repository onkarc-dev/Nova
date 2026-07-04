import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export enum ReturnRequestType {
  RETURN = 'RETURN',
  EXCHANGE = 'EXCHANGE',
}

export class CreateReturnDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsEnum(ReturnRequestType)
  type!: ReturnRequestType;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}

export class RejectReturnDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

