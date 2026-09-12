"use client";
import { use } from "react";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { ListTree } from "lucide-react";
import { getFaqSectionByIdEndpoint, updateFaqSectionEndpoint } from "../../../../../api/faq-section.endpoints";
import { FaqSectionForm } from "src/common/forms/faq-section-form";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { AppRoute } from "src/common/routes/app-route";

export default function FaqSectionUpdatePage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const sectionQuery = useRequesterQuery({
    endpoint: getFaqSectionByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={sectionQuery}
      entityName={EntityName.FAQ_SECTION}
      backRoute={{ path: AppRoute.faqSections, label: "Back to FAQ Sections" }}
    >
      {(section) => (
        <PageShell icon={ListTree} title="Update FAQ Section" description="Update section details">
          <FaqSectionForm defaultValues={section} endpoint={updateFaqSectionEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
