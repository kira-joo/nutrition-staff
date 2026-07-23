"use client";

import { buildAppHref } from "@kira-joo/frontend-toolkit-core";
import { useRouter } from "next/navigation";
import { CustomButton, type CustomButtonProps } from "@kira-joo/frontend-toolkit-tailwind";

export interface RouteButtonProps extends Omit<CustomButtonProps, "onClick"> {
  path: string;
  params?: Record<string, string | number>;
  query?: Record<string, unknown>;
  replace?: boolean;
}

export function RouteButton({ path, params, query, replace, ...buttonProps }: RouteButtonProps) {
  const router = useRouter();
  const href = buildAppHref(path, params, query);

  return <CustomButton onClick={() => (replace ? router.replace(href) : router.push(href))} {...buttonProps} />;
}
