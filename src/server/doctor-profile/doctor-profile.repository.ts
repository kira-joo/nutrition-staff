import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { DoctorProfileModel } from "src/server/doctor-profile/doctor-profile.schema";

export const doctorProfileRepository = createMongooseRepository({
  model: DoctorProfileModel,
  entityName: EntityName.DOCTOR_PROFILE,
});
