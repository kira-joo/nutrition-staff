import { createMongoModel, imageAssetField, MongoField, MongoSchema, type MongoFieldOptions } from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { BookMarginPreset, BookPageSize } from "src/common/enums";
import { CURRENT_BOOK_TEMPLATE_VERSION } from "src/common/books/book-template-version";
import type { BookContactBlock, BookPageWatermark, BookPrintSettings, BookSocialLink } from "src/common/interfaces/book-settings.interface";
import { DEFAULT_PAGE_WATERMARK } from "src/common/interfaces/book-settings.interface";

// See doctor-profile.schema.ts for why this cast exists: MongoFieldOptions
// is typed loosely for `@MongoField()`, and doesn't structurally match
// mongoose.Schema's stricter SchemaDefinitionProperty when mixed into a
// plain embedded-schema literal alongside ordinary fields.
function asSchemaField(options: MongoFieldOptions): mongoose.SchemaDefinitionProperty {
  return options as unknown as mongoose.SchemaDefinitionProperty;
}

const bookSocialLinkSchema = new mongoose.Schema(
  {
    platform: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const bookContactBlockSchema = new mongoose.Schema(
  {
    phone: { type: String, required: false },
    whatsapp: { type: String, required: false },
    email: { type: String, required: false },
    address: { type: String, required: false },
  },
  { _id: false }
);

// Exported for reuse by BookSchema.overrides.print and the Edition
// snapshot's frozen `resolvedSettings.print` — one embedded-schema
// definition, not a copy per consumer.
export const bookPrintSettingsSchema = new mongoose.Schema(
  {
    pageSize: { type: String, enum: Object.values(BookPageSize), default: BookPageSize.A5 },
    marginPreset: { type: String, enum: Object.values(BookMarginPreset), default: BookMarginPreset.STANDARD },
    gutterMm: { type: Number, default: 18 },
    pageNumberStart: { type: Number, default: 1 },
    doublePageSpread: { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * Exported for the same reason as `bookPrintSettingsSchema`: `Book.overrides`
 * and the Edition's frozen `resolvedSettings` reuse this one definition
 * rather than each restating the shape.
 */
export const bookPageWatermarkSchema = new mongoose.Schema(
  {
    image: asSchemaField(imageAssetField()),
    opacity: { type: Number, default: DEFAULT_PAGE_WATERMARK.opacity, min: 0, max: 1 },
    scaleMm: { type: Number, default: DEFAULT_PAGE_WATERMARK.scaleMm, min: 1 },
  },
  { _id: false }
);

@MongoSchema({ timestamps: true })
export class BookSettingsSchema {
  _id!: mongoose.Types.ObjectId;

  // Publishing identity — plain Arabic strings, deliberately NOT
  // LocalizedString: Books are Arabic-only from the architecture up, and
  // this is a separate publishing profile from DoctorProfile/SiteSettings,
  // never auto-mirrored.
  // required:false, not true -- Mongoose's built-in required-checker for
  // String rejects an empty string even when it comes from `default: ""`
  // (confirmed empirically: `required:true` here made getOrCreateSingleton
  // unable to ever create the very first singleton document). These
  // fields are always PRESENT as a string at the application level thanks
  // to the default; `required` here is purely "must the doctor have
  // already typed something," which is not the invariant we want.
  @MongoField({ type: String, required: false, default: "" })
  doctorName!: string;

  @MongoField({ type: String, required: false, default: "" })
  doctorTitle!: string;

  @MongoField({ type: String, required: false, default: "" })
  doctorBio!: string;

  @MongoField(imageAssetField())
  doctorImage?: ImageAsset | null;

  @MongoField(imageAssetField())
  bookLogo?: ImageAsset | null;

  @MongoField({ type: String, required: false })
  websiteUrl?: string;

  @MongoField({ type: [bookSocialLinkSchema], default: () => [] })
  socialLinks!: BookSocialLink[];

  @MongoField({ type: bookContactBlockSchema, default: () => ({}) })
  contact!: BookContactBlock;

  @MongoField({ type: String, required: false, default: "" })
  disclaimer!: string;

  @MongoField({ type: String, required: false, default: "" })
  copyrightText!: string;

  @MongoField({ type: String, required: false, default: "" })
  backCoverClosingText!: string;

  @MongoField({ type: String, required: false, default: "" })
  backCoverAudienceText!: string;

  @MongoField({ type: String, required: false })
  defaultQrDestination?: string;

  @MongoField({ type: bookPrintSettingsSchema, default: () => ({}) })
  print!: BookPrintSettings;

  @MongoField({ type: bookPageWatermarkSchema, default: () => ({}) })
  pageWatermark!: BookPageWatermark;

  @MongoField({ type: String, required: true, default: CURRENT_BOOK_TEMPLATE_VERSION })
  templateVersion!: string;
}

export const BookSettingsModel = createMongoModel(EntityName.BOOK_SETTINGS, BookSettingsSchema);

// Re-exported so BookSchema's embedded `overrides` sub-schema (a different
// module) can reuse the exact same shapes instead of redefining them.
export { asSchemaField, bookContactBlockSchema, bookSocialLinkSchema };
