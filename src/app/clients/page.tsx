"use client";

import { Pencil, Plus, Trash2, UserRoundCog } from "lucide-react";
import { useRef } from "react";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  AppLink,
  Badge,
  FeatureFilterType,
  FeatureTable,
  PageShell,
  RouteButton,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";

import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ClientLifecycle, ClientSource } from "src/common/enums";
import { Client } from "src/common/interfaces/client.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getUsersEndpoint } from "../../../api/user.endpoints";
import { deleteClientEndpoint, getClientsEndpoint } from "../../../api/client.endpoints";

const LIFECYCLE_BADGE_VARIANT: Record<ClientLifecycle, "success" | "secondary" | "warning" | "destructive"> = {
  [ClientLifecycle.LEAD]: "secondary",
  [ClientLifecycle.PROSPECT]: "secondary",
  [ClientLifecycle.ACTIVE]: "success",
  [ClientLifecycle.PAUSED]: "warning",
  [ClientLifecycle.COMPLETED]: "success",
  [ClientLifecycle.LOST]: "destructive",
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteClientEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const isFollowUpOverdue = (client: Client) => Boolean(client.nextFollowUpAt && new Date(client.nextFollowUpAt) < new Date());

  const columns: TableColumn<Client>[] = [
    {
      key: "name",
      header: "Name",
      render: (client) => (
        <AppLink path={AppRoute.clientOverview} params={{ id: client._id }}>
          {client.userId.name}
        </AppLink>
      ),
    },
    { key: "phone", header: "Phone", render: (client) => client.userId.phone ?? "—" },
    { key: "email", header: "Email", render: (client) => client.userId.email ?? "—" },
    {
      key: "lifecycle",
      header: "Lifecycle",
      render: (client) => <Badge variant={LIFECYCLE_BADGE_VARIANT[client.lifecycle]}>{client.lifecycle}</Badge>,
    },
    { key: "source", header: "Source", render: (client) => client.source ?? "—" },
    { key: "assignedTo", header: "Assigned to", render: (client) => client.assignedToUserId?.name ?? "—" },
    {
      key: "nextFollowUpAt",
      header: "Next follow-up",
      render: (client) =>
        client.nextFollowUpAt ? (
          <span className={isFollowUpOverdue(client) ? "font-medium text-red-600" : undefined}>
            {new Date(client.nextFollowUpAt).toLocaleDateString()}
          </span>
        ) : (
          "—"
        ),
    },
    { key: "tags", header: "Tags", render: (client) => (client.tags.length > 0 ? client.tags.join(", ") : "—") },
  ];

  return (
    <PageShell
      icon={UserRoundCog}
      title="Clients & Leads"
      description="Manage leads, prospects, and clients"
      actions={
        <RouteButton path={AppRoute.clientCreate} permission={AppPermission.CLIENT.CREATE} leftIcon={Plus}>
          Add Client
        </RouteButton>
      }
    >
      <FeatureTable<Client, typeof getClientsEndpoint>
        ref={tableRef}
        endpoint={getClientsEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.CLIENT]}
        filters={[
          {
            key: "lifecycle",
            header: "Lifecycle",
            options: Object.values(ClientLifecycle).map((v) => ({ label: v, value: v })),
          },
          {
            key: "source",
            header: "Source",
            options: Object.values(ClientSource).map((v) => ({ label: v, value: v })),
          },
          {
            type: FeatureFilterType.COMBOBOX,
            queryKey: "assignedToUserId",
            endpoint: getUsersEndpoint,
            optionLabel: "name",
            optionValue: "_id",
            placeholder: "Filter by assigned staff",
          },
          {
            key: "followUpDue",
            header: "Follow-up",
            options: [{ label: "Due or overdue", value: "true" }],
          },
        ]}
        columns={columns}
        rowActions={[
          {
            label: "Edit profile",
            icon: Pencil,
            onClick: (client) => navigate(AppRoute.clientProfile, { id: client._id }),
            hidden: !can(AppPermission.CLIENT.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: (client) => deleteMutation.mutate({ params: { id: client._id } }),
            hidden: !can(AppPermission.CLIENT.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
