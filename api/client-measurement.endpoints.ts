import {
  MethodType,
  type Endpoint,
  type PaginatedResponse,
  type PaginationQuery,
} from "@kira-joo/frontend-toolkit-core";
import type {
  ClientMeasurement,
  CreateClientMeasurementDto,
  UpdateClientMeasurementDto,
} from "../src/common/interfaces/client-measurement.interface";

// Backed by the route handlers under src/app/api/client-measurements.

export const getClientMeasurementsEndpoint: Endpoint<{
  query: PaginationQuery & { clientProfileId: string } & Record<string, unknown>;
  returnType: PaginatedResponse<ClientMeasurement>;
}> = { url: "/client-measurements", methodType: MethodType.GET };

export const getClientMeasurementByIdEndpoint: Endpoint<{ params: { id: string }; returnType: ClientMeasurement }> = {
  url: "/client-measurements/:id",
  methodType: MethodType.GET,
};

export const createClientMeasurementEndpoint: Endpoint<{
  body: CreateClientMeasurementDto;
  returnType: ClientMeasurement;
}> = {
  url: "/client-measurements",
  methodType: MethodType.POST,
};

export const updateClientMeasurementEndpoint: Endpoint<{
  params: { id: string };
  body: UpdateClientMeasurementDto;
  returnType: ClientMeasurement;
}> = {
  url: "/client-measurements/:id",
  methodType: MethodType.PUT,
};

export const deleteClientMeasurementEndpoint: Endpoint<{ params: { id: string }; returnType: void }> = {
  url: "/client-measurements/:id",
  methodType: MethodType.DELETE,
};
