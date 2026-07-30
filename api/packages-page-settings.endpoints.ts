import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type { PackagesPageSettings, PackagesPageSettingsFormValues } from "../src/common/interfaces/packages-page-settings.interface";

// Backed by src/app/api/packages-page-settings/route.ts — no assets on this
// entity, so unlike Review/SiteSettings/DoctorProfile the update body is a
// plain JSON object, typed as the real form-values shape (not
// Record<string, unknown>: there's no FormData/multipart path here at all).

export const getPackagesPageSettingsEndpoint: Endpoint<{ returnType: PackagesPageSettings }> = {
  url: "/packages-page-settings",
  methodType: MethodType.GET,
};

export const updatePackagesPageSettingsEndpoint: Endpoint<{
  body: PackagesPageSettingsFormValues;
  returnType: PackagesPageSettings;
}> = {
  url: "/packages-page-settings",
  methodType: MethodType.PUT,
};
