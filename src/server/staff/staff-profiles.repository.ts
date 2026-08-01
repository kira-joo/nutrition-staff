import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { StaffProfileModel } from "src/server/staff/staff-profile.schema";

export const staffProfileRepository = createMongooseRepository({
  model: StaffProfileModel,
  entityName: EntityName.STAFF,
});
