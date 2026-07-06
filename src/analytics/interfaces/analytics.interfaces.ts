export interface ResolvedPeriod {
  from: Date;
  to: Date;
}

/**
 * One time bucket in a revenue/order time-series response.
 * Money fields are always in integer cents.
 */
export interface RevenueTimeBucket {
  [key: string]: string | number;
  bucketStart: string;
  bucketEnd: string;
  grossSalesCents: number;
  netSalesCents: number;
  commissionCents: number;
  refundCents: number;
  orderCount: number;
  itemQuantity: number;
}

/** Mutable internal accumulator used while filling buckets; mirrors {@link RevenueTimeBucket} minus the string dates. */
export interface RevenueBucketAccumulator {
  bucketStart: Date;
  bucketEnd: Date;
  grossSalesCents: number;
  netSalesCents: number;
  commissionCents: number;
  refundCents: number;
  orderCount: number;
  itemQuantity: number;
  orderIds: Set<string>;
}

export interface TopEntry {
  id: string;
  label: string;
  revenueCents: number;
  quantity: number;
}
