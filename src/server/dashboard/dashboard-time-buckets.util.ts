import { DAILY_BUCKET_MAX_DAYS, DEFAULT_RANGE_DAYS, WEEKLY_BUCKET_MAX_DAYS } from "src/server/dashboard/dashboard.constants";

export type BucketGranularity = "day" | "week" | "month";

export interface DashboardDateRange {
  from: Date;
  to: Date;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A bare `YYYY-MM-DD` string (exactly what the dashboard filter bar's date
 * presets send for `to`) parses as that day's midnight, not "end of that
 * day" — left as-is, a `to` of "today" would exclude every event that
 * happened today after midnight, which is effectively all of them.
 * Extended to the last instant of that day so "to: today" actually means
 * through today. A full ISO datetime (anything with a time component) is
 * trusted as an exact instant and left untouched.
 */
function resolveEndOfDay(to: string): Date {
  if (!DATE_ONLY_PATTERN.test(to)) return new Date(to);
  const date = new Date(to);
  return new Date(date.getTime() + MS_PER_DAY - 1);
}

/** Resolves the effective range for a period-based widget, defaulting to the last `DEFAULT_RANGE_DAYS` days when the caller supplies neither bound. */
export function resolveDashboardRange(from?: string, to?: string): DashboardDateRange {
  const effectiveTo = to ? resolveEndOfDay(to) : new Date();
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

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function startOfUtcWeek(date: Date): Date {
  const day = startOfUtcDay(date);
  const weekday = day.getUTCDay(); // 0 = Sunday .. 6 = Saturday
  const diffToMonday = weekday === 0 ? -6 : 1 - weekday;
  day.setUTCDate(day.getUTCDate() + diffToMonday);
  return day;
}

function startOfUtcMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

/** Truncates a timestamp down to the start of the bucket it falls into, for both boundary generation and grouping raw records. */
export function truncateToBucketStart(date: Date, granularity: BucketGranularity): Date {
  if (granularity === "day") return startOfUtcDay(date);
  if (granularity === "week") return startOfUtcWeek(date);
  return startOfUtcMonth(date);
}

function advanceBucket(date: Date, granularity: BucketGranularity): Date {
  const next = new Date(date);
  if (granularity === "day") next.setUTCDate(next.getUTCDate() + 1);
  else if (granularity === "week") next.setUTCDate(next.getUTCDate() + 7);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

/** A stable, sortable string key for a bucket start — also the `date` shown on the chart's x-axis. */
export function bucketKey(date: Date): string {
  return date.toISOString().slice(0, 10);
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
