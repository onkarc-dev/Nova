import { AnalyticsAggregationService } from './analytics-aggregation.service';

describe('AnalyticsAggregationService', () => {
  let service: AnalyticsAggregationService;

  beforeEach(() => {
    service = new AnalyticsAggregationService();
  });

  describe('resolvePeriod', () => {
    it('defaults to a trailing 30-day window when no dates are given', () => {
      const period = service.resolvePeriod();
      const diffDays = (period.to.getTime() - period.from.getTime()) / (24 * 60 * 60 * 1000);
      expect(diffDays).toBeCloseTo(30, 0);
    });

    it('uses explicit from/to when provided', () => {
      const period = service.resolvePeriod('2026-01-01', '2026-01-10');
      expect(period.from.toISOString()).toBe('2026-01-01T00:00:00.000Z');
      expect(period.to.toISOString()).toBe('2026-01-10T00:00:00.000Z');
    });
  });

  describe('bucket boundaries', () => {
    it('generates one bucket per day for a 3-day window', () => {
      const period = { from: new Date('2026-06-01T00:00:00.000Z'), to: new Date('2026-06-04T00:00:00.000Z') };
      const buckets = service.buildEmptyBuckets(period, 'day');
      expect(buckets).toHaveLength(3);
      expect(buckets[0]?.bucketStart.toISOString()).toBe('2026-06-01T00:00:00.000Z');
      expect(buckets[2]?.bucketEnd.toISOString()).toBe('2026-06-04T00:00:00.000Z');
    });

    it('aligns week buckets to Monday', () => {
      // 2026-06-03 is a Wednesday.
      const aligned = service.alignToBucketStart(new Date('2026-06-03T12:00:00.000Z'), 'week');
      expect(aligned.getUTCDay()).toBe(1);
      expect(aligned.toISOString()).toBe('2026-06-01T00:00:00.000Z');
    });

    it('aligns month buckets to the 1st and advances across variable-length months', () => {
      const aligned = service.alignToBucketStart(new Date('2026-02-15T00:00:00.000Z'), 'month');
      expect(aligned.toISOString()).toBe('2026-02-01T00:00:00.000Z');
      const next = service.advanceBucket(aligned, 'month');
      expect(next.toISOString()).toBe('2026-03-01T00:00:00.000Z');
    });

    it('caps runaway bucket counts for malformed ranges', () => {
      const period = { from: new Date('2000-01-01T00:00:00.000Z'), to: new Date('2030-01-01T00:00:00.000Z') };
      const buckets = service.buildEmptyBuckets(period, 'day');
      expect(buckets.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('bucketIndexFor', () => {
    it('computes O(1) day-granularity indices directly', () => {
      const from = new Date('2026-06-01T00:00:00.000Z');
      expect(service.bucketIndexFor(new Date('2026-06-01T05:00:00.000Z'), from, 'day', 5)).toBe(0);
      expect(service.bucketIndexFor(new Date('2026-06-03T05:00:00.000Z'), from, 'day', 5)).toBe(2);
    });

    it('returns -1 for dates outside the bucket range', () => {
      const from = new Date('2026-06-01T00:00:00.000Z');
      expect(service.bucketIndexFor(new Date('2026-07-01T00:00:00.000Z'), from, 'day', 5)).toBe(-1);
      expect(service.bucketIndexFor(new Date('2026-05-01T00:00:00.000Z'), from, 'day', 5)).toBe(-1);
    });

    it('computes month-granularity indices across year boundaries', () => {
      const from = new Date('2025-11-01T00:00:00.000Z');
      expect(service.bucketIndexFor(new Date('2026-01-15T00:00:00.000Z'), from, 'month', 4)).toBe(2);
    });
  });

  describe('sample accumulation and finalization', () => {
    it('assigns order items and refunds to the correct bucket and derives net sales', () => {
      const period = { from: new Date('2026-06-01T00:00:00.000Z'), to: new Date('2026-06-03T00:00:00.000Z') };
      const buckets = service.buildEmptyBuckets(period, 'day');
      const alignedFrom = service.alignToBucketStart(period.from, 'day');

      service.addOrderItemSample(buckets, alignedFrom, 'day', new Date('2026-06-01T10:00:00.000Z'), {
        grossCents: 1000,
        commissionCents: 100,
        quantity: 2,
        orderId: 'order_1',
      });
      service.addOrderItemSample(buckets, alignedFrom, 'day', new Date('2026-06-01T14:00:00.000Z'), {
        grossCents: 500,
        commissionCents: 50,
        quantity: 1,
        orderId: 'order_1', // same order, different item — orderCount should not double count
      });
      service.addRefundSample(buckets, alignedFrom, 'day', new Date('2026-06-01T18:00:00.000Z'), 300);

      const finalized = service.finalizeBuckets(buckets);
      expect(finalized[0]).toEqual(
        expect.objectContaining({
          grossSalesCents: 1500,
          commissionCents: 150,
          refundCents: 300,
          netSalesCents: 1200,
          orderCount: 1,
          itemQuantity: 3,
        }),
      );
      expect(finalized[1]).toEqual(expect.objectContaining({ grossSalesCents: 0, orderCount: 0 }));
    });
  });

  describe('topN', () => {
    it('ranks descending by score and truncates to the limit', () => {
      const rows = [{ id: 'a', score: 5 }, { id: 'b', score: 20 }, { id: 'c', score: 10 }];
      expect(service.topN(rows, (row) => row.score, 2)).toEqual([{ id: 'b', score: 20 }, { id: 'c', score: 10 }]);
    });
  });

  describe('toCsv', () => {
    it('emits a header row and escapes commas/quotes/newlines', () => {
      const csv = service.toCsv(
        ['name', 'note'],
        [{ name: 'Widget, Deluxe', note: 'Says "hello"' }, { name: 'Plain', note: undefined }],
      );
      const lines = csv.split('\n');
      expect(lines[0]).toBe('name,note');
      expect(lines[1]).toBe('"Widget, Deluxe","Says ""hello"""');
      expect(lines[2]).toBe('Plain,');
    });
  });
});
