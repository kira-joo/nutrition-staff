import {
  createMongoModel,
  imageAssetField,
  localizedStringField,
  MongoField,
  MongoSchema,
  type MongoFieldOptions,
} from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset, LocalizedString } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";

// MongoFieldOptions (backend-toolkit-mongoose) is deliberately typed
// loosely for its `@MongoField()` decorator use — it's a real, valid
// Mongoose field definition at runtime, but TypeScript won't structurally
// match it against `mongoose.Schema`'s own strict `SchemaDefinitionProperty`
// when a sub-schema mixes a helper-produced field with a plain literal one
// (as every schema below does, via `order`). Same object, just satisfying
// the compiler at this one boundary.
function asSchemaField(options: MongoFieldOptions): mongoose.SchemaDefinitionProperty {
  return options as unknown as mongoose.SchemaDefinitionProperty;
}

const bioSectionSchema = new mongoose.Schema(
  {
    heading: asSchemaField(localizedStringField()),
    body: asSchemaField(localizedStringField()),
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const labeledOrderedItemSchema = new mongoose.Schema(
  {
    text: asSchemaField(localizedStringField()),
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const statItemSchema = new mongoose.Schema(
  {
    label: asSchemaField(localizedStringField()),
    /* Not integer-only: an average rating like 4.9 is a legitimate figure. */
    value: { type: Number, required: true, min: 0 },
    suffix: { type: String, required: false },
    order: { type: Number, default: 0 },
    /* Lets an editor retire a figure without losing it. */
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const galleryItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    image: asSchemaField(imageAssetField({ required: true })),
    altText: asSchemaField(localizedStringField()),
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

export interface BioSection {
  heading?: LocalizedString;
  body: LocalizedString;
  order: number;
}

export interface LabeledOrderedItem {
  text: LocalizedString;
  order: number;
}

/** One headline figure in the public site's stats band. */
export interface StatItem {
  label: LocalizedString;
  value: number;
  suffix?: string;
  order: number;
  enabled: boolean;
}

export interface GalleryItem {
  id: string;
  image: ImageAsset;
  altText: LocalizedString;
  order: number;
}

@MongoSchema({ timestamps: true })
export class DoctorProfileSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField(localizedStringField())
  name!: LocalizedString;

  @MongoField(localizedStringField())
  tagline!: LocalizedString;

  @MongoField(imageAssetField())
  avatar?: ImageAsset | null;

  @MongoField(localizedStringField())
  avatarAlt!: LocalizedString;

  @MongoField({ type: [bioSectionSchema], default: () => [] })
  bioSections!: BioSection[];

  @MongoField(localizedStringField())
  programHeading!: LocalizedString;

  @MongoField({ type: [labeledOrderedItemSchema], default: () => [] })
  programHighlights!: LabeledOrderedItem[];

  @MongoField(localizedStringField())
  whyChooseHeading!: LocalizedString;

  @MongoField({ type: [labeledOrderedItemSchema], default: () => [] })
  whyChooseReasons!: LabeledOrderedItem[];

  @MongoField(localizedStringField())
  featuredInLabel!: LocalizedString;

  /**
   * The public site's stats band. Lives on this profile rather than in its own
   * collection because it is the same shape family as `programHighlights` and
   * `whyChooseReasons` — a short ordered list of localized items belonging to
   * the doctor — and putting it here means no new collection, route, public
   * endpoint, cache tag or client data function was needed to ship it.
   */
  @MongoField({ type: [statItemSchema], default: () => [] })
  stats!: StatItem[];

  // Managed via its own sub-resource routes (add/replace/remove/reorder),
  // not through the main profile PUT — each item has its own asset, and
  // there's no way to bundle several files into one multipart update
  // (see server/doctor-profile/gallery route handlers).
  @MongoField({ type: [galleryItemSchema], default: () => [] })
  gallery!: GalleryItem[];
}

export const DoctorProfileModel = createMongoModel(EntityName.DOCTOR_PROFILE, DoctorProfileSchema);
