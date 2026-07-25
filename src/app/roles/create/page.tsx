"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { ShieldPlus } from "lucide-react";
import { RoleForm } from "src/common/forms/role-form";
import { AppRoute } from "src/common/routes/app-route";
import { createRoleEndpoint } from "../../../../api/role.endpoints";

export default function RoleCreatePage() {
  return (
    <PageShell
      icon={ShieldPlus}
      title="Create Role"
      description="Add a new role"
      backRoute={{ path: AppRoute.roles, label: "Back to Roles" }}
    >
      <RoleForm endpoint={createRoleEndpoint} />
    </PageShell>
  );
}
