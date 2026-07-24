"use client";

import { RouteButton } from "@/components/nav/route-button";
import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  Badge,
  Card,
  DateText,
  DetailsPageShell,
  ErrorState,
  InfoRow,
  Spinner,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, ArrowLeft, Pencil, ShieldCheck } from "lucide-react";
import { getRoleByIdEndpoint } from "../../../../api/role.endpoints";
import { AppRoute } from "@/common/routes/app-route";

export default function RoleDetailsPage({ params }: { params: { id: string } }) {
  const { data, loading } = useRequesterQuery({
    endpoint: getRoleByIdEndpoint,
    options: { params: { id: params.id } },
  });

  if (loading) {
    return (
      <DetailsPageShell title="Loading..." maxWidth="full">
        <Spinner />
      </DetailsPageShell>
    );
  }

  const role = data;

  if (!role) {
    return (
      <DetailsPageShell title="Role not found" maxWidth="full">
        <ErrorState description={`No role exists with id "${params.id}".`} />
        <RouteButton path={AppRoute.roles} variant="outline">
          Back to Roles
        </RouteButton>
      </DetailsPageShell>
    );
  }

  return (
    <DetailsPageShell
      icon={ShieldCheck}
      title={role.name}
      status={<Badge variant={role.isActive ? "success" : "secondary"}>{role.isActive ? "Active" : "Inactive"}</Badge>}
      backAction={
        <RouteButton path={AppRoute.roles} variant="ghost" leftIcon={ArrowLeft}>
          Back to Roles
        </RouteButton>
      }
      actions={
        <RouteButton path={AppRoute.roleUpdate} params={{ id: role._id }} variant="outline" leftIcon={Pencil}>
          Edit
        </RouteButton>
      }
      maxWidth="full"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card
          title={
            <span className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Permissions
            </span>
          }
        >
          {role.grantsAll ? (
            <p className="text-sm text-slate-600">
              This role has <strong>full access (grantsAll)</strong> — it bypasses every permission check.
            </p>
          ) : role.permissions.length === 0 ? (
            <p className="text-sm text-slate-600">No permissions assigned.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {role.permissions.map((permission) => (
                <li key={permission._id} className="text-sm text-slate-700">
                  {permission.name} <span className="text-slate-400">({permission.key})</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card
          title={
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4" aria-hidden="true" />
              Status &amp; activity
            </span>
          }
        >
          <div className="flex flex-col gap-3">
            <InfoRow
              label="Status"
              value={<Badge variant={role.isActive ? "success" : "secondary"}>{role.isActive ? "Active" : "Inactive"}</Badge>}
            />
            <InfoRow label="Created" value={<DateText value={role.createdAt} />} />
            <InfoRow label="Updated" value={<DateText value={role.updatedAt} />} />
          </div>
        </Card>
      </div>
    </DetailsPageShell>
  );
}
