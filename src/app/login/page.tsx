"use client";

import { AppLink, Card, CustomForm, FieldType, type FormFieldConfig } from "@kira-joo/frontend-toolkit-tailwind";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { loginEndpoint } from "../../../api/auth.endpoints";
import { AppRoute } from "@/common/routes/app-route";
import { setAccessToken } from "@/common/auth/token-storage";
import { GuestGuard } from "@/components/auth/guest-guard";
import { PasswordInput } from "@/components/auth/password-input";
import type { LoginDto } from "@/common/interfaces/auth.interface";

const fields: FormFieldConfig<LoginDto>[] = [
  { type: FieldType.INPUT, name: "email", label: "Email", inputType: "email", rules: { required: true } },
  {
    type: FieldType.CUSTOM,
    name: "password",
    label: "Password",
    rules: { required: true },
    render: ({ field, error }) => <PasswordInput field={field} label="Password" error={error} />,
  },
];

export default function LoginPage() {
  const router = useRouter();

  return (
    <GuestGuard>
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6">
        <div className="flex w-full max-w-sm flex-col gap-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white">
              <LogIn className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Nutrition Staff</h1>
            <p className="text-sm text-slate-600">Sign in to manage staff users and roles.</p>
          </div>

          <Card className="p-6 sm:p-8">
            <CustomForm<LoginDto, typeof loginEndpoint>
              fields={fields}
              submitEndpoint={loginEndpoint}
              submitButtonText="Sign in"
              onSuccess={(data) => {
                setAccessToken(data.accessToken);
                router.push(AppRoute.users);
              }}
            />
          </Card>

          <p className="text-center text-sm text-slate-600">
            Don&apos;t have an account?{" "}
            <AppLink path={AppRoute.signup} className="font-medium text-slate-900 hover:underline">
              Sign up
            </AppLink>
          </p>
        </div>
      </div>
    </GuestGuard>
  );
}
