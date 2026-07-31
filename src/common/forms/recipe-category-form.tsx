"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { useRouter } from "next/navigation";
import type { createRecipeCategoryEndpoint, updateRecipeCategoryEndpoint } from "../../../api/recipe-category.endpoints";
import { ContentStatus } from "../enums";
import { RecipeCategory, RecipeCategoryFormValues } from "../interfaces/recipe-category.interface";
import { AppRoute } from "../routes/app-route";

export interface RecipeCategoryFormProps {
  defaultValues?: RecipeCategory;
  endpoint: typeof createRecipeCategoryEndpoint | typeof updateRecipeCategoryEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

export function RecipeCategoryForm({ defaultValues, endpoint }: RecipeCategoryFormProps) {
  const router = useRouter();

  const fields: FormFieldConfig<RecipeCategoryFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "title", label: "Title" },
    {
      type: FieldType.SELECT,
      name: "status",
      label: "Status",
      options: Object.values(ContentStatus).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
  ];

  return (
    <CustomForm<RecipeCategoryFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        title: defaultValues?.title ?? EMPTY_LOCALIZED,
        status: defaultValues?.status ?? ContentStatus.DRAFT,
      }}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      warnOnUnsavedChanges
      onSuccess={() => {
        toast.success("Recipe category saved");
        router.push(AppRoute.recipeCategories);
      }}
      layout="grid"
      columns={2}
    />
  );
}
