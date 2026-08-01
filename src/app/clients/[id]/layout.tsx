"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import { Badge, PageShell, QueryState, RouteTabs, type RouteTabItem } from "@kira-joo/frontend-toolkit-tailwind";
import { UserRoundCog } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { AppPermission } from "src/common/authorization/app-permission";
import { ClientLifecycle } from "src/common/enums";
import { AppRoute } from "src/common/routes/app-route";
import { getClientByIdEndpoint } from "../../../../api/client.endpoints";

const LIFECYCLE_BADGE_VARIANT: Record<ClientLifecycle, "success" | "secondary" | "warning" | "destructive"> = {
  [ClientLifecycle.LEAD]: "secondary",
  [ClientLifecycle.PROSPECT]: "secondary",
  [ClientLifecycle.ACTIVE]: "success",
  [ClientLifecycle.PAUSED]: "warning",
  [ClientLifecycle.COMPLETED]: "success",
  [ClientLifecycle.LOST]: "destructive",
};

/**
 * Single source of truth for the Client Details workspace's tabs — id,
 * label, route, and permission all live here once. Measurements/
 * Assessments/Calculations/Interactions are all gated on `CLIENT.READ` for
 * now because their own permission entities don't exist until the
 * checkpoint that builds them — update each tab's `permission` to its real
 * entity at that point; nothing else about this config needs to change.
 */
const CLIENT_DETAILS_TABS: RouteTabItem<string>[] = [
  { id: "overview", label: "Overview", path: AppRoute.clientOverview, permission: AppPermission.CLIENT.READ },
  { id: "profile", label: "Profile", path: AppRoute.clientProfile, permission: AppPermission.CLIENT.READ },
  {
    id: "measurements",
    label: "Measurements",
    path: AppRoute.clientMeasurements,
    permission: AppPermission.CLIENT.READ,
  },
  {
    id: "assessments",
    label: "Assessments",
    path: AppRoute.clientAssessments,
    permission: AppPermission.CLIENT.READ,
  },
  {
    id: "calculations",
    label: "Calculations",
    path: AppRoute.clientCalculations,
    permission: AppPermission.CLIENT.READ,
  },
  {
    id: "interactions",
    label: "Interactions",
    path: AppRoute.clientInteractions,
    permission: AppPermission.CLIENT.READ,
  },
];

export default function ClientDetailsLayout({ children, params }: { children: ReactNode; params: { id: string } }) {
  const pathname = usePathname();
  const router = useRouter();

  const clientQuery = useRequesterQuery({
    endpoint: getClientByIdEndpoint,
    options: { params: { id: params.id } },
  });

  return (
    <QueryState query={clientQuery} entityName="Client" backRoute={{ path: AppRoute.clients, label: "Back to Clients" }}>
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
