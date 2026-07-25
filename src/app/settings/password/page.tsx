"use client";

import { CustomForm, FieldType, PageShell, toast, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppRoute } from "src/common/routes/app-route";
import { PasswordInput } from "src/components/auth/password-input";
import { updateOwnPasswordEndpoint } from "../../../../api/auth.endpoints";

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
}

const fields: FormFieldConfig<PasswordFormValues>[] = [
  {
    type: FieldType.CUSTOM,
    name: "currentPassword",
    label: "Current password",
    rules: { required: true },
    render: ({ field, error }) => <PasswordInput field={field} label="Current password" error={error} />,
  },
  {
    type: FieldType.CUSTOM,
    name: "newPassword",
    label: "New password",
    rules: { required: true, minLength: { value: 8, message: "Must be at least 8 characters" } },
    render: ({ field, error }) => <PasswordInput field={field} label="New password" error={error} />,
  },
];

export default function UpdatePasswordPage() {
  const router = useRouter();

  return (
    <PageShell
      icon={KeyRound}
      title="Update Password"
      description="Change your account password"
      backRoute={{ path: AppRoute.settings, label: "Back to Account Settings" }}
    >
      <CustomForm<PasswordFormValues, typeof updateOwnPasswordEndpoint>
        fields={fields}
        submitEndpoint={updateOwnPasswordEndpoint}
        submitButtonText="Update password"
        onSuccess={() => {
          toast.success("Password updated successfully");
          router.push(AppRoute.settings);
        }}
      />
    </PageShell>
  );
}
