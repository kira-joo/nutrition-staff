"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  Badge,
  DateText,
  InfoRow,
  PageSection,
  PageShell,
  QueryState,
  RouteButton,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, Pencil, ShieldCheck } from "lucide-react";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { AppRoute } from "src/common/routes/app-route";
import { getRoleByIdEndpoint } from "../../../../api/role.endpoints";

export default function RoleDetailsPage({ params }: { params: { id: string } }) {
  const roleQuery = useRequesterQuery({
    endpoint: getRoleByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState query={roleQuery} entityName={EntityName.ROLE} backRoute={{ path: AppRoute.roles, label: "Back to Roles" }}>
      {(role) => (
        <PageShell
          icon={ShieldCheck}
          title={role.name}
          badge={<Badge variant={role.isActive ? "success" : "secondary"}>{role.isActive ? "Active" : "Inactive"}</Badge>}
          actions={
            <RouteButton
              path={AppRoute.roleUpdate}
              params={{ id: role._id }}
              permission={AppPermission.ROLE.UPDATE}
              variant="outline"
              leftIcon={Pencil}
            >
              Edit
            </RouteButton>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PageSection icon={ShieldCheck} title="Permissions">
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
            </PageSection>
            <PageSection icon={Activity} title="Status & activity">
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
            </PageSection>
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
