import { ClientSource } from "src/common/enums";
import type { DashboardSourceChart } from "src/common/interfaces/dashboard.interface";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { withAssignedStaffWhere } from "src/server/dashboard/dashboard-scope.util";
import { resolveDashboardRange } from "src/server/dashboard/dashboard-time-buckets.util";
import { DashboardQueryDto } from "src/server/dashboard/dto/dashboard-query.dto";

const SOURCE_LABELS: Record<ClientSource, string> = {
  [ClientSource.FACEBOOK]: "Facebook",
  [ClientSource.INSTAGRAM]: "Instagram",
  [ClientSource.WHATSAPP]: "WhatsApp",
  [ClientSource.WEBSITE]: "Website",
  [ClientSource.REFERRAL]: "Referral",
  [ClientSource.WALK_IN]: "Walk-in",
  [ClientSource.OTHER]: "Other",
};
const UNKNOWN_SOURCE_LABEL = "Unknown";

/** Where clients created within the selected period came from — period-based, per the global filter's scope. */
export async function getDashboardSourceChart(query: DashboardQueryDto): Promise<DashboardSourceChart> {
  const { assignedToUserId } = query;
  const range = resolveDashboardRange(query.from, query.to);

  const rows = await clientProfileRepository.findAll({
    where: withAssignedStaffWhere({ createdAt: { $gte: range.from, $lte: range.to } }, assignedToUserId),
    select: { source: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const source = (row as unknown as { source?: ClientSource }).source;
    const label = source ? SOURCE_LABELS[source] : UNKNOWN_SOURCE_LABEL;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}
