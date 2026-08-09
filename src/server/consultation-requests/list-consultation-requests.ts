import { SortOrder } from "@kira-joo/toolkit-common";
import { consultationRequestRepository } from "src/server/consultation-requests/consultation-requests.repository";
import { ListConsultationRequestsQueryDto } from "src/server/consultation-requests/dto/list-consultation-requests-query.dto";

/**
 * Newest first by default — `BaseFindQueryDto`'s `sortBy`/`sortOrder` have
 * no toolkit-wide default (only `page`/`limit` do; an unsorted query falls
 * back to whatever order MongoDB happens to return), and a submission log
 * that isn't newest-first defeats its own purpose. Still fully overridable
 * by an explicit `sortBy`/`sortOrder` on the query.
 */
export async function listConsultationRequests(query: ListConsultationRequestsQueryDto) {
  const { sortBy, sortOrder, ...rest } = query;

  return consultationRequestRepository.findAllAndCountPublic({
    query: { ...rest, sortBy: sortBy ?? "createdAt", sortOrder: sortOrder ?? SortOrder.DESC },
    relations: ["userId", "clientProfileId"],
  });
}
