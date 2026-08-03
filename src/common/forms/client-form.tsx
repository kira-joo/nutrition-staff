"use client";

import { type ApiError } from "@kira-joo/frontend-toolkit-core";
import { CenteredSpinner, Card, CustomButton, CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Contact, IdCard } from "lucide-react";
import { useState } from "react";
import { useCurrentUser } from "src/common/auth/use-current-user";
import { ClientProfileForm } from "src/common/forms/client-profile-form";
import type { createClientEndpoint } from "../../../api/client.endpoints";
import { getUsersEndpoint } from "../../../api/user.endpoints";
import { ClientSource } from "../enums";
import { CreateClientConflictDetails, CreateClientFormValues } from "../interfaces/client.interface";
import { AppRoute } from "../routes/app-route";
import { useNavigate } from "../routes/use-navigate";

export interface ClientFormProps {
  endpoint: typeof createClientEndpoint;
}

interface ConflictState {
  details: CreateClientConflictDetails;
  /** Whatever the operator had already typed before the conflict was detected — carried into the attach form instead of asked for again. */
  initialValues: Pick<CreateClientFormValues, "source" | "sourceNote" | "assignedToUserId">;
}

/**
 * The "Add Client/Lead" form only — deliberately thin (identity + how they
 * found the clinic), so reception can log a lead in seconds. Everything
 * else (DOB, gender, height, marketing consent, notes, follow-up) is edited
 * afterward via the Client Details "Profile" tab, not here.
 */
export function ClientForm({ endpoint }: ClientFormProps) {
  const navigate = useNavigate();
  const currentUserQuery = useCurrentUser();
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  /**
   * defaultValues is read once by react-hook-form at mount, so the
   * "assigned to me by default" value must be known before the form
   * renders — this briefly gates on /auth/me rather than defaulting to
   * unassigned then never correcting it.
   */
  if (!currentUserQuery.data) {
    return <CenteredSpinner />;
  }

  // A duplicate-identity conflict replaces the form entirely rather than
  // just showing an inline error — the correct next step (attach to the
  // existing identity, or open their existing client) is a distinct
  // decision, not something to squeeze into a field-level error message.
  // Attaching reuses the same ClientProfileForm the User Details page uses,
  // pre-filled with whatever the operator already typed, so resolving the
  // conflict is a continuation of the original entry, not a restart.
  if (conflict) {
    const { details, initialValues } = conflict;
    return (
      <Card
        title="This person already exists"
        description={`A user was found with a matching ${details.field}: "${details.existingUserName}".`}
      >
        <div className="flex flex-col gap-4">
          {details.hasClientProfile ? (
            <>
              <p className="text-sm text-slate-600">
                This identity already has a client profile — open it instead of creating a new one.
              </p>
              <div className="flex gap-2">
                <CustomButton onClick={() => navigate(AppRoute.clientOverview, { id: details.clientProfileId as string })}>
                  Open existing client
                </CustomButton>
                <CustomButton variant="outline" onClick={() => setConflict(null)}>
                  Try a different email/phone
                </CustomButton>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600">
                Attach a client profile to this existing identity instead of creating a duplicate person.
              </p>
              <ClientProfileForm
                target={{ mode: "attach", userId: details.existingUserId, initialValues }}
                onSuccess={(client) => {
                  toast.success("Client profile attached to existing identity");
                  navigate(AppRoute.clientOverview, { id: client._id });
                }}
              />
              <CustomButton variant="outline" className="self-start" onClick={() => setConflict(null)}>
                Try a different email/phone instead
              </CustomButton>
            </>
          )}
        </div>
      </Card>
    );
  }

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
      // Defaults to (and is restricted to) the current user — reassigning to
      // someone else is a Profile-tab edit, kept out of this deliberately
      // thin creation form. Also sidesteps getUsersEndpoint's default page
      // size (10): without this, "assigned to me" wouldn't reliably show as
      // selected once /users (staff + every client) grows past one page.
      query: { ids: [currentUserQuery.data._id] },
    },
  ];

  return (
    <CustomForm<CreateClientFormValues, typeof endpoint>
      sections={[
        { title: "Identity", icon: IdCard, fields },
        { title: "How they found us", icon: Contact, fields: crmFields },
      ]}
      defaultValues={{ assignedToUserId: currentUserQuery.data._id }}
      submitEndpoint={endpoint}
      onSuccess={(client) => {
        toast.success("Client added");
        navigate(AppRoute.clientOverview, { id: client._id });
      }}
      onError={(error: ApiError, values) => {
        if (error.statusCode !== 409) return;
        const details = (error.raw as { details?: CreateClientConflictDetails } | undefined)?.details;
        if (!details) return;
        setConflict({
          details,
          initialValues: { source: values.source, sourceNote: values.sourceNote, assignedToUserId: values.assignedToUserId },
        });
      }}
      layout="grid"
      columns={2}
    />
  );
}
