import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ClientMeasurementModel } from "src/server/measurements/client-measurement.schema";

export const clientMeasurementRepository = createMongooseRepository({
  model: ClientMeasurementModel,
  entityName: EntityName.CLIENT_MEASUREMENT,
});
