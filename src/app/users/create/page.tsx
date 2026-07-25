"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowLeft, UserPlus } from "lucide-react";
import { UserForm } from "src/common/forms/user-form";
import { AppRoute } from "src/common/routes/app-route";
import { RouteButton } from "src/components/nav/route-button";
import { createUserEndpoint } from "../../../../api/user.endpoints";

export default function UserCreatePage() {
  return (
    <PageShell
      surface
      icon={UserPlus}
      title="Create User"
      description="Add a new staff user"
      maxWidth="full"
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
