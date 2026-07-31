"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { addCampaignBlockEndpoint, replaceCampaignBlockEndpoint } from "../../../api/campaign.endpoints";
import { CampaignBlockType } from "../enums";
import type { CtaBlock, CtaBlockFormValues } from "../interfaces/campaign-block.interface";

export interface CtaBlockEditorProps {
  defaultValues?: CtaBlock;
  endpoint: typeof addCampaignBlockEndpoint | typeof replaceCampaignBlockEndpoint;
  submitParams: { campaignId: string } | { campaignId: string; blockId: string };
  onSuccess: () => void;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

/** The cta block's own editor — heading/description, a button label, and a target URL or site-relative path. */
export function CtaBlockEditor({ defaultValues, endpoint, submitParams, onSuccess }: CtaBlockEditorProps) {
  const fields: FormFieldConfig<CtaBlockFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "heading", label: "Heading" },
    { type: FieldType.LOCALIZED_TEXTAREA, name: "description", label: "Description (optional)", rows: 3 },
    { type: FieldType.LOCALIZED_INPUT, name: "buttonLabel", label: "Button label" },
    { type: FieldType.INPUT, name: "buttonUrl", label: "Button URL or path (e.g. https://... or /recipes)" },
  ];

  return (
    <CustomForm<CtaBlockFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        heading: defaultValues?.heading ?? EMPTY_LOCALIZED,
        description: defaultValues?.description ?? EMPTY_LOCALIZED,
        buttonLabel: defaultValues?.buttonLabel ?? EMPTY_LOCALIZED,
        buttonUrl: defaultValues?.buttonUrl,
      }}
      transformValues={(values) => ({ ...values, type: CampaignBlockType.CTA }) as unknown as Record<string, unknown>}
      submitEndpoint={endpoint}
      submitParams={submitParams}
      onSuccess={() => {
        toast.success(defaultValues ? "Block updated" : "Block added");
        onSuccess();
      }}
      submitButtonText={defaultValues ? "Save changes" : "Add block"}
      layout="grid"
      columns={2}
    />
  );
}
