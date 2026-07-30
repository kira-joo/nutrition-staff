"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { MessageSquareText } from "lucide-react";
import { getReviewByIdEndpoint, updateReviewEndpoint } from "../../../../../api/review.endpoints";
import { ReviewForm } from "src/common/forms/review-form";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { AppRoute } from "src/common/routes/app-route";

export default function ReviewUpdatePage({ params }: { params: { id: string } }) {
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
        <PageShell icon={MessageSquareText} title="Update Review" description="Update testimonial content">
          <ReviewForm defaultValues={review} endpoint={updateReviewEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
