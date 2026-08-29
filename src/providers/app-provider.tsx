"use client";

import type { ReactNode } from "react";
import {
  APIConfig,
  AppLinkConfig,
  AuthUserProvider,
  Logger,
  QueryParamsRouterProvider,
  ToolkitProviders,
  createToolkitQueryClient,
  type AppLinkComponentProps,
} from "@kira-joo/frontend-toolkit-core";
import { Toaster, showApiErrorToast } from "@kira-joo/frontend-toolkit-tailwind";
import { DialogProvider } from "@kira-joo/frontend-toolkit-tailwind/dialog";
import { DateTimeConfig } from "@kira-joo/toolkit-common";
import Link from "next/link";
import { APP_TIMEZONE } from "../common/config/app-timezone.constant";
import { DIALOG_LABELS } from "../common/config/dialog-labels.constant";
import { AppRoute } from "../common/routes/app-route";
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

// Gates buildAppHref's unresolved-route-param throw (dev/test only, logs
// instead in production) and Logger.log/.warn — set once, at the same
// module-load point as the rest of this file's global config.
Logger.env = process.env.NODE_ENV;

// The clinic's one configured timezone — every DateText/CustomDatePicker
// display and edit defaults to this, so no page/component/form needs to
// pass it manually. See src/common/config/app-timezone.constant.ts.
DateTimeConfig.timeZone = APP_TIMEZONE;

APIConfig.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

/*
 * No dynamicHeaders. The session is an HttpOnly cookie the browser attaches to
 * every same-origin request by itself — `fetch` defaults to
 * `credentials: "same-origin"`, and this app's API is same-origin.
 *
 * There is deliberately nothing here to read a token from. That is the point of
 * the architecture: a credential JavaScript can attach is a credential
 * JavaScript can leak.
 */

APIConfig.onUnauthorized = () => {
  /*
   * Nothing local to remove — the cookie is HttpOnly and only the backend can
   * clear it. A 401 means it is already invalid, expired, or gone, so dropping
   * cached data and redirecting is the whole job.
   *
   * ## Never remove a query that is still in flight
   *
   * This handler runs while the response that triggered it is still being
   * processed, so the rejection has not reached its own query yet. A plain
   * `queryClient.clear()` removes that query mid-flight, the 401 is never
   * applied to it, and it never reaches `error` — any component gating on
   * `isLoading` then waits forever. Observed, not deduced:
   *
   *   cache:added     status=pending  fetchStatus=idle
   *   cache:updated   status=pending  fetchStatus=fetching
   *   onUnauthorized  FIRED
   *   cache:removed   status=pending  fetchStatus=fetching   <-- mid-flight
   *
   * `/login` hit it first because `GuestGuard` gates on exactly that, and a 401
   * there is the expected answer rather than a session ending — so nothing
   * navigated away and the spinner stayed forever.
   *
   * Two fixes were tried and rejected before this one, both recorded in
   * `unauthorized-handler.test.tsx` so they are not tried again:
   *
   *   - Skipping the clear on `/login`. Closes that route and no other; the
   *     test proves it by failing on `/account`.
   *   - Deferring the clear to a later task. The query settles, is then
   *     removed, its observer refetches, that request 401s, and the handler
   *     fires again — a loop instead of a hang.
   *
   * Skipping only the in-flight queries needs no route knowledge and holds
   * everywhere: the request that just failed settles normally, and every stale
   * authenticated query is still dropped, which is what clearing was for.
   */
  queryClient.removeQueries({
    predicate: (query) => query.state.fetchStatus !== "fetching",
  });

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
        {/* Every dialog surface — the imperative `openDialog` stack and the
            declarative `<Modal>` alike — registers with this provider, which
            owns the shared layer/focus/scroll-lock coordinator and the default
            copy. Mounted inside the router provider so a dialog can navigate,
            and above the shell so a dialog opened anywhere is coordinated by
            one stack. The toast root deliberately stays a sibling: it sits at
            z-[100], above the dialog range (60-69), so a toast raised from
            inside a dialog is still visible over it. */}
        <DialogProvider labels={DIALOG_LABELS}>
          <PermissionContextBridge>{children}</PermissionContextBridge>
        </DialogProvider>
      </QueryParamsRouterProvider>
      <Toaster />
    </ToolkitProviders>
  );
}
