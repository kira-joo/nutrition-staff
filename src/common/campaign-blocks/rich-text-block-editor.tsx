"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { addCampaignBlockEndpoint, replaceCampaignBlockEndpoint } from "../../../api/campaign.endpoints";
import { CampaignBlockType } from "../enums";
import type { RichTextBlock, RichTextBlockFormValues } from "../interfaces/campaign-block.interface";

export interface RichTextBlockEditorProps {
  defaultValues?: RichTextBlock;
  endpoint: typeof addCampaignBlockEndpoint | typeof replaceCampaignBlockEndpoint;
  submitParams: { campaignId: string } | { campaignId: string; blockId: string };
  onSuccess: () => void;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

/** The richText block's own editor — a plain heading + long-form body, same shape/conventions as HeroBlockEditor. */
export function RichTextBlockEditor({ defaultValues, endpoint, submitParams, onSuccess }: RichTextBlockEditorProps) {
  const fields: FormFieldConfig<RichTextBlockFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "heading", label: "Heading (optional)" },
    { type: FieldType.LOCALIZED_TEXTAREA, name: "body", label: "Body", rows: 6 },
  ];

  return (
    <CustomForm<RichTextBlockFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        heading: defaultValues?.heading ?? EMPTY_LOCALIZED,
        body: defaultValues?.body ?? EMPTY_LOCALIZED,
      }}
      transformValues={(values) => ({ ...values, type: CampaignBlockType.RICH_TEXT }) as unknown as Record<string, unknown>}
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
