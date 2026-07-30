import {
  createMongoModel,
  Filterable,
  imageAssetField,
  localizedStringField,
  MongoField,
  MongoSchema,
  Searchable,
} from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";

@MongoSchema({ timestamps: true, softDelete: true })
export class ReviewSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  @Searchable({ subPaths: ["ar", "en"] })
  content!: LocalizedString;

  @MongoField(localizedStringField())
  authorName!: LocalizedString;

  @MongoField(localizedStringField())
  authorLabel!: LocalizedString;

  @MongoField(imageAssetField())
  image?: ImageAsset | null;

  @MongoField(imageAssetField())
  beforeImage?: ImageAsset | null;

  @MongoField(imageAssetField())
  afterImage?: ImageAsset | null;

  @MongoField({ type: Boolean, default: false })
  @Filterable()
  featured!: boolean;

  @MongoField({ type: String, required: false })
  sourceUrl?: string;

  @MongoField({ type: Number, default: 0 })
  order!: number;

  @MongoField({ type: String, enum: Object.values(ContentStatus), required: true })
  @Filterable()
  status!: ContentStatus;
}

export const ReviewModel = createMongoModel(EntityName.REVIEW, ReviewSchema);
