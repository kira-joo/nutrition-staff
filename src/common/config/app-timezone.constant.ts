/**
 * The clinic's one configured timezone — set once, at both app entry
 * points (`src/providers/app-provider.tsx` for the client, `src/instrumentation.ts`
 * for the server) via `DateTimeConfig.timeZone` (from `@kira-joo/toolkit-common`).
 * Every day-based comparison/calculation and every date-time display/edit
 * defaults to this, so no page/component/form/dashboard query needs to pass
 * a timezone manually.
 */
export const APP_TIMEZONE = "Africa/Cairo";
