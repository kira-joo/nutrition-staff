import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type { BookSettings } from "../src/common/interfaces/book-settings.interface";

// Backed by the multipart-upload-on-submit route handler under
// src/app/api/book-settings — see site-settings.endpoints.ts for why the
// update body is typed loosely rather than as UpdateBookSettingsDto.

export const getBookSettingsEndpoint: Endpoint<{ returnType: BookSettings }> = {
  url: "/book-settings",
  methodType: MethodType.GET,
};

export const updateBookSettingsEndpoint: Endpoint<{ body: Record<string, unknown>; returnType: BookSettings }> = {
  url: "/book-settings",
  methodType: MethodType.PUT,
};
