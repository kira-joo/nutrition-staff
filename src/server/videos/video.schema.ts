import { createMongoModel, Filterable, imageAssetField, localizedStringField, MongoField, MongoSchema, Searchable, videoAssetField } from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString, VideoAsset } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";

@MongoSchema({ timestamps: true, softDelete: true })
export class VideoSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  @Searchable({ subPaths: ["ar", "en"] })
  title!: LocalizedString;

  // At least one of video/externalUrl is required — enforced by
  // HasVideoSource, not the schema (mirrors Review's "at least one of"
  // business rule for the same reason: neither field alone is mandatory).
  @MongoField(videoAssetField())
  video?: VideoAsset | null;

  @MongoField({ type: String, required: false })
  externalUrl?: string;

  // Optional override for either an uploaded or an external video — see
  // the plan's placeholder/poster strategy (§6): posterUrl is auto-derived
  // from Cloudinary for uploaded videos, but an external video has nothing
  // to auto-derive a poster from.
  @MongoField(imageAssetField())
  poster?: ImageAsset | null;

  @MongoField({ type: String, enum: Object.values(ContentStatus), required: true })
  @Filterable()
  status!: ContentStatus;
}

export const VideoModel = createMongoModel(EntityName.VIDEO, VideoSchema);
