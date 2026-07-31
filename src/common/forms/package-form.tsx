"use client";

import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";
import { CustomForm, CustomInput, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { DollarSign, ListChecks, Package as PackageIcon, Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { createPackageEndpoint, updatePackageEndpoint } from "../../../api/package.endpoints";
import { ContentStatus, IconKey, PackageVariant } from "../enums";
import { Package, PackageFormValues, PricingTiers } from "../interfaces/package.interface";
import { AppRoute } from "../routes/app-route";
import { ArrayFieldEditor } from "./array-field-editor";
import { LocalizedTextPair } from "./localized-text-pair";

export interface PackageFormProps {
  defaultValues?: Package;
  endpoint: typeof createPackageEndpoint | typeof updatePackageEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };
const EMPTY_PRICING_TIERS: PricingTiers = {
  month: { originalPrice: 0, price: 0 },
  quarter: { originalPrice: 0, price: 0 },
  half: { originalPrice: 0, price: 0 },
};

const DURATION_LABELS: Record<keyof PricingTiers, string> = {
  month: "1 Month",
  quarter: "2 Months",
  half: "3 Months",
};

export function PackageForm({ defaultValues, endpoint }: PackageFormProps) {
  const router = useRouter();

  const contentFields: FormFieldConfig<PackageFormValues>[] = [
    { type: FieldType.INPUT, name: "key", label: "Key", placeholder: "basic", rules: { required: true } },
    { type: FieldType.LOCALIZED_INPUT, name: "name", label: "Name" },
    { type: FieldType.LOCALIZED_INPUT, name: "tag", label: "Tag (optional)" },
    { type: FieldType.LOCALIZED_INPUT, name: "followUpLabel", label: "Follow-up label" },
    { type: FieldType.SWITCH, name: "popular", label: "Popular" },
    {
      type: FieldType.SELECT,
      name: "variant",
      label: "Visual variant",
      options: Object.values(PackageVariant).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
    {
      type: FieldType.SELECT,
      name: "icon",
      label: "Icon",
      options: Object.values(IconKey).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
  ];

  const pricingFields: FormFieldConfig<PackageFormValues>[] = [
    {
      type: FieldType.CUSTOM,
      name: "pricingTiers",
      label: "Pricing",
      render: ({ field }) => {
        const tiers = (field.value as PricingTiers) ?? EMPTY_PRICING_TIERS;
        return (
          <div className="flex flex-col gap-3">
            {(Object.keys(DURATION_LABELS) as (keyof PricingTiers)[]).map((duration) => (
              <div key={duration} className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 p-3 sm:grid-cols-3">
                <span className="self-center text-sm font-medium text-slate-700">{DURATION_LABELS[duration]}</span>
                <CustomInput
                  label="Original price"
                  type="number"
                  value={tiers[duration].originalPrice}
                  onChange={(event) =>
                    field.onChange({
                      ...tiers,
                      [duration]: { ...tiers[duration], originalPrice: Number(event.target.value) },
                    })
                  }
                />
                <CustomInput
                  label="Price"
                  type="number"
                  value={tiers[duration].price}
                  onChange={(event) =>
                    field.onChange({ ...tiers, [duration]: { ...tiers[duration], price: Number(event.target.value) } })
                  }
                />
              </div>
            ))}
          </div>
        );
      },
    },
  ];

  const detailsFields: FormFieldConfig<PackageFormValues>[] = [
    {
      type: FieldType.CUSTOM,
      name: "details",
      label: "Details",
      render: ({ field }) => (
        <ArrayFieldEditor<LocalizedString>
          items={(field.value as LocalizedString[]) ?? []}
          onChange={field.onChange}
          createItem={() => ({ ...EMPTY_LOCALIZED })}
          addLabel="Add detail"
          emptyLabel="No details yet."
          renderItem={(item, index, update) => <LocalizedTextPair label="Detail" value={item} onChange={update} />}
        />
      ),
    },
  ];

  const seoFields: FormFieldConfig<PackageFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "seoOverride.title", label: "SEO title override (optional)" },
    {
      type: FieldType.LOCALIZED_TEXTAREA,
      name: "seoOverride.description",
      label: "SEO description override (optional)",
      rows: 3,
    },
  ];

  const detailsSettingsFields: FormFieldConfig<PackageFormValues>[] = [
    { type: FieldType.INPUT, name: "order", label: "Order", inputType: "number" },
    {
      type: FieldType.SELECT,
      name: "status",
      label: "Status",
      options: Object.values(ContentStatus).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
  ];

  return (
    <CustomForm<PackageFormValues, typeof endpoint>
      sections={[
        { title: "Content", icon: PackageIcon, fields: contentFields },
        { title: "Pricing", icon: DollarSign, fields: pricingFields },
        { title: "Details", icon: ListChecks, fields: detailsFields },
        { title: "SEO override", icon: Settings2, fields: seoFields },
        { title: "Settings", icon: Settings2, fields: detailsSettingsFields },
      ]}
      defaultValues={{
        key: defaultValues?.key ?? "",
        name: defaultValues?.name ?? EMPTY_LOCALIZED,
        tag: defaultValues?.tag ?? EMPTY_LOCALIZED,
        popular: defaultValues?.popular ?? false,
        variant: defaultValues?.variant ?? PackageVariant.PRIMARY,
        icon: defaultValues?.icon ?? IconKey.ZAP,
        followUpLabel: defaultValues?.followUpLabel ?? EMPTY_LOCALIZED,
        pricingTiers: defaultValues?.pricingTiers ?? EMPTY_PRICING_TIERS,
        details: defaultValues?.details ?? [],
        order: defaultValues?.order ?? 0,
        status: defaultValues?.status ?? ContentStatus.DRAFT,
        seoOverride: {
          title: defaultValues?.seoOverride?.title ?? EMPTY_LOCALIZED,
          description: defaultValues?.seoOverride?.description ?? EMPTY_LOCALIZED,
        },
      }}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      warnOnUnsavedChanges
      onSuccess={() => {
        toast.success("Package saved");
        router.push(AppRoute.packages);
      }}
      layout="grid"
      columns={2}
    />
  );
}
