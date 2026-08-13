import { createMongoModel, MongoField, MongoSchema } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import type { BookBackMatter, BookFrontMatter, BookReference, Chapter } from "src/common/interfaces/book-chapter.interface";
import type { ResolvedBookIdentity } from "src/common/books/resolve-book-identity";

/** The frozen content shape — deep-copied at publish time, never a live reference back to `Book`. */
export interface FrozenBookContent {
  frontMatter: BookFrontMatter;
  chapters: Chapter[];
  backMatter: BookBackMatter;
  references: BookReference[];
}

/** Everything a `RECIPE_REF` block needs to render independently of the live Recipe module, keyed by recipe id. */
export interface RecipeSnapshot {
  title: unknown;
  description: unknown;
  image: unknown;
  ingredients: unknown;
  instructions: unknown;
  prepTime?: unknown;
  cookTime?: unknown;
  servings?: unknown;
}

/**
 * `@MongoSchema({ timestamps: true })` — deliberately NO `softDelete`.
 * There is no delete route on Editions at all (see the missing DELETE
 * export on the API route), which is stricter than every other
 * `Book*` schema — immutability here is a mandatory acceptance
 * criterion, not a convention to follow loosely. Every field below is
 * written exactly once, at publish time, by `publish-book-edition.ts`,
 * and never touched again by any other code path.
 */
@MongoSchema({ timestamps: true })
export class BookEditionSchema {
  _id!: mongoose.Types.ObjectId;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.BOOK, required: true, index: true })
  bookId!: mongoose.Types.ObjectId;

  @MongoField({ type: Number, required: true })
  editionNumber!: number;

  @MongoField({ type: String, required: false })
  editionLabel?: string;

  @MongoField({ type: String, required: true })
  templateVersion!: string;

  // The Book's `contentRevision` at the moment this Edition was frozen —
  // lets a future reader confirm exactly which draft state produced it,
  // without that being a live/mutable pointer back to the Book.
  @MongoField({ type: Number, required: true })
  contentRevision!: number;

  @MongoField({ type: Date, required: true })
  publishedAt!: Date;

  @MongoField({ type: mongoose.Schema.Types.ObjectId, ref: EntityName.USER, required: true })
  publishedByUserId!: mongoose.Types.ObjectId;

  @MongoField({ type: String, required: true })
  slugAtPublish!: string;

  @MongoField({ type: String, required: true })
  titleAtPublish!: string;

  // Captured once at publish time via `PublishBookDto.notes` — there is
  // no route to edit this afterward, matching the "no ordinary PUT" rule
  // for the whole Edition.
  @MongoField({ type: String, required: false })
  notes?: string;

  @MongoField({ type: mongoose.Schema.Types.Mixed, required: true })
  content!: FrozenBookContent;

  @MongoField({ type: mongoose.Schema.Types.Mixed, required: true })
  resolvedSettings!: ResolvedBookIdentity;

  @MongoField({ type: mongoose.Schema.Types.Mixed, default: () => ({}) })
  recipeSnapshots!: Record<string, RecipeSnapshot>;

  // Indexed — powers the asset-destruction guard's one covered `count()`
  // check (`destroy-asset-unless-published.ts`). Every Cloudinary
  // publicId this Edition's frozen content/resolvedSettings/recipe
  // snapshots reference, collected once at publish time.
  @MongoField({ type: [String], default: () => [], index: true })
  referencedAssetPublicIds!: string[];
}

export const BookEditionModel = createMongoModel(EntityName.BOOK_EDITION, BookEditionSchema);
