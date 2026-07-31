import { createMongooseRepository } from "@kira-joo/backend-toolkit-mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { FaqItemModel } from "src/server/faq-items/faq-item.schema";

export const faqItemRepository = createMongooseRepository({
  model: FaqItemModel,
  entityName: EntityName.FAQ_ITEM,
});
