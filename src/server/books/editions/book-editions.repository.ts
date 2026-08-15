import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { BookEditionModel } from "./book-edition.schema";

export const bookEditionRepository = createMongooseRepository({
  model: BookEditionModel,
  entityName: EntityName.BOOK_EDITION,
});
