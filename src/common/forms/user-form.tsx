"use client";

import { ApiErrorState, CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { IdCard } from "lucide-react";
import { useRouter } from "next/navigation";
import { getRolesEndpoint } from "../../../api/role.endpoints";
import type { createUserEndpoint, updateUserEndpoint } from "../../../api/user.endpoints";
import { usePermissions } from "../auth/use-permissions";
import { AppPermission } from "../authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "../authorization/entity-labels";
import { EntityName } from "../authorization/entity-name.enum";
import { Status } from "../enums";
import { User, UserFormValues } from "../interfaces/user.interface";
import { AppRoute } from "../routes/app-route";

export interface UserFormProps {
  defaultValues?: User;
  endpoint: typeof createUserEndpoint | typeof updateUserEndpoint;
}

/**
 * Identity + account fields only (name/email/roles/status) — this is the
 * generic identity record for anyone in the system, not a staff-only form.
 * Employment details (salary/joined date) live on the separate StaffProfile,
 * edited from the User Details page's "Staff details" section instead.
 */
export function UserForm({ defaultValues, endpoint }: UserFormProps) {
  const router = useRouter();
  const { can } = usePermissions();

  // Assigning roles requires reading the Roles list — block the whole form
  // rather than silently submit one with the Roles field missing (which
  // would lose validation and produce an incomplete payload).
  if (!can(AppPermission.ROLE.READ)) {
    return (
      <ApiErrorState
        error={{ statusCode: 403, message: "Managing user roles requires permission to view roles." }}
        entityName={ENTITY_PLURAL_LABELS[EntityName.ROLE]}
      />
    );
  }

  const basicInfoFields: FormFieldConfig<UserFormValues>[] = [
    {
      type: FieldType.INPUT,
      name: "name",
      label: "Name",
      rules: { required: true },
    },
    {
      type: FieldType.INPUT,
      name: "email",
      label: "Email",
      inputType: "email",
      rules: { required: true },
    },
    {
      type: FieldType.FEATURE_COMBOBOX,
      name: "roles",
      label: "Roles",
      endpoint: getRolesEndpoint,
      optionLabel: "name",
      optionValue: "_id",
      multiple: true,
      placeholder: "Select roles",
      // Only active roles can be newly assigned — an inactive role already
      // assigned to this user still shows up via defaultValues below.
      query: { isActive: true },
    },
    {
      type: FieldType.SELECT,
      name: "status",
      label: "Status",
      options: Object.values(Status).map((v) => ({ label: v, value: v })),
      rules: { required: true },
    },
  ];

  return (
    <CustomForm<UserFormValues, typeof endpoint>
      sections={[{ title: "Identity & account", icon: IdCard, fields: basicInfoFields }]}
      defaultValues={
        defaultValues ? { ...defaultValues, roles: defaultValues.roles.map((role) => role._id) } : undefined
      }
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      onSuccess={() => {
        toast.success("User saved successfully");
        router.push(AppRoute.users);
      }}
      layout="grid"
      columns={2}
    />
  );
}
