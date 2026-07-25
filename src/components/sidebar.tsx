"use client";

import { AppLink, cn } from "@kira-joo/frontend-toolkit-tailwind";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getAccessToken, removeAccessToken } from "../common/auth/token-storage";
import { AppRoute } from "../common/routes/app-route";
import { queryClient } from "../providers/app-provider";
import { AppPermission } from "../common/authorization/app-permission";
import { usePermissions } from "../common/auth/use-permissions";

const NAV_ITEMS = [
  { href: AppRoute.home, label: "Home", permission: undefined as string | undefined },
  { href: AppRoute.users, label: "Users", permission: AppPermission.USER.READ },
  { href: AppRoute.roles, label: "Roles", permission: AppPermission.ROLE.READ },
];

const AUTH_ONLY_ROUTES: string[] = [AppRoute.login, AppRoute.signup];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { can } = usePermissions();

  if (AUTH_ONLY_ROUTES.includes(pathname)) return null;

  function handleLogout() {
    removeAccessToken();
    queryClient.clear();
    router.replace(AppRoute.login);
  }

  const visibleNavItems = NAV_ITEMS.filter((item) => !item.permission || can(item.permission));

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <span className="text-lg font-bold text-slate-900">Nutrition Staff</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {visibleNavItems.map((item) => {
          const isActive = item.href === AppRoute.home ? pathname === AppRoute.home : pathname.startsWith(item.href);

          return (
            <AppLink
              key={item.href}
              path={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              {item.label}
            </AppLink>
          );
        })}
      </nav>
      {getAccessToken() ? (
        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      ) : null}
    </aside>
  );
}
