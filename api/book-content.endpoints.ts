import { MethodType, type Endpoint } from "@kira-joo/frontend-toolkit-core";
import type { Book } from "../src/common/interfaces/book.interface";

// Chapter/block/reference bodies are typed loosely (`Record<string, unknown>`)
// for the multipart-backed routes (add/replace chapter, add/replace block —
// any of them may carry an image) — same convention `updateBookEndpoint`
// uses. JSON-only routes (reorder, duplicate, remove, references) get real
// body types since they never carry a file.

// ---- Chapters ----

export const addChapterEndpoint: Endpoint<{ params: { bookId: string }; body: Record<string, unknown>; returnType: Book }> = {
  url: "/books/:bookId/chapters",
  methodType: MethodType.POST,
};

export const updateChapterEndpoint: Endpoint<{ params: { bookId: string; chapterId: string }; body: Record<string, unknown>; returnType: Book }> = {
  url: "/books/:bookId/chapters/:chapterId",
  methodType: MethodType.PUT,
};

export const removeChapterEndpoint: Endpoint<{ params: { bookId: string; chapterId: string }; body: { expectedRevision: number }; returnType: Book }> = {
  url: "/books/:bookId/chapters/:chapterId",
  methodType: MethodType.DELETE,
};

export const reorderChaptersEndpoint: Endpoint<{
  params: { bookId: string };
  body: { chapterIds: string[]; expectedRevision: number };
  returnType: Book;
}> = { url: "/books/:bookId/chapters/reorder", methodType: MethodType.PUT };

export const duplicateChapterEndpoint: Endpoint<{
  params: { bookId: string; chapterId: string };
  body: { expectedRevision: number };
  returnType: Book;
}> = { url: "/books/:bookId/chapters/:chapterId/duplicate", methodType: MethodType.POST };

// ---- Chapter blocks ----
//
// Params are typed loosely (`Record<string, string>`) for every block
// endpoint below, chapter or section — `BookBlockList` picks between a
// chapter-shaped and a section-shaped endpoint with one ternary and
// passes one shared `routeParams` object either way (see
// `book-block-list.tsx`), so a precise per-endpoint params shape would
// force that call site into a union it can't satisfy generically. The
// route handlers themselves still validate the real params strictly via
// `FindChapterBlockParamsDto`/`FindSectionBlockParamsDto`.

export const addChapterBlockEndpoint: Endpoint<{ params: Record<string, string>; body: Record<string, unknown>; returnType: Book }> = {
  url: "/books/:bookId/chapters/:chapterId/blocks",
  methodType: MethodType.POST,
};

export const replaceChapterBlockEndpoint: Endpoint<{ params: Record<string, string>; body: Record<string, unknown>; returnType: Book }> = {
  url: "/books/:bookId/chapters/:chapterId/blocks/:blockId",
  methodType: MethodType.PUT,
};

export const removeChapterBlockEndpoint: Endpoint<{ params: Record<string, string>; body: { expectedRevision: number }; returnType: Book }> = {
  url: "/books/:bookId/chapters/:chapterId/blocks/:blockId",
  methodType: MethodType.DELETE,
};

export const reorderChapterBlocksEndpoint: Endpoint<{
  params: Record<string, string>;
  body: { blockIds: string[]; expectedRevision: number };
  returnType: Book;
}> = { url: "/books/:bookId/chapters/:chapterId/blocks/reorder", methodType: MethodType.PUT };

export const duplicateChapterBlockEndpoint: Endpoint<{ params: Record<string, string>; body: { expectedRevision: number }; returnType: Book }> = {
  url: "/books/:bookId/chapters/:chapterId/blocks/:blockId/duplicate",
  methodType: MethodType.POST,
};

// ---- Front-matter / back-matter section blocks (identical registry/DTO dispatch, different container) ----

export const addSectionBlockEndpoint: Endpoint<{ params: Record<string, string>; body: Record<string, unknown>; returnType: Book }> = {
  url: "/books/:bookId/sections/:section/:slot/blocks",
  methodType: MethodType.POST,
};

export const replaceSectionBlockEndpoint: Endpoint<{ params: Record<string, string>; body: Record<string, unknown>; returnType: Book }> = {
  url: "/books/:bookId/sections/:section/:slot/blocks/:blockId",
  methodType: MethodType.PUT,
};

export const removeSectionBlockEndpoint: Endpoint<{ params: Record<string, string>; body: { expectedRevision: number }; returnType: Book }> = {
  url: "/books/:bookId/sections/:section/:slot/blocks/:blockId",
  methodType: MethodType.DELETE,
};

export const reorderSectionBlocksEndpoint: Endpoint<{
  params: Record<string, string>;
  body: { blockIds: string[]; expectedRevision: number };
  returnType: Book;
}> = { url: "/books/:bookId/sections/:section/:slot/blocks/reorder", methodType: MethodType.PUT };

export const duplicateSectionBlockEndpoint: Endpoint<{ params: Record<string, string>; body: { expectedRevision: number }; returnType: Book }> = {
  url: "/books/:bookId/sections/:section/:slot/blocks/:blockId/duplicate",
  methodType: MethodType.POST,
};

// ---- Cross-container move ----

export const moveBlockEndpoint: Endpoint<{
  params: { bookId: string };
  body: {
    blockId: string;
    from: { chapterId?: string; section?: string; slot?: string };
    to: { chapterId?: string; section?: string; slot?: string };
    toIndex?: number;
    expectedRevision: number;
  };
  returnType: Book;
}> = { url: "/books/:bookId/blocks/move", methodType: MethodType.PUT };

// ---- References ----

export const addReferenceEndpoint: Endpoint<{
  params: { bookId: string };
  body: { label: string; text: string; url?: string; expectedRevision: number };
  returnType: Book;
}> = { url: "/books/:bookId/references", methodType: MethodType.POST };

export const updateReferenceEndpoint: Endpoint<{
  params: { bookId: string; referenceId: string };
  body: { label?: string; text?: string; url?: string; expectedRevision: number };
  returnType: Book;
}> = { url: "/books/:bookId/references/:referenceId", methodType: MethodType.PUT };

export const removeReferenceEndpoint: Endpoint<{
  params: { bookId: string; referenceId: string };
  body: { expectedRevision: number };
  returnType: Book;
}> = { url: "/books/:bookId/references/:referenceId", methodType: MethodType.DELETE };

export const reorderReferencesEndpoint: Endpoint<{
  params: { bookId: string };
  body: { referenceIds: string[]; expectedRevision: number };
  returnType: Book;
}> = { url: "/books/:bookId/references/reorder", methodType: MethodType.PUT };
