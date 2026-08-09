import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute } from "src/server/core/route-factories";
import { FindConsultationRequestParamsDto } from "src/server/consultation-requests/dto/find-consultation-request-params.dto";
import { consultationRequestRepository } from "src/server/consultation-requests/consultation-requests.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindConsultationRequestParamsDto,
  auth: { permissions: [AppPermission.CONSULTATION_REQUEST.READ_ONE] },
  handler: async ({ params }) =>
    consultationRequestRepository.findOne({ where: { _id: params.id }, relations: ["userId", "clientProfileId"] }),
});
