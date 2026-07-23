"use client";

import { useState, type ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import {
  APIConfig,
  AppLinkConfig,
  ToolkitProviders,
  type AppLinkComponentProps,
} from "@kira-joo/frontend-toolkit-core";
import { Toaster } from "@kira-joo/frontend-toolkit-tailwind";
import Link from "next/link";

APIConfig.baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";
APIConfig.dynamicHeaders = () => ({});

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
  const [client] = useState(() => new QueryClient());

  return (
    <ToolkitProviders client={client}>
      {children}
      <Toaster />
    </ToolkitProviders>
  );
}
