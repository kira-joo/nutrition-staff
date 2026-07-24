"use client";

import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRef } from "react";

import { requester, useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  AppLink,
  Badge,
  FeatureTable,
  PageShell,
  useErrorHandler,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";

import { Status } from "@/common/enums";
import { User } from "@/common/interfaces/user.interface";
import { AppRoute } from "@/common/routes/app-route";
import { useNavigate } from "@/common/routes/use-navigate";
import { RouteButton } from "@/components/nav/route-button";
import { deleteUserEndpoint, getUsersEndpoint } from "../../../api/user.endpoints";
import { getRolesEndpoint } from "../../../api/role.endpoints";

export default function UsersPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { call } = useErrorHandler();
  const rolesQuery = useRequesterQuery({ endpoint: getRolesEndpoint });
  const roleFilterOptions = (rolesQuery.data?.data ?? []).map((role) => ({ label: role.name, value: role._id }));

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => (
        <AppLink path={AppRoute.userDetails} params={{ id: user._id }}>
          {user.name}
        </AppLink>
      ),
    },
    { key: "email", header: "Email" },
    {
      key: "roles",
      header: "Roles",
      render: (user) => (user.roles.length > 0 ? user.roles.map((role) => role.name).join(", ") : "—"),
    },
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
    await call(() => requester(deleteUserEndpoint, { params: { id: user._id } }));
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
        rowKey="_id"
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
          {
            key: "roles",
            header: "Role",
            options: roleFilterOptions,
          },
        ]}
        emptyMessage="No users match your search"
        rowActions={[
          {
            label: "Edit",
            icon: Pencil,
            onClick: (user) => navigate(AppRoute.userUpdate, { id: user._id }),
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
