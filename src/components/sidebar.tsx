"use client";

import { AppLink, cn } from "@kira-joo/frontend-toolkit-tailwind";
import { LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { getAccessToken, removeAccessToken } from "../common/auth/token-storage";
import { AppRoute } from "../common/routes/app-route";
import { queryClient } from "../providers/app-provider";

const NAV_ITEMS = [
  { href: AppRoute.home, label: "Home" },
  { href: AppRoute.users, label: "Users" },
  { href: AppRoute.roles, label: "Roles" },
];

const AUTH_ONLY_ROUTES: string[] = [AppRoute.login, AppRoute.signup];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  if (AUTH_ONLY_ROUTES.includes(pathname)) return null;

  function handleLogout() {
    removeAccessToken();
    queryClient.clear();
    router.replace(AppRoute.login);
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <span className="text-lg font-bold text-slate-900">Nutrition Staff</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {NAV_ITEMS.map((item) => {
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
