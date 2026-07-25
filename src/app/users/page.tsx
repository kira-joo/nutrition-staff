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

import { Status } from "@/common/enums";
import { User } from "@/common/interfaces/user.interface";
import { AppRoute } from "@/common/routes/app-route";
import { useNavigate } from "@/common/routes/use-navigate";
import { RouteButton } from "@/components/nav/route-button";
import { AppPermission } from "@/common/authorization/app-permission";
import { usePermissions } from "@/common/auth/use-permissions";
import { ENTITY_PLURAL_LABELS } from "@/common/authorization/entity-labels";
import { EntityName } from "@/common/authorization/entity-name.enum";
import { deleteUserEndpoint, getUsersEndpoint } from "../../../api/user.endpoints";
import { getRolesEndpoint } from "../../../api/role.endpoints";

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
