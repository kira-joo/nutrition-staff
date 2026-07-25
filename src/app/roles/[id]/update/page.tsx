"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { ShieldCheck } from "lucide-react";
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
    <QueryState query={roleQuery} entityName={EntityName.ROLE} backRoute={{ path: AppRoute.roles, label: "Back to Roles" }}>
      {(role) => (
        <PageShell icon={ShieldCheck} title="Update Role" description="Update role permissions">
          <RoleForm defaultValues={role} endpoint={updateRoleEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
