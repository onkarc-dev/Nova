import { Injectable } from '@nestjs/common';
import type { AnalyticsGranularity } from './dto/analytics-query.dto';
import type { RevenueBucketAccumulator, RevenueTimeBucket, ResolvedPeriod } from './interfaces/analytics.interfaces';

const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_WINDOW_DAYS = 30;

/**
 * Pure, side-effect-free helpers shared by {@link AdminAnalyticsService} and
 * {@link SellerAnalyticsService}: period resolution, time bucketing (day/week/month),
 * top-N ranking, and CSV serialization.
 *
 * Kept deliberately dependency-free (no Prisma) so it stays trivial to unit test and
 * safe to reuse anywhere aggregation/reporting is needed.
 */
@Injectable()
export class AnalyticsAggregationService {
  /** Resolves an optional from/to query into a concrete date range, defaulting to the trailing 30 days. */
  resolvePeriod(from?: string, to?: string): ResolvedPeriod {
    const toDate = to ? new Date(to) : new Date();
    const fromDate = from ? new Date(from) : new Date(toDate.getTime() - DEFAULT_WINDOW_DAYS * DAY_MS);
    return { from: fromDate, to: toDate };
  }

  resolveGranularity(granularity?: AnalyticsGranularity): AnalyticsGranularity {
    return granularity ?? 'day';
  }

  /** Aligns a date down to the start of its bucket (UTC day / ISO week starting Monday / calendar month). */
  alignToBucketStart(date: Date, granularity: AnalyticsGranularity): Date {
    const aligned = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    if (granularity === 'month') {
      aligned.setUTCDate(1);
      return aligned;
    }
    if (granularity === 'week') {
      const dayOfWeek = aligned.getUTCDay();
      const daysSinceMonday = (dayOfWeek + 6) % 7;
      aligned.setUTCDate(aligned.getUTCDate() - daysSinceMonday);
      return aligned;
    }
    return aligned;
  }

  advanceBucket(date: Date, granularity: AnalyticsGranularity): Date {
    const next = new Date(date);
    if (granularity === 'month') {
      next.setUTCMonth(next.getUTCMonth() + 1);
      return next;
    }
    if (granularity === 'week') {
      next.setUTCDate(next.getUTCDate() + 7);
      return next;
    }
    next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  /**
   * Builds an ordered, zero-initialized bucket list covering [period.from, period.to].
   * Buckets are contiguous and pre-sorted, which lets {@link bucketIndexFor} compute the
   * destination index for any timestamp in O(1) (direct-addressing) instead of scanning.
   */
  buildEmptyBuckets(period: ResolvedPeriod, granularity: AnalyticsGranularity): RevenueBucketAccumulator[] {
    const buckets: RevenueBucketAccumulator[] = [];
    let cursor = this.alignToBucketStart(period.from, granularity);
    const end = period.to;
    // Safety cap avoids runaway loops on malformed/huge ranges (e.g. > ~10 years of days).
    const maxBuckets = 5000;
    while (cursor < end && buckets.length < maxBuckets) {
      const next = this.advanceBucket(cursor, granularity);
      buckets.push({
        bucketStart: cursor,
        bucketEnd: next,
        grossSalesCents: 0,
        netSalesCents: 0,
        commissionCents: 0,
        refundCents: 0,
        orderCount: 0,
        itemQuantity: 0,
        orderIds: new Set<string>(),
      });
      cursor = next;
    }
    return buckets;
  }

  /**
   * Direct-addressing index lookup: since buckets are equal-width (day/week) or
   * calendar-month-aligned, the destination bucket for a timestamp is computed in O(1)
   * rather than searched for, which keeps bucketing O(n) overall for n rows.
   * Returns -1 when the date falls outside the bucket range.
   */
  bucketIndexFor(date: Date, alignedFrom: Date, granularity: AnalyticsGranularity, bucketCount: number): number {
    let index: number;
    if (granularity === 'month') {
      index = (date.getUTCFullYear() - alignedFrom.getUTCFullYear()) * 12 + (date.getUTCMonth() - alignedFrom.getUTCMonth());
    } else {
      const unitMs = granularity === 'week' ? 7 * DAY_MS : DAY_MS;
      index = Math.floor((date.getTime() - alignedFrom.getTime()) / unitMs);
    }
    if (index < 0 || index >= bucketCount) return -1;
    return index;
  }

  addOrderItemSample(
    buckets: RevenueBucketAccumulator[],
    alignedFrom: Date,
    granularity: AnalyticsGranularity,
    date: Date,
    sample: { grossCents: number; commissionCents: number; quantity: number; orderId: string },
  ): void {
    const index = this.bucketIndexFor(date, alignedFrom, granularity, buckets.length);
    if (index === -1) return;
    const bucket = buckets[index];
    if (!bucket) return;
    bucket.grossSalesCents += sample.grossCents;
    bucket.commissionCents += sample.commissionCents;
    bucket.itemQuantity += sample.quantity;
    bucket.orderIds.add(sample.orderId);
  }

  addRefundSample(
    buckets: RevenueBucketAccumulator[],
    alignedFrom: Date,
    granularity: AnalyticsGranularity,
    date: Date,
    amountCents: number,
  ): void {
    const index = this.bucketIndexFor(date, alignedFrom, granularity, buckets.length);
    if (index === -1) return;
    const bucket = buckets[index];
    if (!bucket) return;
    bucket.refundCents += amountCents;
  }

  /** Converts accumulators to the wire format, deriving orderCount and netSalesCents. */
  finalizeBuckets(buckets: RevenueBucketAccumulator[]): RevenueTimeBucket[] {
    return buckets.map((bucket) => ({
      bucketStart: bucket.bucketStart.toISOString(),
      bucketEnd: bucket.bucketEnd.toISOString(),
      grossSalesCents: bucket.grossSalesCents,
      netSalesCents: bucket.grossSalesCents - bucket.refundCents,
      commissionCents: bucket.commissionCents,
      refundCents: bucket.refundCents,
      orderCount: bucket.orderIds.size,
      itemQuantity: bucket.itemQuantity,
    }));
  }

  /**
   * Buckets a plain list of event timestamps into counts per bucket (e.g. failed payments per
   * day). Distinct from {@link addOrderItemSample}, which also tracks distinct order ids.
   */
  countEventsIntoBuckets(dates: Date[], period: ResolvedPeriod, granularity: AnalyticsGranularity): RevenueTimeBucket[] {
    const buckets = this.buildEmptyBuckets(period, granularity);
    const alignedFrom = this.alignToBucketStart(period.from, granularity);
    for (const date of dates) {
      const index = this.bucketIndexFor(date, alignedFrom, granularity, buckets.length);
      if (index === -1) continue;
      const bucket = buckets[index];
      if (!bucket) continue;
      bucket.itemQuantity += 1;
    }
    return this.finalizeBuckets(buckets);
  }

  /** Ranks rows by a numeric score, descending, returning the top `limit`. O(n log n), stable enough for reporting sizes. */
  topN<T>(rows: T[], scoreOf: (row: T) => number, limit: number): T[] {
    return [...rows].sort((a, b) => scoreOf(b) - scoreOf(a)).slice(0, limit);
  }

  /** Serializes rows to CSV, escaping quotes/commas/newlines per RFC 4180. */
  toCsv(columns: string[], rows: Record<string, string | number | null | undefined>[]): string {
    const escape = (value: string | number | null | undefined): string => {
      const text = value === null || value === undefined ? '' : String(value);
      if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
      return text;
    };
    const lines = [columns.map(escape).join(',')];
    for (const row of rows) {
      lines.push(columns.map((column) => escape(row[column])).join(','));
    }
    return lines.join('\n');
  }
}
