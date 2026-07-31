import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { PackageModel } from "src/server/packages/package.schema";

export const packageRepository = createMongooseRepository({
  model: PackageModel,
  entityName: EntityName.PACKAGE,
});
