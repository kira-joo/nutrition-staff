import { hasRequiredPermissions, userHasFullAccess, type AuthUser } from "@kira-joo/backend-toolkit-core";
import { AppPermission } from "src/server/core/authorization/authorization-registry";

export interface DashboardPermissions {
  canViewMeasurements: boolean;
  canViewAssessments: boolean;
  canViewCalculations: boolean;
}

/**
 * Resolved once per dashboard request and used to omit — never merely
 * mask in the UI — sensitive slices of the response. A user without
 * `NUTRITION_ASSESSMENT.READ`, for example, never receives assessment-derived
 * numbers in the first place, regardless of which widgets the frontend
 * chooses to render.
 */
export function resolveDashboardPermissions(user: AuthUser): DashboardPermissions {
  const fullAccess = userHasFullAccess(user);
  return {
    canViewMeasurements: fullAccess || hasRequiredPermissions(user, [AppPermission.CLIENT_MEASUREMENT.READ]),
    canViewAssessments: fullAccess || hasRequiredPermissions(user, [AppPermission.NUTRITION_ASSESSMENT.READ]),
    canViewCalculations: fullAccess || hasRequiredPermissions(user, [AppPermission.NUTRITION_CALCULATION.READ]),
  };
}
