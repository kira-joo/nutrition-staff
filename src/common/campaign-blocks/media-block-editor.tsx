"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { addCampaignBlockEndpoint, replaceCampaignBlockEndpoint } from "../../../api/campaign.endpoints";
import { CampaignBlockType } from "../enums";
import type { MediaBlock, MediaBlockFormValues } from "../interfaces/campaign-block.interface";
import { campaignHeroPolicy, videoContentPolicy } from "../upload-policies";

export interface MediaBlockEditorProps {
  defaultValues?: MediaBlock;
  endpoint: typeof addCampaignBlockEndpoint | typeof replaceCampaignBlockEndpoint;
  submitParams: { campaignId: string } | { campaignId: string; blockId: string };
  onSuccess: () => void;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

/**
 * The media block's own editor — an image, a video, or both (at least one
 * is required, enforced server-side by HasMediaSource), plus an optional
 * caption. Same IMAGE_ASSET/VIDEO_ASSET field types, upload-on-submit
 * behavior, and policies already used by the Video module.
 */
export function MediaBlockEditor({ defaultValues, endpoint, submitParams, onSuccess }: MediaBlockEditorProps) {
  const fields: FormFieldConfig<MediaBlockFormValues>[] = [
    { type: FieldType.IMAGE_ASSET, name: "image", label: "Image", policy: campaignHeroPolicy },
    { type: FieldType.VIDEO_ASSET, name: "video", label: "Video", policy: videoContentPolicy },
    { type: FieldType.LOCALIZED_INPUT, name: "caption", label: "Caption (optional)" },
  ];

  return (
    <CustomForm<MediaBlockFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        image: defaultValues?.image ?? null,
        video: defaultValues?.video ?? null,
        caption: defaultValues?.caption ?? EMPTY_LOCALIZED,
      }}
      transformValues={(values) => ({ ...values, type: CampaignBlockType.MEDIA }) as unknown as Record<string, unknown>}
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
