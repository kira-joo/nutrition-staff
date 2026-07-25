"use client";

import { Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useRef } from "react";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  AppLink,
  Badge,
  FeatureTable,
  PageShell,
  PermissionGuard,
  RouteButton,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";

import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { Role } from "src/common/interfaces/role.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { deleteRoleEndpoint, getRolesEndpoint } from "../../../api/role.endpoints";

export default function RolesPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteRoleEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<Role>[] = [
    {
      key: "name",
      header: "Name",
      render: (role) => (
        <AppLink path={AppRoute.roleDetails} params={{ id: role._id }}>
          {role.name}
        </AppLink>
      ),
    },
    {
      key: "grantsAll",
      header: "Full access",
      render: (role) => (role.grantsAll ? <Badge variant="success">grantsAll</Badge> : <span>—</span>),
    },
    {
      key: "permissions",
      header: "Permissions",
      render: (role) => (role.grantsAll ? "All" : String(role.permissions.length)),
    },
    {
      key: "isActive",
      header: "Status",
      render: (role) => (
        <Badge variant={role.isActive ? "success" : "secondary"}>{role.isActive ? "Active" : "Inactive"}</Badge>
      ),
    },
  ];

  return (
    <PageShell
      icon={ShieldCheck}
      title="Roles"
      description="Manage roles and their permissions"
      actions={
        <PermissionGuard permission={AppPermission.ROLE.CREATE}>
          <RouteButton path={AppRoute.roleCreate} leftIcon={Plus}>
            Add Role
          </RouteButton>
        </PermissionGuard>
      }
    >
      <FeatureTable<Role, typeof getRolesEndpoint>
        ref={tableRef}
        endpoint={getRolesEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.ROLE]}
        filters={[
          {
            key: "isActive",
            header: "Status",
            options: [
              { label: "Active", value: "true" },
              { label: "Inactive", value: "false" },
            ],
          },
        ]}
        columns={columns}
        rowActions={[
          {
            label: "Edit",
            icon: Pencil,
            onClick: (role) => navigate(AppRoute.roleUpdate, { id: role._id }),
            hidden: !can(AppPermission.ROLE.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: (role) => deleteMutation.mutate({ params: { id: role._id } }),
            hidden: !can(AppPermission.ROLE.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
