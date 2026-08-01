import { clientMeasurementRepository } from "src/server/measurements/client-measurements.repository";
import { clientProfileRepository } from "src/server/clients/client-profiles.repository";
import { UpdateClientMeasurementDto } from "src/server/measurements/dto/update-client-measurement.dto";

/** Recomputes bmi/heightCmUsed only when weightKg is actually part of this edit — an edit that doesn't touch weight leaves the existing derived values alone. */
export async function updateClientMeasurement(id: string, body: UpdateClientMeasurementDto) {
  const patch: UpdateClientMeasurementDto & { bmi?: number; heightCmUsed?: number } = { ...body };

  if (body.weightKg !== undefined) {
    const measurement = await clientMeasurementRepository.findOne({ where: { _id: id } });
    const client = await clientProfileRepository.findOne({
      where: { _id: measurement.clientProfileId },
      skipThrowError: true,
    });

    if (client?.heightCm) {
      patch.heightCmUsed = client.heightCm;
      const heightM = client.heightCm / 100;
      patch.bmi = Math.round((body.weightKg / (heightM * heightM)) * 10) / 10;
    }
  }

  return clientMeasurementRepository.update({ where: { _id: id } }, patch);
}
