import { NotFoundError } from "@kira-joo/backend-toolkit-core";
import type { BookBlock } from "src/common/interfaces/book-block.interface";
import type { BookSchema } from "src/server/books/book.schema";
import { emptyBackMatter, emptyFrontMatter, type Chapter } from "src/common/interfaces/book-chapter.interface";

/**
 * A "container" is anywhere a `blocks[]` array lives on a Book: one
 * chapter, or one of the fixed front-matter/back-matter slots. Every
 * block handler (add/replace/remove/reorder/duplicate/move) is written
 * once against this abstraction rather than once per container kind —
 * this is what lets front/back matter reuse the identical block registry,
 * DTO dispatch, and sub-resource routes chapters use, per the approved
 * architecture.
 */
export type BlockContainerRef =
  | { kind: "chapter"; chapterId: string }
  | { kind: "frontMatter"; slot: "aboutBook" | "introduction" }
  | { kind: "backMatter"; slot: "conclusion" };

export function containerRefFromParams(params: { chapterId?: string; section?: string; slot?: string }): BlockContainerRef {
  if (params.chapterId) return { kind: "chapter", chapterId: params.chapterId };
  if (params.section === "front-matter") return { kind: "frontMatter", slot: assertFrontMatterSlot(params.slot) };
  if (params.section === "back-matter") return { kind: "backMatter", slot: assertBackMatterSlot(params.slot) };
  throw new NotFoundError("Unknown block container.");
}

function assertFrontMatterSlot(slot: string | undefined): "aboutBook" | "introduction" {
  if (slot === "aboutBook" || slot === "introduction") return slot;
  throw new NotFoundError(`Unknown front-matter slot: "${slot}".`, { validSlots: ["aboutBook", "introduction"] });
}

function assertBackMatterSlot(slot: string | undefined): "conclusion" {
  if (slot === "conclusion") return slot;
  throw new NotFoundError(`Unknown back-matter slot: "${slot}".`, { validSlots: ["conclusion"] });
}

/**
 * Defensive against pre-Phase-C documents (created before `frontMatter`/
 * `backMatter` had real slot shapes — Phase B seeded them as `{}`):
 * always returns a real array, never throws on a missing slot key.
 */
export function getContainerBlocks(book: BookSchema, ref: BlockContainerRef): BookBlock[] {
  if (ref.kind === "chapter") {
    const chapter = book.chapters.find((chapter) => chapter.id === ref.chapterId);
    if (!chapter) throw new NotFoundError(`No chapter exists with id "${ref.chapterId}".`, { chapterId: ref.chapterId });
    return chapter.blocks ?? [];
  }
  if (ref.kind === "frontMatter") {
    return book.frontMatter?.[ref.slot]?.blocks ?? [];
  }
  return book.backMatter?.[ref.slot]?.blocks ?? [];
}

/** Returns the whole-Book patch to persist (the specific field that changed) — the caller passes this straight to `bookRepository.update()`. */
export function withContainerBlocks(book: BookSchema, ref: BlockContainerRef, nextBlocks: BookBlock[]): Partial<BookSchema> {
  if (ref.kind === "chapter") {
    const chapterIndex = book.chapters.findIndex((chapter) => chapter.id === ref.chapterId);
    if (chapterIndex === -1) throw new NotFoundError(`No chapter exists with id "${ref.chapterId}".`, { chapterId: ref.chapterId });
    const nextChapters = book.chapters.map((chapter, index) => (index === chapterIndex ? { ...chapter, blocks: nextBlocks } : chapter));
    return { chapters: nextChapters };
  }
  if (ref.kind === "frontMatter") {
    const frontMatter = book.frontMatter ?? emptyFrontMatter();
    return { frontMatter: { ...frontMatter, [ref.slot]: { blocks: nextBlocks } } };
  }
  const backMatter = book.backMatter ?? emptyBackMatter();
  return { backMatter: { ...backMatter, [ref.slot]: { blocks: nextBlocks } } };
}

export function findChapterOrThrow(book: BookSchema, chapterId: string): Chapter {
  const chapter = book.chapters.find((chapter) => chapter.id === chapterId);
  if (!chapter) throw new NotFoundError(`No chapter exists with id "${chapterId}".`, { chapterId });
  return chapter;
}
