"use client";

import { RoleForm } from "@/common/forms/role-form";
import { AppRoute } from "@/common/routes/app-route";
import { RouteButton } from "@/components/nav/route-button";
import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowLeft, ShieldPlus } from "lucide-react";
import { createRoleEndpoint } from "../../../../api/role.endpoints";

export default function RoleCreatePage() {
  return (
    <PageShell
      surface
      icon={ShieldPlus}
      title="Create Role"
      description="Add a new role"
      maxWidth="full"
      actions={
        <RouteButton path={AppRoute.roles} variant="ghost" leftIcon={ArrowLeft}>
          Back to Roles
        </RouteButton>
      }
    >
      <RoleForm endpoint={createRoleEndpoint} />
    </PageShell>
  );
}
