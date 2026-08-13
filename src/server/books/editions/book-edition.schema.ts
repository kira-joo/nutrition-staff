import { createMongoModel, imageAssetField, MongoField, MongoSchema } from "@kira-joo/backend-toolkit-mongoose";
import mongoose from "mongoose";
import { EntityName } from "src/common/authorization/entity-name.enum";
import type { ImageAsset, LocalizedString } from "@kira-joo/frontend-toolkit-core";
import type { BookBackMatter, BookFrontMatter, BookReference, Chapter } from "src/common/interfaces/book-chapter.interface";
import type { ResolvedBookIdentity } from "src/common/books/resolve-book-identity";

/**
 * The frozen content shape — deep-copied at publish time, never a live
 * reference back to `Book`. Includes everything the renderer's
 * `BookContentForRender` input needs (title/subtitle/cover/back-cover
 * images) so a PDF can be generated from `{content, resolvedSettings}`
 * alone — `titleAtPublish`/`slugAtPublish` stay as separate top-level
 * fields too (used by the edition list/detail UI without reaching into
 * `content`), so `title` is deliberately captured in both places.
 */
export interface FrozenBookContent {
  title: string;
  subtitle?: string;
  coverImage?: ImageAsset | null;
  backCoverImage?: ImageAsset | null;
  frontMatter: BookFrontMatter;
  chapters: Chapter[];
  backMatter: BookBackMatter;
  references: BookReference[];
}

/**
 * Everything a `RECIPE_REF` block needs to render independently of the
 * live Recipe module, keyed by recipe id — mirrors the real `Recipe`
 * interface's field types exactly (see `snapshot-recipe-references.ts`)
 * so the shared renderer (`render-block.ts`, reused by Staff Preview,
 * PDF generation, and the public reader) can read `.ar` off these
 * without a cast.
 */
export interface RecipeSnapshot {
  title: LocalizedString;
  description: LocalizedString;
  image: ImageAsset | null;
  ingredients: LocalizedString[];
  instructions: LocalizedString[];
  prepTime?: LocalizedString;
  cookTime?: LocalizedString;
  servings?: LocalizedString;
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

  // `subtitleAtPublish`/`coverImageAtPublish` exist for exactly the same
  // reason `titleAtPublish` does: the public LISTING needs these three
  // presentation fields for every book on a page in ONE batched `$in`
  // query (see `find-public-book-list-items.ts`), and `content` is
  // `Mixed` — a dot-path projection like `"content.title": 1` works at
  // the raw MongoDB level but isn't a shape this toolkit's `select`
  // typing or `buildLevelProjection` (single-level, schema-aware) is
  // designed around. Real top-level fields sidestep that entirely.
  // `content.subtitle`/`content.coverImage` remain the source of truth
  // for the detail/reader payload and for PDF rendering; these are a
  // deliberate, populated-once duplicate for the listing's sake only.
  @MongoField({ type: String, required: false })
  subtitleAtPublish?: string;

  @MongoField(imageAssetField())
  coverImageAtPublish?: ImageAsset | null;

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

// `content`/`resolvedSettings`/`recipeSnapshots` are all `Mixed` — plain
// JS object trees, not typed sub-schemas. Mongoose's default `minimize`
// behavior silently DROPS any empty-object (`{}`) key anywhere in a
// document before persisting, which is exactly wrong for an Edition:
// caught live when a book with no contact info ever set resolved to
// `identity.contact = {}`, and a fresh re-fetch of the persisted
// Edition came back with the `contact` key missing entirely, crashing
// the PDF renderer's `identity.contact.phone` access. `@MongoSchema()`
// has no `minimize` passthrough (no toolkit change possible), but
// `schema.set()` is a normal, documented Mongoose API on the already-
// compiled model — not a toolkit edit. Disabled schema-wide (not just
// per-field) because "exact Edition snapshot" is a mandatory acceptance
// criterion here, unlike most other schemas in this app.
BookEditionModel.schema.set("minimize", false);
