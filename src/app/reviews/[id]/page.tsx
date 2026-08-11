"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  AssetViewer,
  Badge,
  DateText,
  InfoRow,
  PageSection,
  PageShell,
  QueryState,
  RouteButton,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, Image as ImageIcon, MessageSquareText, Pencil, UserRound } from "lucide-react";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";
import { getReviewByIdEndpoint } from "../../../../api/review.endpoints";

export default function ReviewDetailsPage({ params }: { params: { id: string } }) {
  const reviewQuery = useRequesterQuery({
    endpoint: getReviewByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={reviewQuery}
      entityName={EntityName.REVIEW}
      backRoute={{ path: AppRoute.reviews, label: "Back to Reviews" }}
    >
      {(review) => (
        <PageShell
          icon={UserRound}
          title={review.content?.en || review.content?.ar || "Review"}
          badge={
            <Badge variant={review.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{review.status}</Badge>
          }
          actions={
            <RouteButton
              path={AppRoute.reviewUpdate}
              params={{ id: review._id }}
              permission={AppPermission.REVIEW.UPDATE}
              variant="outline"
              leftIcon={Pencil}
            >
              Edit
            </RouteButton>
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PageSection icon={MessageSquareText} title="Content">
              <div className="flex flex-col gap-3">
                <InfoRow label="English" value={review.content?.en || "—"} />
                <InfoRow label="Arabic" value={review.content?.ar || "—"} />
                <InfoRow label="Author name (EN)" value={review.authorName?.en || "—"} />
                <InfoRow label="Author label (EN)" value={review.authorLabel?.en || "—"} />
                <InfoRow label="Source URL" value={review.sourceUrl || "—"} />
              </div>
            </PageSection>
            <PageSection icon={Activity} title="Status & activity">
              <div className="flex flex-col gap-3">
                <InfoRow label="Rating" value={review.rating ? `${review.rating} / 5` : "—"} />
                <InfoRow label="Featured" value={review.featured ? "Yes" : "No"} />
                <InfoRow label="Created" value={<DateText value={review.createdAt} />} />
                <InfoRow label="Updated" value={<DateText value={review.updatedAt} />} />
              </div>
            </PageSection>
            <PageSection icon={ImageIcon} title="Media" className="sm:col-span-2">
              <AssetViewer
                images={[
                  review.image && { key: "image", label: "Photo", asset: review.image },
                  review.beforeImage && { key: "beforeImage", label: "Before", asset: review.beforeImage },
                  review.afterImage && { key: "afterImage", label: "After", asset: review.afterImage },
                ]}
                emptyState={<span className="text-sm text-slate-500">No media</span>}
              />
            </PageSection>
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
