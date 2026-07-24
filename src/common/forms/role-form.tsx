"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { useRouter } from "next/navigation";
import { getPermissionsEndpoint } from "../../../api/permission.endpoints";
import type { createRoleEndpoint, updateRoleEndpoint } from "../../../api/role.endpoints";
import { Role, RoleFormValues } from "../interfaces/role.interface";
import { AppRoute } from "../routes/app-route";

export interface RoleFormProps {
  defaultValues?: Role;
  endpoint: typeof createRoleEndpoint | typeof updateRoleEndpoint;
}

export function RoleForm({ defaultValues, endpoint }: RoleFormProps) {
  const router = useRouter();

  const fields: FormFieldConfig<RoleFormValues>[] = [
    {
      type: FieldType.INPUT,
      name: "name",
      label: "Name",
      rules: { required: true },
    },
    {
      type: FieldType.SWITCH,
      name: "grantsAll",
      label: "Full access (grantsAll)",
      description: "Bypasses every permission check. Use sparingly.",
    },
    {
      type: FieldType.FEATURE_COMBOBOX,
      name: "permissions",
      label: "Permissions",
      endpoint: getPermissionsEndpoint,
      optionLabel: (item: Record<string, unknown>) => `${item.name} (${item.key})`,
      optionValue: "_id",
      multiple: true,
      placeholder: "Select permissions",
    },
    ...(defaultValues
      ? ([
          {
            type: FieldType.SWITCH,
            name: "isActive",
            label: "Active",
            description: "Inactive roles no longer contribute their permissions to any user.",
          },
        ] as FormFieldConfig<RoleFormValues>[])
      : []),
  ];

  return (
    <CustomForm<RoleFormValues, typeof endpoint>
      fields={fields}
      defaultValues={
        defaultValues
          ? {
              name: defaultValues.name,
              grantsAll: defaultValues.grantsAll,
              isActive: defaultValues.isActive,
              permissions: defaultValues.permissions.map((permission) => permission._id),
            }
          : { grantsAll: false, isActive: true, permissions: [] }
      }
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      onSuccess={() => {
        toast.success("Role saved successfully");
        router.push(AppRoute.roles);
      }}
      onError={(error) => {
        toast.error(error.message);
      }}
      layout="grid"
      columns={2}
    />
  );
}
