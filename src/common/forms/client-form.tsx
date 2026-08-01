"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Contact, IdCard } from "lucide-react";
import { getUsersEndpoint } from "../../../api/user.endpoints";
import type { createClientEndpoint } from "../../../api/client.endpoints";
import { ClientSource } from "../enums";
import { CreateClientFormValues } from "../interfaces/client.interface";
import { AppRoute } from "../routes/app-route";
import { useNavigate } from "../routes/use-navigate";

export interface ClientFormProps {
  endpoint: typeof createClientEndpoint;
}

/**
 * The "Add Client/Lead" form only — deliberately thin (identity + how they
 * found the clinic), so reception can log a lead in seconds. Everything
 * else (DOB, gender, height, marketing consent, notes, follow-up) is edited
 * afterward via the Client Details "Profile" tab, not here.
 */
export function ClientForm({ endpoint }: ClientFormProps) {
  const navigate = useNavigate();

  const fields: FormFieldConfig<CreateClientFormValues>[] = [
    {
      type: FieldType.INPUT,
      name: "name",
      label: "Name",
      rules: { required: true },
    },
    {
      type: FieldType.INPUT,
      name: "phone",
      label: "Phone",
      rules: { required: true },
    },
    {
      type: FieldType.INPUT,
      name: "email",
      label: "Email",
      inputType: "email",
    },
  ];

  const crmFields: FormFieldConfig<CreateClientFormValues>[] = [
    {
      type: FieldType.SELECT,
      name: "source",
      label: "Source",
      options: Object.values(ClientSource).map((v) => ({ label: v, value: v })),
    },
    {
      type: FieldType.INPUT,
      name: "sourceNote",
      label: "Source note",
      placeholder: 'Only used when Source is "other"',
    },
    {
      type: FieldType.FEATURE_COMBOBOX,
      name: "assignedToUserId",
      label: "Assigned staff member",
      endpoint: getUsersEndpoint,
      optionLabel: "name",
      optionValue: "_id",
      placeholder: "Select a staff member",
    },
  ];

  return (
    <CustomForm<CreateClientFormValues, typeof endpoint>
      sections={[
        { title: "Identity", icon: IdCard, fields },
        { title: "How they found us", icon: Contact, fields: crmFields },
      ]}
      submitEndpoint={endpoint}
      onSuccess={(client) => {
        toast.success("Client added");
        navigate(AppRoute.clientOverview, { id: client._id });
      }}
      layout="grid"
      columns={2}
    />
  );
}
