import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ConsultationRequestModel } from "src/server/consultation-requests/consultation-request.schema";

export const consultationRequestRepository = createMongooseRepository({
  model: ConsultationRequestModel,
  entityName: EntityName.CONSULTATION_REQUEST,
});
