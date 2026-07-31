"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import type { addCampaignBlockEndpoint, replaceCampaignBlockEndpoint } from "../../../api/campaign.endpoints";
import { CampaignBlockType } from "../enums";
import type {
  FeatureGridBlock,
  FeatureGridBlockFormValues,
  FeatureGridItem,
} from "../interfaces/campaign-block.interface";
import { ArrayFieldEditor } from "../forms/array-field-editor";
import { LocalizedTextPair } from "../forms/localized-text-pair";

export interface FeatureGridBlockEditorProps {
  defaultValues?: FeatureGridBlock;
  endpoint: typeof addCampaignBlockEndpoint | typeof replaceCampaignBlockEndpoint;
  submitParams: { campaignId: string } | { campaignId: string; blockId: string };
  onSuccess: () => void;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

function createItem(): FeatureGridItem {
  return { id: crypto.randomUUID(), heading: { ...EMPTY_LOCALIZED }, description: { ...EMPTY_LOCALIZED } };
}

/** The featureGrid block's own editor — a section heading plus a repeatable list of heading+description feature items. */
export function FeatureGridBlockEditor({ defaultValues, endpoint, submitParams, onSuccess }: FeatureGridBlockEditorProps) {
  const fields: FormFieldConfig<FeatureGridBlockFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "heading", label: "Section heading (optional)" },
    {
      type: FieldType.CUSTOM,
      name: "items",
      label: "Features",
      render: ({ field }) => (
        <ArrayFieldEditor<FeatureGridItem>
          items={(field.value as FeatureGridItem[]) ?? []}
          onChange={field.onChange}
          createItem={createItem}
          addLabel="Add feature"
          emptyLabel="No features yet."
          renderItem={(item, index, update) => (
            <>
              <LocalizedTextPair
                label="Heading"
                value={item.heading}
                onChange={(heading) => update({ heading })}
              />
              <LocalizedTextPair
                label="Description"
                value={item.description ?? EMPTY_LOCALIZED}
                onChange={(description) => update({ description })}
              />
            </>
          )}
        />
      ),
    },
  ];

  return (
    <CustomForm<FeatureGridBlockFormValues, typeof endpoint>
      fields={fields}
      defaultValues={{
        heading: defaultValues?.heading ?? EMPTY_LOCALIZED,
        items: defaultValues?.items ?? [],
      }}
      transformValues={(values) => ({ ...values, type: CampaignBlockType.FEATURE_GRID }) as unknown as Record<string, unknown>}
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
