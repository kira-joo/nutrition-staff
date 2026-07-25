"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState, RouteButton } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { RoleForm } from "src/common/forms/role-form";
import { AppRoute } from "src/common/routes/app-route";
import { getRoleByIdEndpoint, updateRoleEndpoint } from "../../../../../api/role.endpoints";

export default function RoleUpdatePage({ params }: { params: { id: string } }) {
  const roleQuery = useRequesterQuery({
    endpoint: getRoleByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={roleQuery}
      entityName={EntityName.ROLE}
      backAction={
        <RouteButton path={AppRoute.roles} variant="outline">
          Back to Roles
        </RouteButton>
      }
    >
      {(role) => (
        <PageShell
          icon={ShieldCheck}
          title="Update Role"
          description="Update role permissions"
          actions={
            <RouteButton path={AppRoute.roles} variant="ghost" leftIcon={ArrowLeft}>
              Back to Roles
            </RouteButton>
          }
        >
          <RoleForm defaultValues={role} endpoint={updateRoleEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
