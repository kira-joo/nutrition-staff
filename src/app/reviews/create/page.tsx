"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { MessageSquarePlus } from "lucide-react";
import { createReviewEndpoint } from "../../../../api/review.endpoints";
import { ReviewForm } from "src/common/forms/review-form";
import { AppRoute } from "src/common/routes/app-route";

export default function ReviewCreatePage() {
  return (
    <PageShell
      icon={MessageSquarePlus}
      title="Create Review"
      description="Add a new client testimonial"
      backRoute={{ path: AppRoute.reviews, label: "Back to Reviews" }}
    >
      <ReviewForm endpoint={createReviewEndpoint} />
    </PageShell>
  );
}
