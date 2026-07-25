"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  Badge,
  Card,
  DateText,
  DetailsPageShell,
  InfoRow,
  PermissionGuard,
  QueryState,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, ArrowLeft, Pencil, ShieldCheck } from "lucide-react";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { AppRoute } from "src/common/routes/app-route";
import { RouteButton } from "src/components/nav/route-button";
import { getRoleByIdEndpoint } from "../../../../api/role.endpoints";

export default function RoleDetailsPage({ params }: { params: { id: string } }) {
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
        <DetailsPageShell
          icon={ShieldCheck}
          title={role.name}
          status={
            <Badge variant={role.isActive ? "success" : "secondary"}>{role.isActive ? "Active" : "Inactive"}</Badge>
          }
          backAction={
            <RouteButton path={AppRoute.roles} variant="ghost" leftIcon={ArrowLeft}>
              Back to Roles
            </RouteButton>
          }
          actions={
            <PermissionGuard permission={AppPermission.ROLE.UPDATE}>
              <RouteButton path={AppRoute.roleUpdate} params={{ id: role._id }} variant="outline" leftIcon={Pencil}>
                Edit
              </RouteButton>
            </PermissionGuard>
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
                  value={
                    <Badge variant={role.isActive ? "success" : "secondary"}>
                      {role.isActive ? "Active" : "Inactive"}
                    </Badge>
                  }
                />
                <InfoRow label="Created" value={<DateText value={role.createdAt} />} />
                <InfoRow label="Updated" value={<DateText value={role.updatedAt} />} />
              </div>
            </Card>
          </div>
        </DetailsPageShell>
      )}
    </QueryState>
  );
}
