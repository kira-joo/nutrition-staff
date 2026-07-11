"use client";
import {
  Badge,
  Card,
  CustomButton,
  ErrorState,
  InfoRow,
} from "@kira-joo/frontend-toolkit-tailwind";
import { useRouter } from "next/navigation";
import { findUserById } from "../../../../common/data/users.mock";
import { Status } from "../../../../common/enums";

export default function UserDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const user = findUserById(params.id);

  if (!user) {
    return (
      <main className="mx-auto max-w-2xl p-8">
        <ErrorState
          title="User not found"
          description={`No user exists with id "${params.id}".`}
          onRetry={() => router.push("/users")}
          retryText="Back to users"
        />
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
        <CustomButton
          variant="outline"
          onClick={() => router.push(`/users/${user.id}/update`)}
        >
          Edit
        </CustomButton>
      </div>

      <Card title="User details">
        <div className="flex flex-col gap-3">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Role" value={user.role} />
          <InfoRow
            label="Status"
            value={
              <Badge
                variant={
                  user.status === Status.ACTIVE ? "success" : "secondary"
                }
              >
                {user.status}
              </Badge>
            }
          />
          <InfoRow label="Salary" value={`$${user.salary.toLocaleString()}`} />
          <InfoRow label="Joined At" value={user.joinedAt} />
          <InfoRow
            label="Created At"
            value={new Date(user.createdAt).toLocaleString()}
          />
          <InfoRow
            label="Updated At"
            value={new Date(user.updatedAt).toLocaleString()}
          />
        </div>
      </Card>

      <CustomButton variant="ghost" onClick={() => router.push("/users")}>
        Back to Users
      </CustomButton>
    </main>
  );
}
