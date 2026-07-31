"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, DateText, InfoRow, PageSection, PageShell, QueryState, RouteButton } from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, ListTree, Pencil } from "lucide-react";
import { getFaqSectionByIdEndpoint } from "../../../../api/faq-section.endpoints";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";

export default function FaqSectionDetailsPage({ params }: { params: { id: string } }) {
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
        <PageShell
          icon={ListTree}
          title={section.title?.en || section.title?.ar || "FAQ Section"}
          badge={
            <Badge variant={section.status === ContentStatus.PUBLISHED ? "success" : "secondary"}>
              {section.status}
            </Badge>
          }
          actions={
            <RouteButton
              path={AppRoute.faqSectionUpdate}
              params={{ id: section._id }}
              permission={AppPermission.FAQ_SECTION.UPDATE}
              variant="outline"
              leftIcon={Pencil}
            >
              Edit
            </RouteButton>
          }
        >
          <PageSection icon={Activity} title="Details">
            <div className="flex flex-col gap-3">
              <InfoRow label="English" value={section.title?.en || "—"} />
              <InfoRow label="Arabic" value={section.title?.ar || "—"} />
              <InfoRow label="Order" value={section.order} />
              <InfoRow label="Created" value={<DateText value={section.createdAt} />} />
              <InfoRow label="Updated" value={<DateText value={section.updatedAt} />} />
            </div>
          </PageSection>
        </PageShell>
      )}
    </QueryState>
  );
}
