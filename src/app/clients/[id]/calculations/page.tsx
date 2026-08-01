"use client";

import { SortOrder, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Card, CustomButton, DateText, EmptyState } from "@kira-joo/frontend-toolkit-tailwind";
import { FlaskConical, Plus } from "lucide-react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getNutritionCalculationsEndpoint } from "../../../../../api/nutrition-calculation.endpoints";

export default function ClientCalculationsPage({ params }: { params: { id: string } }) {
  const navigate = useNavigate();
  const { can } = usePermissions();

  const calculationsQuery = useRequesterQuery({
    endpoint: getNutritionCalculationsEndpoint,
    options: {
      query: { clientProfileId: params.id, sortBy: "calculatedAt", sortOrder: SortOrder.DESC, limit: 50, page: 1 },
    },
  });

  const calculations = calculationsQuery.data?.data ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        {can(AppPermission.NUTRITION_CALCULATION.CREATE) ? (
          <CustomButton leftIcon={Plus} onClick={() => navigate(AppRoute.clientCalculationNew, { id: params.id })}>
            Run calculator
          </CustomButton>
        ) : null}
      </div>

      {calculations.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No saved calculations yet"
          description="Run the Nutrition Calculation Workspace to compute and save BMI, calories, macros, and more for this client."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {calculations.map((calculation) => (
            <Card
              key={calculation._id}
              className="cursor-pointer p-4 hover:bg-slate-50"
              onClick={() => navigate(AppRoute.clientCalculationDetails, { id: params.id, calculationId: calculation._id })}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-slate-900">
                    <DateText value={calculation.calculatedAt} />
                  </span>
                  <span className="text-sm text-slate-500">
                    {calculation.results.bmi ? `BMI ${calculation.results.bmi.value}` : ""}
                    {calculation.results.goalCalories ? ` • Goal ${calculation.results.goalCalories.value} kcal/day` : ""}
                    {calculation.results.maintenanceCalories && !calculation.results.goalCalories
                      ? ` • Maintenance ${calculation.results.maintenanceCalories.value} kcal/day`
                      : ""}
                  </span>
                </div>
                <span className="text-sm text-slate-500">by {calculation.calculatedByUserId.name}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
