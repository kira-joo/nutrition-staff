"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { useRouter } from "next/navigation";
import type { createFaqSectionEndpoint, updateFaqSectionEndpoint } from "../../../api/faq-section.endpoints";
import { ContentStatus } from "../enums";
import { FaqSection, FaqSectionFormValues } from "../interfaces/faq-section.interface";
import { AppRoute } from "../routes/app-route";

export interface FaqSectionFormProps {
  defaultValues?: FaqSection;
  endpoint: typeof createFaqSectionEndpoint | typeof updateFaqSectionEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

export function FaqSectionForm({ defaultValues, endpoint }: FaqSectionFormProps) {
  const router = useRouter();

  const fields: FormFieldConfig<FaqSectionFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "title", label: "Title" },
    { type: FieldType.INPUT, name: "order", label: "Order", inputType: "number" },
    {
      type: FieldType.SELECT,
      name: "status",
      label: "Status",
      options: Object.values(ContentStatus).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
  ];

  return (
    <CustomForm<FaqSectionFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        title: defaultValues?.title ?? EMPTY_LOCALIZED,
        order: defaultValues?.order ?? 0,
        status: defaultValues?.status ?? ContentStatus.DRAFT,
      }}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      warnOnUnsavedChanges
      onSuccess={() => {
        toast.success("FAQ section saved");
        router.push(AppRoute.faqSections);
      }}
      layout="grid"
      columns={2}
    />
  );
}
