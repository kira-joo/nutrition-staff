import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { FaqSection, FaqSectionFormValues } from "../src/common/interfaces/faq-section.interface";

export const getFaqSectionsEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<FaqSection>;
}> = { url: "/faq-sections", methodType: MethodType.GET };

export const getFaqSectionByIdEndpoint: Endpoint<{ params: { id: string }; returnType: FaqSection }> = {
  url: "/faq-sections/:id",
  methodType: MethodType.GET,
};

export const createFaqSectionEndpoint: Endpoint<{ body: FaqSectionFormValues; returnType: FaqSection }> = {
  url: "/faq-sections",
  methodType: MethodType.POST,
};

export const updateFaqSectionEndpoint: Endpoint<{
  params: { id: string };
  body: Partial<FaqSectionFormValues>;
  returnType: FaqSection;
}> = {
  url: "/faq-sections/:id",
  methodType: MethodType.PUT,
};

export const deleteFaqSectionEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/faq-sections/:id",
  methodType: MethodType.DELETE,
};
