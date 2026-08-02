import type { AuthUser } from "@kira-joo/backend-toolkit-core";
import { ClientLifecycle } from "src/common/enums";
import type { DashboardKpis, KpiMetric } from "src/common/interfaces/dashboard.interface";
import { clientMeasurementRepository } from "src/server/measurements/client-measurements.repository";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import {
  OVERDUE_FOLLOW_UPS_NEGATIVE_THRESHOLD,
  OVERDUE_FOLLOW_UPS_WARNING_THRESHOLD,
} from "src/server/dashboard/dashboard.constants";
import { resolveDashboardPermissions } from "src/server/dashboard/dashboard-permissions.util";
import { resolveScopedClientProfileIds, withAssignedStaffWhere, withScopedClientWhere } from "src/server/dashboard/dashboard-scope.util";
import {
  bucketTimestamps,
  resolveBucketGranularity,
  resolveDashboardRange,
  resolvePreviousPeriod,
  type DashboardDateRange,
} from "src/server/dashboard/dashboard-time-buckets.util";
import { DashboardQueryDto } from "src/server/dashboard/dto/dashboard-query.dto";
import { nutritionCalculationRepository } from "src/server/nutrition-calculations/nutrition-calculations.repository";

const ACTIVE_OR_FURTHER = [ClientLifecycle.ACTIVE, ClientLifecycle.PAUSED, ClientLifecycle.COMPLETED];

function rangeWhere(field: string, range: DashboardDateRange): Record<string, unknown> {
  return { [field]: { $gte: range.from, $lte: range.to } };
}

/**
 * A live snapshot (e.g. "clients currently active", "follow-ups due
 * today") has no honest history — `nextFollowUpAt`/`lifecycle` are live,
 * overwritable fields, not an append-only event log, so a past "how many
 * were active on day X" can't be reconstructed. These metrics report only
 * their current value; the global date-range filter never changes them.
 */
function snapshotMetric(value: number, state: KpiMetric["state"] = "neutral"): KpiMetric {
  return { value, state };
}

async function periodMetric(
  countInRange: () => Promise<number>,
  countInPreviousRange: () => Promise<number>,
  timestampsInRange: () => Promise<Date[]>,
  range: DashboardDateRange,
  granularity: ReturnType<typeof resolveBucketGranularity>
): Promise<KpiMetric> {
  const [value, previousPeriodValue, timestamps] = await Promise.all([countInRange(), countInPreviousRange(), timestampsInRange()]);
  return {
    value,
    previousPeriodValue,
    trend: bucketTimestamps(timestamps, range, granularity),
    state: "neutral",
  };
}

function resolveOverdueState(count: number): KpiMetric["state"] {
  if (count === 0) return "positive";
  if (count >= OVERDUE_FOLLOW_UPS_NEGATIVE_THRESHOLD) return "negative";
  if (count >= OVERDUE_FOLLOW_UPS_WARNING_THRESHOLD) return "warning";
  return "neutral";
}

export async function getDashboardKpis(query: DashboardQueryDto, user: AuthUser): Promise<DashboardKpis> {
  const { assignedToUserId } = query;
  const range = resolveDashboardRange(query.from, query.to);
  const previousRange = resolvePreviousPeriod(range);
  const granularity = resolveBucketGranularity(range);
  const permissions = resolveDashboardPermissions(user);

  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const [totalClients, activeClients, todaysFollowUpsCount, overdueFollowUpsCount, newLeads, newClients] = await Promise.all([
    clientProfileRepository.count({ where: withAssignedStaffWhere({}, assignedToUserId) }),
    clientProfileRepository.count({ where: withAssignedStaffWhere({ lifecycle: ClientLifecycle.ACTIVE }, assignedToUserId) }),
    clientProfileRepository.count({
      where: withAssignedStaffWhere({ nextFollowUpAt: { $gte: startOfToday, $lt: startOfTomorrow } }, assignedToUserId),
    }),
    clientProfileRepository.count({
      where: withAssignedStaffWhere({ nextFollowUpAt: { $lt: now } }, assignedToUserId),
    }),
    periodMetric(
      () => clientProfileRepository.count({ where: withAssignedStaffWhere(rangeWhere("createdAt", range), assignedToUserId) }),
      () => clientProfileRepository.count({ where: withAssignedStaffWhere(rangeWhere("createdAt", previousRange), assignedToUserId) }),
      async () => {
        const rows = await clientProfileRepository.findAll({
          where: withAssignedStaffWhere(rangeWhere("createdAt", range), assignedToUserId),
          select: { createdAt: true },
        });
        return rows.map((row) => new Date((row as unknown as { createdAt: string | Date }).createdAt));
      },
      range,
      granularity
    ),
    periodMetric(
      () =>
        clientProfileRepository.count({
          where: withAssignedStaffWhere({ ...rangeWhere("createdAt", range), lifecycle: { $in: ACTIVE_OR_FURTHER } }, assignedToUserId),
        }),
      () =>
        clientProfileRepository.count({
          where: withAssignedStaffWhere({ ...rangeWhere("createdAt", previousRange), lifecycle: { $in: ACTIVE_OR_FURTHER } }, assignedToUserId),
        }),
      async () => {
        const rows = await clientProfileRepository.findAll({
          where: withAssignedStaffWhere({ ...rangeWhere("createdAt", range), lifecycle: { $in: ACTIVE_OR_FURTHER } }, assignedToUserId),
          select: { createdAt: true },
        });
        return rows.map((row) => new Date((row as unknown as { createdAt: string | Date }).createdAt));
      },
      range,
      granularity
    ),
  ]);

  const kpis: DashboardKpis = {
    totalClients: snapshotMetric(totalClients),
    activeClients: snapshotMetric(activeClients),
    todaysFollowUps: snapshotMetric(todaysFollowUpsCount),
    overdueFollowUps: snapshotMetric(overdueFollowUpsCount, resolveOverdueState(overdueFollowUpsCount)),
    newLeads,
    newClients,
  };

  const scopedClientProfileIds =
    permissions.canViewMeasurements || permissions.canViewCalculations
      ? await resolveScopedClientProfileIds(assignedToUserId)
      : undefined;

  if (permissions.canViewMeasurements) {
    kpis.measurementsRecorded = await periodMetric(
      () => clientMeasurementRepository.count({ where: withScopedClientWhere(rangeWhere("measuredAt", range), scopedClientProfileIds) }),
      () => clientMeasurementRepository.count({ where: withScopedClientWhere(rangeWhere("measuredAt", previousRange), scopedClientProfileIds) }),
      async () => {
        const rows = await clientMeasurementRepository.findAll({
          where: withScopedClientWhere(rangeWhere("measuredAt", range), scopedClientProfileIds),
          select: { measuredAt: true },
        });
        return rows.map((row) => new Date((row as unknown as { measuredAt: string | Date }).measuredAt));
      },
      range,
      granularity
    );
  }

  if (permissions.canViewCalculations) {
    kpis.nutritionCalculationsSaved = await periodMetric(
      () => nutritionCalculationRepository.count({ where: withScopedClientWhere(rangeWhere("calculatedAt", range), scopedClientProfileIds) }),
      () => nutritionCalculationRepository.count({ where: withScopedClientWhere(rangeWhere("calculatedAt", previousRange), scopedClientProfileIds) }),
      async () => {
        const rows = await nutritionCalculationRepository.findAll({
          where: withScopedClientWhere(rangeWhere("calculatedAt", range), scopedClientProfileIds),
          select: { calculatedAt: true },
        });
        return rows.map((row) => new Date((row as unknown as { calculatedAt: string | Date }).calculatedAt));
      },
      range,
      granularity
    );
  }

  return kpis;
}
