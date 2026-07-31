"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { useRouter } from "next/navigation";
import type { createRecipeFoodGroupEndpoint, updateRecipeFoodGroupEndpoint } from "../../../api/recipe-food-group.endpoints";
import { ContentStatus } from "../enums";
import { RecipeFoodGroup, RecipeFoodGroupFormValues } from "../interfaces/recipe-food-group.interface";
import { AppRoute } from "../routes/app-route";

export interface RecipeFoodGroupFormProps {
  defaultValues?: RecipeFoodGroup;
  endpoint: typeof createRecipeFoodGroupEndpoint | typeof updateRecipeFoodGroupEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

export function RecipeFoodGroupForm({ defaultValues, endpoint }: RecipeFoodGroupFormProps) {
  const router = useRouter();

  const fields: FormFieldConfig<RecipeFoodGroupFormValues>[] = [
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
    <CustomForm<RecipeFoodGroupFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        title: defaultValues?.title ?? EMPTY_LOCALIZED,
        status: defaultValues?.status ?? ContentStatus.DRAFT,
      }}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      warnOnUnsavedChanges
      onSuccess={() => {
        toast.success("Recipe food group saved");
        router.push(AppRoute.recipeFoodGroups);
      }}
      layout="grid"
      columns={2}
    />
  );
}
