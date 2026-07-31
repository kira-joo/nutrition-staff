import { createMongoModel, imageAssetField, localizedStringField, MongoField, MongoSchema } from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { Currency } from "src/common/enums";

const socialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

// Exported for reuse anywhere else that needs an optional SEO override with
// the exact same shape (e.g. Package.seoOverride) — one embedded-schema
// definition, not a copy per consumer.
export const seoSchema = new mongoose.Schema(
  {
    title: localizedStringField(),
    description: localizedStringField(),
  },
  { _id: false }
);

export interface SocialLink {
  platform: string;
  url: string;
  order: number;
}

export interface Seo {
  title: LocalizedString;
  description: LocalizedString;
}

@MongoSchema({ timestamps: true })
export class SiteSettingsSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: String, required: false })
  phone?: string;

  @MongoField({ type: String, required: false })
  whatsappNumber?: string;

  @MongoField({ type: String, required: false })
  email?: string;

  @MongoField({ type: String, enum: Object.values(Currency), default: Currency.EGP })
  currencyCode!: Currency;

  @MongoField({ type: [socialLinkSchema], default: () => [] })
  socialLinks!: SocialLink[];

  @MongoField(imageAssetField())
  logo?: ImageAsset | null;

  @MongoField(imageAssetField())
  favicon?: ImageAsset | null;

  @MongoField({ type: seoSchema, default: () => ({}) })
  defaultSeo!: Seo;

  @MongoField(imageAssetField())
  ogImage?: ImageAsset | null;

  // No real Campaign collection exists yet (Checkpoint E+) — this is a
  // forward-compatible, unvalidated-against-anything ObjectId reference
  // until Campaign is built.
  @MongoField({ type: mongoose.Schema.Types.ObjectId, required: false })
  activeCampaignId?: mongoose.Types.ObjectId;
}

export const SiteSettingsModel = createMongoModel(EntityName.SITE_SETTINGS, SiteSettingsSchema);
