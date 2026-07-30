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
import { MessageSquareQuote, Pencil, Plus, Trash2 } from "lucide-react";
import { useRef } from "react";
import { deleteReviewEndpoint, getReviewsEndpoint } from "../../../api/review.endpoints";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ENTITY_PLURAL_LABELS } from "src/common/authorization/entity-labels";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { Review } from "src/common/interfaces/review.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";

export default function ReviewsPage() {
  const navigate = useNavigate();
  const tableRef = useRef<FeatureTableHandle>(null);
  const { can } = usePermissions();

  const deleteMutation = useRequesterMutation({
    endpoint: deleteReviewEndpoint,
    onSuccess: () => tableRef.current?.refetch(),
  });

  const columns: TableColumn<Review>[] = [
    {
      key: "content",
      header: "Content",
      render: (review) => (
        <AppLink path={AppRoute.reviewDetails} params={{ id: review._id }}>
          {review.content?.en || review.content?.ar || (review.image ? "(image only)" : "(untitled)")}
        </AppLink>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (review) => (
        <Badge variant={review.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{review.status}</Badge>
      ),
    },
    { key: "featured", header: "Featured", render: (review) => (review.featured ? "Yes" : "—") },
    { key: "order", header: "Order", align: "right" },
  ];

  return (
    <PageShell
      icon={MessageSquareQuote}
      title="Reviews"
      description="Manage client testimonials shown on the public site"
      actions={
        <RouteButton path={AppRoute.reviewCreate} permission={AppPermission.REVIEW.CREATE} leftIcon={Plus}>
          Add Review
        </RouteButton>
      }
    >
      <FeatureTable<Review, typeof getReviewsEndpoint>
        ref={tableRef}
        endpoint={getReviewsEndpoint}
        entityName={ENTITY_PLURAL_LABELS[EntityName.REVIEW]}
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
            onClick: (review) => navigate(AppRoute.reviewUpdate, { id: review._id }),
            hidden: !can(AppPermission.REVIEW.UPDATE),
          },
          {
            label: "Delete",
            icon: Trash2,
            destructive: true,
            onClick: (review) => deleteMutation.mutate({ params: { id: review._id } }),
            hidden: !can(AppPermission.REVIEW.DELETE),
          },
        ]}
      />
    </PageShell>
  );
}
