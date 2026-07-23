"use client";

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
import { Activity, ArrowLeft, IdCard, Pencil, UserRound } from "lucide-react";
import { getUserByIdEndpoint } from "../../../../api/user.endpoints";
import { Status } from "../../../../common/enums";
import { AppRoute } from "../../../../common/routes/app-route";
import { RouteButton } from "../../../components/nav/route-button";

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const { data, loading } = useRequesterQuery({
    endpoint: getUserByIdEndpoint,
    options: { params: { id: params.id } },
  });

  if (loading) {
    return (
      <DetailsPageShell title="Loading..." maxWidth="full">
        <Spinner />
      </DetailsPageShell>
    );
  }

  const user = data;

  if (!user) {
    return (
      <DetailsPageShell title="User not found" maxWidth="full">
        <ErrorState description={`No user exists with id "${params.id}".`} />
        <RouteButton path={AppRoute.users} variant="outline">
          Back to Users
        </RouteButton>
      </DetailsPageShell>
    );
  }

  return (
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
        <RouteButton path={AppRoute.userUpdate} params={{ id: user.id }} variant="outline" leftIcon={Pencil}>
          Edit
        </RouteButton>
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
            <InfoRow label="Role" value={user.role} />
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
  );
}
