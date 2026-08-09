import { MethodType, type Endpoint, type PaginatedResponse, type PaginationQuery } from "@kira-joo/frontend-toolkit-core";
import type { ConsultationRequest } from "../src/common/interfaces/consultation-request.interface";

// Backed by the MongoDB-backed route handlers under src/app/api/consultation-requests.
// Read-only: staff never creates/updates/deletes one of these directly —
// the only writer is the public consultation-requests endpoint.

export const getConsultationRequestsEndpoint: Endpoint<{
  query: PaginationQuery & Record<string, unknown>;
  returnType: PaginatedResponse<ConsultationRequest>;
}> = { url: "/consultation-requests", methodType: MethodType.GET };

export const getConsultationRequestByIdEndpoint: Endpoint<{ params: { id: string }; returnType: ConsultationRequest }> = {
  url: "/consultation-requests/:id",
  methodType: MethodType.GET,
};
