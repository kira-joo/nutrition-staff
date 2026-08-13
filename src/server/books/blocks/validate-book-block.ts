import { BadRequestError, validateDto } from "@kira-joo/backend-toolkit-core";
import type { ClassConstructor } from "class-transformer";
import { BookBlockType } from "src/common/enums";
import { assertValidRichTextDoc } from "src/server/books/blocks/assert-valid-rich-text-doc";
import { CalloutBlockDto } from "./dto/callout-block.dto";
import { ChecklistBlockDto } from "./dto/checklist-block.dto";
import { CitationBlockDto } from "./dto/citation-block.dto";
import { ImageBlockDto } from "./dto/image-block.dto";
import { ListBlockDto } from "./dto/list-block.dto";
import { ParagraphBlockDto } from "./dto/paragraph-block.dto";
import { QrLinkBlockDto } from "./dto/qr-link-block.dto";
import { QuoteBlockDto } from "./dto/quote-block.dto";
import { RecipeRefBlockDto } from "./dto/recipe-ref-block.dto";
import { SimpleBlockDto } from "./dto/simple-block.dto";
import { TableBlockDto } from "./dto/table-block.dto";
import { HeadingBlockDto, SubheadingBlockDto } from "./dto/text-block.dto";

/**
 * One entry per block type. Add a new block type by adding one entry here
 * (and one to the client block registry, and one to
 * `getBookBlockAssetFields`'s asset dispatch) — nothing else about this
 * dispatch changes. Mirrors `BLOCK_DTO_BY_TYPE` in
 * `src/server/campaigns/blocks/validate-campaign-block.ts`.
 */
export const BOOK_BLOCK_DTO_BY_TYPE: Record<BookBlockType, ClassConstructor<object>> = {
  [BookBlockType.HEADING]: HeadingBlockDto,
  [BookBlockType.SUBHEADING]: SubheadingBlockDto,
  [BookBlockType.PARAGRAPH]: ParagraphBlockDto,
  [BookBlockType.IMAGE]: ImageBlockDto,
  [BookBlockType.BULLET_LIST]: ListBlockDto,
  [BookBlockType.NUMBERED_LIST]: ListBlockDto,
  [BookBlockType.CHECKLIST]: ChecklistBlockDto,
  [BookBlockType.QUOTE]: QuoteBlockDto,
  [BookBlockType.TIP]: CalloutBlockDto,
  [BookBlockType.NOTE]: CalloutBlockDto,
  [BookBlockType.WARNING]: CalloutBlockDto,
  [BookBlockType.TABLE]: TableBlockDto,
  [BookBlockType.DIVIDER]: SimpleBlockDto,
  [BookBlockType.PAGE_BREAK]: SimpleBlockDto,
  [BookBlockType.QR_LINK]: QrLinkBlockDto,
  [BookBlockType.RECIPE_REF]: RecipeRefBlockDto,
  [BookBlockType.CITATION]: CitationBlockDto,
};

/** Block types whose DTO carries a `richText` field requiring the separate allow-list walk. */
const RICH_TEXT_FIELD_BY_TYPE: Partial<Record<BookBlockType, "richText">> = {
  [BookBlockType.PARAGRAPH]: "richText",
  [BookBlockType.QUOTE]: "richText",
  [BookBlockType.TIP]: "richText",
  [BookBlockType.NOTE]: "richText",
  [BookBlockType.WARNING]: "richText",
};

export function assertValidBlockType(type: unknown): BookBlockType {
  if (typeof type !== "string" || !Object.values(BookBlockType).includes(type as BookBlockType)) {
    throw new BadRequestError(`Unknown or missing block type: ${JSON.stringify(type)}`, {
      knownTypes: Object.values(BookBlockType),
    });
  }
  return type as BookBlockType;
}

/**
 * Validates a block payload's structural shape (class-validator DTO) AND,
 * for any block carrying `richText`, walks that doc against the
 * ProseMirror allow-list. Both must pass before a block is considered
 * valid — this is the ONLY place either check happens, so every entry
 * point (add/replace/duplicate) goes through this function rather than
 * re-implementing validation.
 */
export async function validateBookBlock(payload: Record<string, unknown>): Promise<object> {
  const type = assertValidBlockType(payload.type);
  const DtoClass = BOOK_BLOCK_DTO_BY_TYPE[type];
  const dto = await validateDto(DtoClass, payload);

  const richTextField = RICH_TEXT_FIELD_BY_TYPE[type];
  if (richTextField) {
    assertValidRichTextDoc((dto as Record<string, unknown>)[richTextField]);
  }

  return dto;
}
