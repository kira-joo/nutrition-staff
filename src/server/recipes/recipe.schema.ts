import {
  createMongoModel,
  Filterable,
  imageAssetField,
  localizedStringField,
  MongoField,
  MongoSchema,
  Relation,
  Searchable,
} from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import { RecipeCategorySchema } from "src/server/recipe-categories/recipe-category.schema";
import { RecipeFoodGroupSchema } from "src/server/recipe-food-groups/recipe-food-group.schema";

@MongoSchema({ timestamps: true, softDelete: true })
export class RecipeSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  @Searchable({ subPaths: ["ar", "en"] })
  title!: LocalizedString;

  @MongoField(localizedStringField())
  description!: LocalizedString;

  @MongoField(imageAssetField({ required: true }))
  image!: ImageAsset;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.RECIPE_CATEGORY, required: true })
  @Filterable()
  @Relation(() => RecipeCategorySchema)
  category!: mongoose.Types.ObjectId;

  @MongoField({ type: [mongoose.Schema.Types.ObjectId], ref: EntityName.RECIPE_FOOD_GROUP, default: [] })
  @Relation(() => RecipeFoodGroupSchema)
  foodGroups!: mongoose.Types.ObjectId[];

  // Each line is its own bilingual entry (mirroring how nutrition-client
  // actually stores these — plain text lines, not structured
  // amount/unit/item objects, which don't exist anywhere in the reference
  // site's real data).
  @MongoField({ type: [localizedStringField().type], default: () => [] })
  ingredients!: LocalizedString[];

  @MongoField({ type: [localizedStringField().type], default: () => [] })
  instructions!: LocalizedString[];

  @MongoField(localizedStringField())
  prepTime?: LocalizedString;

  @MongoField(localizedStringField())
  cookTime?: LocalizedString;

  @MongoField(localizedStringField())
  servings?: LocalizedString;

  @MongoField({ type: String, enum: Object.values(ContentStatus), required: true })
  @Filterable()
  status!: ContentStatus;
}

export const RecipeModel = createMongoModel(EntityName.RECIPE, RecipeSchema);
