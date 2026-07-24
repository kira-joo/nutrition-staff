"use client";

import type { ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import {
  APIConfig,
  AppLinkConfig,
  ToolkitProviders,
  type AppLinkComponentProps,
} from "@kira-joo/frontend-toolkit-core";
import { Toaster } from "@kira-joo/frontend-toolkit-tailwind";
import Link from "next/link";
import { AppRoute } from "../common/routes/app-route";
import { getAccessToken, removeAccessToken } from "../common/auth/token-storage";

// Module-level (not per-component-mount) on purpose — this is a client-only
// SPA-style app (every data-fetching page is "use client", nothing fetches
// via this client during server rendering), and onUnauthorized (defined
// below, outside of any React component) needs a stable reference to call
// .clear() on when a request comes back 401.
export const queryClient = new QueryClient();

APIConfig.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

APIConfig.dynamicHeaders = (): Record<string, string> => {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

APIConfig.onUnauthorized = () => {
  removeAccessToken();
  queryClient.clear();
  // Avoid a redirect loop when the failing request originates from the
  // login page itself (e.g. a wrong-password attempt is also a 401).
  if (typeof window !== "undefined" && window.location.pathname !== AppRoute.login) {
    window.location.assign(AppRoute.login);
  }
};

// Next's Link isn't directly assignable to AppLinkConfig.Component (its
// `href: Url` prop type conflicts with AppLinkComponentProps's `href: string`
// at the propTypes-validator level) — this adapter narrows it to match.
function NextAppLink({ href, children, className, ...rest }: AppLinkComponentProps) {
  return (
    <Link href={href} className={className} {...rest}>
      {children}
    </Link>
  );
}

AppLinkConfig.Component = NextAppLink;

export interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ToolkitProviders client={queryClient}>
      {children}
      <Toaster />
    </ToolkitProviders>
  );
}
