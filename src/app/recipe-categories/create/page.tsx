"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { ListTree } from "lucide-react";
import { createRecipeCategoryEndpoint } from "../../../../api/recipe-category.endpoints";
import { RecipeCategoryForm } from "src/common/forms/recipe-category-form";
import { AppRoute } from "src/common/routes/app-route";

export default function RecipeCategoryCreatePage() {
  return (
    <PageShell
      icon={ListTree}
      title="Create Recipe Category"
      description="Add a new recipe category"
      backRoute={{ path: AppRoute.recipeCategories, label: "Back to Recipe Categories" }}
    >
      <RecipeCategoryForm endpoint={createRecipeCategoryEndpoint} />
    </PageShell>
  );
}
