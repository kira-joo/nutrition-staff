"use client";

import { Pencil, Plus, Trash2, ShieldCheck } from "lucide-react";
import { useRef } from "react";

import { requester } from "@kira-joo/frontend-toolkit-core";
import {
  Badge,
  AppLink,
  FeatureTable,
  PageShell,
  useErrorHandler,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";

import { Role } from "@/common/interfaces/role.interface";
import { AppRoute } from "@/common/routes/app-route";
import { useNavigate } from "@/common/routes/use-navigate";
import { RouteButton } from "@/components/nav/route-button";
import { deleteRoleEndpoint, getRolesEndpoint } from "../../../api/role.endpoints";

export default function RolesPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { call } = useErrorHandler();

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

  async function handleDelete(role: Role) {
    await call(() => requester(deleteRoleEndpoint, { params: { id: role._id } }));
    tableRef.current?.refetch();
  }

  return (
    <PageShell
      surface
      icon={ShieldCheck}
      title="Roles"
      description="Manage roles and their permissions"
      maxWidth="full"
      actions={
        <RouteButton path={AppRoute.roleCreate} leftIcon={Plus}>
          Add Role
        </RouteButton>
      }
    >
      <FeatureTable<Role>
        ref={tableRef}
        bordered={false}
        endpoint={getRolesEndpoint}
        columns={columns}
        rowKey="_id"
        searchable
        searchPlaceholder="Search roles..."
        paginated
        pageSizeOptions={[10, 25, 50]}
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
        emptyMessage="No roles match your search"
        rowActions={[
          {
            label: "Edit",
            icon: Pencil,
            onClick: (role) => navigate(AppRoute.roleUpdate, { id: role._id }),
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
