"use client";

import { ArrowLeft, UserPlus } from "lucide-react";
import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { RouteButton } from "../../../components/nav/route-button";
import { AppRoute } from "../../../../common/routes/app-route";
import { UserForm } from "../../../../common/forms/user-form";

export default function UserCreatePage() {
  return (
    <PageShell
      surface
      icon={UserPlus}
      title="Create User"
      description="Add a new staff user"
      maxWidth="2xl"
      actions={
        <RouteButton path={AppRoute.users} variant="ghost" leftIcon={ArrowLeft}>
          Back to Users
        </RouteButton>
      }
    >
      <UserForm />
    </PageShell>
  );
}
