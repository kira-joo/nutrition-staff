"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Contact, NotebookPen, Ruler } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getUsersEndpoint } from "../../../api/user.endpoints";
import { attachClientProfileEndpoint } from "../../../api/client-profile.endpoints";
import type { Client } from "../interfaces/client.interface";
import { Gender, ProfileType } from "../enums";

type AttachClientProfileValues = {
  dateOfBirth?: string;
  birthYear?: number;
  gender?: Gender;
  heightCm?: number;
  targetWeightKg?: number;
  assignedToUserId?: string;
  tagsInput?: string;
  nextFollowUpAt?: string;
  marketingConsent?: boolean;
  generalNotes?: string;
};

export interface AttachClientProfileFormProps {
  userId: string;
  onSuccess: (client: Client) => void;
}

/**
 * Attaches a `ClientProfile` to an existing `User` — no identity fields
 * (name/phone/email already exist on that `User`), only the same
 * client-specific fields `ClientProfileForm` edits after the fact.
 * `lifecycle` isn't asked for here either; it defaults to LEAD server-side,
 * matching the "Add Client" flow's own default for a brand-new identity.
 * Minimal creation (submitting with nothing filled in) is intentionally
 * still valid, same as creating a client the usual way.
 */
export function AttachClientProfileForm({ userId, onSuccess }: AttachClientProfileFormProps) {
  const form = useForm<AttachClientProfileValues>({ defaultValues: {} });

  const dateOfBirth = form.watch("dateOfBirth");

  useEffect(() => {
    if (!dateOfBirth) return;
    const year = new Date(dateOfBirth).getFullYear();
    if (!Number.isNaN(year)) form.setValue("birthYear", year);
  }, [dateOfBirth, form]);

  const personalFields: FormFieldConfig<AttachClientProfileValues>[] = [
    { type: FieldType.DATE, name: "dateOfBirth", label: "Date of birth" },
    {
      type: FieldType.INPUT,
      name: "birthYear",
      label: "Birth year (if exact date unknown)",
      inputType: "number",
      disabled: Boolean(dateOfBirth),
    },
    {
      type: FieldType.SELECT,
      name: "gender",
      label: "Gender",
      options: Object.values(Gender).map((v) => ({ label: v, value: v })),
    },
    { type: FieldType.INPUT, name: "heightCm", label: "Height (cm)", inputType: "number" },
    { type: FieldType.INPUT, name: "targetWeightKg", label: "Target weight (kg)", inputType: "number" },
  ];

  const crmFields: FormFieldConfig<AttachClientProfileValues>[] = [
    {
      type: FieldType.FEATURE_COMBOBOX,
      name: "assignedToUserId",
      label: "Assigned staff member",
      endpoint: getUsersEndpoint,
      optionLabel: "name",
      optionValue: "_id",
      query: { profileType: ProfileType.STAFF_ONLY },
    },
    { type: FieldType.INPUT, name: "tagsInput", label: "Tags (comma-separated)" },
    { type: FieldType.DATE, name: "nextFollowUpAt", label: "Next follow-up", includeTime: true },
    { type: FieldType.SWITCH, name: "marketingConsent", label: "Marketing consent" },
  ];

  const notesFields: FormFieldConfig<AttachClientProfileValues>[] = [
    { type: FieldType.TEXTAREA, name: "generalNotes", label: "General notes" },
  ];

  return (
    <CustomForm<AttachClientProfileValues, typeof attachClientProfileEndpoint>
      form={form}
      sections={[
        { title: "Personal details", icon: Ruler, fields: personalFields },
        { title: "CRM", icon: Contact, fields: crmFields },
        { title: "Notes", icon: NotebookPen, fields: notesFields },
      ]}
      transformValues={({ tagsInput, ...values }) => ({
        ...values,
        tags: tagsInput
          ? tagsInput
              .split(",")
              .map((tag) => tag.trim())
              .filter(Boolean)
          : [],
      })}
      submitEndpoint={attachClientProfileEndpoint}
      submitParams={{ userId }}
      onSuccess={(client) => {
        toast.success("Client profile added");
        onSuccess(client);
      }}
      submitButtonText="Add client profile"
      layout="grid"
      columns={2}
    />
  );
}
