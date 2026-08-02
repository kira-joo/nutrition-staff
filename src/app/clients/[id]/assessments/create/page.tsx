"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { NotebookPen } from "lucide-react";
import { NutritionAssessmentForm } from "src/common/forms/nutrition-assessment-form";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getClientByIdEndpoint } from "../../../../../../api/client.endpoints";
import { createNutritionAssessmentEndpoint } from "../../../../../../api/nutrition-assessment.endpoints";

export default function ClientAssessmentCreatePage({ params }: { params: { id: string } }) {
  const navigate = useNavigate();

  const clientQuery = useRequesterQuery({
    endpoint: getClientByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={clientQuery}
      entityName="Client"
      backRoute={{ path: AppRoute.clientAssessments, label: "Back to Assessments", params: { id: params.id } }}
    >
      {(client) => (
        <PageShell icon={NotebookPen} title="New Assessment">
          <NutritionAssessmentForm
            clientProfileId={params.id}
            clientGender={client.gender}
            endpoint={createNutritionAssessmentEndpoint}
            onSuccess={(assessment) =>
              navigate(AppRoute.clientAssessmentDetails, { id: params.id, assessmentId: assessment._id })
            }
          />
        </PageShell>
      )}
    </QueryState>
  );
}
