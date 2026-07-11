"use client";

import { ArrowLeft, UserCog } from "lucide-react";
import { ErrorState, PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { RouteButton } from "../../../../components/nav/route-button";
import { AppRoute } from "../../../../../common/routes/app-route";
import { findUserById } from "../../../../../common/data/users.mock";
import { UserForm } from "../../../../../common/forms/user-form";

export default function UserUpdatePage({ params }: { params: { id: string } }) {
  const user = findUserById(params.id);

  if (!user) {
    return (
      <PageShell title="Update User" maxWidth="2xl">
        <ErrorState
          title="User not found"
          description={`No user exists with id "${params.id}".`}
        />
        <RouteButton path={AppRoute.users} variant="outline">
          Back to Users
        </RouteButton>
      </PageShell>
    );
  }

  return (
    <PageShell
      surface
      icon={UserCog}
      title="Update User"
      description="Update staff user information"
      maxWidth="2xl"
      actions={
        <RouteButton path={AppRoute.users} variant="ghost" leftIcon={ArrowLeft}>
          Back to Users
        </RouteButton>
      }
    >
      <UserForm defaultValues={user} />
    </PageShell>
  );
}
