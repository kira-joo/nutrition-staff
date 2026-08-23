import { MethodType, ResponseType, type Endpoint } from "@kira-joo/frontend-toolkit-core";

/** Returns the raw self-contained book HTML as text — never JSON, so `responseType: TEXT` skips `requester`'s default `JSON.parse`. */
export const getBookPrintPreviewEndpoint: Endpoint<{
  params: { id: string };
  query: { chapterId?: string };
  returnType: string;
}> = { url: "/books/:id/print-preview", methodType: MethodType.GET, responseType: ResponseType.TEXT };
