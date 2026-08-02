import { SortOrder } from "@kira-joo/toolkit-common";
import type { Client } from "src/common/interfaces/client.interface";
import type { DashboardFollowUpRow, DashboardFollowUps } from "src/common/interfaces/dashboard.interface";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { withAssignedStaffWhere } from "src/server/dashboard/dashboard-scope.util";
import { DashboardQueryDto } from "src/server/dashboard/dto/dashboard-query.dto";

function toRow(client: Client): DashboardFollowUpRow {
  return {
    clientProfileId: String(client._id),
    clientName: client.userId.name,
    clientPhone: client.userId.phone,
    lifecycle: client.lifecycle,
    assignedStaffName: client.assignedToUserId?.name,
    nextFollowUpAt: client.nextFollowUpAt as string,
    lastContactedAt: client.lastContactedAt,
  };
}

/**
 * Always "right now" — never affected by the dashboard's global date-range
 * filter, only by the assigned-staff filter. A follow-up date is a live,
 * single value (not an append-only log), so "today"/"overdue" only ever
 * mean the current moment.
 */
export async function getDashboardFollowUps(query: DashboardQueryDto): Promise<DashboardFollowUps> {
  const { assignedToUserId } = query;
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  const [today, overdue] = await Promise.all([
    clientProfileRepository.findAll({
      where: withAssignedStaffWhere({ nextFollowUpAt: { $gte: startOfToday, $lt: startOfTomorrow } }, assignedToUserId),
      relations: ["userId", "assignedToUserId"],
      sort: { field: "nextFollowUpAt", order: SortOrder.ASC },
    }),
    clientProfileRepository.findAll({
      where: withAssignedStaffWhere({ nextFollowUpAt: { $lt: now } }, assignedToUserId),
      relations: ["userId", "assignedToUserId"],
      sort: { field: "nextFollowUpAt", order: SortOrder.ASC },
    }),
  ]);

  return {
    today: (today as unknown as Client[]).map(toRow),
    overdue: (overdue as unknown as Client[]).map(toRow),
  };
}
