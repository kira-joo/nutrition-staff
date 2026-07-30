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

export interface GalleryItem {
  id: string;
  image: ImageAsset;
  altText: LocalizedString;
  order: number;
}

/**
 * `GalleryItem` is a plain-data interface (deliberately — it's the wire/DTO
 * shape), but at runtime `profile.gallery`'s elements are actual Mongoose
 * subdocuments: their fields are prototype getters, not own enumerable
 * properties, so `{...item}` silently drops all of them. Any gallery
 * handler that spreads/patches an item must convert it via this first.
 */
export function toPlainGalleryItem(item: GalleryItem): GalleryItem {
  return (item as unknown as { toObject: () => GalleryItem }).toObject();
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

  // Managed via its own sub-resource routes (add/replace/remove/reorder),
  // not through the main profile PUT — each item has its own asset, and
  // there's no way to bundle several files into one multipart update
  // (see server/doctor-profile/gallery route handlers).
  @MongoField({ type: [galleryItemSchema], default: () => [] })
  gallery!: GalleryItem[];
}

export const DoctorProfileModel = createMongoModel(EntityName.DOCTOR_PROFILE, DoctorProfileSchema);
