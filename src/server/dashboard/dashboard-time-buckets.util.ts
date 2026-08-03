import {
  addDaysInZone,
  addMonthsInZone,
  formatZonedDate,
  resolveEndOfDayInZone,
  startOfDayInZone,
  startOfMonthInZone,
  startOfWeekInZone,
} from "@kira-joo/toolkit-common";
import { DAILY_BUCKET_MAX_DAYS, DEFAULT_RANGE_DAYS, WEEKLY_BUCKET_MAX_DAYS } from "src/server/dashboard/dashboard.constants";

export type BucketGranularity = "day" | "week" | "month";

export interface DashboardDateRange {
  from: Date;
  to: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Resolves the effective range for a period-based widget, defaulting to
 * the last `DEFAULT_RANGE_DAYS` days when the caller supplies neither
 * bound. Every day boundary here resolves against the app's configured
 * timezone (`DateTimeConfig.timeZone`, set once in `instrumentation.ts`/
 * `app-provider.tsx`) — not UTC, or "today" would roll over at whatever
 * hour UTC midnight happens to land at locally.
 */
export function resolveDashboardRange(from?: string, to?: string): DashboardDateRange {
  const effectiveTo = to ? resolveEndOfDayInZone(to) : new Date();
  const effectiveFrom = from ? new Date(from) : new Date(effectiveTo.getTime() - DEFAULT_RANGE_DAYS * MS_PER_DAY);
  return { from: effectiveFrom, to: effectiveTo };
}

/** The immediately preceding, equal-length window — the honest baseline for every KPI's period-over-period comparison. */
export function resolvePreviousPeriod({ from, to }: DashboardDateRange): DashboardDateRange {
  const spanMs = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - spanMs), to: new Date(from.getTime()) };
}

/** Picks a bucket size that keeps a trend chart legible regardless of the selected range's length. */
export function resolveBucketGranularity({ from, to }: DashboardDateRange): BucketGranularity {
  const days = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY));
  if (days <= DAILY_BUCKET_MAX_DAYS) return "day";
  if (days <= WEEKLY_BUCKET_MAX_DAYS) return "week";
  return "month";
}

/** Truncates a timestamp down to the start of the bucket it falls into (in the configured timezone), for both boundary generation and grouping raw records. */
export function truncateToBucketStart(date: Date, granularity: BucketGranularity): Date {
  if (granularity === "day") return startOfDayInZone(date);
  if (granularity === "week") return startOfWeekInZone(date);
  return startOfMonthInZone(date);
}

function advanceBucket(date: Date, granularity: BucketGranularity): Date {
  if (granularity === "day") return addDaysInZone(date, 1);
  if (granularity === "week") return addDaysInZone(date, 7);
  return addMonthsInZone(date, 1);
}

/** A stable, sortable string key for a bucket start (its local calendar date) — also the `date` shown on the chart's x-axis. */
export function bucketKey(date: Date): string {
  return formatZonedDate(date);
}

/** Every bucket boundary between `from` and `to`, inclusive — the contiguous spine a sparse aggregation result gets zero-filled against. */
export function buildBucketBoundaries({ from, to }: DashboardDateRange, granularity: BucketGranularity): Date[] {
  const boundaries: Date[] = [];
  let cursor = truncateToBucketStart(from, granularity);
  const end = truncateToBucketStart(to, granularity);
  while (cursor.getTime() <= end.getTime()) {
    boundaries.push(cursor);
    cursor = advanceBucket(cursor, granularity);
  }
  return boundaries;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

/**
 * Buckets a list of raw timestamps into a gap-free, chart-ready series.
 * Zero-filled deliberately: an empty bucket is a real "nothing happened
 * that day," not a missing data point a line chart should visually skip
 * over (which would misleadingly connect two distant points).
 */
export function bucketTimestamps(timestamps: Date[], range: DashboardDateRange, granularity: BucketGranularity): ChartDataPoint[] {
  const counts = new Map<string, number>();
  for (const timestamp of timestamps) {
    const key = bucketKey(truncateToBucketStart(timestamp, granularity));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return buildBucketBoundaries(range, granularity).map((boundary) => {
    const key = bucketKey(boundary);
    return { date: key, value: counts.get(key) ?? 0 };
  });
}

/** Same as `bucketTimestamps`, but each bucket holds the running total up to and including it — for a cumulative growth line. */
export function bucketTimestampsCumulative(timestamps: Date[], range: DashboardDateRange, granularity: BucketGranularity, baselineCount: number): ChartDataPoint[] {
  const series = bucketTimestamps(timestamps, range, granularity);
  let running = baselineCount;
  return series.map((point) => {
    running += point.value;
    return { date: point.date, value: running };
  });
}
