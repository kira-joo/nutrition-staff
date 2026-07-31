"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, DateText, InfoRow, PageSection, PageShell, QueryState, RouteButton } from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, HelpCircle, Pencil } from "lucide-react";
import { getFaqItemByIdEndpoint } from "../../../../api/faq-item.endpoints";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";

export default function FaqItemDetailsPage({ params }: { params: { id: string } }) {
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
        <PageShell
          icon={HelpCircle}
          title={item.question?.en || item.question?.ar || "FAQ Item"}
          badge={<Badge variant={item.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>{item.status}</Badge>}
          actions={
            <RouteButton
              path={AppRoute.faqItemUpdate}
              params={{ id: item._id }}
              permission={AppPermission.FAQ_ITEM.UPDATE}
              variant="outline"
              leftIcon={Pencil}
            >
              Edit
            </RouteButton>
          }
        >
          <PageSection icon={Activity} title="Details">
            <div className="flex flex-col gap-3">
              <InfoRow label="Section" value={typeof item.section === "string" ? "—" : item.section?.title?.en || "—"} />
              <InfoRow label="Question (EN)" value={item.question?.en || "—"} />
              <InfoRow label="Question (AR)" value={item.question?.ar || "—"} />
              <InfoRow label="Answer (EN)" value={item.answer?.en || "—"} />
              <InfoRow label="Answer (AR)" value={item.answer?.ar || "—"} />
              <InfoRow label="Order" value={item.order} />
              <InfoRow label="Created" value={<DateText value={item.createdAt} />} />
              <InfoRow label="Updated" value={<DateText value={item.updatedAt} />} />
            </div>
          </PageSection>
        </PageShell>
      )}
    </QueryState>
  );
}
