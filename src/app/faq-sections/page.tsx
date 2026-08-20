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
import { ListTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { deleteFaqSectionEndpoint, getFaqSectionsEndpoint } from "../../../api/faq-section.endpoints";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { FaqSection } from "src/common/interfaces/faq-section.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";

export default function FaqSectionsPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteFaqSectionEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<FaqSection>[] = [
    {
      key: "title",
      header: "Title",
      render: (section) => (
        <AppLink path={AppRoute.faqSectionDetails} params={{ id: section._id }}>
          {section.title?.en || section.title?.ar || "(untitled)"}
        </AppLink>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (section) => (
        <Badge variant={section.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{section.status}</Badge>
      ),
    },
    { key: "order", header: "Order", align: "right" },
  ];

  return (
    <PageShell
      icon={ListTree}
      title="FAQ Sections"
      description="Groups of frequently asked questions shown on the public site"
      actions={
        <RouteButton path={AppRoute.faqSectionCreate} permission={AppPermission.FAQ_SECTION.CREATE} leftIcon={Plus}>
          Add Section
        </RouteButton>
      }
    >
      <FeatureTable<FaqSection, typeof getFaqSectionsEndpoint>
        ref={tableRef}
        endpoint={getFaqSectionsEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.FAQ_SECTION]}
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
            onClick: (section) => navigate(AppRoute.faqSectionUpdate, { id: section._id }),
            hidden: !can(AppPermission.FAQ_SECTION.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            // Names the section rather than saying "this item": the row that was
            // clicked and the row someone meant to click are not always the same.
            confirm: (section) => ({
              title: `Delete ${section.title?.en || section.title?.ar || "this section"}?`,
              description: "This permanently deletes the section and cannot be undone.",
              confirmLabel: "Delete",
            }),
            // `mutateAsync`, so the table can await the real request and show an
            // executing state instead of clearing the moment the click lands.
            onClick: (section) => deleteMutation.mutateAsync({ params: { id: section._id } }),
            hidden: !can(AppPermission.FAQ_SECTION.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
