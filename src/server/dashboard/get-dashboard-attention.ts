import type { AuthUser } from "@kira-joo/backend-toolkit-core";
import { ClientLifecycle } from "src/common/enums";
import type { Client } from "src/common/interfaces/client.interface";
import type { DashboardAttention, DashboardAttentionItem } from "src/common/interfaces/dashboard.interface";
import { calculateProfileCompleteness } from "src/common/utils/profile-completeness";
import { clientMeasurementRepository } from "src/server/measurements/client-measurements.repository";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import {
  INCOMPLETE_PROFILE_MAX_RATIO,
  MEASUREMENT_WITHOUT_CALCULATION_GRACE_DAYS,
  NOT_CONTACTED_RECENTLY_DAYS,
  NO_ASSESSMENT_GRACE_DAYS,
  STALE_MEASUREMENT_DAYS,
} from "src/server/dashboard/dashboard.constants";
import { resolveDashboardPermissions } from "src/server/dashboard/dashboard-permissions.util";
import { resolveScopedClientProfileIds, withAssignedStaffWhere, withScopedClientWhere } from "src/server/dashboard/dashboard-scope.util";
import { DashboardQueryDto } from "src/server/dashboard/dto/dashboard-query.dto";
import { nutritionAssessmentRepository } from "src/server/assessments/nutrition-assessments.repository";
import { nutritionCalculationRepository } from "src/server/nutrition-calculations/nutrition-calculations.repository";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
function daysAgo(days: number): Date {
  return new Date(Date.now() - days * MS_PER_DAY);
}

async function getActiveClients(assignedToUserId?: string): Promise<Client[]> {
  return (await clientProfileRepository.findAll({
    where: withAssignedStaffWhere({ lifecycle: ClientLifecycle.ACTIVE }, assignedToUserId),
    relations: ["userId"],
  })) as unknown as Client[];
}

/**
 * A client created yesterday with no measurement yet isn't "stale" — they
 * simply haven't had time for one. Every check below only flags a client
 * once they've exceeded the relevant threshold since either their last
 * relevant event, or (if that event never happened) their own creation
 * date — never on day one.
 */
export async function getDashboardAttention(query: DashboardQueryDto, user: AuthUser): Promise<DashboardAttention> {
  const { assignedToUserId } = query;
  const permissions = resolveDashboardPermissions(user);

  const attention: DashboardAttention = {
    notContactedRecently: [],
    noRecentMeasurement: [],
    noAssessment: [],
    incompleteProfile: [],
    measurementWithoutCalculation: [],
  };

  const [activeClients, nonTerminalClients] = await Promise.all([
    getActiveClients(assignedToUserId),
    clientProfileRepository.findAll({
      where: withAssignedStaffWhere({ lifecycle: { $nin: [ClientLifecycle.COMPLETED, ClientLifecycle.LOST] } }, assignedToUserId),
      relations: ["userId"],
    }) as unknown as Promise<Client[]>,
  ]);

  const contactThreshold = daysAgo(NOT_CONTACTED_RECENTLY_DAYS);
  attention.notContactedRecently = activeClients
    .filter((client) => {
      const baseline = client.lastContactedAt ? new Date(client.lastContactedAt) : new Date(client.createdAt);
      return baseline < contactThreshold;
    })
    .map((client) => toAttentionItem(client, "not_contacted_recently", client.lastContactedAt ? `Last contacted ${client.lastContactedAt}` : "Never contacted"));

  attention.incompleteProfile = nonTerminalClients
    .filter((client) => {
      const completeness = calculateProfileCompleteness(client);
      return completeness.filled / completeness.total < INCOMPLETE_PROFILE_MAX_RATIO;
    })
    .map((client) => {
      const completeness = calculateProfileCompleteness(client);
      return toAttentionItem(client, "incomplete_profile", `${completeness.filled}/${completeness.total} profile fields filled`);
    });

  if (permissions.canViewMeasurements) {
    const activeClientIds = activeClients.map((client) => client._id);
    const measurements = await clientMeasurementRepository.findAll({
      where: { clientProfileId: { $in: activeClientIds } },
      select: { clientProfileId: true, measuredAt: true },
    });

    const latestMeasurementByClient = new Map<string, Date>();
    for (const measurement of measurements as unknown as { clientProfileId: string; measuredAt: string }[]) {
      const key = String(measurement.clientProfileId);
      const measuredAt = new Date(measurement.measuredAt);
      const current = latestMeasurementByClient.get(key);
      if (!current || measuredAt > current) latestMeasurementByClient.set(key, measuredAt);
    }

    const measurementThreshold = daysAgo(STALE_MEASUREMENT_DAYS);
    attention.noRecentMeasurement = activeClients
      .filter((client) => {
        const latest = latestMeasurementByClient.get(String(client._id));
        const baseline = latest ?? new Date(client.createdAt);
        return baseline < measurementThreshold;
      })
      .map((client) => {
        const latest = latestMeasurementByClient.get(String(client._id));
        return toAttentionItem(client, "no_recent_measurement", latest ? `Last measured ${latest.toISOString()}` : "No measurement recorded yet");
      });
  }

  if (permissions.canViewAssessments) {
    const activeClientIds = activeClients.map((client) => client._id);
    const assessments = await nutritionAssessmentRepository.findAll({
      where: { clientProfileId: { $in: activeClientIds } },
      select: { clientProfileId: true },
    });
    const hasAssessment = new Set((assessments as unknown as { clientProfileId: string }[]).map((row) => String(row.clientProfileId)));

    const assessmentThreshold = daysAgo(NO_ASSESSMENT_GRACE_DAYS);
    attention.noAssessment = activeClients
      .filter((client) => !hasAssessment.has(String(client._id)) && new Date(client.createdAt) < assessmentThreshold)
      .map((client) => toAttentionItem(client, "no_assessment", "No assessment on file"));
  }

  if (permissions.canViewMeasurements && permissions.canViewCalculations) {
    const scopedClientProfileIds = await resolveScopedClientProfileIds(assignedToUserId);
    const cutoff = daysAgo(MEASUREMENT_WITHOUT_CALCULATION_GRACE_DAYS);
    const staleMeasurements = await clientMeasurementRepository.findAll({
      where: withScopedClientWhere({ measuredAt: { $lte: cutoff } }, scopedClientProfileIds),
      select: { clientProfileId: true, measuredAt: true },
    });

    const measurementIds = (staleMeasurements as unknown as { _id: string }[]).map((row) => String(row._id));
    const calculationsWithMeasurement = await nutritionCalculationRepository.findAll({
      where: { measurementId: { $in: measurementIds } },
      select: { measurementId: true },
    });
    const hasCalculation = new Set(
      (calculationsWithMeasurement as unknown as { measurementId?: string }[]).map((row) => String(row.measurementId))
    );

    const flaggedMeasurements = (staleMeasurements as unknown as { _id: string; clientProfileId: string; measuredAt: string }[]).filter(
      (measurement) => !hasCalculation.has(String(measurement._id))
    );

    const flaggedClientIds = [...new Set(flaggedMeasurements.map((measurement) => String(measurement.clientProfileId)))];
    const flaggedClients =
      flaggedClientIds.length > 0
        ? ((await clientProfileRepository.findAll({ where: { _id: { $in: flaggedClientIds } }, relations: ["userId"] })) as unknown as Client[])
        : [];
    const clientById = new Map(flaggedClients.map((client) => [String(client._id), client]));

    attention.measurementWithoutCalculation = flaggedMeasurements
      .map((measurement) => {
        const client = clientById.get(String(measurement.clientProfileId));
        if (!client) return null;
        return toAttentionItem(client, "measurement_without_calculation", `Measured ${measurement.measuredAt}, no calculation since`);
      })
      .filter((item): item is DashboardAttentionItem => item !== null);
  }

  return attention;
}

function toAttentionItem(client: Client, reason: DashboardAttentionItem["reason"], detail: string): DashboardAttentionItem {
  return { reason, clientProfileId: String(client._id), clientName: client.userId.name, detail };
}
