import { ClientLifecycle } from "src/common/enums";
import type { DashboardLifecycleChart } from "src/common/interfaces/dashboard.interface";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { withAssignedStaffWhere } from "src/server/dashboard/dashboard-scope.util";
import { DashboardQueryDto } from "src/server/dashboard/dto/dashboard-query.dto";

/** Matches the existing `LIFECYCLE_BADGE_VARIANT` color mapping used on the Clients list, so the same lifecycle always reads as the same color everywhere in the app. */
const LIFECYCLE_LABELS: Record<ClientLifecycle, string> = {
  [ClientLifecycle.LEAD]: "Lead",
  [ClientLifecycle.PROSPECT]: "Prospect",
  [ClientLifecycle.ACTIVE]: "Active",
  [ClientLifecycle.PAUSED]: "Paused",
  [ClientLifecycle.COMPLETED]: "Completed",
  [ClientLifecycle.LOST]: "Lost",
};
const LIFECYCLE_COLORS: Record<ClientLifecycle, string> = {
  [ClientLifecycle.LEAD]: "#94a3b8",
  [ClientLifecycle.PROSPECT]: "#94a3b8",
  [ClientLifecycle.ACTIVE]: "#10b981",
  [ClientLifecycle.PAUSED]: "#f59e0b",
  [ClientLifecycle.COMPLETED]: "#10b981",
  [ClientLifecycle.LOST]: "#ef4444",
};
const FUNNEL_STAGES = [ClientLifecycle.LEAD, ClientLifecycle.PROSPECT, ClientLifecycle.ACTIVE, ClientLifecycle.COMPLETED];

/**
 * Always a current-state snapshot — never affected by the dashboard's
 * global date-range filter, only by the assigned-staff filter.
 * `lifecycle` is a live, overwritable field with no transition history
 * stored anywhere queryable, so neither the distribution nor the funnel
 * can honestly represent "as of a past date" or a true historical
 * conversion rate. The funnel is exactly the ordered subset of this same
 * snapshot (Lead → Prospect → Active → Completed) — Paused/Lost are shown
 * only in the distribution, since they don't belong on an ordered pipeline.
 */
export async function getDashboardLifecycleChart(query: DashboardQueryDto): Promise<DashboardLifecycleChart> {
  const { assignedToUserId } = query;

  const rows = await clientProfileRepository.findAll({
    where: withAssignedStaffWhere({}, assignedToUserId),
    select: { lifecycle: true },
  });

  const counts = new Map<ClientLifecycle, number>();
  for (const row of rows) {
    const lifecycle = (row as unknown as { lifecycle: ClientLifecycle }).lifecycle;
    counts.set(lifecycle, (counts.get(lifecycle) ?? 0) + 1);
  }

  const distribution = Object.values(ClientLifecycle).map((lifecycle) => ({
    label: LIFECYCLE_LABELS[lifecycle],
    value: counts.get(lifecycle) ?? 0,
    color: LIFECYCLE_COLORS[lifecycle],
  }));

  const funnel = FUNNEL_STAGES.map((lifecycle) => ({
    label: LIFECYCLE_LABELS[lifecycle],
    value: counts.get(lifecycle) ?? 0,
    color: LIFECYCLE_COLORS[lifecycle],
  }));

  return { distribution, funnel };
}
