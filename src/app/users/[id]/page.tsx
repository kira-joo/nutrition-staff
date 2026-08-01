"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  Badge,
  CustomButton,
  DateText,
  InfoRow,
  Modal,
  PageSection,
  PageShell,
  QueryState,
  RouteButton,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, Briefcase, IdCard, Pencil, UserRound } from "lucide-react";
import { useState } from "react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { Status } from "src/common/enums";
import { StaffProfileForm } from "src/common/forms/staff-profile-form";
import { AppRoute } from "src/common/routes/app-route";
import { getStaffProfileByUserIdEndpoint } from "../../../../api/staff-profile.endpoints";
import { getUserByIdEndpoint } from "../../../../api/user.endpoints";

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const { can } = usePermissions();
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);

  const userQuery = useRequesterQuery({
    endpoint: getUserByIdEndpoint,
    options: { params: { id: params.id } },
  });

  const staffProfileQuery = useRequesterQuery({
    endpoint: getStaffProfileByUserIdEndpoint,
    options: { params: { userId: params.id } },
  });

  return (
    <QueryState query={userQuery} entityName={EntityName.USER} backRoute={{ path: AppRoute.users, label: "Back to Users" }}>
      {(user) => (
        <PageShell
          icon={UserRound}
          title={user.name}
          badge={<Badge variant={user.status === Status.ACTIVE ? "success" : "secondary"}>{user.status}</Badge>}
          actions={
            <RouteButton
              path={AppRoute.userUpdate}
              params={{ id: user._id }}
              permission={AppPermission.USER.UPDATE}
              variant="outline"
              leftIcon={Pencil}
            >
              Edit
            </RouteButton>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PageSection icon={IdCard} title="Identity">
              <div className="flex flex-col gap-3">
                <InfoRow label="Email" value={user.email ?? "—"} />
                <InfoRow label="Phone" value={user.phone ?? "—"} />
                <InfoRow label="Role" value={user.roles.map((role) => role.name).join(", ") || "—"} />
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
            <PageSection icon={Briefcase} title="Staff details">
              <div className="flex flex-col gap-3">
                {can(AppPermission.STAFF.UPDATE) ? (
                  <CustomButton
                    variant="outline"
                    className="self-start"
                    leftIcon={Pencil}
                    onClick={() => setStaffDialogOpen(true)}
                  >
                    Edit staff details
                  </CustomButton>
                ) : null}
                {staffProfileQuery.data ? (
                  <>
                    <InfoRow
                      label="Salary"
                      value={
                        staffProfileQuery.data.salary !== undefined
                          ? `$${staffProfileQuery.data.salary.toLocaleString()}`
                          : "—"
                      }
                    />
                    <InfoRow label="Joined At" value={staffProfileQuery.data.joinedAt ?? "—"} />
                  </>
                ) : (
                  <p className="text-sm text-slate-500">
                    This identity has no staff profile yet — it isn't a current or former staff member.
                  </p>
                )}
              </div>
            </PageSection>
          </div>

          <Modal open={staffDialogOpen} onOpenChange={setStaffDialogOpen} title="Edit staff details">
            <StaffProfileForm
              userId={user._id}
              defaultValues={staffProfileQuery.data ?? undefined}
              onSuccess={() => {
                setStaffDialogOpen(false);
                staffProfileQuery.refetch();
              }}
            />
          </Modal>
        </PageShell>
      )}
    </QueryState>
  );
}
