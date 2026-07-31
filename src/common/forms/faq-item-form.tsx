"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { useRouter } from "next/navigation";
import { getFaqSectionsEndpoint } from "../../../api/faq-section.endpoints";
import type { createFaqItemEndpoint, updateFaqItemEndpoint } from "../../../api/faq-item.endpoints";
import { ContentStatus } from "../enums";
import { FaqItem, FaqItemFormValues } from "../interfaces/faq-item.interface";
import { FaqSection } from "../interfaces/faq-section.interface";
import { AppRoute } from "../routes/app-route";

export interface FaqItemFormProps {
  defaultValues?: FaqItem;
  endpoint: typeof createFaqItemEndpoint | typeof updateFaqItemEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

function toId(value: { _id: string } | string | undefined): string | undefined {
  return typeof value === "string" ? value : value?._id;
}

export function FaqItemForm({ defaultValues, endpoint }: FaqItemFormProps) {
  const router = useRouter();

  const fields: FormFieldConfig<FaqItemFormValues>[] = [
    {
      type: FieldType.FEATURE_COMBOBOX,
      name: "section",
      label: "Section",
      endpoint: getFaqSectionsEndpoint,
      optionLabel: (item: Record<string, unknown>) => {
        const section = item as unknown as FaqSection;
        return section.title.en || section.title.ar || "(untitled)";
      },
      optionValue: "_id",
      placeholder: "Select a section",
      rules: { required: true },
    },
    { type: FieldType.LOCALIZED_INPUT, name: "question", label: "Question" },
    { type: FieldType.LOCALIZED_TEXTAREA, name: "answer", label: "Answer", rows: 4 },
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
    <CustomForm<FaqItemFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        section: toId(defaultValues?.section) ?? "",
        question: defaultValues?.question ?? EMPTY_LOCALIZED,
        answer: defaultValues?.answer ?? EMPTY_LOCALIZED,
        order: defaultValues?.order ?? 0,
        status: defaultValues?.status ?? ContentStatus.DRAFT,
      }}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      warnOnUnsavedChanges
      onSuccess={() => {
        toast.success("FAQ item saved");
        router.push(AppRoute.faqItems);
      }}
      layout="grid"
      columns={2}
    />
  );
}
