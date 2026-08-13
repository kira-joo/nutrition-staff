import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { BookArtifactModel } from "./book-artifact.schema";

export const bookArtifactRepository = createMongooseRepository({
  model: BookArtifactModel,
  entityName: EntityName.BOOK_ARTIFACT,
});
