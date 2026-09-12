"use client";
import { use } from "react";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { ChefHat } from "lucide-react";
import { getRecipeByIdEndpoint, updateRecipeEndpoint } from "../../../../../api/recipe.endpoints";
import { RecipeForm } from "src/common/forms/recipe-form";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { AppRoute } from "src/common/routes/app-route";

export default function RecipeUpdatePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const recipeQuery = useRequesterQuery({
    endpoint: getRecipeByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={recipeQuery}
      entityName={EntityName.RECIPE}
      backRoute={{ path: AppRoute.recipes, label: "Back to Recipes" }}
    >
      {(recipe) => (
        <PageShell icon={ChefHat} title="Update Recipe" description="Update recipe content">
          <RecipeForm defaultValues={recipe} endpoint={updateRecipeEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
