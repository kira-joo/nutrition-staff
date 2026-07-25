"use client";

import { PageShell, RouteButton } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowLeft, UserPlus } from "lucide-react";
import { UserForm } from "src/common/forms/user-form";
import { AppRoute } from "src/common/routes/app-route";
import { createUserEndpoint } from "../../../../api/user.endpoints";

export default function UserCreatePage() {
  return (
    <PageShell
      icon={UserPlus}
      title="Create User"
      description="Add a new staff user"
      actions={
        <RouteButton path={AppRoute.users} variant="ghost" leftIcon={ArrowLeft}>
          Back to Users
        </RouteButton>
      }
    >
      <UserForm endpoint={createUserEndpoint} />
    </PageShell>
  );
}
