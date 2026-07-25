"use client";

import { UserForm } from "@/common/forms/user-form";
import { AppRoute } from "@/common/routes/app-route";
import { RouteButton } from "@/components/nav/route-button";
import { EntityName } from "@/common/authorization/entity-name.enum";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowLeft, UserCog } from "lucide-react";
import { getUserByIdEndpoint, updateUserEndpoint } from "../../../../../api/user.endpoints";

export default function UserUpdatePage({ params }: { params: { id: string } }) {
  const userQuery = useRequesterQuery({
    endpoint: getUserByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={userQuery}
      entityName={EntityName.USER}
      backAction={
        <RouteButton path={AppRoute.users} variant="outline">
          Back to Users
        </RouteButton>
      }
    >
      {(user) => (
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
      )}
    </QueryState>
  );
}
