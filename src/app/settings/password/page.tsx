"use client";

import {
  CustomForm,
  FieldType,
  PageShell,
  matchesFieldRule,
  toast,
  type FormFieldConfig,
} from "@kira-joo/frontend-toolkit-tailwind";
import { KeyRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { AppRoute } from "src/common/routes/app-route";
import { PasswordInput } from "src/components/auth/password-input";
import { updateOwnPasswordEndpoint } from "../../../../api/auth.endpoints";

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
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
    // deps: re-validates confirmPassword the moment this changes, so an
    // already-entered confirmPassword's mismatch error clears/appears live
    // instead of only at the next submit attempt.
    rules: {
      required: true,
      minLength: { value: 8, message: "Must be at least 8 characters" },
      deps: ["confirmPassword"],
    },
    render: ({ field, error }) => <PasswordInput field={field} label="New password" error={error} />,
  },
  {
    type: FieldType.CUSTOM,
    name: "confirmPassword",
    label: "Confirm new password",
    rules: {
      required: true,
      validate: matchesFieldRule<PasswordFormValues>("newPassword", "Passwords do not match"),
    },
    render: ({ field, error }) => <PasswordInput field={field} label="Confirm new password" error={error} />,
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
        // confirmPassword is frontend-only validation — never sent to the API.
        transformValues={(values) => ({ currentPassword: values.currentPassword, newPassword: values.newPassword })}
        onSuccess={() => {
          toast.success("Password updated successfully");
          router.push(AppRoute.settings);
        }}
      />
    </PageShell>
  );
}
