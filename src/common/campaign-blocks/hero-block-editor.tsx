"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { addCampaignBlockEndpoint, replaceCampaignBlockEndpoint } from "../../../api/campaign.endpoints";
import { CampaignBlockType } from "../enums";
import type { HeroBlock, HeroBlockFormValues } from "../interfaces/campaign-block.interface";
import { campaignHeroPolicy } from "../upload-policies";

export interface HeroBlockEditorProps {
  defaultValues?: HeroBlock;
  endpoint: typeof addCampaignBlockEndpoint | typeof replaceCampaignBlockEndpoint;
  submitParams: { campaignId: string } | { campaignId: string; blockId: string };
  onSuccess: () => void;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

/**
 * The Hero block's own editor — a real `CustomForm`, submitted to whichever
 * sub-resource endpoint the caller (add vs. replace) passes in, exactly
 * like any other entity form. `type` is never a user-editable field: it's
 * injected at submit time via `transformValues`, since the block's type is
 * implied by which editor is rendering, not something to pick here.
 */
export function HeroBlockEditor({ defaultValues, endpoint, submitParams, onSuccess }: HeroBlockEditorProps) {
  const fields: FormFieldConfig<HeroBlockFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "heading", label: "Heading" },
    { type: FieldType.LOCALIZED_INPUT, name: "subheading", label: "Subheading" },
    { type: FieldType.IMAGE_ASSET, name: "image", label: "Banner image", policy: campaignHeroPolicy },
    { type: FieldType.LOCALIZED_INPUT, name: "ctaLabel", label: "Button label" },
    { type: FieldType.INPUT, name: "ctaUrl", label: "Button URL", inputType: "url" },
  ];

  return (
    <CustomForm<HeroBlockFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        heading: defaultValues?.heading ?? EMPTY_LOCALIZED,
        subheading: defaultValues?.subheading ?? EMPTY_LOCALIZED,
        image: defaultValues?.image ?? null,
        ctaLabel: defaultValues?.ctaLabel ?? EMPTY_LOCALIZED,
        ctaUrl: defaultValues?.ctaUrl,
      }}
      transformValues={(values) => ({ ...values, type: CampaignBlockType.HERO }) as unknown as Record<string, unknown>}
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
