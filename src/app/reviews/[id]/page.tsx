"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, DateText, InfoRow, PageSection, PageShell, QueryState, RouteButton } from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, Image as ImageIcon, MessageSquareText, Pencil, UserRound } from "lucide-react";
import { getReviewByIdEndpoint } from "../../../../api/review.endpoints";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";

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
            <Badge variant={review.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>
              {review.status}
            </Badge>
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
                <InfoRow label="Featured" value={review.featured ? "Yes" : "No"} />
                <InfoRow label="Order" value={review.order} />
                <InfoRow label="Created" value={<DateText value={review.createdAt} />} />
                <InfoRow label="Updated" value={<DateText value={review.updatedAt} />} />
              </div>
            </PageSection>
            <PageSection icon={ImageIcon} title="Media" className="sm:col-span-2">
              <div className="flex flex-wrap gap-4">
                {review.image ? <img src={review.image.secureUrl} alt="" className="h-32 w-32 rounded-md object-cover" /> : null}
                {review.beforeImage ? (
                  <img src={review.beforeImage.secureUrl} alt="Before" className="h-32 w-32 rounded-md object-cover" />
                ) : null}
                {review.afterImage ? (
                  <img src={review.afterImage.secureUrl} alt="After" className="h-32 w-32 rounded-md object-cover" />
                ) : null}
                {!review.image && !review.beforeImage && !review.afterImage ? (
                  <span className="text-sm text-slate-500">No media</span>
                ) : null}
              </div>
            </PageSection>
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
