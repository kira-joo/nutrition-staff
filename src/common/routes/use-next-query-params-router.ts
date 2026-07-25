"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { QueryParamsRouterState } from "@kira-joo/frontend-toolkit-core";

/** The Next.js App Router-backed implementation of `useQueryParamsState`'s router adapter. */
export function useNextQueryParamsRouter(): QueryParamsRouterState {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const navigate = useCallback(
    (nextSearchParams: URLSearchParams, options?: { replace?: boolean }) => {
      const queryString = nextSearchParams.toString();
      const href = queryString ? `${pathname}?${queryString}` : pathname;

      if (options?.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    },
    [router, pathname]
  );

  return { searchParams, navigate };
}
