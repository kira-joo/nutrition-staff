import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPostRoute } from "src/server/core/route-factories";
import { createClientMeasurement } from "src/server/measurements/create-client-measurement";
import { CreateClientMeasurementDto } from "src/server/measurements/dto/create-client-measurement.dto";
import { ListClientMeasurementsQueryDto } from "src/server/measurements/dto/list-client-measurements-query.dto";
import { clientMeasurementRepository } from "src/server/measurements/client-measurements.repository";

export const GET = createGetRoute({
  query: ListClientMeasurementsQueryDto,
  auth: { permissions: [AppPermission.CLIENT_MEASUREMENT.READ] },
  handler: async ({ query }) => clientMeasurementRepository.findAllAndCountPublic({ query, relations: ["recordedByUserId"] }),
});

export const POST = createPostRoute({
  body: CreateClientMeasurementDto,
  auth: { permissions: [AppPermission.CLIENT_MEASUREMENT.CREATE] },
  handler: async ({ body, user }) => createClientMeasurement(body, user._id),
});
