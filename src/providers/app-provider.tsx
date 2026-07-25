"use client";

import type { ReactNode } from "react";
import {
  APIConfig,
  AppLinkConfig,
  AuthUserProvider,
  QueryParamsRouterProvider,
  ToolkitProviders,
  createToolkitQueryClient,
  type AppLinkComponentProps,
} from "@kira-joo/frontend-toolkit-core";
import { Toaster, showApiErrorToast } from "@kira-joo/frontend-toolkit-tailwind";
import Link from "next/link";
import { AppRoute } from "../common/routes/app-route";
import { getAccessToken, removeAccessToken } from "../common/auth/token-storage";
import { usePermissions } from "../common/auth/use-permissions";
import { useNextQueryParamsRouter } from "../common/routes/use-next-query-params-router";

// Module-level (not per-component-mount) on purpose — this is a client-only
// SPA-style app (every data-fetching page is "use client", nothing fetches
// via this client during server rendering), and onUnauthorized (defined
// below, outside of any React component) needs a stable reference to call
// .clear() on when a request comes back 401. createToolkitQueryClient also
// wires the shared retry policy (no retry on deterministic 4xx, one retry
// for network/5xx queries, no retry for mutations) and a single global error
// toast via QueryCache/MutationCache — not APIConfig.onError, which fires
// once per raw fetch attempt (including every retry) and would double-toast
// a retried request. QueryCache/MutationCache fire exactly once per query or
// mutation settling, regardless of retries or how many components observe
// the same query key.
export const queryClient = createToolkitQueryClient({ onError: showApiErrorToast });

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

// Bridges `usePermissions()` (which needs QueryClient context) into
// AuthUserProvider's context, so `PermissionGuard` can resolve the current
// user implicitly instead of every call site threading it through manually.
// Must render inside ToolkitProviders, not alongside it in AppProvider.
function PermissionContextBridge({ children }: { children: ReactNode }) {
  const { user } = usePermissions();
  return <AuthUserProvider user={user}>{children}</AuthUserProvider>;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ToolkitProviders client={queryClient}>
      <QueryParamsRouterProvider useAdapter={useNextQueryParamsRouter}>
        <PermissionContextBridge>{children}</PermissionContextBridge>
      </QueryParamsRouterProvider>
      <Toaster />
    </ToolkitProviders>
  );
}
