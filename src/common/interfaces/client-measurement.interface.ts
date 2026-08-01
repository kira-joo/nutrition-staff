import { BodyCompositionMethod } from "../enums";
import type { ClientUserSummary } from "./client.interface";

export interface ClientMeasurement {
  _id: string;
  clientProfileId: string;
  measuredAt: string;
  weightKg?: number;
  waistCm?: number;
  hipCm?: number;
  chestCm?: number;
  neckCm?: number;
  armCm?: number;
  thighCm?: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  bodyWaterPercentage?: number;
  visceralFatLevel?: number;
  bodyCompositionMethod?: BodyCompositionMethod;
  bmi?: number;
  heightCmUsed?: number;
  notes?: string;
  recordedByUserId: ClientUserSummary;
  createdAt: string;
  updatedAt: string;
}

export interface CreateClientMeasurementDto {
  clientProfileId: string;
  measuredAt: string;
  weightKg?: number;
  waistCm?: number;
  hipCm?: number;
  chestCm?: number;
  neckCm?: number;
  armCm?: number;
  thighCm?: number;
  bodyFatPercentage?: number;
  muscleMassKg?: number;
  bodyWaterPercentage?: number;
  visceralFatLevel?: number;
  bodyCompositionMethod?: BodyCompositionMethod;
  notes?: string;
}

export type UpdateClientMeasurementDto = Partial<Omit<CreateClientMeasurementDto, "clientProfileId">>;
