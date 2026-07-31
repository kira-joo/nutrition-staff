"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { ChefHat } from "lucide-react";
import { createRecipeEndpoint } from "../../../../api/recipe.endpoints";
import { RecipeForm } from "src/common/forms/recipe-form";
import { AppRoute } from "src/common/routes/app-route";

export default function RecipeCreatePage() {
  return (
    <PageShell
      icon={ChefHat}
      title="Create Recipe"
      description="Add a new recipe"
      backRoute={{ path: AppRoute.recipes, label: "Back to Recipes" }}
    >
      <RecipeForm endpoint={createRecipeEndpoint} />
    </PageShell>
  );
}
