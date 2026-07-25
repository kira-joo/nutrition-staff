"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState, RouteButton } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowLeft, UserCog } from "lucide-react";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { UserForm } from "src/common/forms/user-form";
import { AppRoute } from "src/common/routes/app-route";
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
          icon={UserCog}
          title="Update User"
          description="Update staff user information"
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
