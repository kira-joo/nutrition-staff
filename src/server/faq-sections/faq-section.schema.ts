import { createMongoModel, Filterable, localizedStringField, MongoField, MongoSchema, Searchable } from "@kira-joo/backend-toolkit-mongoose";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";

@MongoSchema({ timestamps: true, softDelete: true })
export class FaqSectionSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  @Searchable({ subPaths: ["ar", "en"] })
  title!: LocalizedString;

  @MongoField({ type: Number, default: 0 })
  order!: number;

  @MongoField({ type: String, enum: Object.values(ContentStatus), required: true })
  @Filterable()
  status!: ContentStatus;
}

export const FaqSectionModel = createMongoModel(EntityName.FAQ_SECTION, FaqSectionSchema);
