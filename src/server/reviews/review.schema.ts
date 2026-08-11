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

  // Optional at the schema level on purpose — reviews created before this
  // field existed have no rating, and that must stay a valid, non-crashing
  // state rather than something a migration has to backfill. Required
  // going forward at the create-DTO/staff-form layer instead (see
  // CreateReviewDto and ReviewForm).
  @MongoField({ type: Number, required: false, min: 1, max: 5 })
  rating?: number;

  @MongoField({ type: Boolean, default: false })
  @Filterable()
  featured!: boolean;

  @MongoField({ type: String, required: false })
  sourceUrl?: string;

  @MongoField({ type: String, enum: Object.values(ContentStatus), required: true })
  @Filterable()
  status!: ContentStatus;
}

export const ReviewModel = createMongoModel(EntityName.REVIEW, ReviewSchema);
