"use client";

import { useMemo, useState } from "react";
import { Filter, Pencil, Plus, Trash2, Users } from "lucide-react";

import {
  AppLink,
  Badge,
  CustomButton,
  CustomTable,
  PageShell,
  SearchInput,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";

import { RouteButton } from "../../components/nav/route-button";
import { AppRoute } from "../../../common/routes/app-route";
import { useNavigate } from "../../../common/routes/use-navigate";
import { deleteUser, getUsers } from "../../../common/data/users.mock";
import { Status } from "../../../common/enums";
import { User } from "../../../common/interfaces/user.interface";

export default function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>(() => getUsers());
  const [search, setSearch] = useState("");

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) =>
      [user.name, user.email, user.role, user.status].some((field) =>
        field.toLowerCase().includes(query)
      )
    );
  }, [users, search]);

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
    <PageShell
      surface
      icon={Users}
      title="Users"
      description="Manage staff users"
      maxWidth="full"
      actions={
        <RouteButton path={AppRoute.userCreate} leftIcon={Plus}>
          Add User
        </RouteButton>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search users..."
            className="max-w-xs"
          />
          <CustomButton variant="outline" leftIcon={Filter}>
            Filter
          </CustomButton>
        </div>
      }
    >
      <CustomTable<User>
        bordered={false}
        data={filteredUsers}
        columns={columns}
        rowKey="id"
        emptyMessage="No users match your search"
        rowActions={[
          {
            label: "Edit",
            icon: Pencil,
            onClick: (user) => navigate(AppRoute.userUpdate, { id: user.id }),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: (user) => {
              deleteUser(user.id);
              setUsers(getUsers());
            },
          },
        ]}
      />
    </PageShell>
  );
}
