"use client";

import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { useRef } from "react";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  AppLink,
  Badge,
  FeatureFilterType,
  FeatureTable,
  PageShell,
  PermissionGuard,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";

import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { Status } from "src/common/enums";
import { User } from "src/common/interfaces/user.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { RouteButton } from "src/components/nav/route-button";
import { getRolesEndpoint } from "../../../api/role.endpoints";
import { deleteUserEndpoint, getUsersEndpoint } from "../../../api/user.endpoints";

export default function UsersPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteUserEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

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

  return (
    <PageShell
      surface
      icon={Users}
      title="Users"
      description="Manage staff users"
      maxWidth="full"
      actions={
        <PermissionGuard permission={AppPermission.USER.CREATE}>
          <RouteButton path={AppRoute.userCreate} leftIcon={Plus}>
            Add User
          </RouteButton>
        </PermissionGuard>
      }
    >
      <FeatureTable<User, typeof getUsersEndpoint>
        ref={tableRef}
        bordered={false}
        endpoint={getUsersEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.USER]}
        searchPlaceholder="Search users..."
        emptyMessage="No users match your search"
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
            type: FeatureFilterType.COMBOBOX,
            queryKey: "roles",
            endpoint: getRolesEndpoint,
            optionLabel: "name",
            optionValue: "_id",
            placeholder: "Filter by role",
            permission: AppPermission.ROLE.READ,
            endpointQuery: { isActive: true },
          },
        ]}
        columns={columns}
        rowActions={[
          {
            label: "Edit",
            icon: Pencil,
            onClick: (user) => navigate(AppRoute.userUpdate, { id: user._id }),
            hidden: !can(AppPermission.USER.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: (user) => deleteMutation.mutate({ params: { id: user._id } }),
            hidden: !can(AppPermission.USER.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
