"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { getFaqSectionsEndpoint } from "../../../api/faq-section.endpoints";
import type { addCampaignBlockEndpoint, replaceCampaignBlockEndpoint } from "../../../api/campaign.endpoints";
import { CampaignBlockType } from "../enums";
import type { FaqRefBlock, FaqRefBlockFormValues } from "../interfaces/campaign-block.interface";
import { FaqSection } from "../interfaces/faq-section.interface";

export interface FaqRefBlockEditorProps {
  defaultValues?: FaqRefBlock;
  endpoint: typeof addCampaignBlockEndpoint | typeof replaceCampaignBlockEndpoint;
  submitParams: { campaignId: string } | { campaignId: string; blockId: string };
  onSuccess: () => void;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

/**
 * The faqRef block's own editor — references one existing FaqSection by id.
 * The combobox itself only ever lists real sections, but the server still
 * re-checks existence/publish-availability on save (see
 * assert-faq-ref-valid.ts) rather than trusting this picker alone.
 */
export function FaqRefBlockEditor({ defaultValues, endpoint, submitParams, onSuccess }: FaqRefBlockEditorProps) {
  const fields: FormFieldConfig<FaqRefBlockFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "heading", label: "Heading (optional)" },
    {
      type: FieldType.FEATURE_COMBOBOX,
      name: "faqSectionId",
      label: "FAQ section",
      endpoint: getFaqSectionsEndpoint,
      optionLabel: (item: Record<string, unknown>) => {
        const section = item as unknown as FaqSection;
        return section.title.en || section.title.ar || "(untitled)";
      },
      optionValue: "_id",
      placeholder: "Select a FAQ section",
      rules: { required: true },
    },
  ];

  return (
    <CustomForm<FaqRefBlockFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        heading: defaultValues?.heading ?? EMPTY_LOCALIZED,
        faqSectionId: defaultValues?.faqSectionId ?? "",
      }}
      transformValues={(values) => ({ ...values, type: CampaignBlockType.FAQ_REF }) as unknown as Record<string, unknown>}
      submitEndpoint={endpoint}
      submitParams={submitParams}
      onSuccess={() => {
        toast.success(defaultValues ? "Block updated" : "Block added");
        onSuccess();
      }}
      submitButtonText={defaultValues ? "Save changes" : "Add block"}
      layout="grid"
      columns={1}
    />
  );
}
