"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { Salad } from "lucide-react";
import { createRecipeFoodGroupEndpoint } from "../../../../api/recipe-food-group.endpoints";
import { RecipeFoodGroupForm } from "src/common/forms/recipe-food-group-form";
import { AppRoute } from "src/common/routes/app-route";

export default function RecipeFoodGroupCreatePage() {
  return (
    <PageShell
      icon={Salad}
      title="Create Recipe Food Group"
      description="Add a new recipe food group"
      backRoute={{ path: AppRoute.recipeFoodGroups, label: "Back to Recipe Food Groups" }}
    >
      <RecipeFoodGroupForm endpoint={createRecipeFoodGroupEndpoint} />
    </PageShell>
  );
}
