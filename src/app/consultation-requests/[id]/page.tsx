"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  Badge,
  DateText,
  InfoRow,
  PageSection,
  PageShell,
  QueryState,
  RouteButton,
} from "@kira-joo/frontend-toolkit-tailwind";
import { Activity, MessageSquareText, User as UserIcon, UserRoundCog } from "lucide-react";
import { AppPermission } from "src/common/authorization/app-permission";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ConsultationRequestIntent } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";
import { getConsultationRequestByIdEndpoint } from "../../../../api/consultation-request.endpoints";

const INTENT_LABEL: Record<ConsultationRequestIntent, string> = {
  [ConsultationRequestIntent.CONSULTATION]: "Consultation",
  [ConsultationRequestIntent.PACKAGE_INQUIRY]: "Package inquiry",
  [ConsultationRequestIntent.NEWSLETTER]: "Newsletter",
};

export default function ConsultationRequestDetailsPage({ params }: { params: { id: string } }) {
  const requestQuery = useRequesterQuery({
    endpoint: getConsultationRequestByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={requestQuery}
      entityName={EntityName.CONSULTATION_REQUEST}
      backRoute={{ path: AppRoute.consultationRequests, label: "Back to Consultation Requests" }}
    >
      {(request) => (
        <PageShell
          icon={UserIcon}
          title={request.name}
          badge={<Badge variant="secondary">{INTENT_LABEL[request.intent]}</Badge>}
          actions={
            request.clientProfileId && (
              <RouteButton
                path={AppRoute.clientOverview}
                params={{ id: request.clientProfileId._id }}
                permission={AppPermission.CLIENT.READ}
                variant="outline"
                leftIcon={UserRoundCog}
              >
                View client profile
              </RouteButton>
            )
          }
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <PageSection icon={UserIcon} title="Submission">
              <div className="flex flex-col gap-3">
                <InfoRow label="Name" value={request.name} />
                <InfoRow label="Phone" value={request.phone} />
                <InfoRow label="Email" value={request.email || "—"} />
                <InfoRow label="Intent" value={INTENT_LABEL[request.intent]} />
                <InfoRow label="Requested package" value={request.packageKey || "—"} />
                <InfoRow label="IP address" value={request.ip || "—"} />
              </div>
            </PageSection>

            <PageSection icon={Activity} title="Linked CRM identity">
              <div className="flex flex-col gap-3">
                <InfoRow label="User" value={request.userId?.name || "—"} />
                <InfoRow label="User phone" value={request.userId?.phone || "—"} />
                <InfoRow label="User email" value={request.userId?.email || "—"} />
                <InfoRow
                  label="Client status"
                  value={request.clientProfileId ? request.clientProfileId.lifecycle : "No client profile"}
                />
                <InfoRow label="Submitted" value={<DateText value={request.createdAt} />} />
              </div>
            </PageSection>

            <PageSection icon={MessageSquareText} title="Message" className="sm:col-span-2">
              {request.message ? (
                <p className="whitespace-pre-wrap text-sm text-slate-700">{request.message}</p>
              ) : (
                <p className="text-sm text-slate-500">No message was submitted with this request.</p>
              )}
            </PageSection>
          </div>
        </PageShell>
      )}
    </QueryState>
  );
}
