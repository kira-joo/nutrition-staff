import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { FaqSectionModel } from "src/server/faq-sections/faq-section.schema";

export const faqSectionRepository = createMongooseRepository({
  model: FaqSectionModel,
  entityName: EntityName.FAQ_SECTION,
});
