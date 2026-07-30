import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type { SiteSettings } from "../src/common/interfaces/site-settings.interface";

// Backed by the multipart-upload-on-submit route handler under
// src/app/api/site-settings — see review.endpoints.ts for why the update
// body is typed loosely rather than as UpdateSiteSettingsDto.

export const getSiteSettingsEndpoint: Endpoint<{ returnType: SiteSettings }> = {
  url: "/site-settings",
  methodType: MethodType.GET,
};

export const updateSiteSettingsEndpoint: Endpoint<{ body: Record<string, unknown>; returnType: SiteSettings }> = {
  url: "/site-settings",
  methodType: MethodType.PUT,
};
