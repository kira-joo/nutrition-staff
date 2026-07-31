import { createMongoModel, Filterable, localizedStringField, MongoField, MongoSchema, Searchable, Unique } from "@kira-joo/backend-toolkit-mongoose";
import type { LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { ContentStatus, IconKey, PackageVariant } from "src/common/enums";
import { seoSchema, type Seo } from "src/server/site-settings/site-settings.schema";

const pricingTierSchema = new mongoose.Schema(
  {
    originalPrice: { type: Number, required: true },
    price: { type: Number, required: true },
  },
  { _id: false }
);

const pricingTiersSchema = new mongoose.Schema(
  {
    month: pricingTierSchema,
    quarter: pricingTierSchema,
    half: pricingTierSchema,
  },
  { _id: false }
);

export interface PricingTier {
  originalPrice: number;
  price: number;
}

export interface PricingTiers {
  month: PricingTier;
  quarter: PricingTier;
  half: PricingTier;
}

@MongoSchema({ timestamps: true })
export class PackageSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: String, required: true })
  @Unique({ message: "A package with this key already exists" })
  key!: string;

  @MongoField(localizedStringField())
  @Searchable({ subPaths: ["ar", "en"] })
  name!: LocalizedString;

  @MongoField(localizedStringField())
  tag?: LocalizedString;

  @MongoField({ type: Boolean, default: false })
  @Filterable()
  popular!: boolean;

  @MongoField({ type: String, enum: Object.values(PackageVariant), required: true })
  variant!: PackageVariant;

  @MongoField({ type: String, enum: Object.values(IconKey), required: true })
  icon!: IconKey;

  @MongoField(localizedStringField())
  followUpLabel!: LocalizedString;

  @MongoField({ type: pricingTiersSchema, required: true })
  pricingTiers!: PricingTiers;

  @MongoField({ type: [localizedStringField().type], default: () => [] })
  details!: LocalizedString[];

  @MongoField({ type: Number, default: 0 })
  order!: number;

  @MongoField({ type: String, enum: Object.values(ContentStatus), required: true })
  @Filterable()
  status!: ContentStatus;

  // No soft delete for Package, per the plan — it's a tiny, fixed-size
  // collection (3 rows in practice), not user-generated content.
  @MongoField({ type: seoSchema, required: false })
  seoOverride?: Seo;
}

export const PackageModel = createMongoModel(EntityName.PACKAGE, PackageSchema);
