import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type { BookEdition } from "../src/common/interfaces/book-edition.interface";

export interface PublishValidationIssue {
  code: string;
  message: string;
}

export const getBookPublishCheckEndpoint: Endpoint<{
  params: { id: string };
  returnType: { errors: PublishValidationIssue[]; warnings: PublishValidationIssue[] };
}> = { url: "/books/:id/publish-check", methodType: MethodType.GET };

export const getBookEditionsEndpoint: Endpoint<{ params: { id: string }; returnType: BookEdition[] }> = {
  url: "/books/:id/editions",
  methodType: MethodType.GET,
};

export const getBookEditionByIdEndpoint: Endpoint<{ params: { id: string; editionId: string }; returnType: BookEdition }> = {
  url: "/books/:id/editions/:editionId",
  methodType: MethodType.GET,
};

export const publishBookEditionEndpoint: Endpoint<{
  params: { id: string };
  body: { expectedRevision: number; expectedContentRevision: number; acknowledgedWarningCodes?: string[]; notes?: string };
  returnType: { book: unknown; edition: BookEdition };
}> = { url: "/books/:id/editions", methodType: MethodType.POST };
