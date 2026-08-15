import { createMongoModel, Filterable, MongoField, MongoSchema } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import { BookArtifactStatus, BookArtifactType } from "src/common/enums";

export { BookArtifactStatus, BookArtifactType };

/**
 * Foundation only, per the approved Phase E scope — no generation route
 * exists yet (that is Phase F). This schema/repository exist now so
 * Phase F has a real place to write to rather than needing a migration,
 * matching the same reasoning `Book.chapters` was seeded with real
 * (if initially empty) shape ahead of Phase C.
 */
@MongoSchema({ timestamps: true })
export class BookArtifactSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.BOOK_EDITION, required: true, index: true })
  editionId!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.BOOK, required: true, index: true })
  bookId!: mongoose.Types.ObjectId;

  @MongoField({ type: String, enum: Object.values(BookArtifactType), required: true })
  type!: BookArtifactType;

  @MongoField({ type: String, enum: Object.values(BookArtifactStatus), required: true })
  @Filterable()
  status!: BookArtifactStatus;

  @MongoField({ type: String, required: true })
  templateVersion!: string;

  @MongoField({ type: Date, required: true })
  startedAt!: Date;

  @MongoField({ type: Date, required: false })
  finishedAt?: Date;

  @MongoField({ type: Number, required: false })
  pageCount?: number;

  @MongoField({ type: Number, required: false })
  fileSize?: number;

  @MongoField({ type: String, required: false })
  storageProvider?: string;

  @MongoField({ type: String, required: false })
  storagePublicId?: string;

  @MongoField({ type: String, required: false })
  storageUrl?: string;

  // Internal detail only — never surfaced verbatim to the staff UI (see
  // BOOK_PLAN §45: "record useful internal error information without
  // leaking stack traces in user-facing UI").
  @MongoField({ type: String, required: false })
  errorMessage?: string;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.USER, required: true })
  generatedByUserId!: mongoose.Types.ObjectId;
}

export const BookArtifactModel = createMongoModel(EntityName.BOOK_ARTIFACT, BookArtifactSchema);

// A compound unique index, not a decorator — `@MongoField`/`@Unique()`
// only builds single-field indexes (see `apply-indexes.ts`), and this
// schema cannot be edited (no toolkit changes). Calling `.index()`
// directly on the compiled model's own `mongoose.Schema` is a normal,
// documented Mongoose API, not a toolkit change. At most one artifact
// per (edition, type) is the concurrency guard's foundation
// (`generate-book-artifact.ts`): the first-ever generation attempt races
// on `.save()` and a `DuplicateKeyError` means another request already
// won; every later (re)generation reuses that same row via `.update()`.
BookArtifactModel.schema.index({ editionId: 1, type: 1 }, { unique: true });
