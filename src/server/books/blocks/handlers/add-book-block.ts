import { ConflictError, NotFoundError, validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import { assertBookSizeBudget } from "src/server/books/assert-book-size-budget";
import { assertBookBlockLimits } from "src/server/books/blocks/assert-book-block-limits";
import { assertBookBlockReferencesValid } from "src/server/books/blocks/assert-book-block-references-valid";
import { BOOK_BLOCK_ASSET_FOLDER, getBookBlockAssetFields } from "src/server/books/blocks/book-block-asset-fields";
import { BlockContainerRef, getContainerBlocks, withContainerBlocks } from "src/server/books/blocks/resolve-block-container";
import { assertValidBlockType, validateBookBlock } from "src/server/books/blocks/validate-book-block";
import { ExpectedRevisionDto } from "src/server/books/dto/expected-revision.dto";
import { bookRepository } from "src/server/books/books.repository";
import { assetProvider, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";
import type { BookBlock } from "src/common/interfaces/book-block.interface";

export async function addBookBlock(request: NextRequest, bookId: string, containerRef: BlockContainerRef) {
  const { fields, files } = await parseMultipartFormData(request);
  const payload = JSON.parse(fields.payload ?? "{}");
  // Narrowed to just this one field before validating — `validateDto` whitelists by
  // default, so validating the FULL block payload (which legitimately carries `type`
  // plus whatever type-specific fields) against a DTO that only declares
  // `expectedRevision` would reject every other field as "should not exist."
  const { expectedRevision } = await validateDto(ExpectedRevisionDto, { expectedRevision: payload.expectedRevision });
  // Removed so it isn't rejected as an unknown field when `payload` is validated against a per-type block DTO below (none of the 12 declare it).
  delete payload.expectedRevision;

  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const containerBlocks = getContainerBlocks(book, containerRef);

  const assetFields = getBookBlockAssetFields(assertValidBlockType(payload.type));
  const { uploaded } = await processAssetUploadFields({ files, payload, fields: assetFields, provider: assetProvider, folder: BOOK_BLOCK_ASSET_FOLDER });

  try {
    const dto = (await validateBookBlock(payload)) as Omit<BookBlock, "id" | "order">;
    await assertBookBlockReferencesValid(dto as unknown as Record<string, unknown>, book.references);

    const newBlock = { ...dto, id: crypto.randomUUID(), order: containerBlocks.length } as BookBlock;
    const nextBlocks = [...containerBlocks, newBlock];
    assertBookBlockLimits(book, nextBlocks.length);

    const patch = withContainerBlocks(book, containerRef, nextBlocks);
    assertBookSizeBudget({ ...book, ...patch } as unknown as Record<string, unknown>);

    try {
      return await bookRepository.update({ where: { _id: bookId, contentRevision: expectedRevision } }, { ...patch, contentRevision: expectedRevision + 1 });
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw new ConflictError("This book's content was changed elsewhere. Refresh the page and try again.");
      }
      throw error;
    }
  } catch (error) {
    await destroyUploadedAssets(assetProvider, uploaded);
    throw error;
  }
}
