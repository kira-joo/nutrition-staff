"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Contact, IdCard, NotebookPen, Ruler } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { attachClientProfileEndpoint } from "../../../api/client-profile.endpoints";
import { updateClientEndpoint } from "../../../api/client.endpoints";
import { getUsersEndpoint } from "../../../api/user.endpoints";
import { Gender, ProfileType } from "../enums";
import type { AttachClientProfileFormValues, Client } from "../interfaces/client.interface";

type FormValues = AttachClientProfileFormValues & { name?: string; phone?: string; email?: string; tagsInput?: string };

export type ClientProfileFormTarget =
  | { mode: "edit"; client: Client }
  /** `initialValues` carries over whatever the operator already typed before a duplicate-identity conflict was detected — attaching shouldn't mean re-entering the same information. */
  | { mode: "attach"; userId: string; initialValues?: Partial<AttachClientProfileFormValues> };

export interface ClientProfileFormProps {
  target: ClientProfileFormTarget;
  onSuccess: (client: Client) => void;
}

/**
 * The one ClientProfile form, in either of two modes:
 * - `edit` — the Client Details "Profile" tab, editing an existing
 *   ClientProfile (plus its User's identity fields). Everything except
 *   lifecycle, which has its own dedicated quick action.
 * - `attach` — creating a ClientProfile for an existing User (from User
 *   Details), reusing their identity automatically. No identity fields
 *   (the User already has them) and no lifecycle field either (defaults
 *   to LEAD server-side, same as a brand-new client).
 *
 * Kept as one component specifically so these two flows never drift into
 * two near-duplicate field lists over time — the only real differences
 * are which fields are shown and which endpoint the result is submitted to.
 */
export function ClientProfileForm({ target, onSuccess }: ClientProfileFormProps) {
  const isEdit = target.mode === "edit";

  const defaultValues: FormValues = isEdit
    ? {
        name: target.client.userId.name,
        phone: target.client.userId.phone,
        email: target.client.userId.email,
        dateOfBirth: target.client.dateOfBirth,
        birthYear: target.client.birthYear,
        gender: target.client.gender,
        heightCm: target.client.heightCm,
        targetWeightKg: target.client.targetWeightKg,
        source: target.client.source,
        sourceNote: target.client.sourceNote,
        assignedToUserId: target.client.assignedToUserId?._id,
        tagsInput: target.client.tags.join(", "),
        nextFollowUpAt: target.client.nextFollowUpAt,
        marketingConsent: target.client.marketingConsent,
        generalNotes: target.client.generalNotes,
      }
    : {
        ...target.initialValues,
        tagsInput: target.initialValues?.tags?.join(", ") ?? "",
      };

  const form = useForm<FormValues>({ defaultValues });

  const dateOfBirth = form.watch("dateOfBirth");

  // birthYear only exists as a fallback for when the exact date is unknown —
  // once dateOfBirth is set, it's derived and locked rather than left to
  // silently disagree with the real date.
  useEffect(() => {
    if (!dateOfBirth) return;
    const year = new Date(dateOfBirth).getFullYear();
    if (!Number.isNaN(year)) form.setValue("birthYear", year);
  }, [dateOfBirth, form]);

  const identityFields: FormFieldConfig<FormValues>[] = [
    { type: FieldType.INPUT, name: "name", label: "Name", rules: { required: true } },
    { type: FieldType.INPUT, name: "phone", label: "Phone", rules: { required: true } },
    { type: FieldType.INPUT, name: "email", label: "Email", inputType: "email" },
  ];

  const personalFields: FormFieldConfig<FormValues>[] = [
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

  const crmFields: FormFieldConfig<FormValues>[] = [
    {
      type: FieldType.FEATURE_COMBOBOX,
      name: "assignedToUserId",
      label: "Assigned staff member",
      endpoint: getUsersEndpoint,
      optionLabel: "name",
      optionValue: "_id",
      // /users lists every client/lead alongside staff — without this, a
      // client could be offered here as an "assignable staff member".
      // STAFF_ONLY here means "has a staff profile" (see buildProfileTypeWhere),
      // so a person who is both staff and a client is still assignable.
      query: { profileType: ProfileType.STAFF_ONLY },
    },
    { type: FieldType.INPUT, name: "tagsInput", label: "Tags (comma-separated)" },
    { type: FieldType.DATE, name: "nextFollowUpAt", label: "Next follow-up", includeTime: true },
    { type: FieldType.SWITCH, name: "marketingConsent", label: "Marketing consent" },
  ];

  const notesFields: FormFieldConfig<FormValues>[] = [
    { type: FieldType.TEXTAREA, name: "generalNotes", label: "General notes" },
  ];

  const sections = [
    ...(isEdit ? [{ title: "Identity", icon: IdCard, fields: identityFields }] : []),
    { title: "Personal details", icon: Ruler, fields: personalFields },
    { title: "CRM", icon: Contact, fields: crmFields },
    { title: "Notes", icon: NotebookPen, fields: notesFields },
  ];

  const transformValues = ({ tagsInput, ...values }: FormValues) => ({
    ...values,
    tags: tagsInput
      ? tagsInput
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [],
  });

  if (isEdit) {
    return (
      <CustomForm<FormValues, typeof updateClientEndpoint>
        form={form}
        sections={sections}
        transformValues={transformValues}
        submitEndpoint={updateClientEndpoint}
        submitParams={{ id: target.client._id }}
        onSuccess={(client) => {
          toast.success("Client profile updated");
          onSuccess(client);
        }}
        layout="grid"
        columns={2}
      />
    );
  }

  return (
    <CustomForm<FormValues, typeof attachClientProfileEndpoint>
      form={form}
      sections={sections}
      transformValues={transformValues}
      submitEndpoint={attachClientProfileEndpoint}
      submitParams={{ userId: target.userId }}
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
