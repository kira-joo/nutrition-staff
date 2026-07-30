import { createMongoModel, Filterable, localizedStringField, MongoField, MongoSchema, Searchable, Unique } from "@kira-joo/backend-toolkit-mongoose";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus } from "src/common/enums";
import type { CampaignBlock } from "src/server/campaigns/blocks/campaign-block.type";

@MongoSchema({ timestamps: true, softDelete: true })
export class CampaignSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  @Searchable({ subPaths: ["ar", "en"] })
  title!: LocalizedString;

  @MongoField({ type: String, required: true })
  @Unique({ message: "A campaign with this slug already exists" })
  slug!: string;

  @MongoField({ type: Date, required: true })
  startDate!: Date;

  @MongoField({ type: Date, required: true })
  endDate!: Date;

  @MongoField({ type: String, enum: Object.values(ContentStatus), required: true })
  @Filterable()
  status!: ContentStatus;

  // Each block type has its own DTO/validation (see server/campaigns/blocks/),
  // enforced entirely before anything reaches this repository — Mongoose
  // itself just stores whatever shape was already validated, the same way
  // it would for any schemaless JSON. Managed via its own sub-resource
  // routes (add/replace/remove/reorder), never through this entity's own
  // header PUT — see server/campaigns/blocks route handlers.
  @MongoField({ type: [mongoose.Schema.Types.Mixed], default: () => [] })
  blocks!: CampaignBlock[];
}

export const CampaignModel = createMongoModel(EntityName.CAMPAIGN, CampaignSchema);

/**
 * `title` is a real Mongoose subdocument (via `localizedStringField()`),
 * not a plain `{ar, en}` object — its fields are prototype getters, and its
 * internal Mongoose bookkeeping (parent/schema back-references) forms a
 * genuinely circular graph. Passing a hydrated document straight into
 * `findIncompleteLocalizedPaths`'s recursive walk crashes with a stack
 * overflow once it falls through to walking those internals. Any publish
 * check must convert to a plain object first — same fix as
 * `toPlainGalleryItem` in doctor-profile.schema.ts.
 */
export function toPlainCampaign(campaign: CampaignSchema): CampaignSchema {
  return (campaign as unknown as { toObject: () => CampaignSchema }).toObject();
}
