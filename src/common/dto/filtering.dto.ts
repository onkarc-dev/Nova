import { IsObject, IsOptional } from 'class-validator';

export class FilteringDto {
  @IsOptional()
  @IsObject()
  filters?: Record<string, string | number | boolean | string[]>;
}
