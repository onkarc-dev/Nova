import { IsIn, IsOptional, IsString, Matches } from 'class-validator';

export class SortingDto {
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_.]+$/)
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder: 'asc' | 'desc' = 'desc';
}
