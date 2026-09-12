"use client";
import { use } from "react";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { UserCog } from "lucide-react";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { UserForm } from "src/common/forms/user-form";
import { AppRoute } from "src/common/routes/app-route";
import { getUserByIdEndpoint, updateUserEndpoint } from "../../../../../api/user.endpoints";

export default function UserUpdatePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const userQuery = useRequesterQuery({
    endpoint: getUserByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={userQuery}
      entityName={EntityName.USER}
      backRoute={{ path: AppRoute.users, label: "Back to Users" }}
    >
      {(user) => (
        <PageShell icon={UserCog} title="Update User" description="Update staff user information">
          <UserForm defaultValues={user} endpoint={updateUserEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
