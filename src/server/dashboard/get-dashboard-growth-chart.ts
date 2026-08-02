import type { DashboardGrowthChart } from "src/common/interfaces/dashboard.interface";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { withAssignedStaffWhere } from "src/server/dashboard/dashboard-scope.util";
import { bucketTimestampsCumulative, resolveBucketGranularity, resolveDashboardRange } from "src/server/dashboard/dashboard-time-buckets.util";
import { DashboardQueryDto } from "src/server/dashboard/dto/dashboard-query.dto";

/**
 * One clearly-labeled cumulative line ("Cumulative Clients") — deliberately
 * not overlaid with per-period additions in the same chart (that pairing is
 * already covered honestly by the New Leads KPI's own sparkline), per the
 * instruction not to combine cumulative totals and period additions
 * ambiguously in one visualization.
 */
export async function getDashboardGrowthChart(query: DashboardQueryDto): Promise<DashboardGrowthChart> {
  const { assignedToUserId } = query;
  const range = resolveDashboardRange(query.from, query.to);
  const granularity = resolveBucketGranularity(range);

  const [baselineCount, rowsInRange] = await Promise.all([
    clientProfileRepository.count({ where: withAssignedStaffWhere({ createdAt: { $lt: range.from } }, assignedToUserId) }),
    clientProfileRepository.findAll({
      where: withAssignedStaffWhere({ createdAt: { $gte: range.from, $lte: range.to } }, assignedToUserId),
      select: { createdAt: true },
    }),
  ]);

  const timestamps = rowsInRange.map((row) => new Date((row as unknown as { createdAt: string | Date }).createdAt));
  return bucketTimestampsCumulative(timestamps, range, granularity, baselineCount);
}
