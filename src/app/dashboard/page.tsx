"use client";

import { useRequesterQuery } from "@kira-joo/frontend-toolkit-core";
import {
  ActionableList,
  AppLink,
  Badge,
  ChartCard,
  CustomSelect,
  DashboardFilterBar,
  DateText,
  DonutChart,
  KpiCard,
  LineChart,
  PageShell,
  QueryState,
  Timeline,
  type DashboardDateRange,
} from "@kira-joo/frontend-toolkit-tailwind";
import {
  AlertTriangle,
  CalendarClock,
  FlaskConical,
  Ruler,
  UserPlus,
  UserRoundCheck,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppRoute } from "src/common/routes/app-route";
import { ClientLifecycle, ProfileType } from "src/common/enums";
import {
  getDashboardActivityEndpoint,
  getDashboardAttentionEndpoint,
  getDashboardFollowUpsEndpoint,
  getDashboardGrowthChartEndpoint,
  getDashboardKpisEndpoint,
  getDashboardLifecycleChartEndpoint,
  getDashboardSourceChartEndpoint,
} from "../../../api/dashboard.endpoints";
import { getUsersEndpoint } from "../../../api/user.endpoints";

const RANGE_PRESETS = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "3m", label: "Last 3 months" },
  { id: "year", label: "This year" },
  { id: "custom", label: "Custom range" },
];

const LIFECYCLE_BADGE_VARIANT: Record<string, "success" | "secondary" | "warning" | "destructive"> = {
  [ClientLifecycle.LEAD]: "secondary",
  [ClientLifecycle.PROSPECT]: "secondary",
  [ClientLifecycle.ACTIVE]: "success",
  [ClientLifecycle.PAUSED]: "warning",
  [ClientLifecycle.COMPLETED]: "success",
  [ClientLifecycle.LOST]: "destructive",
};

const ATTENTION_LABELS = {
  notContactedRecently: "Not contacted recently",
  noRecentMeasurement: "No recent measurement",
  noAssessment: "No assessment on file",
  incompleteProfile: "Incomplete profile",
  measurementWithoutCalculation: "Measurement without calculation",
} as const;

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysBefore(now: Date, days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function resolvePresetRange(presetId: string, customRange: DashboardDateRange, now: Date): DashboardDateRange {
  switch (presetId) {
    case "7d":
      return { from: isoDate(daysBefore(now, 6)), to: isoDate(now) };
    case "30d":
      return { from: isoDate(daysBefore(now, 29)), to: isoDate(now) };
    case "3m":
      return { from: isoDate(daysBefore(now, 89)), to: isoDate(now) };
    case "year":
      return { from: isoDate(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))), to: isoDate(now) };
    default:
      return customRange;
  }
}

interface FollowUpRow {
  clientProfileId: string;
  clientName: string;
  clientPhone?: string;
  lifecycle: string;
  assignedStaffName?: string;
  nextFollowUpAt: string;
  lastContactedAt?: string;
}

function FollowUpRowContent({ row, overdue }: { row: FollowUpRow; overdue: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-1">
        <AppLink path={AppRoute.clientOverview} params={{ id: row.clientProfileId }} className="font-medium">
          {row.clientName}
        </AppLink>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          {row.clientPhone ? <span>{row.clientPhone}</span> : null}
          <Badge variant={LIFECYCLE_BADGE_VARIANT[row.lifecycle] ?? "secondary"}>{row.lifecycle}</Badge>
          {row.assignedStaffName ? <span>Assigned: {row.assignedStaffName}</span> : null}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 text-right text-xs">
        <span className={overdue ? "font-medium text-red-600" : "text-slate-500"}>
          <DateText value={row.nextFollowUpAt} />
        </span>
        {overdue && row.lastContactedAt ? (
          <span className="text-slate-400">
            Last contacted <DateText value={row.lastContactedAt} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

interface AttentionItem {
  clientProfileId: string;
  clientName: string;
  detail: string;
}

function AttentionRow({ item }: { item: AttentionItem }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <AppLink path={AppRoute.clientOverview} params={{ id: item.clientProfileId }} className="font-medium">
        {item.clientName}
      </AppLink>
      <span className="text-xs text-slate-500">{item.detail}</span>
    </div>
  );
}

export default function DashboardPage() {
  const [now, setNow] = useState(() => new Date());
  const [activePresetId, setActivePresetId] = useState("30d");
  const [customRange, setCustomRange] = useState<DashboardDateRange>({ from: isoDate(daysBefore(now, 29)), to: isoDate(now) });
  const [assignedToUserId, setAssignedToUserId] = useState<string | undefined>(undefined);

  // Presets are relative to "right now" — recomputed whenever `now` is
  // bumped (see handleRefresh), not just once at mount/preset-change.
  // Without this, a preset's `to` silently goes stale as real time passes
  // (most visibly across a midnight rollover), quietly excluding anything
  // that happened after the page was first opened.
  const range = useMemo(() => resolvePresetRange(activePresetId, customRange, now), [activePresetId, customRange, now]);
  const periodQuery = { from: range.from, to: range.to, assignedToUserId };
  const snapshotQuery = { assignedToUserId };

  const staffOptionsQuery = useRequesterQuery({
    endpoint: getUsersEndpoint,
    options: { query: { profileType: ProfileType.STAFF_ONLY, limit: 100, page: 1 } },
  });
  const staffOptions = staffOptionsQuery.data?.data ?? [];

  const kpisQuery = useRequesterQuery({ endpoint: getDashboardKpisEndpoint, options: { query: periodQuery } });
  const followUpsQuery = useRequesterQuery({ endpoint: getDashboardFollowUpsEndpoint, options: { query: snapshotQuery } });
  const growthQuery = useRequesterQuery({ endpoint: getDashboardGrowthChartEndpoint, options: { query: periodQuery } });
  const lifecycleQuery = useRequesterQuery({ endpoint: getDashboardLifecycleChartEndpoint, options: { query: snapshotQuery } });
  const sourceQuery = useRequesterQuery({ endpoint: getDashboardSourceChartEndpoint, options: { query: periodQuery } });
  const activityQuery = useRequesterQuery({ endpoint: getDashboardActivityEndpoint, options: { query: periodQuery } });
  const attentionQuery = useRequesterQuery({ endpoint: getDashboardAttentionEndpoint, options: { query: snapshotQuery } });

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => {
    setRefreshing(true);
    setNow(new Date());
    await Promise.all([
      kpisQuery.refetch(),
      followUpsQuery.refetch(),
      growthQuery.refetch(),
      lifecycleQuery.refetch(),
      sourceQuery.refetch(),
      activityQuery.refetch(),
      attentionQuery.refetch(),
    ]);
    setRefreshing(false);
  };

  const kpis = kpisQuery.data;
  const attention = attentionQuery.data;
  const attentionCount = attention
    ? Object.values(attention).reduce((total, items) => total + items.length, 0)
    : 0;

  return (
    <PageShell title="Dashboard" description="Today's clinic snapshot — who needs attention, what changed, and how the client base is growing.">
      <div className="flex flex-col gap-6">
        <DashboardFilterBar
          presets={RANGE_PRESETS}
          activePresetId={activePresetId}
          onPresetChange={setActivePresetId}
          range={range}
          onRangeChange={setCustomRange}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          extraFilters={
            <CustomSelect
              label="Assigned staff"
              wrapperClassName="min-w-[10rem]"
              value={assignedToUserId ?? ""}
              onChange={(value) => setAssignedToUserId(value ? String(value) : undefined)}
              options={[{ label: "All staff", value: "" }, ...staffOptions.map((staff) => ({ label: staff.name, value: staff._id }))]}
            />
          }
        />

        {/* Primary KPI row — the most operationally urgent numbers at a glance. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Total Clients" value={kpis?.totalClients.value ?? 0} state={kpis?.totalClients.state ?? "neutral"} icon={Users} loading={kpisQuery.loading} />
          <KpiCard
            label="New Leads"
            value={kpis?.newLeads.value ?? 0}
            previousValue={kpis?.newLeads.previousPeriodValue}
            trend={kpis?.newLeads.trend}
            state={kpis?.newLeads.state ?? "neutral"}
            icon={UserPlus}
            loading={kpisQuery.loading}
          />
          <KpiCard
            label="Today's Follow-ups"
            value={kpis?.todaysFollowUps.value ?? 0}
            state={kpis?.todaysFollowUps.state ?? "neutral"}
            icon={CalendarClock}
            loading={kpisQuery.loading}
          />
          <KpiCard
            label="Overdue Follow-ups"
            value={kpis?.overdueFollowUps.value ?? 0}
            state={kpis?.overdueFollowUps.state ?? "neutral"}
            icon={AlertTriangle}
            loading={kpisQuery.loading}
          />
        </div>

        {/* Secondary KPI row — volume/growth metrics, valuable but less time-sensitive. */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Active Clients" value={kpis?.activeClients.value ?? 0} state="neutral" icon={UserRoundCheck} loading={kpisQuery.loading} />
          <KpiCard
            label="New Clients"
            value={kpis?.newClients.value ?? 0}
            previousValue={kpis?.newClients.previousPeriodValue}
            trend={kpis?.newClients.trend}
            state="neutral"
            icon={UserRoundCheck}
            loading={kpisQuery.loading}
          />
          {kpis?.measurementsRecorded ? (
            <KpiCard
              label="Measurements Recorded"
              value={kpis.measurementsRecorded.value}
              previousValue={kpis.measurementsRecorded.previousPeriodValue}
              trend={kpis.measurementsRecorded.trend}
              state="neutral"
              icon={Ruler}
              loading={kpisQuery.loading}
            />
          ) : null}
          {kpis?.nutritionCalculationsSaved ? (
            <KpiCard
              label="Nutrition Calculations Saved"
              value={kpis.nutritionCalculationsSaved.value}
              previousValue={kpis.nutritionCalculationsSaved.previousPeriodValue}
              trend={kpis.nutritionCalculationsSaved.trend}
              state="neutral"
              icon={FlaskConical}
              loading={kpisQuery.loading}
            />
          ) : null}
        </div>

        {/* Actionable follow-up sections — never buried under charts. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ActionableList
            title="Today's Follow-ups"
            items={followUpsQuery.data?.today ?? []}
            keyFor={(row) => row.clientProfileId}
            renderItem={(row) => <FollowUpRowContent row={row} overdue={false} />}
            emptyTitle="Nothing due today"
            emptyDescription="No clients have a follow-up scheduled for today."
            loading={followUpsQuery.loading}
            actions={<Badge variant="secondary">{followUpsQuery.data?.today.length ?? 0}</Badge>}
          />
          <ActionableList
            title="Overdue Follow-ups"
            items={followUpsQuery.data?.overdue ?? []}
            keyFor={(row) => row.clientProfileId}
            renderItem={(row) => <FollowUpRowContent row={row} overdue />}
            emptyTitle="Nothing overdue"
            emptyDescription="Every scheduled follow-up is on track."
            loading={followUpsQuery.loading}
            actions={<Badge variant={(followUpsQuery.data?.overdue.length ?? 0) > 0 ? "destructive" : "secondary"}>{followUpsQuery.data?.overdue.length ?? 0}</Badge>}
          />
        </div>

        {/* Charts and analytics. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="Client Growth" description="Cumulative clients over the selected period" loading={growthQuery.loading} className="lg:col-span-2">
            <LineChart
              data={(growthQuery.data ?? []).map((point) => ({ date: point.date, value: point.value }))}
              series={[{ key: "value", label: "Cumulative Clients", color: "#0ea5e9" }]}
              emptyMessage="No clients yet in this period"
            />
          </ChartCard>

          <ChartCard title="Current Lifecycle Funnel" description="Current pipeline snapshot — not a historical conversion rate" loading={lifecycleQuery.loading}>
            <QueryState query={lifecycleQuery} entityName="Lifecycle data">
              {(lifecycleData) => (
                <div className="flex flex-col gap-6">
                  <DonutChart data={lifecycleData.distribution} emptyMessage="No clients yet" />
                </div>
              )}
            </QueryState>
          </ChartCard>

          <ChartCard title="Client Source Distribution" description="Where clients created in this period came from" loading={sourceQuery.loading}>
            <DonutChart data={sourceQuery.data ?? []} emptyMessage="No clients created in this period" />
          </ChartCard>
        </div>

        {/* Recent activity — a read-side merge of existing records, most recent first. */}
        <ChartCard title="Recent Activity" description="What changed recently, across the whole clinic" loading={activityQuery.loading}>
          <Timeline
            items={(activityQuery.data ?? []).map((entry, index) => ({
              id: `${entry.type}-${entry.clientProfileId}-${index}`,
              content: (
                <div className="flex items-center justify-between gap-3">
                  <span>
                    <AppLink path={AppRoute.clientOverview} params={{ id: entry.clientProfileId }} className="font-medium">
                      {entry.clientName}
                    </AppLink>{" "}
                    <span className="text-slate-500">— {entry.summary}</span>
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    <DateText value={entry.happenedAt} />
                  </span>
                </div>
              ),
            }))}
            emptyState={<p className="py-4 text-center text-sm text-slate-500">No activity in this period yet.</p>}
          />
        </ChartCard>

        {/* Attention-needed sections. */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {attention
            ? (Object.entries(attention) as [keyof typeof ATTENTION_LABELS, AttentionItem[]][])
                .filter(([, items]) => items.length > 0)
                .map(([key, items]) => (
                  <ActionableList
                    key={key}
                    title={ATTENTION_LABELS[key]}
                    items={items}
                    keyFor={(item, index) => `${item.clientProfileId}-${index}`}
                    renderItem={(item) => <AttentionRow item={item} />}
                    loading={attentionQuery.loading}
                    actions={<Badge variant="warning">{items.length}</Badge>}
                  />
                ))
            : null}
          {attention && attentionCount === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500 lg:col-span-2">
              Nothing needs attention right now.
            </div>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
