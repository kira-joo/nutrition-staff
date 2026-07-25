"use client";

import { SideNavLayout, SideNavProvider } from "@kira-joo/frontend-toolkit-tailwind";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppRoute } from "../common/routes/app-route";
import { AuthGuard } from "./auth/auth-guard";
import { Sidebar } from "./sidebar";

const AUTH_ONLY_ROUTES: string[] = [AppRoute.login, AppRoute.signup];

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  if (AUTH_ONLY_ROUTES.includes(pathname)) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <SideNavProvider persistCollapsed>
      <SideNavLayout sidebar={<Sidebar />}>
        <AuthGuard>{children}</AuthGuard>
      </SideNavLayout>
    </SideNavProvider>
  );
}
