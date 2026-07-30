"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Award, BookOpen, UserRound } from "lucide-react";
import type { updateDoctorProfileEndpoint } from "../../../api/doctor-profile.endpoints";
import type { BioSection, DoctorProfile, DoctorProfileFormValues, LabeledOrderedItem } from "../interfaces/doctor-profile.interface";
import { doctorPhotoPolicy } from "../upload-policies";
import { ArrayFieldEditor } from "./array-field-editor";
import { LocalizedTextPair } from "./localized-text-pair";

export interface DoctorProfileFormProps {
  defaultValues: DoctorProfile;
  endpoint: typeof updateDoctorProfileEndpoint;
}

const EMPTY_LOCALIZED = { ar: "", en: "" };

export function DoctorProfileForm({ defaultValues, endpoint }: DoctorProfileFormProps) {
  const identityFields: FormFieldConfig<DoctorProfileFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "name", label: "Name" },
    { type: FieldType.LOCALIZED_INPUT, name: "tagline", label: "Tagline" },
    { type: FieldType.IMAGE_ASSET, name: "avatar", label: "Avatar", policy: doctorPhotoPolicy },
    { type: FieldType.LOCALIZED_INPUT, name: "avatarAlt", label: "Avatar alt text" },
  ];

  const bioFields: FormFieldConfig<DoctorProfileFormValues>[] = [
    {
      type: FieldType.CUSTOM,
      name: "bioSections",
      label: "Bio sections",
      render: ({ field }) => (
        <ArrayFieldEditor<BioSection>
          items={(field.value as BioSection[]) ?? []}
          onChange={(items) => field.onChange(items.map((item, order) => ({ ...item, order })))}
          createItem={() => ({ heading: EMPTY_LOCALIZED, body: EMPTY_LOCALIZED, order: 0 })}
          addLabel="Add bio section"
          emptyLabel="No bio sections yet."
          renderItem={(item, index, update) => (
            <>
              <LocalizedTextPair
                label="Heading (optional)"
                value={item.heading ?? EMPTY_LOCALIZED}
                onChange={(heading) => update({ heading })}
              />
              <LocalizedTextPair label="Body" multiline value={item.body} onChange={(body) => update({ body })} />
            </>
          )}
        />
      ),
    },
  ];

  const programFields: FormFieldConfig<DoctorProfileFormValues>[] = [
    { type: FieldType.LOCALIZED_INPUT, name: "programHeading", label: "Program heading" },
    {
      type: FieldType.CUSTOM,
      name: "programHighlights",
      label: "Program highlights",
      render: ({ field }) => (
        <ArrayFieldEditor<LabeledOrderedItem>
          items={(field.value as LabeledOrderedItem[]) ?? []}
          onChange={(items) => field.onChange(items.map((item, order) => ({ ...item, order })))}
          createItem={() => ({ text: EMPTY_LOCALIZED, order: 0 })}
          addLabel="Add highlight"
          emptyLabel="No program highlights yet."
          renderItem={(item, index, update) => (
            <LocalizedTextPair label="Text" value={item.text} onChange={(text) => update({ text })} />
          )}
        />
      ),
    },
    { type: FieldType.LOCALIZED_INPUT, name: "whyChooseHeading", label: "Why choose us — heading" },
    {
      type: FieldType.CUSTOM,
      name: "whyChooseReasons",
      label: "Why choose us — reasons",
      render: ({ field }) => (
        <ArrayFieldEditor<LabeledOrderedItem>
          items={(field.value as LabeledOrderedItem[]) ?? []}
          onChange={(items) => field.onChange(items.map((item, order) => ({ ...item, order })))}
          createItem={() => ({ text: EMPTY_LOCALIZED, order: 0 })}
          addLabel="Add reason"
          emptyLabel="No reasons yet."
          renderItem={(item, index, update) => (
            <LocalizedTextPair label="Text" value={item.text} onChange={(text) => update({ text })} />
          )}
        />
      ),
    },
    { type: FieldType.LOCALIZED_INPUT, name: "featuredInLabel", label: "\"Featured in\" label" },
  ];

  return (
    <CustomForm<DoctorProfileFormValues, typeof endpoint>
      sections={[
        { title: "Identity", icon: UserRound, fields: identityFields },
        { title: "Bio", icon: BookOpen, fields: bioFields },
        { title: "Program & why choose us", icon: Award, fields: programFields },
      ]}
      defaultValues={{
        name: defaultValues.name ?? EMPTY_LOCALIZED,
        tagline: defaultValues.tagline ?? EMPTY_LOCALIZED,
        avatar: defaultValues.avatar ?? null,
        avatarAlt: defaultValues.avatarAlt ?? EMPTY_LOCALIZED,
        bioSections: defaultValues.bioSections ?? [],
        programHeading: defaultValues.programHeading ?? EMPTY_LOCALIZED,
        programHighlights: defaultValues.programHighlights ?? [],
        whyChooseHeading: defaultValues.whyChooseHeading ?? EMPTY_LOCALIZED,
        whyChooseReasons: defaultValues.whyChooseReasons ?? [],
        featuredInLabel: defaultValues.featuredInLabel ?? EMPTY_LOCALIZED,
      }}
      submitEndpoint={endpoint}
      warnOnUnsavedChanges
      onSuccess={() => toast.success("Doctor profile saved")}
      layout="grid"
      columns={2}
      submitButtonText="Save changes"
    />
  );
}
