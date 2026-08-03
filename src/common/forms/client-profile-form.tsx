"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Contact, IdCard, NotebookPen, Ruler } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { getUsersEndpoint } from "../../../api/user.endpoints";
import { updateClientEndpoint } from "../../../api/client.endpoints";
import { Gender, ProfileType } from "../enums";
import { Client, UpdateClientDto } from "../interfaces/client.interface";

type ClientProfileFormValues = Omit<UpdateClientDto, "tags"> & { tagsInput?: string };

export interface ClientProfileFormProps {
  client: Client;
  onSuccess: () => void;
}

/** The Client Details "Profile" tab's editable card — everything except lifecycle, which has its own dedicated quick action. */
export function ClientProfileForm({ client, onSuccess }: ClientProfileFormProps) {
  const form = useForm<ClientProfileFormValues>({
    defaultValues: {
      name: client.userId.name,
      phone: client.userId.phone,
      email: client.userId.email,
      dateOfBirth: client.dateOfBirth,
      birthYear: client.birthYear,
      gender: client.gender,
      heightCm: client.heightCm,
      targetWeightKg: client.targetWeightKg,
      assignedToUserId: client.assignedToUserId?._id,
      tagsInput: client.tags.join(", "),
      nextFollowUpAt: client.nextFollowUpAt,
      marketingConsent: client.marketingConsent,
      generalNotes: client.generalNotes,
    },
  });

  const dateOfBirth = form.watch("dateOfBirth");

  // birthYear only exists as a fallback for when the exact date is unknown —
  // once dateOfBirth is set, it's derived and locked rather than left to
  // silently disagree with the real date.
  useEffect(() => {
    if (!dateOfBirth) return;
    const year = new Date(dateOfBirth).getFullYear();
    if (!Number.isNaN(year)) form.setValue("birthYear", year);
  }, [dateOfBirth, form]);

  const identityFields: FormFieldConfig<ClientProfileFormValues>[] = [
    { type: FieldType.INPUT, name: "name", label: "Name", rules: { required: true } },
    { type: FieldType.INPUT, name: "phone", label: "Phone", rules: { required: true } },
    { type: FieldType.INPUT, name: "email", label: "Email", inputType: "email" },
  ];

  const personalFields: FormFieldConfig<ClientProfileFormValues>[] = [
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

  const crmFields: FormFieldConfig<ClientProfileFormValues>[] = [
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

  const notesFields: FormFieldConfig<ClientProfileFormValues>[] = [
    { type: FieldType.TEXTAREA, name: "generalNotes", label: "General notes" },
  ];

  return (
    <CustomForm<ClientProfileFormValues, typeof updateClientEndpoint>
      form={form}
      sections={[
        { title: "Identity", icon: IdCard, fields: identityFields },
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
      submitEndpoint={updateClientEndpoint}
      submitParams={{ id: client._id }}
      onSuccess={() => {
        toast.success("Client profile updated");
        onSuccess();
      }}
      layout="grid"
      columns={2}
    />
  );
}
