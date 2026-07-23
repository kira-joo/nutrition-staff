"use client";

import { useRouter } from "next/navigation";
import { CustomButton, type CustomButtonProps } from "@kira-joo/frontend-toolkit-tailwind";

export interface NavigateButtonProps extends Omit<CustomButtonProps, "onClick"> {
  href: string;
  replace?: boolean;
}

export function NavigateButton({ href, replace, ...buttonProps }: NavigateButtonProps) {
  const router = useRouter();

  return <CustomButton onClick={() => (replace ? router.replace(href) : router.push(href))} {...buttonProps} />;
}
