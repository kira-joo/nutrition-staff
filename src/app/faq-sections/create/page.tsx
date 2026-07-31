"use client";

import { PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { ListTree } from "lucide-react";
import { createFaqSectionEndpoint } from "../../../../api/faq-section.endpoints";
import { FaqSectionForm } from "src/common/forms/faq-section-form";
import { AppRoute } from "src/common/routes/app-route";

export default function FaqSectionCreatePage() {
  return (
    <PageShell
      icon={ListTree}
      title="Create FAQ Section"
      description="Add a new FAQ section"
      backRoute={{ path: AppRoute.faqSections, label: "Back to FAQ Sections" }}
    >
      <FaqSectionForm endpoint={createFaqSectionEndpoint} />
    </PageShell>
  );
}
