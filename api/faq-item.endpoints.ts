import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type { FaqItem, FaqItemFormValues } from "../src/common/interfaces/faq-item.interface";

export const getFaqItemsEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<FaqItem>;
}> = { url: "/faq-items", methodType: MethodType.GET };

export const getFaqItemByIdEndpoint: Endpoint<{ params: { id: string }; returnType: FaqItem }> = {
  url: "/faq-items/:id",
  methodType: MethodType.GET,
};

export const createFaqItemEndpoint: Endpoint<{ body: FaqItemFormValues; returnType: FaqItem }> = {
  url: "/faq-items",
  methodType: MethodType.POST,
};

export const updateFaqItemEndpoint: Endpoint<{
  params: { id: string };
  body: Partial<FaqItemFormValues>;
  returnType: FaqItem;
}> = {
  url: "/faq-items/:id",
  methodType: MethodType.PUT,
};

export const deleteFaqItemEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/faq-items/:id",
  methodType: MethodType.DELETE,
};
