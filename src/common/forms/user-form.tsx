"use client";

import { CustomForm, FieldType, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { Briefcase, IdCard } from "lucide-react";
import { useRouter } from "next/navigation";
import type { createUserEndpoint, updateUserEndpoint } from "../../../api/user.endpoints";
import { Status, UserRole } from "../enums";
import { User, UserFormValues } from "../interfaces/user.interface";
import { AppRoute } from "../routes/app-route";

export interface UserFormProps {
  defaultValues?: User;
  endpoint: typeof createUserEndpoint | typeof updateUserEndpoint;
}

export function UserForm({ defaultValues, endpoint }: UserFormProps) {
  const router = useRouter();

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
      type: FieldType.SELECT,
      name: "role",
      label: "Role",
      options: Object.values(UserRole).map((v) => ({ label: v, value: v })),
      rules: { required: true },
    },
    {
      type: FieldType.SELECT,
      name: "status",
      label: "Status",
      options: Object.values(Status).map((v) => ({ label: v, value: v })),
      rules: { required: true },
    },
  ];

  const employmentFields: FormFieldConfig<UserFormValues>[] = [
    {
      type: FieldType.INPUT,
      name: "salary",
      label: "Salary",
      inputType: "number",
    },
    {
      type: FieldType.DATE,
      name: "joinedAt",
      label: "Joined At",
    },
  ];

  return (
    <CustomForm<UserFormValues, typeof endpoint>
      sections={[
        { title: "Basic information", icon: IdCard, fields: basicInfoFields },
        { title: "Employment details", icon: Briefcase, fields: employmentFields },
      ]}
      defaultValues={defaultValues}
      submitEndpoint={endpoint}
      submitParams={defaultValues ? { id: defaultValues._id } : undefined}
      onSuccess={() => {
        toast.success("User saved successfully");
        router.push(AppRoute.users);
      }}
      onError={(error) => {
        toast.error(error.message);
      }}
      layout="grid"
      columns={2}
    />
  );
}
