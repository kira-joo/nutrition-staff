"use client";

import { Pencil, Plus, Trash2, ShieldCheck } from "lucide-react";
import { useRef } from "react";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  Badge,
  AppLink,
  FeatureTable,
  PageShell,
  PermissionGuard,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";

import { Role } from "@/common/interfaces/role.interface";
import { AppRoute } from "@/common/routes/app-route";
import { useNavigate } from "@/common/routes/use-navigate";
import { RouteButton } from "@/components/nav/route-button";
import { AppPermission } from "@/common/authorization/app-permission";
import { usePermissions } from "@/common/auth/use-permissions";
import { ENTITY_PLURAL_LABELS } from "@/common/authorization/entity-labels";
import { EntityName } from "@/common/authorization/entity-name.enum";
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
      render: (role) => <Badge variant={role.isActive ? "success" : "secondary"}>{role.isActive ? "Active" : "Inactive"}</Badge>,
    },
  ];

  return (
    <PageShell
      surface
      icon={ShieldCheck}
      title="Roles"
      description="Manage roles and their permissions"
      maxWidth="full"
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
        bordered={false}
        endpoint={getRolesEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.ROLE]}
        searchPlaceholder="Search roles..."
        emptyMessage="No roles match your search"
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
