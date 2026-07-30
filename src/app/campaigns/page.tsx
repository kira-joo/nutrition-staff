"use client";

import { useRequesterMutation } from "@kira-joo/frontend-toolkit-core";
import {
  AppLink,
  Badge,
  DateText,
  FeatureTable,
  PageShell,
  RouteButton,
  type FeatureTableHandle,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Megaphone, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { deleteCampaignEndpoint, getCampaignsEndpoint } from "../../../api/campaign.endpoints";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { Campaign } from "src/common/interfaces/campaign.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";

export default function CampaignsPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteCampaignEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<Campaign>[] = [
    {
      key: "title",
      header: "Title",
      render: (campaign) => (
        <AppLink path={AppRoute.campaignDetails} params={{ id: campaign._id }}>
          {campaign.title?.en || campaign.title?.ar || "(untitled)"}
        </AppLink>
      ),
    },
    { key: "slug", header: "Slug" },
    {
      key: "status",
      header: "Status",
      render: (campaign) => (
        <Badge variant={campaign.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{campaign.status}</Badge>
      ),
    },
    { key: "startDate", header: "Start", render: (campaign) => <DateText value={campaign.startDate} /> },
    { key: "endDate", header: "End", render: (campaign) => <DateText value={campaign.endDate} /> },
  ];

  return (
    <PageShell
      icon={Megaphone}
      title="Campaigns"
      description="Marketing campaigns built from reorderable content blocks"
      actions={
        <RouteButton path={AppRoute.campaignCreate} permission={AppPermission.CAMPAIGN.CREATE} leftIcon={Plus}>
          Add Campaign
        </RouteButton>
      }
    >
      <FeatureTable<Campaign, typeof getCampaignsEndpoint>
        ref={tableRef}
        endpoint={getCampaignsEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.CAMPAIGN]}
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
            onClick: (campaign) => navigate(AppRoute.campaignDetails, { id: campaign._id }),
            hidden: !can(AppPermission.CAMPAIGN.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: (campaign) => deleteMutation.mutate({ params: { campaignId: campaign._id } }),
            hidden: !can(AppPermission.CAMPAIGN.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
