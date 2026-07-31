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

/** ISO datetime <-> the value a native <input type="datetime-local"> needs ("YYYY-MM-DDTHH:mm", local time, no seconds/offset). */
function toDateTimeLocalValue(isoDate: string | undefined): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * The countdown block's own editor — a heading, a target date/time, and an
 * optional expired-state label. No date+time picker exists anywhere in the
 * toolkit (`FieldType.DATE` is date-only) — rather than adding one for this
 * single use, a plain native `<input type="datetime-local">` is rendered
 * directly via `FieldType.CUSTOM`, converting to/from a real ISO string at
 * the field boundary.
 */
export function CountdownBlockEditor({ defaultValues, endpoint, submitParams, onSuccess }: CountdownBlockEditorProps) {
  const fields: FormFieldConfig<CountdownBlockFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "heading", label: "Heading" },
    {
      type: FieldType.CUSTOM,
      name: "targetDate",
      label: "Target date & time",
      render: ({ field }) => (
        <input
          type="datetime-local"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          value={toDateTimeLocalValue(field.value as string | undefined)}
          onChange={(event) => {
            const localValue = event.target.value;
            field.onChange(localValue ? new Date(localValue).toISOString() : "");
          }}
        />
      ),
    },
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
