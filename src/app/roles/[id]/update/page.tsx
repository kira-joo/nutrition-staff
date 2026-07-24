"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { ErrorState, PageShell, Spinner } from "@kira-joo/frontend-toolkit-tailwind";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { getRoleByIdEndpoint, updateRoleEndpoint } from "../../../../../api/role.endpoints";
import { RoleForm } from "@/common/forms/role-form";
import { AppRoute } from "@/common/routes/app-route";
import { RouteButton } from "@/components/nav/route-button";

export default function RoleUpdatePage({ params }: { params: { id: string } }) {
  const roleQuery = useRequesterQuery({
    endpoint: getRoleByIdEndpoint,
    options: { params: { id: params.id } },
  });

  if (roleQuery.loading) {
    return (
      <PageShell title="Update Role" maxWidth="full">
        <Spinner />
      </PageShell>
    );
  }

  const role = roleQuery.data;

  if (!role) {
    return (
      <PageShell title="Update Role" maxWidth="full">
        <ErrorState title="Role not found" description={`No role exists with id "${params.id}".`} />
        <RouteButton path={AppRoute.roles} variant="outline">
          Back to Roles
        </RouteButton>
      </PageShell>
    );
  }

  return (
    <PageShell
      surface
      icon={ShieldCheck}
      title="Update Role"
      description="Update role permissions"
      maxWidth="full"
      actions={
        <RouteButton path={AppRoute.roles} variant="ghost" leftIcon={ArrowLeft}>
          Back to Roles
        </RouteButton>
      }
    >
      <RoleForm defaultValues={role} endpoint={updateRoleEndpoint} />
    </PageShell>
  );
}
