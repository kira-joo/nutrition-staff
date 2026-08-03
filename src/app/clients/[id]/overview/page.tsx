"use client";

import { SortOrder, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, DateText, DeltaIndicator, InfoRow, Modal, PageSection, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import {
  Activity,
  CalendarClock,
  Contact,
  FlaskConical,
  NotebookPen,
  Repeat,
  Ruler,
} from "lucide-react";
import { useState } from "react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ClientLifecycleForm } from "src/common/forms/client-lifecycle-form";
import { ScheduleFollowUpForm } from "src/common/forms/schedule-follow-up-form";
import { calculateProfileCompleteness } from "src/common/utils/profile-completeness";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getClientByIdEndpoint } from "../../../../../api/client.endpoints";
import { getClientMeasurementsEndpoint } from "../../../../../api/client-measurement.endpoints";
import { getNutritionAssessmentsEndpoint } from "../../../../../api/nutrition-assessment.endpoints";
import { getNutritionCalculationsEndpoint } from "../../../../../api/nutrition-calculation.endpoints";

type DialogKind = "lifecycle" | "followUp" | null;

/** A disabled quick action always says why — a permission gap should never look like a silent bug. */
const NO_PERMISSION_TITLE = "You don't have permission to do this";

export default function ClientOverviewPage({ params }: { params: { id: string } }) {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [openDialog, setOpenDialog] = useState<DialogKind>(null);

  const clientQuery = useRequesterQuery({
    endpoint: getClientByIdEndpoint,
    options: { params: { id: params.id } },
  });

  const measurementsQuery = useRequesterQuery({
    endpoint: getClientMeasurementsEndpoint,
    options: {
      query: { clientProfileId: params.id, sortBy: "measuredAt", sortOrder: SortOrder.DESC, limit: 2, page: 1 },
    },
  });
  const [latestMeasurement, previousMeasurement] = measurementsQuery.data?.data ?? [];

  const assessmentsQuery = useRequesterQuery({
    endpoint: getNutritionAssessmentsEndpoint,
    options: {
      query: { clientProfileId: params.id, sortBy: "assessedAt", sortOrder: SortOrder.DESC, limit: 1, page: 1 },
    },
  });
  const latestAssessment = assessmentsQuery.data?.data[0];

  const calculationsQuery = useRequesterQuery({
    endpoint: getNutritionCalculationsEndpoint,
    options: {
      query: { clientProfileId: params.id, sortBy: "calculatedAt", sortOrder: SortOrder.DESC, limit: 1, page: 1 },
    },
  });
  const latestCalculation = calculationsQuery.data?.data[0];

  const refetchAll = () => {
    clientQuery.refetch();
    measurementsQuery.refetch();
    assessmentsQuery.refetch();
    calculationsQuery.refetch();
  };

  return (
    <QueryState query={clientQuery} entityName="Client">
      {(client) => {
        const completeness = calculateProfileCompleteness({ ...client, hasMeasurement: Boolean(latestMeasurement) });
        const isFollowUpOverdue = Boolean(client.nextFollowUpAt && new Date(client.nextFollowUpAt) < new Date());

        return (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              <CustomButton
                variant="outline"
                leftIcon={Repeat}
                onClick={() => setOpenDialog("lifecycle")}
                disabled={!can(AppPermission.CLIENT.UPDATE)}
                title={!can(AppPermission.CLIENT.UPDATE) ? NO_PERMISSION_TITLE : undefined}
              >
                Change lifecycle
              </CustomButton>
              <CustomButton
                variant="outline"
                onClick={() => navigate(AppRoute.clientProfile, { id: params.id })}
                disabled={!can(AppPermission.CLIENT.UPDATE)}
                title={!can(AppPermission.CLIENT.UPDATE) ? NO_PERMISSION_TITLE : undefined}
              >
                Edit profile
              </CustomButton>
              <CustomButton
                variant="outline"
                leftIcon={CalendarClock}
                onClick={() => setOpenDialog("followUp")}
                disabled={!can(AppPermission.CLIENT.UPDATE)}
                title={!can(AppPermission.CLIENT.UPDATE) ? NO_PERMISSION_TITLE : undefined}
              >
                Schedule follow-up
              </CustomButton>
              <CustomButton
                variant="outline"
                leftIcon={Ruler}
                onClick={() => navigate(AppRoute.clientMeasurementCreate, { id: params.id })}
                disabled={!can(AppPermission.CLIENT_MEASUREMENT.CREATE)}
                title={!can(AppPermission.CLIENT_MEASUREMENT.CREATE) ? NO_PERMISSION_TITLE : undefined}
              >
                Add measurement
              </CustomButton>
              <CustomButton
                variant="outline"
                leftIcon={NotebookPen}
                onClick={() => navigate(AppRoute.clientAssessmentCreate, { id: params.id })}
                disabled={!can(AppPermission.NUTRITION_ASSESSMENT.CREATE)}
                title={!can(AppPermission.NUTRITION_ASSESSMENT.CREATE) ? NO_PERMISSION_TITLE : undefined}
              >
                Create assessment
              </CustomButton>
              <CustomButton
                variant="outline"
                leftIcon={FlaskConical}
                onClick={() => navigate(AppRoute.clientCalculationNew, { id: params.id })}
                disabled={!can(AppPermission.NUTRITION_CALCULATION.CREATE)}
                title={!can(AppPermission.NUTRITION_CALCULATION.CREATE) ? NO_PERMISSION_TITLE : undefined}
              >
                Run calculator
              </CustomButton>
              <CustomButton
                variant="outline"
                leftIcon={CalendarClock}
                onClick={() => navigate(AppRoute.clientInteractions, { id: params.id })}
                disabled={!can(AppPermission.CLIENT_INTERACTION.CREATE)}
                title={!can(AppPermission.CLIENT_INTERACTION.CREATE) ? NO_PERMISSION_TITLE : undefined}
              >
                Add interaction
              </CustomButton>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <PageSection icon={Contact} title="Contact & CRM">
                <div className="flex flex-col gap-3">
                  <InfoRow label="Phone" value={client.userId.phone ?? "—"} />
                  <InfoRow label="Email" value={client.userId.email ?? "—"} />
                  <InfoRow label="Source" value={client.source ?? "—"} />
                  <InfoRow label="Assigned to" value={client.assignedToUserId?.name ?? "—"} />
                  <InfoRow label="Tags" value={client.tags.length > 0 ? client.tags.join(", ") : "—"} />
                </div>
              </PageSection>

              <PageSection icon={Activity} title="Status & activity">
                <div className="flex flex-col gap-3">
                  <InfoRow
                    label="Next follow-up"
                    value={
                      client.nextFollowUpAt ? (
                        <span className={isFollowUpOverdue ? "font-medium text-red-600" : undefined}>
                          <DateText value={client.nextFollowUpAt} />
                          {isFollowUpOverdue ? " (overdue)" : ""}
                        </span>
                      ) : (
                        "Not scheduled"
                      )
                    }
                  />
                  <InfoRow
                    label="Last contacted"
                    value={client.lastContactedAt ? <DateText value={client.lastContactedAt} /> : "Never"}
                  />
                  <InfoRow
                    label="Profile completeness"
                    value={
                      <div className="flex flex-col gap-1">
                        <span>
                          {completeness.completed}/{completeness.total} fields ({completeness.percentage}%)
                        </span>
                        {completeness.missing.length > 0 ? (
                          <ul className="flex flex-col gap-0.5 text-xs text-amber-600">
                            {completeness.missing.map((item) => (
                              <li key={item.key}>{item.label}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    }
                  />
                  <InfoRow label="Created" value={<DateText value={client.createdAt} />} />
                </div>
              </PageSection>

              <PageSection icon={Ruler} title="Latest measurement">
                {latestMeasurement ? (
                  <div className="flex flex-col gap-3">
                    <InfoRow label="Measured on" value={<DateText value={latestMeasurement.measuredAt} />} />
                    <InfoRow label="Weight" value={latestMeasurement.weightKg ? `${latestMeasurement.weightKg} kg` : "—"} />
                    <InfoRow label="BMI" value={latestMeasurement.bmi ?? "—"} />
                    {latestMeasurement.weightKg !== undefined ? (
                      <DeltaIndicator
                        current={latestMeasurement.weightKg}
                        previous={previousMeasurement?.weightKg}
                        unit="kg"
                        label="since last visit"
                      />
                    ) : null}
                    <button
                      type="button"
                      className="text-left text-sm text-slate-600 underline hover:text-slate-900"
                      onClick={() => navigate(AppRoute.clientMeasurements, { id: params.id })}
                    >
                      View all measurements →
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No measurements recorded yet.</p>
                )}
              </PageSection>

              <PageSection icon={NotebookPen} title="Latest assessment">
                {latestAssessment ? (
                  <div className="flex flex-col gap-3">
                    <InfoRow label="Assessed on" value={<DateText value={latestAssessment.assessedAt} />} />
                    <InfoRow label="Goal" value={latestAssessment.goal ?? "—"} />
                    <InfoRow label="Activity level" value={latestAssessment.activityLevel ?? "—"} />
                    <button
                      type="button"
                      className="text-left text-sm text-slate-600 underline hover:text-slate-900"
                      onClick={() => navigate(AppRoute.clientAssessmentDetails, { id: params.id, assessmentId: latestAssessment._id })}
                    >
                      View details →
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No assessments recorded yet.</p>
                )}
              </PageSection>

              <PageSection icon={FlaskConical} title="Latest calculation">
                {latestCalculation ? (
                  <div className="flex flex-col gap-3">
                    <InfoRow label="Calculated on" value={<DateText value={latestCalculation.calculatedAt} />} />
                    <InfoRow label="BMI" value={latestCalculation.results.bmi?.value ?? "—"} />
                    <InfoRow
                      label="Goal calories"
                      value={
                        latestCalculation.results.goalCalories
                          ? `${latestCalculation.results.goalCalories.value} kcal/day`
                          : latestCalculation.results.maintenanceCalories
                            ? `${latestCalculation.results.maintenanceCalories.value} kcal/day (maintenance)`
                            : "—"
                      }
                    />
                    <button
                      type="button"
                      className="text-left text-sm text-slate-600 underline hover:text-slate-900"
                      onClick={() => navigate(AppRoute.clientCalculationDetails, { id: params.id, calculationId: latestCalculation._id })}
                    >
                      View details →
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No saved calculations yet.</p>
                )}
              </PageSection>
            </div>

            <Modal open={openDialog === "lifecycle"} onOpenChange={(open) => setOpenDialog(open ? "lifecycle" : null)} title="Change lifecycle">
              <ClientLifecycleForm
                clientId={client._id}
                currentLifecycle={client.lifecycle}
                onSuccess={() => {
                  setOpenDialog(null);
                  refetchAll();
                }}
              />
            </Modal>

            <Modal open={openDialog === "followUp"} onOpenChange={(open) => setOpenDialog(open ? "followUp" : null)} title="Schedule follow-up">
              <ScheduleFollowUpForm
                clientId={client._id}
                currentNextFollowUpAt={client.nextFollowUpAt}
                onSuccess={() => {
                  setOpenDialog(null);
                  refetchAll();
                }}
              />
            </Modal>
          </div>
        );
      }}
    </QueryState>
  );
}
