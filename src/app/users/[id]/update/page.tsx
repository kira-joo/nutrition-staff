"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { ErrorState, PageShell, Spinner } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowLeft, UserCog } from "lucide-react";
import { getUserByIdEndpoint, updateUserEndpoint } from "../../../../../api/user.endpoints";
import { UserForm } from "../../../../../common/forms/user-form";
import { AppRoute } from "../../../../../common/routes/app-route";
import { RouteButton } from "../../../../components/nav/route-button";

export default function UserUpdatePage({ params }: { params: { id: string } }) {
  const userQuery = useRequesterQuery({
    endpoint: getUserByIdEndpoint,
    options: { params: { id: params.id } },
  });

  if (userQuery.loading) {
    return (
      <PageShell title="Update User" maxWidth="full">
        <Spinner />
      </PageShell>
    );
  }

  const user = userQuery.data;

  if (!user) {
    return (
      <PageShell title="Update User" maxWidth="full">
        <ErrorState title="User not found" description={`No user exists with id "${params.id}".`} />
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
      maxWidth="full"
      actions={
        <RouteButton path={AppRoute.users} variant="ghost" leftIcon={ArrowLeft}>
          Back to Users
        </RouteButton>
      }
    >
      <UserForm defaultValues={user} endpoint={updateUserEndpoint} />
    </PageShell>
  );
}
