import { SortOrder } from "@kira-joo/toolkit-common";
import type { AuthUser } from "@kira-joo/backend-toolkit-core";
import type { Client } from "src/common/interfaces/client.interface";
import type { DashboardActivityEntry } from "src/common/interfaces/dashboard.interface";
import { clientInteractionRepository } from "src/server/interactions/client-interactions.repository";
import { clientMeasurementRepository } from "src/server/measurements/client-measurements.repository";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { RECENT_ACTIVITY_LIMIT } from "src/server/dashboard/dashboard.constants";
import { resolveDashboardPermissions } from "src/server/dashboard/dashboard-permissions.util";
import { resolveScopedClientProfileIds, withAssignedStaffWhere, withScopedClientWhere } from "src/server/dashboard/dashboard-scope.util";
import { resolveDashboardRange } from "src/server/dashboard/dashboard-time-buckets.util";
import { DashboardQueryDto } from "src/server/dashboard/dto/dashboard-query.dto";
import { nutritionAssessmentRepository } from "src/server/assessments/nutrition-assessments.repository";
import { nutritionCalculationRepository } from "src/server/nutrition-calculations/nutrition-calculations.repository";

interface RawEntry {
  clientProfileId: string;
  happenedAt: Date;
  build: (clientName: string) => DashboardActivityEntry;
}

/**
 * A read-side merge of the collections that already exist — deliberately
 * not a new denormalized activity/history collection. Each source is
 * queried independently (capped, sorted, within the selected period and
 * staff scope), tagged, then merged and re-sorted here in application
 * code. Assessment/calculation entries are never fetched at all — not
 * merely filtered out afterward — when the caller lacks the corresponding
 * read permission.
 */
export async function getDashboardActivity(query: DashboardQueryDto, user: AuthUser): Promise<DashboardActivityEntry[]> {
  const { assignedToUserId } = query;
  const range = resolveDashboardRange(query.from, query.to);
  const permissions = resolveDashboardPermissions(user);
  const dateWhere = { $gte: range.from, $lte: range.to };

  const scopedClientProfileIds = await resolveScopedClientProfileIds(assignedToUserId);

  const [createdClients, interactions, measurements, assessments, calculations] = await Promise.all([
    clientProfileRepository.findAll({
      where: withAssignedStaffWhere({ createdAt: dateWhere }, assignedToUserId),
      relations: ["userId"],
      sort: { field: "createdAt", order: SortOrder.DESC },
      take: RECENT_ACTIVITY_LIMIT,
    }),
    clientInteractionRepository.findAll({
      where: withScopedClientWhere({ happenedAt: dateWhere }, scopedClientProfileIds),
      sort: { field: "happenedAt", order: SortOrder.DESC },
      take: RECENT_ACTIVITY_LIMIT,
    }),
    permissions.canViewMeasurements
      ? clientMeasurementRepository.findAll({
          where: withScopedClientWhere({ measuredAt: dateWhere }, scopedClientProfileIds),
          sort: { field: "measuredAt", order: SortOrder.DESC },
          take: RECENT_ACTIVITY_LIMIT,
        })
      : Promise.resolve([]),
    permissions.canViewAssessments
      ? nutritionAssessmentRepository.findAll({
          where: withScopedClientWhere({ assessedAt: dateWhere }, scopedClientProfileIds),
          sort: { field: "assessedAt", order: SortOrder.DESC },
          take: RECENT_ACTIVITY_LIMIT,
        })
      : Promise.resolve([]),
    permissions.canViewCalculations
      ? nutritionCalculationRepository.findAll({
          where: withScopedClientWhere({ calculatedAt: dateWhere }, scopedClientProfileIds),
          sort: { field: "calculatedAt", order: SortOrder.DESC },
          take: RECENT_ACTIVITY_LIMIT,
        })
      : Promise.resolve([]),
  ]);

  const rawEntries: RawEntry[] = [];

  for (const client of createdClients as unknown as Client[]) {
    rawEntries.push({
      clientProfileId: String(client._id),
      happenedAt: new Date(client.createdAt),
      build: (clientName) => ({ type: "client_created", happenedAt: client.createdAt, clientProfileId: String(client._id), clientName, summary: "Added as a new client" }),
    });
  }
  for (const interaction of interactions as unknown as { _id: string; clientProfileId: string; happenedAt: string; summary: string }[]) {
    rawEntries.push({
      clientProfileId: String(interaction.clientProfileId),
      happenedAt: new Date(interaction.happenedAt),
      build: (clientName) => ({ type: "interaction", happenedAt: interaction.happenedAt, clientProfileId: String(interaction.clientProfileId), clientName, summary: interaction.summary }),
    });
  }
  for (const measurement of measurements as unknown as { clientProfileId: string; measuredAt: string }[]) {
    rawEntries.push({
      clientProfileId: String(measurement.clientProfileId),
      happenedAt: new Date(measurement.measuredAt),
      build: (clientName) => ({ type: "measurement", happenedAt: measurement.measuredAt, clientProfileId: String(measurement.clientProfileId), clientName, summary: "Measurement recorded" }),
    });
  }
  for (const assessment of assessments as unknown as { clientProfileId: string; assessedAt: string }[]) {
    rawEntries.push({
      clientProfileId: String(assessment.clientProfileId),
      happenedAt: new Date(assessment.assessedAt),
      build: (clientName) => ({ type: "assessment", happenedAt: assessment.assessedAt, clientProfileId: String(assessment.clientProfileId), clientName, summary: "Assessment completed" }),
    });
  }
  for (const calculation of calculations as unknown as { clientProfileId: string; calculatedAt: string }[]) {
    rawEntries.push({
      clientProfileId: String(calculation.clientProfileId),
      happenedAt: new Date(calculation.calculatedAt),
      build: (clientName) => ({ type: "calculation", happenedAt: calculation.calculatedAt, clientProfileId: String(calculation.clientProfileId), clientName, summary: "Nutrition calculation saved" }),
    });
  }

  rawEntries.sort((a, b) => b.happenedAt.getTime() - a.happenedAt.getTime());
  const topEntries = rawEntries.slice(0, RECENT_ACTIVITY_LIMIT);

  const nameByClientProfileId = new Map<string, string>();
  for (const client of createdClients as unknown as Client[]) {
    nameByClientProfileId.set(String(client._id), client.userId.name);
  }
  const missingIds = [...new Set(topEntries.map((entry) => entry.clientProfileId))].filter((id) => !nameByClientProfileId.has(id));
  if (missingIds.length > 0) {
    const missingClients = (await clientProfileRepository.findAll({ where: { _id: { $in: missingIds } }, relations: ["userId"] })) as unknown as Client[];
    for (const client of missingClients) {
      nameByClientProfileId.set(String(client._id), client.userId.name);
    }
  }

  return topEntries.map((entry) => entry.build(nameByClientProfileId.get(entry.clientProfileId) ?? "Unknown client"));
}
