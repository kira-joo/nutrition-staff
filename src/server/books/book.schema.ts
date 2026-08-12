import { createMongoModel, Filterable, imageAssetField, MongoField, MongoSchema, Searchable, Unique } from "@kira-joo/backend-toolkit-mongoose";
import type { ImageAsset } from "@kira-joo/toolkit-common";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { BookOverrideKey, BookStatus, BookVisibility } from "src/common/enums";
import { asSchemaField, bookContactBlockSchema, bookSocialLinkSchema } from "src/server/book-settings/book-settings.schema";
import type { BookOverrides } from "src/common/interfaces/book.interface";

// Embedded, `_id:false` — mirrors BookSettings' overridable shape exactly,
// reusing the same sub-schemas rather than redefining them.
const bookOverridesSchema = new mongoose.Schema(
  {
    doctorName: { type: String, required: false },
    doctorTitle: { type: String, required: false },
    doctorBio: { type: String, required: false },
    doctorImage: asSchemaField(imageAssetField()),
    bookLogo: asSchemaField(imageAssetField()),
    websiteUrl: { type: String, required: false },
    socialLinks: { type: [bookSocialLinkSchema], required: false },
    contact: { type: bookContactBlockSchema, required: false },
    disclaimer: { type: String, required: false },
    copyrightText: { type: String, required: false },
    backCoverClosingText: { type: String, required: false },
    backCoverAudienceText: { type: String, required: false },
    qrDestination: { type: String, required: false },
    // Mixed, NOT bookPrintSettingsSchema -- print resolves as a PARTIAL
    // MERGE (`{ ...settings.print, ...overrides.print }` in
    // resolveBookIdentity), which requires that a field the doctor never
    // touched stay genuinely absent in storage. Reusing the full
    // sub-schema here was a real bug caught live: Mongoose casts ANY
    // write through a nested schema's own field defaults, so sending
    // `{ pageSize: "a4" }` silently stored
    // `{ pageSize: "a4", marginPreset: "standard", gutterMm: 18, ... }` —
    // clobbering the books default for every field the doctor left alone
    // with the sub-schema's generic default instead. Mixed stores exactly
    // what's given, with no casting/defaulting, which is what a genuine
    // partial value requires.
    print: { type: mongoose.Schema.Types.Mixed, required: false },
  },
  { _id: false }
);

@MongoSchema({ timestamps: true, softDelete: true })
export class BookSchema {
  _id!: mongoose.Types.ObjectId;

  // Header — plain Arabic string, deliberately NOT LocalizedString (Books
  // are Arabic-only from the architecture up). `@Searchable()` with no
  // `subPaths` since this is a bare string field, not a {ar,en} shape.
  @MongoField({ type: String, required: true })
  @Searchable()
  title!: string;

  @MongoField({ type: String, required: false })
  subtitle?: string;

  @MongoField({ type: String, required: true })
  @Unique({ message: "A book with this slug already exists" })
  slug!: string;

  @MongoField({ type: String, required: false })
  shortDescription?: string;

  @MongoField({ type: String, required: false })
  @Filterable()
  category?: string;

  @MongoField({ type: String, required: false })
  editionLabelTemplate?: string;

  @MongoField(imageAssetField())
  coverImage?: ImageAsset | null;

  @MongoField(imageAssetField())
  backCoverImage?: ImageAsset | null;

  // Lifecycle
  @MongoField({ type: String, enum: Object.values(BookStatus), required: true, default: BookStatus.DRAFT })
  @Filterable()
  status!: BookStatus;

  @MongoField({ type: String, enum: Object.values(BookVisibility), required: true, default: BookVisibility.UNLISTED })
  @Filterable()
  visibility!: BookVisibility;

  @MongoField({ type: Boolean, default: true })
  allowFlipbook!: boolean;

  @MongoField({ type: Boolean, default: true })
  allowPdfDownload!: boolean;

  @MongoField({ type: Boolean, default: false })
  showOnWebsite!: boolean;

  // Concurrency + dirty tracking
  @MongoField({ type: Number, default: 0 })
  revision!: number;

  @MongoField({ type: Number, default: 0 })
  contentRevision!: number;

  // Publication pointers — mutable metadata ABOUT immutable editions, never the editions themselves.
  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.BOOK_EDITION, required: false })
  currentEditionId?: mongoose.Types.ObjectId;

  @MongoField({ type: Date, required: false })
  lastPublishedAt?: Date;

  @MongoField({ type: Number, default: 0 })
  editionCount!: number;

  // Inheritance — `overriddenFields` is the AUTHORITY on which keys of
  // `overrides` are active; resolution is key membership, never value
  // truthiness (see resolve-book-identity.ts).
  @MongoField({ type: bookOverridesSchema, default: () => ({}) })
  overrides!: BookOverrides;

  @MongoField({ type: [String], enum: Object.values(BookOverrideKey), default: () => [] })
  overriddenFields!: BookOverrideKey[];

  // Content placeholders — real shape (chapter/block registry, front/back
  // matter slots, structured references) is Phase C/D territory. Present
  // here with safe empty defaults so a Draft created in Phase B already
  // has the exact keys Phase C will populate, rather than needing a later
  // migration to add them.
  @MongoField({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  frontMatter!: Record<string, unknown>;

  @MongoField({ type: [mongoose.Schema.Types.Mixed], default: () => [] })
  chapters!: unknown[];

  @MongoField({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  backMatter!: Record<string, unknown>;

  @MongoField({ type: [mongoose.Schema.Types.Mixed], default: () => [] })
  references!: unknown[];
}

export const BookModel = createMongoModel(EntityName.BOOK, BookSchema);
