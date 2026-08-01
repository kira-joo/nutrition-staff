"use client";

import { SortOrder, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Card, CustomButton, DateText, EmptyState } from "@kira-joo/frontend-toolkit-tailwind";
import { NotebookPen, Plus } from "lucide-react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getNutritionAssessmentsEndpoint } from "../../../../../api/nutrition-assessment.endpoints";

export default function ClientAssessmentsPage({ params }: { params: { id: string } }) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  const assessmentsQuery = useRequesterQuery({
    endpoint: getNutritionAssessmentsEndpoint,
    options: {
      query: { clientProfileId: params.id, sortBy: "assessedAt", sortOrder: SortOrder.DESC, limit: 50, page: 1 },
    },
  });

  const assessments = assessmentsQuery.data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {can(AppPermission.NUTRITION_ASSESSMENT.CREATE) ? (
          <CustomButton leftIcon={Plus} onClick={() => navigate(AppRoute.clientAssessmentCreate, { id: params.id })}>
            New assessment
          </CustomButton>
        ) : null}
      </div>

      {assessments.length === 0 ? (
        <EmptyState
          icon={NotebookPen}
          title="No assessments yet"
          description="Create the client's first nutrition assessment to capture their goals, activity, and health background."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {assessments.map((assessment) => (
            <Card
              key={assessment._id}
              className="cursor-pointer p-4 hover:bg-slate-50"
              onClick={() => navigate(AppRoute.clientAssessmentDetails, { id: params.id, assessmentId: assessment._id })}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-slate-900">
                    <DateText value={assessment.assessedAt} />
                  </span>
                  <span className="text-sm text-slate-500">
                    {assessment.goal ? `Goal: ${assessment.goal}` : "No goal set"}
                    {assessment.activityLevel ? ` • Activity: ${assessment.activityLevel}` : ""}
                  </span>
                </div>
                <span className="text-sm text-slate-500">by {assessment.assessedByUserId.name}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
