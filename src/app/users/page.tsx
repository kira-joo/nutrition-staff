"use client";

import { useRef } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";

import {
  AppLink,
  Badge,
  FeatureTable,
  PageShell,
  useErrorHandler,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";
import { requester } from "@kira-joo/frontend-toolkit-core";

import { RouteButton } from "../../components/nav/route-button";
import { AppRoute } from "../../../common/routes/app-route";
import { useNavigate } from "../../../common/routes/use-navigate";
import { deleteUserEndpoint, getUsersEndpoint } from "../../../api/user.endpoints";
import { Status } from "../../../common/enums";
import { User } from "../../../common/interfaces/user.interface";

export default function UsersPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { call } = useErrorHandler();

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
      render: (user) => <Badge variant={user.status === Status.ACTIVE ? "success" : "secondary"}>{user.status}</Badge>,
    },
    {
      key: "salary",
      header: "Salary",
      align: "right",
      render: (user) => `$${user.salary.toLocaleString()}`,
    },
    { key: "joinedAt", header: "Joined At" },
  ];

  async function handleDelete(user: User) {
    await call(() => requester(deleteUserEndpoint, { params: { id: user.id } }));
    tableRef.current?.refetch();
  }

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
    >
      <FeatureTable<User>
        ref={tableRef}
        bordered={false}
        endpoint={getUsersEndpoint}
        columns={columns}
        rowKey="id"
        searchable
        searchPlaceholder="Search users..."
        paginated
        pageSizeOptions={[10, 25, 50]}
        filters={[
          {
            key: "status",
            header: "Status",
            options: [
              { label: "Active", value: Status.ACTIVE },
              { label: "Inactive", value: Status.INACTIVE },
            ],
          },
        ]}
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
            onClick: handleDelete,
          },
        ]}
      />
    </PageShell>
  );
}
