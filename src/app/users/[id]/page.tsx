import { Badge, Card, DateText, DetailsPageShell, ErrorState, InfoRow } from "@kira-joo/frontend-toolkit-tailwind";
import { RouteButton } from "../../../components/nav/route-button";
import { AppRoute } from "../../../../common/routes/app-route";
import { findUserById } from "../../../../common/data/users.mock";
import { Status } from "../../../../common/enums";

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const user = findUserById(params.id);

  if (!user) {
    return (
      <DetailsPageShell title="User not found" maxWidth="3xl">
        <ErrorState description={`No user exists with id "${params.id}".`} />
        <RouteButton path={AppRoute.users} variant="outline">
          Back to Users
        </RouteButton>
      </DetailsPageShell>
    );
  }

  return (
    <DetailsPageShell
      title={user.name}
      status={
        <Badge variant={user.status === Status.ACTIVE ? "success" : "secondary"}>
          {user.status}
        </Badge>
      }
      meta={
        <span className="flex flex-wrap items-center gap-2">
          <span>
            Created <DateText value={user.createdAt} />
          </span>
          <span>·</span>
          <span>
            Updated <DateText value={user.updatedAt} />
          </span>
        </span>
      }
      backAction={
        <RouteButton path={AppRoute.users} variant="ghost">
          Back to Users
        </RouteButton>
      }
      actions={
        <RouteButton path={AppRoute.userUpdate} params={{ id: user.id }} variant="outline">
          Edit
        </RouteButton>
      }
      maxWidth="3xl"
    >
      <Card title="User information">
        <div className="flex flex-col gap-3">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Role" value={user.role} />
          <InfoRow label="Salary" value={`$${user.salary.toLocaleString()}`} />
          <InfoRow label="Joined At" value={user.joinedAt} />
        </div>
      </Card>
    </DetailsPageShell>
  );
}
