"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { DateText, PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { History, NotebookPen } from "lucide-react";
import { NutritionAssessmentForm } from "src/common/forms/nutrition-assessment-form";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getClientByIdEndpoint } from "../../../../../../api/client.endpoints";
import {
  getNutritionAssessmentByIdEndpoint,
  updateNutritionAssessmentEndpoint,
} from "../../../../../../api/nutrition-assessment.endpoints";

export default function ClientAssessmentDetailsPage({ params }: { params: { id: string; assessmentId: string } }) {
  const navigate = useNavigate();

  const clientQuery = useRequesterQuery({
    endpoint: getClientByIdEndpoint,
    options: { params: { id: params.id } },
  });

  const assessmentQuery = useRequesterQuery({
    endpoint: getNutritionAssessmentByIdEndpoint,
    options: { params: { id: params.assessmentId } },
  });

  const previousAssessmentId = assessmentQuery.data?.previousAssessmentId;
  const previousAssessmentQuery = useRequesterQuery({
    endpoint: getNutritionAssessmentByIdEndpoint,
    options: { params: { id: previousAssessmentId ?? "" } },
    queryOptions: { enabled: Boolean(previousAssessmentId) },
  });

  return (
    <QueryState
      query={clientQuery}
      entityName="Client"
      backRoute={{ path: AppRoute.clientAssessments, label: "Back to Assessments", params: { id: params.id } }}
    >
      {(client) => (
        <QueryState query={assessmentQuery} entityName="Assessment">
          {(assessment) => (
            <PageShell
              icon={NotebookPen}
              title={<DateText value={assessment.assessedAt} />}
              actions={
                previousAssessmentQuery.data ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900"
                    onClick={() =>
                      navigate(AppRoute.clientAssessmentDetails, {
                        id: params.id,
                        assessmentId: previousAssessmentQuery.data._id,
                      })
                    }
                  >
                    <History className="h-4 w-4" />
                    Compare to previous ({new Date(previousAssessmentQuery.data.assessedAt).toLocaleDateString()})
                  </button>
                ) : undefined
              }
            >
              <NutritionAssessmentForm
                clientProfileId={params.id}
                clientGender={client.gender}
                defaultValues={assessment}
                endpoint={updateNutritionAssessmentEndpoint}
                onSuccess={() => assessmentQuery.refetch()}
              />
            </PageShell>
          )}
        </QueryState>
      )}
    </QueryState>
  );
}
