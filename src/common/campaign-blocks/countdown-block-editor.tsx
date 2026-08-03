"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { addCampaignBlockEndpoint, replaceCampaignBlockEndpoint } from "../../../api/campaign.endpoints";
import { CampaignBlockType } from "../enums";
import type { CountdownBlock, CountdownBlockFormValues } from "../interfaces/campaign-block.interface";

export interface CountdownBlockEditorProps {
  defaultValues?: CountdownBlock;
  endpoint: typeof addCampaignBlockEndpoint | typeof replaceCampaignBlockEndpoint;
  submitParams: { campaignId: string } | { campaignId: string; blockId: string };
  onSuccess: () => void;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

/**
 * The countdown block's own editor — a heading, a target date/time, and an
 * optional expired-state label. `FieldType.DATE`'s `includeTime` renders a
 * real date+time picker (previously this used a hand-rolled
 * `FieldType.CUSTOM` `<input type="datetime-local">`, converted via the
 * browser's own local timezone rather than the clinic's configured one —
 * replaced now that the shared field supports this directly).
 */
export function CountdownBlockEditor({ defaultValues, endpoint, submitParams, onSuccess }: CountdownBlockEditorProps) {
  const fields: FormFieldConfig<CountdownBlockFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "heading", label: "Heading" },
    { type: FieldType.DATE, name: "targetDate", label: "Target date & time", includeTime: true },
    { type: FieldType.LOCALIZED_INPUT, name: "expiredLabel", label: "Expired-state label (optional)" },
  ];

  return (
    <CustomForm<CountdownBlockFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        heading: defaultValues?.heading ?? EMPTY_LOCALIZED,
        targetDate: defaultValues?.targetDate ?? "",
        expiredLabel: defaultValues?.expiredLabel ?? EMPTY_LOCALIZED,
      }}
      transformValues={(values) => ({ ...values, type: CampaignBlockType.COUNTDOWN }) as unknown as Record<string, unknown>}
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
