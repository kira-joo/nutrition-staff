import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type {
  DashboardActivityEntry,
  DashboardAttention,
  DashboardFollowUps,
  DashboardGrowthChart,
  DashboardKpis,
  DashboardLifecycleChart,
  DashboardSourceChart,
} from "../src/common/interfaces/dashboard.interface";

// Backed by the MongoDB-backed route handlers under src/app/api/dashboard.

export interface DashboardQuery {
  from?: string;
  to?: string;
  assignedToUserId?: string;
  [key: string]: unknown;
}

export const getDashboardKpisEndpoint: Endpoint<{ query: DashboardQuery; returnType: DashboardKpis }> = {
  url: "/dashboard/kpis",
  methodType: MethodType.GET,
};

export const getDashboardFollowUpsEndpoint: Endpoint<{ query: DashboardQuery; returnType: DashboardFollowUps }> = {
  url: "/dashboard/follow-ups",
  methodType: MethodType.GET,
};

export const getDashboardGrowthChartEndpoint: Endpoint<{ query: DashboardQuery; returnType: DashboardGrowthChart }> = {
  url: "/dashboard/charts/growth",
  methodType: MethodType.GET,
};

export const getDashboardLifecycleChartEndpoint: Endpoint<{ query: DashboardQuery; returnType: DashboardLifecycleChart }> = {
  url: "/dashboard/charts/lifecycle",
  methodType: MethodType.GET,
};

export const getDashboardSourceChartEndpoint: Endpoint<{ query: DashboardQuery; returnType: DashboardSourceChart }> = {
  url: "/dashboard/charts/sources",
  methodType: MethodType.GET,
};

export const getDashboardActivityEndpoint: Endpoint<{ query: DashboardQuery; returnType: DashboardActivityEntry[] }> = {
  url: "/dashboard/activity",
  methodType: MethodType.GET,
};

export const getDashboardAttentionEndpoint: Endpoint<{ query: DashboardQuery; returnType: DashboardAttention }> = {
  url: "/dashboard/attention",
  methodType: MethodType.GET,
};
