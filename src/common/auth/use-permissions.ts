"use client";

import { hasPermission } from "@kira-joo/frontend-toolkit-core";
import { useCurrentUser } from "./use-current-user";

/** Thin wrapper over `useCurrentUser()` + the toolkit's `hasPermission` (already null-tolerant). */
export function usePermissions() {
  const { data: user } = useCurrentUser();

  return {
    user,
    can: (permissionCode: string): boolean => hasPermission(user, permissionCode),
  };
}
