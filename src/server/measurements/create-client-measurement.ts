import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { clientMeasurementRepository } from "src/server/measurements/client-measurements.repository";
import { CreateClientMeasurementDto } from "src/server/measurements/dto/create-client-measurement.dto";

/** BMI is derived from weightKg + whatever ClientProfile.heightCm is *right now* — heightCmUsed is stored alongside it so the derivation stays self-explanatory even if the profile's height later changes. */
export async function createClientMeasurement(body: CreateClientMeasurementDto, recordedByUserId: string) {
  let bmi: number | undefined;
  let heightCmUsed: number | undefined;

  if (body.weightKg !== undefined) {
    const client = await clientProfileRepository.findOne({ where: { _id: body.clientProfileId }, skipThrowError: true });
    if (client?.heightCm) {
      heightCmUsed = client.heightCm;
      const heightM = heightCmUsed / 100;
      bmi = Math.round((body.weightKg / (heightM * heightM)) * 10) / 10;
    }
  }

  return clientMeasurementRepository.save({ ...body, bmi, heightCmUsed, recordedByUserId });
}
