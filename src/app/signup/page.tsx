"use client";

import { AppLink, Card, CustomForm, FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FieldValues } from "react-hook-form";
import { setAccessToken } from "src/common/auth/token-storage";
import type { SignupDto } from "src/common/interfaces/auth.interface";
import { AppRoute } from "src/common/routes/app-route";
import { GuestGuard } from "src/components/auth/guest-guard";
import { PasswordInput } from "src/components/auth/password-input";
import { signupEndpoint } from "../../../api/auth.endpoints";

interface SignupFormValues extends SignupDto {
  confirmPassword: string;
}

const fields: FormFieldConfig<SignupFormValues>[] = [
  { type: FieldType.INPUT, name: "name", label: "Name", rules: { required: true } },
  { type: FieldType.INPUT, name: "email", label: "Email", inputType: "email", rules: { required: true } },
  {
    type: FieldType.CUSTOM,
    name: "password",
    label: "Password",
    rules: {
      required: true,
      minLength: { value: 8, message: "Password must be at least 8 characters" },
      deps: ["confirmPassword"],
    },
    render: ({ field, error }) => <PasswordInput field={field} label="Password" error={error} />,
  },
  {
    type: FieldType.CUSTOM,
    name: "confirmPassword",
    label: "Confirm password",
    rules: {
      required: true,
      validate: (value: string, formValues: FieldValues) => value === formValues.password || "Passwords do not match",
    },
    render: ({ field, error }) => <PasswordInput field={field} label="Confirm password" error={error} />,
  },
];

export default function SignupPage() {
  const router = useRouter();

  return (
    <GuestGuard>
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">
              <UserPlus className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Create an account</h1>
            <p className="text-sm text-slate-600">
              New accounts start with no roles — an admin assigns access afterward.
            </p>
          </div>

          <Card className="p-6 sm:p-8">
            <CustomForm<SignupFormValues, typeof signupEndpoint>
              fields={fields}
              submitEndpoint={signupEndpoint}
              submitButtonText="Create account"
              // confirmPassword is frontend-only validation — never sent to the API.
              transformValues={(values) => ({ name: values.name, email: values.email, password: values.password })}
              onSuccess={(data) => {
                setAccessToken(data.accessToken);
                router.push(AppRoute.users);
              }}
            />
          </Card>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{" "}
            <AppLink path={AppRoute.login} className="font-medium text-slate-900 hover:underline">
              Sign in
            </AppLink>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
