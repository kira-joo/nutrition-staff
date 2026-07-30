"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { useRouter } from "next/navigation";
import type { createCampaignEndpoint, updateCampaignEndpoint } from "../../../api/campaign.endpoints";
import { ContentStatus } from "../enums";
import { Campaign, CampaignFormValues } from "../interfaces/campaign.interface";
import { AppRoute } from "../routes/app-route";

export interface CampaignFormProps {
  defaultValues?: Campaign;
  endpoint: typeof createCampaignEndpoint | typeof updateCampaignEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

export function CampaignForm({ defaultValues, endpoint }: CampaignFormProps) {
  const router = useRouter();

  const fields: FormFieldConfig<CampaignFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "title", label: "Title" },
    { type: FieldType.INPUT, name: "slug", label: "Slug", placeholder: "summer-sale" },
    { type: FieldType.DATE, name: "startDate", label: "Start date" },
    { type: FieldType.DATE, name: "endDate", label: "End date" },
    {
      type: FieldType.SELECT,
      name: "status",
      label: "Status",
      options: Object.values(ContentStatus).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
  ];

  return (
    <CustomForm<CampaignFormValues, typeof endpoint>
      fields={fields}
      defaultValues={
        defaultValues
          ? {
              title: defaultValues.title ?? EMPTY_LOCALIZED,
              slug: defaultValues.slug,
              startDate: defaultValues.startDate,
              endDate: defaultValues.endDate,
              status: defaultValues.status,
            }
          : {
              title: EMPTY_LOCALIZED,
              slug: "",
              status: ContentStatus.DRAFT,
            }
      }
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { campaignId: defaultValues._id } : undefined}
      warnOnUnsavedChanges
      onSuccess={(campaign) => {
        toast.success("Campaign saved");
        if (!defaultValues) router.push(AppRoute.campaignDetails.replace("[id]", campaign._id));
      }}
      layout="grid"
      columns={2}
      submitButtonText="Save changes"
    />
  );
}
