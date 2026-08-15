import type { ResolvedBookIdentity } from "src/common/books/resolve-book-identity";
import type { ImageAsset } from "@kira-joo/toolkit-common";
import type { FrozenBookContent, RecipeSnapshot } from "src/server/books/editions/book-edition.schema";

/** Generic — finds every `{publicId: string}`-shaped object anywhere in an arbitrary JSON value, rather than hand-listing every field that happens to hold an image today (book cover/back-cover, chapter covers, IMAGE blocks, doctor image, book logo, recipe images, ...). New image-bearing fields are covered automatically. */
function walkForPublicIds(value: unknown, found: Set<string>): void {
  if (value === null || value === undefined) return;
  if (Array.isArray(value)) {
    for (const item of value) walkForPublicIds(item, found);
    return;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (typeof record.publicId === "string") found.add(record.publicId);
    for (const key of Object.keys(record)) walkForPublicIds(record[key], found);
  }
}

export interface CollectAssetPublicIdsInput {
  coverImage?: ImageAsset | null;
  backCoverImage?: ImageAsset | null;
  content: FrozenBookContent;
  resolvedSettings: ResolvedBookIdentity;
  recipeSnapshots: Record<string, RecipeSnapshot>;
}

export function collectAssetPublicIds(input: CollectAssetPublicIdsInput): string[] {
  const found = new Set<string>();
  walkForPublicIds(input.coverImage, found);
  walkForPublicIds(input.backCoverImage, found);
  walkForPublicIds(input.content, found);
  walkForPublicIds(input.resolvedSettings, found);
  walkForPublicIds(input.recipeSnapshots, found);
  return [...found];
}
