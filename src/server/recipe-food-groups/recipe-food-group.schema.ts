import { createMongoModel, Filterable, localizedStringField, MongoField, MongoSchema, Searchable } from "@kira-joo/backend-toolkit-mongoose";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";

@MongoSchema({ timestamps: true, softDelete: true })
export class RecipeFoodGroupSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  @Searchable({ subPaths: ["ar", "en"] })
  title!: LocalizedString;

  @MongoField({ type: String, enum: Object.values(ContentStatus), required: true })
  @Filterable()
  status!: ContentStatus;
}

export const RecipeFoodGroupModel = createMongoModel(EntityName.RECIPE_FOOD_GROUP, RecipeFoodGroupSchema);
