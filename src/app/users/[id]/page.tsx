"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  Badge,
  DateText,
  InfoRow,
  PageSection,
  PageShell,
  PermissionGuard,
  QueryState,
  RouteButton,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, IdCard, Pencil, UserRound } from "lucide-react";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { Status } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";
import { getUserByIdEndpoint } from "../../../../api/user.endpoints";

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const userQuery = useRequesterQuery({
    endpoint: getUserByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState query={userQuery} entityName={EntityName.USER} backRoute={{ path: AppRoute.users, label: "Back to Users" }}>
      {(user) => (
        <PageShell
          icon={UserRound}
          title={user.name}
          badge={<Badge variant={user.status === Status.ACTIVE ? "success" : "secondary"}>{user.status}</Badge>}
          actions={
            <PermissionGuard permission={AppPermission.USER.UPDATE}>
              <RouteButton path={AppRoute.userUpdate} params={{ id: user._id }} variant="outline" leftIcon={Pencil}>
                Edit
              </RouteButton>
            </PermissionGuard>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PageSection icon={IdCard} title="User information">
              <div className="flex flex-col gap-3">
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Role" value={user.roles.map((role) => role.name).join(", ") || "—"} />
                <InfoRow label="Salary" value={`$${user.salary.toLocaleString()}`} />
                <InfoRow label="Joined At" value={user.joinedAt} />
              </div>
            </PageSection>
            <PageSection icon={Activity} title="Status & activity">
              <div className="flex flex-col gap-3">
                <InfoRow
                  label="Status"
                  value={<Badge variant={user.status === Status.ACTIVE ? "success" : "secondary"}>{user.status}</Badge>}
                />
                <InfoRow label="Created" value={<DateText value={user.createdAt} />} />
                <InfoRow label="Updated" value={<DateText value={user.updatedAt} />} />
              </div>
            </PageSection>
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
