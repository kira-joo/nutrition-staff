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
import { Activity, Briefcase, Contact, IdCard, Pencil, UserPlus, UserRound } from "lucide-react";
import { useState } from "react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { Status } from "src/common/enums";
import { ClientProfileForm } from "src/common/forms/client-profile-form";
import { StaffProfileForm } from "src/common/forms/staff-profile-form";
import { AppRoute } from "src/common/routes/app-route";
import { getClientByUserIdEndpoint } from "../../../../api/client-profile.endpoints";
import { getStaffProfileByUserIdEndpoint } from "../../../../api/staff-profile.endpoints";
import { getUserByIdEndpoint } from "../../../../api/user.endpoints";

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const { can } = usePermissions();
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [clientDialogOpen, setClientDialogOpen] = useState(false);

  const userQuery = useRequesterQuery({
    endpoint: getUserByIdEndpoint,
    options: { params: { id: params.id } },
  });

  const staffProfileQuery = useRequesterQuery({
    endpoint: getStaffProfileByUserIdEndpoint,
    options: { params: { userId: params.id } },
  });

  const clientProfileQuery = useRequesterQuery({
    endpoint: getClientByUserIdEndpoint,
    options: { params: { userId: params.id } },
  });

  return (
    <QueryState
      query={userQuery}
      entityName={EntityName.USER}
      backRoute={{ path: AppRoute.users, label: "Back to Users" }}
    >
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
                          ? `EGP ${staffProfileQuery.data.salary.toLocaleString()}`
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
            <PageSection icon={Contact} title="Client details">
              <div className="flex flex-col gap-3">
                {clientProfileQuery.data ? (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Client</Badge>
                    </div>
                    <InfoRow label="Lifecycle" value={clientProfileQuery.data.lifecycle} />
                    <InfoRow label="Source" value={clientProfileQuery.data.source ?? "—"} />
                    <InfoRow
                      label="Next follow-up"
                      value={
                        clientProfileQuery.data.nextFollowUpAt ? (
                          <DateText value={clientProfileQuery.data.nextFollowUpAt} />
                        ) : (
                          "—"
                        )
                      }
                    />
                    <RouteButton
                      path={AppRoute.clientOverview}
                      params={{ id: clientProfileQuery.data._id }}
                      permission={AppPermission.CLIENT.READ_ONE}
                      variant="outline"
                      className="self-start"
                    >
                      Open Client Workspace
                    </RouteButton>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-slate-500">
                      This identity has no client profile yet — it isn't a current or former client.
                    </p>
                    {can(AppPermission.CLIENT.CREATE) ? (
                      <CustomButton
                        variant="outline"
                        className="self-start"
                        leftIcon={UserPlus}
                        onClick={() => setClientDialogOpen(true)}
                      >
                        Add Client Profile
                      </CustomButton>
                    ) : null}
                  </>
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

          <Modal open={clientDialogOpen} onOpenChange={setClientDialogOpen} title="Add client profile" size="full">
            <ClientProfileForm
              target={{ mode: "attach", userId: user._id }}
              onSuccess={() => {
                setClientDialogOpen(false);
                clientProfileQuery.refetch();
              }}
            />
          </Modal>
        </PageShell>
      )}
    </QueryState>
  );
}
