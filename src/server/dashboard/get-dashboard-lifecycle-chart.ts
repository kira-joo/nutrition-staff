import { BADGE_VARIANT_HEX, LIFECYCLE_BADGE_VARIANT } from "src/common/badges/badge-variants";
import { ClientLifecycle } from "src/common/enums";
import type { DashboardLifecycleChart } from "src/common/interfaces/dashboard.interface";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { withAssignedStaffWhere } from "src/server/dashboard/dashboard-scope.util";
import { DashboardQueryDto } from "src/server/dashboard/dto/dashboard-query.dto";

const LIFECYCLE_LABELS: Record<ClientLifecycle, string> = {
  [ClientLifecycle.LEAD]: "Lead",
  [ClientLifecycle.PROSPECT]: "Prospect",
  [ClientLifecycle.ACTIVE]: "Active",
  [ClientLifecycle.PAUSED]: "Paused",
  [ClientLifecycle.COMPLETED]: "Completed",
  [ClientLifecycle.LOST]: "Lost",
};

/** Derived from `LIFECYCLE_BADGE_VARIANT`, not hand-listed, so this chart's colors can never drift from the Badge the Clients list renders for the same lifecycle. */
const LIFECYCLE_COLORS: Record<ClientLifecycle, string> = Object.fromEntries(
  Object.values(ClientLifecycle).map((lifecycle) => [lifecycle, BADGE_VARIANT_HEX[LIFECYCLE_BADGE_VARIANT[lifecycle]]]),
) as Record<ClientLifecycle, string>;

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
