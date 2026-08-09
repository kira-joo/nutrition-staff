import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute } from "src/server/core/route-factories";
import { ListConsultationRequestsQueryDto } from "src/server/consultation-requests/dto/list-consultation-requests-query.dto";
import { listConsultationRequests } from "src/server/consultation-requests/list-consultation-requests";

export const dynamic = "force-dynamic";

// No POST here — the only writer is the public
// /api/public/consultation-requests endpoint (createConsultationRequest).
// Staff never creates one of these directly.
export const GET = createGetRoute({
  query: ListConsultationRequestsQueryDto,
  auth: { permissions: [AppPermission.CONSULTATION_REQUEST.READ] },
  handler: async ({ query }) => listConsultationRequests(query),
});
