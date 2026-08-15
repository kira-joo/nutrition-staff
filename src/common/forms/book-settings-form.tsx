"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { CustomButton, CustomForm, FieldType, toast, useConfirmDialog, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { BookMarked, Contact, Image as ImageIcon, Printer } from "lucide-react";
import { useForm } from "react-hook-form";
import { getDoctorProfileEndpoint } from "../../../api/doctor-profile.endpoints";
import type { updateBookSettingsEndpoint } from "../../../api/book-settings.endpoints";
import { BookMarginPreset, BookPageSize } from "../enums";
import { BookSettings, BookSettingsFormValues } from "../interfaces/book-settings.interface";
import { bookLogoPolicy, bookPortraitPolicy } from "../upload-policies";
import { ArrayFieldEditor } from "./array-field-editor";
import { arabicInput, arabicTextarea } from "./books/arabic-fields";

const EMPTY_SOCIAL_LINK = { platform: "", url: "", order: 0 };

export interface BookSettingsFormProps {
  defaultValues: BookSettings;
  endpoint: typeof updateBookSettingsEndpoint;
}

export function BookSettingsForm({ defaultValues, endpoint }: BookSettingsFormProps) {
  const { confirm, dialog } = useConfirmDialog();

  const form = useForm<BookSettingsFormValues>({
    defaultValues: {
      doctorName: defaultValues.doctorName,
      doctorTitle: defaultValues.doctorTitle,
      doctorBio: defaultValues.doctorBio,
      doctorImage: defaultValues.doctorImage ?? null,
      bookLogo: defaultValues.bookLogo ?? null,
      websiteUrl: defaultValues.websiteUrl ?? "",
      socialLinks: defaultValues.socialLinks ?? [],
      contact: defaultValues.contact ?? {},
      disclaimer: defaultValues.disclaimer,
      copyrightText: defaultValues.copyrightText,
      backCoverClosingText: defaultValues.backCoverClosingText,
      backCoverAudienceText: defaultValues.backCoverAudienceText,
      defaultQrDestination: defaultValues.defaultQrDestination ?? "",
      print: defaultValues.print,
      templateVersion: defaultValues.templateVersion,
    },
  });

  const doctorProfileQuery = useRequesterQuery({ endpoint: getDoctorProfileEndpoint, queryOptions: { enabled: false } });

  async function handleCopyFromDoctorProfile() {
    const confirmed = await confirm({
      title: "Copy from Doctor Profile?",
      description: "This fills in the doctor name, title, and photo from the website Doctor Profile, as a one-time starting point. It will not stay in sync afterward, and nothing is saved until you save this form.",
    });
    if (!confirmed) return;

    const { data: profile } = await doctorProfileQuery.refetch();
    if (!profile) {
      toast.error("Could not load the Doctor Profile");
      return;
    }

    form.setValue("doctorName", profile.name.ar || profile.name.en || "", { shouldDirty: true });
    form.setValue("doctorTitle", profile.tagline.ar || profile.tagline.en || "", { shouldDirty: true });
    if (profile.avatar) form.setValue("doctorImage", profile.avatar, { shouldDirty: true });
    toast.success("Copied — review and save when ready");
  }

  const doctorFields: FormFieldConfig<BookSettingsFormValues>[] = [
    arabicInput("doctorName", "Doctor name (for books)"),
    arabicInput("doctorTitle", "Professional title (for books)"),
    arabicTextarea("doctorBio", "Short bio (for books)", { rows: 4 }),
    { type: FieldType.IMAGE_ASSET, name: "doctorImage", label: "Doctor photo", policy: bookPortraitPolicy },
    { type: FieldType.IMAGE_ASSET, name: "bookLogo", label: "Book logo", policy: bookLogoPolicy },
    { type: FieldType.INPUT, name: "websiteUrl", label: "Website URL" },
  ];

  const contactFields: FormFieldConfig<BookSettingsFormValues>[] = [
    { type: FieldType.INPUT, name: "contact.phone", label: "Phone" },
    { type: FieldType.INPUT, name: "contact.whatsapp", label: "WhatsApp" },
    { type: FieldType.INPUT, name: "contact.email", label: "Email" },
    { type: FieldType.INPUT, name: "contact.address", label: "Address" },
    {
      type: FieldType.CUSTOM,
      name: "socialLinks",
      label: "Social links",
      colSpan: "full",
      render: ({ field }) => (
        <ArrayFieldEditor
          items={(field.value as BookSettingsFormValues["socialLinks"]) ?? []}
          onChange={field.onChange}
          createItem={() => ({ ...EMPTY_SOCIAL_LINK })}
          addLabel="Add social link"
          emptyLabel="No social links yet."
          renderItem={(item, _index, update) => (
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded border px-2 py-1"
                placeholder="Platform"
                value={item.platform}
                onChange={(e) => update({ platform: e.target.value })}
              />
              <input className="rounded border px-2 py-1" placeholder="URL" value={item.url} onChange={(e) => update({ url: e.target.value })} />
            </div>
          )}
        />
      ),
    },
  ];

  const legalFields: FormFieldConfig<BookSettingsFormValues>[] = [
    arabicTextarea("disclaimer", "Disclaimer"),
    arabicTextarea("copyrightText", "Copyright text"),
    arabicTextarea("backCoverClosingText", "Back cover closing message"),
    arabicTextarea("backCoverAudienceText", "Back cover — who this guide is for"),
    { type: FieldType.INPUT, name: "defaultQrDestination", label: "Default QR destination" },
  ];

  const printFields: FormFieldConfig<BookSettingsFormValues>[] = [
    { type: FieldType.SELECT, name: "print.pageSize", label: "Page size", options: Object.values(BookPageSize).map((value) => ({ label: value.toUpperCase(), value })) },
    { type: FieldType.SELECT, name: "print.marginPreset", label: "Margins", options: Object.values(BookMarginPreset).map((value) => ({ label: value, value })) },
    { type: FieldType.INPUT, name: "print.gutterMm", label: "Gutter (mm)", inputType: "number" },
    { type: FieldType.INPUT, name: "print.pageNumberStart", label: "First page number", inputType: "number" },
    { type: FieldType.SWITCH, name: "print.doublePageSpread", label: "Double-page spread preview" },
  ];

  return (
    <>
      <div className="mb-4 flex justify-end">
        <CustomButton type="button" variant="secondary" onClick={handleCopyFromDoctorProfile}>
          Copy from Doctor Profile
        </CustomButton>
      </div>
      <CustomForm<BookSettingsFormValues, typeof endpoint>
        form={form}
        sections={[
          { title: "Doctor identity", icon: ImageIcon, fields: doctorFields },
          { title: "Contact & social", icon: Contact, fields: contactFields },
          { title: "Legal & back cover", icon: BookMarked, fields: legalFields },
          { title: "Print defaults", icon: Printer, fields: printFields },
        ]}
        submitEndpoint={endpoint}
        warnOnUnsavedChanges
        onSuccess={() => toast.success("Book settings saved")}
        layout="grid"
        columns={2}
      />
      {dialog}
    </>
  );
}
