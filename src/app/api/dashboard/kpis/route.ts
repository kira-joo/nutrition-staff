import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute } from "src/server/core/route-factories";
import { getDashboardKpis } from "src/server/dashboard/get-dashboard-kpis";
import { DashboardQueryDto } from "src/server/dashboard/dto/dashboard-query.dto";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  query: DashboardQueryDto,
  auth: { permissions: [AppPermission.DASHBOARD.READ] },
  handler: async ({ query, user }) => getDashboardKpis(query, user),
});
