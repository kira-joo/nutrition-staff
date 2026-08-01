/** Effectively one value for v1 — the unified Nutrition Calculation Workspace produces one multi-metric run per calculation. Kept extensible for a future, genuinely different calculation family (which would get its own type value, not a redesign of this one). */
export enum CalculationType {
  NUTRITION_WORKSPACE = "nutrition_workspace",
}
