"use client";

import { UserForm } from "@/common/forms/user-form";
import { AppRoute } from "@/common/routes/app-route";
import { RouteButton } from "@/components/nav/route-button";
import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowLeft, UserPlus } from "lucide-react";
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
