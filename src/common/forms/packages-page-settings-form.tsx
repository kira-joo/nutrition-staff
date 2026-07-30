"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Layout } from "lucide-react";
import type { updatePackagesPageSettingsEndpoint } from "../../../api/packages-page-settings.endpoints";
import type { PackagesPageSettings, PackagesPageSettingsFormValues } from "../interfaces/packages-page-settings.interface";

export interface PackagesPageSettingsFormProps {
  defaultValues: PackagesPageSettings;
  endpoint: typeof updatePackagesPageSettingsEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

export function PackagesPageSettingsForm({ defaultValues, endpoint }: PackagesPageSettingsFormProps) {
  const fields: FormFieldConfig<PackagesPageSettingsFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "title", label: "Title" },
    { type: FieldType.LOCALIZED_INPUT, name: "titleAccent", label: "Title accent" },
    { type: FieldType.LOCALIZED_TEXTAREA, name: "subtitle", label: "Subtitle", rows: 3 },
    { type: FieldType.LOCALIZED_INPUT, name: "durationLabels.month", label: "Duration label — month" },
    { type: FieldType.LOCALIZED_INPUT, name: "durationLabels.quarter", label: "Duration label — quarter" },
    { type: FieldType.LOCALIZED_INPUT, name: "durationLabels.half", label: "Duration label — half-year" },
    { type: FieldType.LOCALIZED_INPUT, name: "subscribeButtonLabel", label: "Subscribe button label" },
  ];

  return (
    <CustomForm<PackagesPageSettingsFormValues, typeof endpoint>
      sections={[{ title: "Packages Page", icon: Layout, fields }]}
      defaultValues={{
        title: defaultValues.title ?? EMPTY_LOCALIZED,
        titleAccent: defaultValues.titleAccent ?? EMPTY_LOCALIZED,
        subtitle: defaultValues.subtitle ?? EMPTY_LOCALIZED,
        durationLabels: {
          month: defaultValues.durationLabels?.month ?? EMPTY_LOCALIZED,
          quarter: defaultValues.durationLabels?.quarter ?? EMPTY_LOCALIZED,
          half: defaultValues.durationLabels?.half ?? EMPTY_LOCALIZED,
        },
        subscribeButtonLabel: defaultValues.subscribeButtonLabel ?? EMPTY_LOCALIZED,
      }}
      submitEndpoint={endpoint}
      warnOnUnsavedChanges
      onSuccess={() => toast.success("Packages page settings saved")}
      layout="grid"
      columns={2}
      submitButtonText="Save changes"
    />
  );
}
