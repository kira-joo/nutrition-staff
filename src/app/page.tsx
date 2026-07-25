import { AppLink, PageShell } from "@kira-joo/frontend-toolkit-tailwind";
import { AppRoute } from "src/common/routes/app-route";

export default function HomePage() {
  return (
    <PageShell maxWidth="lg">
      <div className="flex flex-col items-center gap-6 py-12 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Nutrition Staff</h1>
        <p className="text-slate-600">
          A small User Management smoke test for <code>@kira-joo/frontend-toolkit-core</code> and{" "}
          <code>@kira-joo/frontend-toolkit-tailwind</code>.
        </p>
        <AppLink
          path={AppRoute.users}
          variant="unstyled"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Go to Users
        </AppLink>
      </div>
    </PageShell>
  );
}
