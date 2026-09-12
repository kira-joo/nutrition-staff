"use client";
import { use } from "react";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, PageShell, QueryState, RouteTabs, type RouteTabItem } from "@kira-joo/frontend-toolkit-tailwind";
import { UserRoundCog } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AppPermission } from "src/common/authorization/app-permission";
import { LIFECYCLE_BADGE_VARIANT } from "src/common/badges/badge-variants";
import { AppRoute } from "src/common/routes/app-route";
import { getClientByIdEndpoint } from "../../../../api/client.endpoints";

/**
 * Single source of truth for the Client Details workspace's tabs — id,
 * label, route, and permission all live here once.
 */
const CLIENT_DETAILS_TABS: RouteTabItem<string>[] = [
  { id: "overview", label: "Overview", path: AppRoute.clientOverview, permission: AppPermission.CLIENT.READ },
  { id: "profile", label: "Profile", path: AppRoute.clientProfile, permission: AppPermission.CLIENT.READ },
  {
    id: "measurements",
    label: "Measurements",
    path: AppRoute.clientMeasurements,
    permission: AppPermission.CLIENT_MEASUREMENT.READ,
  },
  {
    id: "assessments",
    label: "Assessments",
    path: AppRoute.clientAssessments,
    permission: AppPermission.NUTRITION_ASSESSMENT.READ,
  },
  {
    id: "calculations",
    label: "Calculations",
    path: AppRoute.clientCalculations,
    permission: AppPermission.NUTRITION_CALCULATION.READ,
  },
  {
    id: "interactions",
    label: "Interactions",
    path: AppRoute.clientInteractions,
    permission: AppPermission.CLIENT_INTERACTION.READ,
  },
];

export default function ClientDetailsLayout(props: { children: ReactNode; params: Promise<{ id: string }> }) {
  const params = use(props.params);

  const { children } = props;

  const pathname = usePathname();
  const router = useRouter();

  const clientQuery = useRequesterQuery({
    endpoint: getClientByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState
      query={clientQuery}
      entityName="Client"
      backRoute={{ path: AppRoute.clients, label: "Back to Clients" }}
    >
      {(client) => (
        <PageShell
          icon={UserRoundCog}
          title={client.userId.name}
          badge={<Badge variant={LIFECYCLE_BADGE_VARIANT[client.lifecycle]}>{client.lifecycle}</Badge>}
        >
          <RouteTabs
            tabs={CLIENT_DETAILS_TABS}
            pathname={pathname}
            params={{ id: params.id }}
            onNavigate={(href) => router.push(href)}
          />
          <div className="mt-4">{children}</div>
        </PageShell>
      )}
    </QueryState>
  );
}
