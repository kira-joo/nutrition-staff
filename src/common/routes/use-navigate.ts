"use client";

import { buildAppHref, type ExtractRouteParams } from "@kira-joo/frontend-toolkit-core";
import { useRouter } from "next/navigation";

export interface NavigateOptions {
  replace?: boolean;
}

/**
 * `params` is required or optional depending on `path` — same
 * `RouteParamsForPath` contract as `AppLink`/`RouteButton`, adapted to a
 * positional-args function via a conditional rest tuple (an object-props
 * merge isn't available here). Passing `{ clientId: ... }` for a route
 * whose placeholder is `[id]` is a compile error, not a silent no-op.
 */
type NavigateArgs<TPath extends string> = keyof ExtractRouteParams<TPath> extends never
  ? [params?: ExtractRouteParams<TPath>, query?: Record<string, unknown>, options?: NavigateOptions]
  : [params: ExtractRouteParams<TPath>, query?: Record<string, unknown>, options?: NavigateOptions];

export function useNavigate() {
  const router = useRouter();

  return function navigate<TPath extends string>(path: TPath, ...args: NavigateArgs<TPath>) {
    const [params, query, options] = args;
    const href = buildAppHref(path, params as Record<string, string | number> | undefined, query);

    if (options?.replace) {
      router.replace(href);
      return;
    }

    router.push(href);
  };
}
