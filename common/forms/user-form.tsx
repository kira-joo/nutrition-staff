"use client";

import {
  CustomForm,
  FieldType,
  toast,
  type FormFieldConfig,
} from "@kira-joo/frontend-toolkit-tailwind";
import { useRouter } from "next/navigation";
import { createUser, updateUser } from "../data/users.mock";
import { Status, UserRole } from "../enums";
import { User, UserFormValues } from "../interfaces/user.interface";
import { AppRoute } from "../routes/app-route";

export interface UserFormProps {
  defaultValues?: User;
  loading?: boolean;
}

export function UserForm({ defaultValues, loading }: UserFormProps) {
  const router = useRouter();

  async function onSubmit(values: UserFormValues) {
    defaultValues ? updateUser(defaultValues?.id, values) : createUser(values);
    toast.success("User updated successfully");
    router.push(AppRoute.users);
  }
  const fields: FormFieldConfig<UserFormValues>[] = [
    {
      type: FieldType.INPUT,
      name: "name",
      label: "Name",
      disabled: loading,
      rules: { required: true },
    },
    {
      type: FieldType.INPUT,
      name: "email",
      label: "Email",
      inputType: "email",
      disabled: loading,
      rules: { required: true },
    },
    {
      type: FieldType.SELECT,
      name: "role",
      label: "Role",
      options: Object.values(UserRole).map((v) => ({ label: v, value: v })),
      disabled: loading,
      rules: { required: true },
    },
    {
      type: FieldType.SELECT,
      name: "status",
      label: "Status",
      options: Object.values(Status).map((v) => ({ label: v, value: v })),
      disabled: loading,
      rules: { required: true },
    },
    {
      type: FieldType.INPUT,
      name: "salary",
      label: "Salary",
      inputType: "number",
      disabled: loading,
    },
    {
      type: FieldType.DATE,
      name: "joinedAt",
      label: "Joined At",
      disabled: loading,
    },
  ];
  return (
    <CustomForm<UserFormValues>
      fields={fields}
      defaultValues={defaultValues}
      onSubmit={onSubmit}
      loading={loading}
      layout="grid"
      columns={2}
    />
  );
}
