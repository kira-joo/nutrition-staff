"use client";

import { Eye, Inbox, UserRoundCog } from "lucide-react";

import {
  Badge,
  DateText,
  FeatureTable,
  PageShell,
  type TableColumn,
} from "@kira-joo/frontend-toolkit-tailwind";

import { ClientLifecycle, ConsultationRequestIntent } from "src/common/enums";
import { ConsultationRequest } from "src/common/interfaces/consultation-request.interface";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getConsultationRequestsEndpoint } from "../../../api/consultation-request.endpoints";

const INTENT_LABEL: Record<ConsultationRequestIntent, string> = {
  [ConsultationRequestIntent.CONSULTATION]: "Consultation",
  [ConsultationRequestIntent.PACKAGE_INQUIRY]: "Package inquiry",
  [ConsultationRequestIntent.NEWSLETTER]: "Newsletter",
};

const LIFECYCLE_BADGE_VARIANT: Record<ClientLifecycle, "success" | "secondary" | "warning" | "destructive"> = {
  [ClientLifecycle.LEAD]: "secondary",
  [ClientLifecycle.PROSPECT]: "secondary",
  [ClientLifecycle.ACTIVE]: "success",
  [ClientLifecycle.PAUSED]: "warning",
  [ClientLifecycle.COMPLETED]: "success",
  [ClientLifecycle.LOST]: "destructive",
};

/**
 * Read-only submission log — there is deliberately no create/edit/delete
 * here. The only writer is the public consultation-request endpoint; this
 * page exists so a real form submission from nutrition-client is actually
 * visible to staff, which it previously wasn't (see the
 * ConsultationRequest schema's own doc comment for why a ClientProfile
 * alone can't represent this — a returning lead's second submission left
 * its message nowhere retrievable).
 */
export default function ConsultationRequestsPage() {
  const navigate = useNavigate();

  const columns: TableColumn<ConsultationRequest>[] = [
    { key: "name", header: "Name", render: (request) => request.name },
    { key: "phone", header: "Phone", render: (request) => request.phone },
    {
      key: "email",
      header: "Email",
      className: "max-w-[180px] truncate",
      render: (request) => request.email ?? "—",
    },
    {
      key: "intent",
      header: "Intent",
      render: (request) => <Badge variant="secondary">{INTENT_LABEL[request.intent]}</Badge>,
    },
    { key: "packageKey", header: "Requested package", render: (request) => request.packageKey ?? "—" },
    {
      key: "message",
      header: "Message",
      className: "max-w-[240px] truncate",
      render: (request) => request.message || "—",
    },
    {
      key: "clientStatus",
      header: "Client status",
      render: (request) =>
        request.clientProfileId ? (
          <Badge variant={LIFECYCLE_BADGE_VARIANT[request.clientProfileId.lifecycle]}>{request.clientProfileId.lifecycle}</Badge>
        ) : (
          "—"
        ),
    },
    {
      key: "createdAt",
      header: "Submitted",
      render: (request) => <DateText value={request.createdAt} />,
    },
  ];

  return (
    <PageShell icon={Inbox} title="Consultation Requests" description="Submissions from the public website's consultation form">
      <FeatureTable<ConsultationRequest, typeof getConsultationRequestsEndpoint>
        endpoint={getConsultationRequestsEndpoint}
        entityName="Consultation Requests"
        filters={[
          {
            key: "intent",
            header: "Intent",
            options: Object.values(ConsultationRequestIntent).map((value) => ({ label: INTENT_LABEL[value], value })),
          },
        ]}
        columns={columns}
        rowActions={[
          {
            label: "View request",
            icon: Eye,
            onClick: (request) => navigate(AppRoute.consultationRequestDetails, { id: request._id }),
          },
          {
            label: "View client profile",
            icon: UserRoundCog,
            onClick: (request) => navigate(AppRoute.clientOverview, { id: request.clientProfileId!._id }),
            hidden: (request) => !request.clientProfileId,
          },
        ]}
      />
    </PageShell>
  );
}
