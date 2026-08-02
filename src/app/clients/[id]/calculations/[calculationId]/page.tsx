"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { CustomForm, DateText, FieldType, InfoRow, PageSection, PageShell, QueryState, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { FlaskConical } from "lucide-react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { NutritionCalculationResultsView } from "src/common/forms/nutrition-calculation-results";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getClientMeasurementByIdEndpoint } from "../../../../../../api/client-measurement.endpoints";
import { getNutritionAssessmentByIdEndpoint } from "../../../../../../api/nutrition-assessment.endpoints";
import {
  getNutritionCalculationByIdEndpoint,
  updateNutritionCalculationEndpoint,
} from "../../../../../../api/nutrition-calculation.endpoints";

interface NotesFormValues {
  notes?: string;
}

export default function ClientCalculationDetailsPage({ params }: { params: { id: string; calculationId: string } }) {
  const { can } = usePermissions();
  const navigate = useNavigate();

  const calculationQuery = useRequesterQuery({
    endpoint: getNutritionCalculationByIdEndpoint,
    options: { params: { id: params.calculationId } },
  });

  const linkedMeasurementId = calculationQuery.data?.measurementId;
  const linkedMeasurementQuery = useRequesterQuery({
    endpoint: getClientMeasurementByIdEndpoint,
    options: { params: { id: linkedMeasurementId ?? "" } },
    queryOptions: { enabled: Boolean(linkedMeasurementId) },
  });

  const linkedAssessmentId = calculationQuery.data?.assessmentId;
  const linkedAssessmentQuery = useRequesterQuery({
    endpoint: getNutritionAssessmentByIdEndpoint,
    options: { params: { id: linkedAssessmentId ?? "" } },
    queryOptions: { enabled: Boolean(linkedAssessmentId) },
  });

  return (
    <QueryState
      query={calculationQuery}
      entityName="Calculation"
      backRoute={{ path: AppRoute.clientCalculations, label: "Back to Calculations", params: { id: params.id } }}
    >
      {(calculation) => (
        <PageShell icon={FlaskConical} title={<DateText value={calculation.calculatedAt} />}>
          <div className="flex flex-col gap-4">
            <PageSection title="Snapshot">
              <div className="flex flex-col gap-3">
                <InfoRow label="Calculated by" value={calculation.calculatedByUserId.name} />
                <InfoRow label="Engine version" value={calculation.engineVersion} />
                <InfoRow label="Assigned" value={calculation.assignedAt ? <DateText value={calculation.assignedAt} /> : "N/A (calculated directly for this client)"} />
                <InfoRow
                  label="Based on measurement"
                  value={
                    linkedMeasurementQuery.data ? (
                      <button
                        type="button"
                        className="text-left underline hover:text-slate-900"
                        onClick={() => navigate(AppRoute.clientMeasurements, { id: params.id })}
                      >
                        <DateText value={linkedMeasurementQuery.data.measuredAt} />
                      </button>
                    ) : (
                      "—"
                    )
                  }
                />
                <InfoRow
                  label="Based on assessment"
                  value={
                    linkedAssessmentQuery.data ? (
                      <button
                        type="button"
                        className="text-left underline hover:text-slate-900"
                        onClick={() =>
                          navigate(AppRoute.clientAssessmentDetails, { id: params.id, assessmentId: linkedAssessmentQuery.data._id })
                        }
                      >
                        <DateText value={linkedAssessmentQuery.data.assessedAt} />
                      </button>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>
            </PageSection>

            <NutritionCalculationResultsView results={calculation.results} assumptions={calculation.assumptions} />

            <PageSection title="Notes">
              {can(AppPermission.NUTRITION_CALCULATION.UPDATE) ? (
                <CustomForm<NotesFormValues, typeof updateNutritionCalculationEndpoint>
                  sections={[{ fields: [{ type: FieldType.TEXTAREA, name: "notes", label: "Notes" }] as FormFieldConfig<NotesFormValues>[] }]}
                  defaultValues={{ notes: calculation.notes }}
                  submitEndpoint={updateNutritionCalculationEndpoint}
                  submitParams={{ id: calculation._id }}
                  submitButtonText="Save notes"
                  onSuccess={() => {
                    toast.success("Notes saved");
                    calculationQuery.refetch();
                  }}
                />
              ) : (
                <p className="text-sm text-slate-600">{calculation.notes || "No notes."}</p>
              )}
            </PageSection>
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
