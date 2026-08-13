import type { ImageAsset } from "@kira-joo/frontend-toolkit-core";
import type { BookBackMatter, BookFrontMatter, BookReference, Chapter } from "./book-chapter.interface";
import type { ResolvedBookIdentity } from "../books/resolve-book-identity";

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

export interface BookEdition {
  _id: string;
  bookId: string;
  editionNumber: number;
  editionLabel?: string;
  templateVersion: string;
  contentRevision: number;
  publishedAt: string;
  publishedByUserId: string;
  slugAtPublish: string;
  titleAtPublish: string;
  notes?: string;
  content: {
    title: string;
    subtitle?: string;
    coverImage?: ImageAsset | null;
    backCoverImage?: ImageAsset | null;
    frontMatter: BookFrontMatter;
    chapters: Chapter[];
    backMatter: BookBackMatter;
    references: BookReference[];
  };
  resolvedSettings: ResolvedBookIdentity;
  recipeSnapshots: Record<string, RecipeSnapshot>;
  referencedAssetPublicIds: string[];
  createdAt: string;
  updatedAt: string;
}
