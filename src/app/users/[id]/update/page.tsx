"use client";
import { ErrorState } from "@kira-joo/frontend-toolkit-tailwind";
import { useRouter } from "next/navigation";
import { findUserById } from "../../../../../common/data/users.mock";
import { UserForm } from "../../../../../common/forms/user-form";

export default function UserUpdatePage({ params }: { params: { id: string } }) {
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
      <h1 className="text-2xl font-bold text-slate-900">Update User</h1>
      <UserForm defaultValues={user} />
    </main>
  );
}
