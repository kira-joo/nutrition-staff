"use client";
import { AppLink, PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { usePermissions } from "src/common/auth/use-permissions";
import { AppPermission } from "src/common/authorization/app-permission";
import { AppRoute } from "src/common/routes/app-route";

export default function HomePage() {
  const { can } = usePermissions();
  const canDashboardRead = can(AppPermission.DASHBOARD.READ);
  return (
    <PageShell maxWidth="full">
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Nutrition Staff</h1>
        <p className="text-slate-600">Welcome</p>
        {canDashboardRead && (
          <AppLink
            path={AppRoute.dashboard}
            variant="unstyled"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Go to Dashboard
          </AppLink>
        )}
      </div>
    </PageShell>
  );
}
