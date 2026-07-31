"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { PageShell, QueryState } from "@kira-joo/frontend-toolkit-tailwind";
import { HelpCircle } from "lucide-react";
import { getFaqItemByIdEndpoint, updateFaqItemEndpoint } from "../../../../../api/faq-item.endpoints";
import { FaqItemForm } from "src/common/forms/faq-item-form";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { AppRoute } from "src/common/routes/app-route";

export default function FaqItemUpdatePage({ params }: { params: { id: string } }) {
  const itemQuery = useRequesterQuery({
    endpoint: getFaqItemByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={itemQuery}
      entityName={EntityName.FAQ_ITEM}
      backRoute={{ path: AppRoute.faqItems, label: "Back to FAQ Items" }}
    >
      {(item) => (
        <PageShell icon={HelpCircle} title="Update FAQ Item" description="Update question and answer">
          <FaqItemForm defaultValues={item} endpoint={updateFaqItemEndpoint} />
        </PageShell>
      )}
    </QueryState>
  );
}
