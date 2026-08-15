import type { ImageAsset } from "@kira-joo/frontend-toolkit-core";
import type { BookBlock } from "./book-block.interface";

export interface Chapter {
  id: string;
  title: string;
  subtitle?: string;
  intro?: string;
  coverImage?: ImageAsset | null;
  startOnNewPage: boolean;
  includeInToc: boolean;
  tocTitle?: string;
  blocks: BookBlock[];
  order: number;
}

/** The three content-bearing slots — a closed set (nobody adds a fourth), so this is a fixed-key object rather than a second polymorphic array. */
export interface BookFrontMatter {
  aboutBook: { blocks: BookBlock[] };
  introduction: { blocks: BookBlock[] };
}

export interface BookBackMatter {
  conclusion: { blocks: BookBlock[] };
}

export interface BookReference {
  id: string;
  label: string;
  text: string;
  url?: string;
}

export function emptyFrontMatter(): BookFrontMatter {
  return { aboutBook: { blocks: [] }, introduction: { blocks: [] } };
}

export function emptyBackMatter(): BookBackMatter {
  return { conclusion: { blocks: [] } };
}
