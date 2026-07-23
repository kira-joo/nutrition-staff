"use client";

import { buildAppHref } from "@kira-joo/frontend-toolkit-core";
import { useRouter } from "next/navigation";

export interface NavigateOptions {
  replace?: boolean;
}

export function useNavigate() {
  const router = useRouter();

  return function navigate<TPath extends string>(
    path: TPath,
    params?: Record<string, string | number>,
    query?: Record<string, unknown>,
    options?: NavigateOptions,
  ) {
    const href = buildAppHref(path, params, query);

    if (options?.replace) {
      router.replace(href);
      return;
    }

    router.push(href);
  };
}
