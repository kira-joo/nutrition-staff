"use client";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  AppLink,
  Badge,
  FeatureTable,
  PageShell,
  RouteButton,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Package as PackageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { deletePackageEndpoint, getPackagesEndpoint } from "src/common/api/package.endpoints";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { Package } from "src/common/interfaces/package.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";

export default function PackagesPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deletePackageEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<Package>[] = [
    {
      key: "name",
      header: "Name",
      render: (pkg) => (
        <AppLink path={AppRoute.packageDetails} params={{ id: pkg._id }}>
          {pkg.name?.en || pkg.name?.ar || "(untitled)"}
        </AppLink>
      ),
    },
    { key: "key", header: "Key" },
    { key: "popular", header: "Popular", render: (pkg) => (pkg.popular ? "Yes" : "—") },
    {
      key: "status",
      header: "Status",
      render: (pkg) => (
        <Badge variant={pkg.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{pkg.status}</Badge>
      ),
    },
    { key: "order", header: "Order", align: "right" },
  ];

  return (
    <PageShell
      icon={PackageIcon}
      title="Packages"
      description="Membership packages shown on the public pricing page"
      actions={
        <RouteButton path={AppRoute.packageCreate} permission={AppPermission.PACKAGE.CREATE} leftIcon={Plus}>
          Add Package
        </RouteButton>
      }
    >
      <FeatureTable<Package, typeof getPackagesEndpoint>
        ref={tableRef}
        endpoint={getPackagesEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.PACKAGE]}
        filters={[
          {
            key: "status",
            header: "Status",
            options: Object.values(ContentStatus).map((value) => ({ label: value, value })),
          },
        ]}
        columns={columns}
        rowActions={[
          {
            label: "Edit",
            icon: Pencil,
            onClick: (pkg) => navigate(AppRoute.packageUpdate, { id: pkg._id }),
            hidden: !can(AppPermission.PACKAGE.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            // Names the package rather than saying "this item": the row that was
            // clicked and the row someone meant to click are not always the same.
            confirm: (pkg) => ({
              title: `Delete ${pkg.name?.en || pkg.name?.ar || "this package"}?`,
              description: "This permanently deletes the package and cannot be undone.",
              confirmLabel: "Delete",
            }),
            // `mutateAsync`, so the table can await the real request and show an
            // executing state instead of clearing the moment the click lands.
            onClick: (pkg) => deleteMutation.mutateAsync({ params: { id: pkg._id } }),
            hidden: !can(AppPermission.PACKAGE.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
