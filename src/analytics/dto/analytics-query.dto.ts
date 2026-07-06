import { IsDateString, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export type AnalyticsGranularity = 'day' | 'week' | 'month';
export type AnalyticsExportType = 'revenue' | 'orders' | 'products' | 'settlements';

export class AnalyticsPeriodQueryDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}

/**
 * Time-series query usable by the admin controller. Admins may additionally scope
 * results to a specific seller; the seller controller uses {@link SellerAnalyticsTimeSeriesQueryDto}
 * (without `sellerId`) so a seller can never request another seller's series.
 */
export class AnalyticsTimeSeriesQueryDto extends AnalyticsPeriodQueryDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  granularity?: AnalyticsGranularity;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  productId?: string;
}

export class SellerAnalyticsTimeSeriesQueryDto extends AnalyticsPeriodQueryDto {
  @IsOptional()
  @IsIn(['day', 'week', 'month'])
  granularity?: AnalyticsGranularity;

  @IsOptional()
  @IsString()
  storeId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  productId?: string;
}

export class AnalyticsListQueryDto extends AnalyticsPeriodQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class AnalyticsExportQueryDto extends AnalyticsPeriodQueryDto {
  @IsIn(['revenue', 'orders', 'products', 'settlements'])
  type!: AnalyticsExportType;
}
