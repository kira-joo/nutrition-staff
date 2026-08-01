"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, PageShell, QueryState, Tabs, type TabItem } from "@kira-joo/frontend-toolkit-tailwind";
import { UserRoundCog } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { ClientLifecycle } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";
import { useNavigate } from "src/common/routes/use-navigate";
import { getClientByIdEndpoint } from "../../../../api/client.endpoints";

const LIFECYCLE_BADGE_VARIANT: Record<ClientLifecycle, "success" | "secondary" | "warning" | "destructive"> = {
  [ClientLifecycle.LEAD]: "secondary",
  [ClientLifecycle.PROSPECT]: "secondary",
  [ClientLifecycle.ACTIVE]: "success",
  [ClientLifecycle.PAUSED]: "warning",
  [ClientLifecycle.COMPLETED]: "success",
  [ClientLifecycle.LOST]: "destructive",
};

const TAB_IDS = ["overview", "profile", "measurements", "assessments", "calculations", "interactions"] as const;
type TabId = (typeof TAB_IDS)[number];

const ROUTE_FOR_TAB: Record<TabId, string> = {
  overview: AppRoute.clientOverview,
  profile: AppRoute.clientProfile,
  measurements: AppRoute.clientMeasurements,
  assessments: AppRoute.clientAssessments,
  calculations: AppRoute.clientCalculations,
  interactions: AppRoute.clientInteractions,
};

export default function ClientDetailsLayout({ children, params }: { children: ReactNode; params: { id: string } }) {
  const pathname = usePathname();
  const navigate = useNavigate();
  const { can } = usePermissions();

  const clientQuery = useRequesterQuery({
    endpoint: getClientByIdEndpoint,
    options: { params: { id: params.id } },
  });

  const activeTab = TAB_IDS.find((tabId) => pathname.endsWith(`/${tabId}`)) ?? "overview";

  // Checkpoint 1 only introduces the CLIENT permission entity — Measurements/
  // Assessments/Calculations/Interactions get their own permission entity
  // (and their own `hidden` check here) in the checkpoint that builds them.
  // Until then, every tab is gated on the one permission that exists: being
  // able to view the client at all.
  const canViewClient = can(AppPermission.CLIENT.READ);

  const tabs: TabItem[] = [
    { id: "overview", label: "Overview", hidden: !canViewClient },
    { id: "profile", label: "Profile", hidden: !canViewClient },
    { id: "measurements", label: "Measurements", hidden: !canViewClient },
    { id: "assessments", label: "Assessments", hidden: !canViewClient },
    { id: "calculations", label: "Calculations", hidden: !canViewClient },
    { id: "interactions", label: "Interactions", hidden: !canViewClient },
  ];

  return (
    <QueryState query={clientQuery} entityName="Client" backRoute={{ path: AppRoute.clients, label: "Back to Clients" }}>
      {(client) => (
        <PageShell
          icon={UserRoundCog}
          title={client.userId.name}
          badge={<Badge variant={LIFECYCLE_BADGE_VARIANT[client.lifecycle]}>{client.lifecycle}</Badge>}
        >
          <Tabs
            value={activeTab}
            onChange={(id) => navigate(ROUTE_FOR_TAB[id as TabId], { id: params.id })}
            tabs={tabs}
          />
          <div className="mt-4">{children}</div>
        </PageShell>
      )}
    </QueryState>
  );
}
