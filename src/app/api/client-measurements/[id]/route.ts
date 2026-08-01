import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { clientMeasurementRepository } from "src/server/measurements/client-measurements.repository";
import { FindClientMeasurementParamsDto } from "src/server/measurements/dto/find-client-measurement-params.dto";
import { UpdateClientMeasurementDto } from "src/server/measurements/dto/update-client-measurement.dto";
import { updateClientMeasurement } from "src/server/measurements/update-client-measurement";

export const GET = createGetRoute({
  params: FindClientMeasurementParamsDto,
  auth: { permissions: [AppPermission.CLIENT_MEASUREMENT.READ_ONE] },
  handler: async ({ params }) =>
    clientMeasurementRepository.findOne({ where: { _id: params.id }, relations: ["recordedByUserId"] }),
});

export const PUT = createPutRoute({
  params: FindClientMeasurementParamsDto,
  body: UpdateClientMeasurementDto,
  auth: { permissions: [AppPermission.CLIENT_MEASUREMENT.UPDATE] },
  handler: async ({ params, body }) => updateClientMeasurement(params.id, body),
});

export const DELETE = createDeleteRoute({
  params: FindClientMeasurementParamsDto,
  auth: { permissions: [AppPermission.CLIENT_MEASUREMENT.DELETE] },
  handler: async ({ params }) => {
    await clientMeasurementRepository.softDelete({ where: { _id: params.id } });
  },
});
