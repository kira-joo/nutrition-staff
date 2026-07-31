import { createMongoModel, Filterable, localizedStringField, MongoField, MongoSchema, Relation, Searchable } from "@kira-joo/backend-toolkit-mongoose";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { FaqSectionSchema } from "src/server/faq-sections/faq-section.schema";

@MongoSchema({ timestamps: true, softDelete: true })
export class FaqItemSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.FAQ_SECTION, required: true })
  @Filterable()
  @Relation(() => FaqSectionSchema)
  section!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  @Searchable({ subPaths: ["ar", "en"] })
  question!: LocalizedString;

  @MongoField(localizedStringField())
  answer!: LocalizedString;

  @MongoField({ type: Number, default: 0 })
  order!: number;

  @MongoField({ type: String, enum: Object.values(ContentStatus), required: true })
  @Filterable()
  status!: ContentStatus;
}

export const FaqItemModel = createMongoModel(EntityName.FAQ_ITEM, FaqItemSchema);
