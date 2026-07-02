import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationDto } from './pagination.dto';

export class SearchDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  q?: string;
}
