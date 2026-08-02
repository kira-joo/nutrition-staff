"use client";

import { SortOrder, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { FlaskConical } from "lucide-react";
import { useState } from "react";
import { NutritionCalculationInputForm } from "src/common/forms/nutrition-calculation-input-form";
import { NutritionCalculationResultsView } from "src/common/forms/nutrition-calculation-results";
import { SaveNutritionCalculationForm } from "src/common/forms/save-nutrition-calculation-form";
import { ComputeNutritionCalculationResponse } from "src/common/interfaces/nutrition-calculation.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getClientByIdEndpoint } from "../../../../../../api/client.endpoints";
import { getClientMeasurementsEndpoint } from "../../../../../../api/client-measurement.endpoints";
import { getNutritionAssessmentsEndpoint } from "../../../../../../api/nutrition-assessment.endpoints";

export default function ClientCalculationNewPage({ params }: { params: { id: string } }) {
  const navigate = useNavigate();
  const [computed, setComputed] = useState<ComputeNutritionCalculationResponse | null>(null);

  const clientQuery = useRequesterQuery({ endpoint: getClientByIdEndpoint, options: { params: { id: params.id } } });

  const latestMeasurementQuery = useRequesterQuery({
    endpoint: getClientMeasurementsEndpoint,
    options: { query: { clientProfileId: params.id, sortBy: "measuredAt", sortOrder: SortOrder.DESC, limit: 1, page: 1 } },
  });
  const latestMeasurement = latestMeasurementQuery.data?.data[0];

  const latestAssessmentQuery = useRequesterQuery({
    endpoint: getNutritionAssessmentsEndpoint,
    options: { query: { clientProfileId: params.id, sortBy: "assessedAt", sortOrder: SortOrder.DESC, limit: 1, page: 1 } },
  });
  const latestAssessment = latestAssessmentQuery.data?.data[0];

  return (
    <QueryState
      query={clientQuery}
      entityName="Client"
      backRoute={{ path: AppRoute.clientCalculations, label: "Back to Calculations", params: { id: params.id } }}
    >
      {(client) => (
        <PageShell icon={FlaskConical} title="Run Calculator">
          {!computed ? (
            <NutritionCalculationInputForm
              defaultValues={{
                gender: client.gender,
                dateOfBirth: client.dateOfBirth,
                birthYear: client.birthYear,
                heightCm: client.heightCm,
                weightKg: latestMeasurement?.weightKg,
                bodyFatPercentage: latestMeasurement?.bodyFatPercentage,
                activityLevel: latestAssessment?.activityLevel,
                goal: latestAssessment?.goal,
              }}
              onComputed={setComputed}
            />
          ) : (
            <div className="flex flex-col gap-4">
              <NutritionCalculationResultsView results={computed.results} assumptions={computed.assumptions} />
              <SaveNutritionCalculationForm
                clientProfileId={params.id}
                assessmentId={latestAssessment?._id}
                measurementId={latestMeasurement?._id}
                computed={computed}
                onSuccess={(calculation) =>
                  navigate(AppRoute.clientCalculationDetails, { id: params.id, calculationId: calculation._id })
                }
              />
            </div>
          )}
        </PageShell>
      )}
    </QueryState>
  );
}
