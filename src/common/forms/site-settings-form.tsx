"use client";

import { CustomForm, CustomInput, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Globe, Image as ImageIcon, Phone, Share2 } from "lucide-react";
import type { updateSiteSettingsEndpoint } from "../../../api/site-settings.endpoints";
import { Currency } from "../enums";
import type { SiteSettings, SiteSettingsFormValues, SocialLink } from "../interfaces/site-settings.interface";
import { faviconImagePolicy, logoImagePolicy, ogImagePolicy } from "../upload-policies";
import { ArrayFieldEditor } from "./array-field-editor";

export interface SiteSettingsFormProps {
  defaultValues: SiteSettings;
  endpoint: typeof updateSiteSettingsEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

export function SiteSettingsForm({ defaultValues, endpoint }: SiteSettingsFormProps) {
  const contactFields: FormFieldConfig<SiteSettingsFormValues>[] = [
    { type: FieldType.INPUT, name: "phone", label: "Phone" },
    { type: FieldType.INPUT, name: "whatsappNumber", label: "WhatsApp number" },
    { type: FieldType.INPUT, name: "email", label: "Email", inputType: "email" },
    {
      type: FieldType.SELECT,
      name: "currencyCode",
      label: "Currency",
      options: Object.values(Currency).map((value) => ({ label: value, value })),
      rules: { required: true },
    },
  ];

  const socialFields: FormFieldConfig<SiteSettingsFormValues>[] = [
    {
      type: FieldType.CUSTOM,
      name: "socialLinks",
      label: "Social links",
      render: ({ field }) => (
        <ArrayFieldEditor<SocialLink>
          items={(field.value as SocialLink[]) ?? []}
          onChange={(items) => field.onChange(items.map((item, order) => ({ ...item, order })))}
          createItem={() => ({ platform: "", url: "", order: 0 })}
          addLabel="Add social link"
          emptyLabel="No social links yet."
          renderItem={(item, index, update) => (
            <>
              <CustomInput
                label="Platform"
                value={item.platform}
                onChange={(event) => update({ platform: event.target.value })}
                placeholder="Instagram"
              />
              <CustomInput
                label="URL"
                type="url"
                value={item.url}
                onChange={(event) => update({ url: event.target.value })}
                placeholder="https://instagram.com/..."
              />
            </>
          )}
        />
      ),
    },
  ];

  const brandingFields: FormFieldConfig<SiteSettingsFormValues>[] = [
    { type: FieldType.IMAGE_ASSET, name: "logo", label: "Logo", policy: logoImagePolicy },
    { type: FieldType.IMAGE_ASSET, name: "favicon", label: "Favicon", policy: faviconImagePolicy },
    { type: FieldType.IMAGE_ASSET, name: "ogImage", label: "Social share image (OG image)", policy: ogImagePolicy },
    { type: FieldType.LOCALIZED_INPUT, name: "defaultSeo.title", label: "Default SEO title" },
    { type: FieldType.LOCALIZED_TEXTAREA, name: "defaultSeo.description", label: "Default SEO description", rows: 3 },
  ];

  return (
    <CustomForm<SiteSettingsFormValues, typeof endpoint>
      sections={[
        { title: "Contact", icon: Phone, fields: contactFields },
        { title: "Social links", icon: Share2, fields: socialFields },
        { title: "Branding & SEO", icon: ImageIcon, fields: brandingFields },
      ]}
      defaultValues={{
        phone: defaultValues.phone,
        whatsappNumber: defaultValues.whatsappNumber,
        email: defaultValues.email,
        currencyCode: defaultValues.currencyCode,
        socialLinks: defaultValues.socialLinks ?? [],
        logo: defaultValues.logo ?? null,
        favicon: defaultValues.favicon ?? null,
        ogImage: defaultValues.ogImage ?? null,
        defaultSeo: {
          title: defaultValues.defaultSeo?.title ?? EMPTY_LOCALIZED,
          description: defaultValues.defaultSeo?.description ?? EMPTY_LOCALIZED,
        },
        activeCampaignId: defaultValues.activeCampaignId,
      }}
      submitEndpoint={endpoint}
      warnOnUnsavedChanges
      onSuccess={() => toast.success("Site settings saved")}
      layout="grid"
      columns={2}
      submitButtonText="Save changes"
    />
  );
}
