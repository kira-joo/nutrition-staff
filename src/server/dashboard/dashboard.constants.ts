/**
 * Every threshold the dashboard uses, centralized here so a clinical/product
 * decision lives in exactly one documented place — plain constants for now;
 * promote to admin-configurable settings later if the clinic ever wants to
 * self-service tune them (no current need, per the CRM plan's enum-vocabulary
 * precedent).
 */

/** Default date range when the caller supplies neither `from` nor `to`. */
export const DEFAULT_RANGE_DAYS = 30;

/** A range at or under this many days buckets its trend by day. */
export const DAILY_BUCKET_MAX_DAYS = 45;
/** A range at or under this many days (but over `DAILY_BUCKET_MAX_DAYS`) buckets by week; beyond this, by month. */
export const WEEKLY_BUCKET_MAX_DAYS = 180;

/** Cap on the merged recent-activity feed. */
export const RECENT_ACTIVITY_LIMIT = 20;

/**
 * An active client with no measurement in this many days — or, if they have
 * none at all, whose profile is older than this many days — is flagged as
 * needing attention. The creation-grace fallback exists so a client created
 * yesterday with zero measurements isn't flagged as "stale"; they simply
 * haven't had time to get one yet.
 */
export const STALE_MEASUREMENT_DAYS = 60;

/** Same shape as `STALE_MEASUREMENT_DAYS`, applied to `ClientProfile.lastContactedAt` instead of measurements. */
export const NOT_CONTACTED_RECENTLY_DAYS = 30;

/**
 * An active client with no assessment ever, whose profile is older than
 * this many days, is flagged. Shorter than the other two grace windows —
 * an initial assessment is expected early in the relationship, not months in.
 */
export const NO_ASSESSMENT_GRACE_DAYS = 14;

/** A measurement with no linked calculation, older than this many days, is flagged — avoids flagging one recorded moments ago. */
export const MEASUREMENT_WITHOUT_CALCULATION_GRACE_DAYS = 3;

/** A profile is "incomplete" when fewer than this fraction of its optional identity/CRM signals (see `calculateProfileCompleteness`) are filled in. */
export const INCOMPLETE_PROFILE_MAX_RATIO = 0.5;

/** Overdue-follow-up count thresholds driving the "Overdue Follow-ups" KPI card's state color. */
export const OVERDUE_FOLLOW_UPS_WARNING_THRESHOLD = 1;
export const OVERDUE_FOLLOW_UPS_NEGATIVE_THRESHOLD = 10;
