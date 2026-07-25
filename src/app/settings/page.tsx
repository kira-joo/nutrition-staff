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
import { Activity, IdCard, KeyRound, Pencil, UserRound } from "lucide-react";
import { useCurrentUser } from "src/common/auth/use-current-user";
import { AppPermission } from "src/common/authorization/app-permission";
import { Status } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";
import { getUserByIdEndpoint } from "../../../api/user.endpoints";

// The current authenticated user's own account settings — a read-only
// details view (same layout as the Users detail page), not a duplicate of
// the Update User / Update Password forms. Those already exist; this page
// only displays the profile and links out to them.
export default function SettingsPage() {
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?._id;

  const userDetailsQuery = useRequesterQuery({
    endpoint: getUserByIdEndpoint,
    options: { params: { id: currentUserId ?? "" } },
    queryOptions: { enabled: Boolean(currentUserId) },
  });

  const query = {
    data: userDetailsQuery.data,
    isLoading: currentUserQuery.isLoading || userDetailsQuery.isLoading,
    isError: currentUserQuery.isError || userDetailsQuery.isError,
    error: currentUserQuery.error ?? userDetailsQuery.error,
    refetch: userDetailsQuery.refetch,
  };

  return (
    <QueryState query={query} entityName="Account">
      {(user) => (
        <PageShell
          icon={UserRound}
          title={user.name}
          badge={<Badge variant={user.status === Status.ACTIVE ? "success" : "secondary"}>{user.status}</Badge>}
          actions={
            <>
              <PermissionGuard permission={AppPermission.USER.UPDATE}>
                <RouteButton path={AppRoute.userUpdate} params={{ id: user._id }} variant="outline" leftIcon={Pencil}>
                  Update Profile
                </RouteButton>
              </PermissionGuard>
              <RouteButton path={AppRoute.settingsPassword} variant="outline" leftIcon={KeyRound}>
                Update Password
              </RouteButton>
            </>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PageSection icon={IdCard} title="Account information">
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
