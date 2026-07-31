"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { ListTree } from "lucide-react";
import { getRecipeCategoryByIdEndpoint, updateRecipeCategoryEndpoint } from "../../../../../api/recipe-category.endpoints";
import { RecipeCategoryForm } from "src/common/forms/recipe-category-form";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { AppRoute } from "src/common/routes/app-route";

export default function RecipeCategoryUpdatePage({ params }: { params: { id: string } }) {
  const categoryQuery = useRequesterQuery({
    endpoint: getRecipeCategoryByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={categoryQuery}
      entityName={EntityName.RECIPE_CATEGORY}
      backRoute={{ path: AppRoute.recipeCategories, label: "Back to Recipe Categories" }}
    >
      {(category) => (
        <PageShell icon={ListTree} title="Update Recipe Category" description="Update category details">
          <RecipeCategoryForm defaultValues={category} endpoint={updateRecipeCategoryEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
