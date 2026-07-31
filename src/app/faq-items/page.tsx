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
import { HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { deleteFaqItemEndpoint, getFaqItemsEndpoint } from "../../../api/faq-item.endpoints";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { FaqItem } from "src/common/interfaces/faq-item.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";

export default function FaqItemsPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteFaqItemEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<FaqItem>[] = [
    {
      key: "question",
      header: "Question",
      render: (item) => (
        <AppLink path={AppRoute.faqItemDetails} params={{ id: item._id }}>
          {item.question?.en || item.question?.ar || "(untitled)"}
        </AppLink>
      ),
    },
    {
      key: "section",
      header: "Section",
      render: (item) => (typeof item.section === "string" ? "—" : item.section?.title?.en || "—"),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge variant={item.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{item.status}</Badge>
      ),
    },
    { key: "order", header: "Order", align: "right" },
  ];

  return (
    <PageShell
      icon={HelpCircle}
      title="FAQ Items"
      description="Individual questions and answers, grouped by section"
      actions={
        <RouteButton path={AppRoute.faqItemCreate} permission={AppPermission.FAQ_ITEM.CREATE} leftIcon={Plus}>
          Add FAQ Item
        </RouteButton>
      }
    >
      <FeatureTable<FaqItem, typeof getFaqItemsEndpoint>
        ref={tableRef}
        endpoint={getFaqItemsEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.FAQ_ITEM]}
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
            onClick: (item) => navigate(AppRoute.faqItemUpdate, { id: item._id }),
            hidden: !can(AppPermission.FAQ_ITEM.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: (item) => deleteMutation.mutate({ params: { id: item._id } }),
            hidden: !can(AppPermission.FAQ_ITEM.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
