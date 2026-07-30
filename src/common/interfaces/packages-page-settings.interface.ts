import type { LocalizedString } from "@kira-joo/frontend-toolkit-core";

export interface DurationLabels {
  month: LocalizedString;
  quarter: LocalizedString;
  half: LocalizedString;
}

export interface PackagesPageSettings {
  _id: string;
  title: LocalizedString;
  titleAccent: LocalizedString;
  subtitle: LocalizedString;
  durationLabels: DurationLabels;
  subscribeButtonLabel: LocalizedString;
  createdAt: string;
  updatedAt: string;
}

export type PackagesPageSettingsFormValues = Omit<PackagesPageSettings, "_id" | "createdAt" | "updatedAt">;
