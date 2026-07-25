"use client";

import { Status } from "@/common/enums";
import { AppRoute } from "@/common/routes/app-route";
import { RouteButton } from "@/components/nav/route-button";
import { AppPermission } from "@/common/authorization/app-permission";
import { EntityName } from "@/common/authorization/entity-name.enum";
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
import { Activity, ArrowLeft, IdCard, Pencil, UserRound } from "lucide-react";
import { getUserByIdEndpoint } from "../../../../api/user.endpoints";

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const userQuery = useRequesterQuery({
    endpoint: getUserByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={userQuery}
      entityName={EntityName.USER}
      backAction={
        <RouteButton path={AppRoute.users} variant="outline">
          Back to Users
        </RouteButton>
      }
    >
      {(user) => (
        <DetailsPageShell
          icon={UserRound}
          title={user.name}
          status={<Badge variant={user.status === Status.ACTIVE ? "success" : "secondary"}>{user.status}</Badge>}
          backAction={
            <RouteButton path={AppRoute.users} variant="ghost" leftIcon={ArrowLeft}>
              Back to Users
            </RouteButton>
          }
          actions={
            <PermissionGuard permission={AppPermission.USER.UPDATE}>
              <RouteButton path={AppRoute.userUpdate} params={{ id: user._id }} variant="outline" leftIcon={Pencil}>
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
                  <IdCard className="h-4 w-4" aria-hidden="true" />
                  User information
                </span>
              }
            >
              <div className="flex flex-col gap-3">
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="Role" value={user.roles.map((role) => role.name).join(", ") || "—"} />
                <InfoRow label="Salary" value={`$${user.salary.toLocaleString()}`} />
                <InfoRow label="Joined At" value={user.joinedAt} />
              </div>
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
                  value={<Badge variant={user.status === Status.ACTIVE ? "success" : "secondary"}>{user.status}</Badge>}
                />
                <InfoRow label="Created" value={<DateText value={user.createdAt} />} />
                <InfoRow label="Updated" value={<DateText value={user.updatedAt} />} />
              </div>
            </Card>
          </div>
        </DetailsPageShell>
      )}
    </QueryState>
  );
}
