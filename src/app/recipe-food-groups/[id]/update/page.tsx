"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { Salad } from "lucide-react";
import { getRecipeFoodGroupByIdEndpoint, updateRecipeFoodGroupEndpoint } from "../../../../../api/recipe-food-group.endpoints";
import { RecipeFoodGroupForm } from "src/common/forms/recipe-food-group-form";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { AppRoute } from "src/common/routes/app-route";

export default function RecipeFoodGroupUpdatePage({ params }: { params: { id: string } }) {
  const foodGroupQuery = useRequesterQuery({
    endpoint: getRecipeFoodGroupByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={foodGroupQuery}
      entityName={EntityName.RECIPE_FOOD_GROUP}
      backRoute={{ path: AppRoute.recipeFoodGroups, label: "Back to Recipe Food Groups" }}
    >
      {(foodGroup) => (
        <PageShell icon={Salad} title="Update Recipe Food Group" description="Update food group details">
          <RecipeFoodGroupForm defaultValues={foodGroup} endpoint={updateRecipeFoodGroupEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
