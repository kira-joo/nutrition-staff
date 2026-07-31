"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { HelpCircle } from "lucide-react";
import { createFaqItemEndpoint } from "../../../../api/faq-item.endpoints";
import { FaqItemForm } from "src/common/forms/faq-item-form";
import { AppRoute } from "src/common/routes/app-route";

export default function FaqItemCreatePage() {
  return (
    <PageShell
      icon={HelpCircle}
      title="Create FAQ Item"
      description="Add a new question and answer"
      backRoute={{ path: AppRoute.faqItems, label: "Back to FAQ Items" }}
    >
      <FaqItemForm endpoint={createFaqItemEndpoint} />
    </PageShell>
  );
}
