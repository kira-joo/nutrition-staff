export interface ChartDataPoint {
  date: string;
  value: number;
}

export type KpiState = "positive" | "neutral" | "warning" | "negative";

export interface KpiMetric {
  value: number;
  /** Omitted for a live snapshot metric — see each field's own doc comment in `get-dashboard-kpis.ts` for why. */
  previousPeriodValue?: number;
  /** Omitted for a live snapshot metric with no honest history to plot. */
  trend?: ChartDataPoint[];
  state: KpiState;
}

export interface DashboardKpis {
  totalClients: KpiMetric;
  activeClients: KpiMetric;
  todaysFollowUps: KpiMetric;
  overdueFollowUps: KpiMetric;
  newLeads: KpiMetric;
  newClients: KpiMetric;
  /** Present only when the caller has `CLIENT_MEASUREMENT.READ`. */
  measurementsRecorded?: KpiMetric;
  /** Present only when the caller has `NUTRITION_CALCULATION.READ`. */
  nutritionCalculationsSaved?: KpiMetric;
}

export interface DashboardFollowUpRow {
  clientProfileId: string;
  clientName: string;
  clientPhone?: string;
  lifecycle: string;
  assignedStaffName?: string;
  nextFollowUpAt: string;
  lastContactedAt?: string;
}

export interface DashboardFollowUps {
  today: DashboardFollowUpRow[];
  overdue: DashboardFollowUpRow[];
}

export interface DashboardLabeledValue {
  label: string;
  value: number;
  color?: string;
}

export interface DashboardLifecycleChart {
  /** All 6 `ClientLifecycle` values, current snapshot — not affected by the date-range filter. */
  distribution: DashboardLabeledValue[];
  /**
   * The current lifecycle pipeline, ordered Lead → Prospect → Active →
   * Completed. A snapshot, not a historical conversion rate: this app has
   * no lifecycle-transition history to compute a true cohort conversion
   * from, so this must never be labeled or implied as one.
   */
  funnel: DashboardLabeledValue[];
}

export type DashboardSourceChart = DashboardLabeledValue[];

export type DashboardGrowthChart = ChartDataPoint[];

export type DashboardActivityType =
  | "client_created"
  | "interaction"
  | "measurement"
  | "assessment"
  | "calculation";

export interface DashboardActivityEntry {
  type: DashboardActivityType;
  happenedAt: string;
  clientProfileId: string;
  clientName: string;
  summary: string;
}

export type DashboardAttentionReason =
  | "not_contacted_recently"
  | "no_recent_measurement"
  | "no_assessment"
  | "incomplete_profile"
  | "measurement_without_calculation";

export interface DashboardAttentionItem {
  reason: DashboardAttentionReason;
  clientProfileId: string;
  clientName: string;
  detail: string;
}

/**
 * Overdue follow-ups are deliberately NOT repeated here — they're already
 * their own first-class "Overdue Follow-ups" section (see
 * `DashboardFollowUps`), and showing the same clients again in this list
 * would be redundant noise, not more actionable information.
 */
export interface DashboardAttention {
  notContactedRecently: DashboardAttentionItem[];
  noRecentMeasurement: DashboardAttentionItem[];
  noAssessment: DashboardAttentionItem[];
  incompleteProfile: DashboardAttentionItem[];
  measurementWithoutCalculation: DashboardAttentionItem[];
}
