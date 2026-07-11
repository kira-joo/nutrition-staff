"use client";

import { useState, type ReactNode } from "react";
import { QueryClient } from "@tanstack/react-query";
import { APIConfig, ToolkitProviders } from "@kira-joo/frontend-toolkit-core";
import { Toaster } from "@kira-joo/frontend-toolkit-tailwind";

APIConfig.baseURL = "http://localhost:3001/api";
APIConfig.dynamicHeaders = () => ({});

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
