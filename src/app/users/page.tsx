"use client";

import {
  AppLink,
  Badge,
  CustomButton,
  CustomTable,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";

import { useRouter } from "next/navigation";

import { getUsers } from "../../../common/data/users.mock";
import { Status } from "../../../common/enums";
import { User } from "../../../common/interfaces/user.interface";

export default function UsersPage() {
  const router = useRouter();
  const users = getUsers();
  const columns: TableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => (
        <AppLink path="/users/[id]" params={{ id: user.id }}>
          {user.name}
        </AppLink>
      ),
    },
    { key: "email", header: "Email" },
    { key: "role", header: "Role" },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <Badge
          variant={user.status === Status.ACTIVE ? "success" : "secondary"}
        >
          {user.status}
        </Badge>
      ),
    },
    {
      key: "salary",
      header: "Salary",
      align: "right",
      render: (user) => `$${user.salary.toLocaleString()}`,
    },
    { key: "joinedAt", header: "Joined At" },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <div className="flex items-center justify-end gap-2">
          <CustomButton
            size="sm"
            variant="outline"
            onClick={() => router.push(`/users/${user.id}/update`)}
          >
            Edit
          </CustomButton>
        </div>
      ),
      align: "right",
    },
  ];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Users</h1>
        <CustomButton onClick={() => router.push("/users/create")}>
          Add User
        </CustomButton>
      </div>

      <CustomTable<User>
        data={users}
        columns={columns}
        rowKey="id"
        emptyMessage="No users yet"
      />
    </main>
  );
}
