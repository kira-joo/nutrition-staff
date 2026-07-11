"use client";

import { useState } from "react";

import { AppLink, Badge, CustomTable, type TableColumn } from "@kira-joo/frontend-toolkit-tailwind";

import { RouteButton } from "../../components/nav/route-button";
import { AppRoute } from "../../../common/routes/app-route";
import { useNavigate } from "../../../common/routes/use-navigate";
import { deleteUser, getUsers } from "../../../common/data/users.mock";
import { Status } from "../../../common/enums";
import { User } from "../../../common/interfaces/user.interface";

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>(() => getUsers());

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => (
        <AppLink path={AppRoute.userDetails} params={{ id: user.id }}>
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
        <Badge variant={user.status === Status.ACTIVE ? "success" : "secondary"}>
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
  ];

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 p-8">
      <CustomTable<User>
        data={users}
        columns={columns}
        rowKey="id"
        emptyMessage="No users yet"
        title="Users"
        description="Manage staff users"
        headerActions={<RouteButton path={AppRoute.userCreate}>Add User</RouteButton>}
        rowActions={[
          {
            label: "Edit",
            onClick: (user) => navigate(AppRoute.userUpdate, { id: user.id }),
          },
          {
            label: "Delete",
            destructive: true,
            onClick: (user) => {
              deleteUser(user.id);
              setUsers(getUsers());
            },
          },
        ]}
      />
    </main>
  );
}
