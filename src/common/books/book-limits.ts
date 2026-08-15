/**
 * Hard caps on Book content, enforced in DTOs/handlers before any save.
 * `chapters`/blocks are stored as `Mixed` (Mongoose validates nothing on
 * that path), so these caps — together with per-type DTO validation and
 * the size-budget guard — are the only real defence against a pathological
 * document. Numbers are a soft ceiling, not a measured production limit.
 */
export const MAX_CHAPTERS = 60;
export const MAX_BLOCKS_PER_CONTAINER = 300;
export const MAX_BLOCKS_PER_BOOK = 2000;
export const MAX_REFERENCES = 300;
export const MAX_TABLE_CELLS = 400;
export const MAX_RICH_TEXT_NODES = 500;

/** Soft budget checked before every content save — well under the 16MB BSON hard limit, so a "document too large" error is never a surprise. */
export const BOOK_SIZE_SOFT_BUDGET_BYTES = 4 * 1024 * 1024;
