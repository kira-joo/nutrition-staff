import { ConflictError, NotFoundError, validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import type { NextRequest } from "next/server";
import { assertBookSizeBudget } from "src/server/books/assert-book-size-budget";
import { assertBookBlockReferencesValid } from "src/server/books/blocks/assert-book-block-references-valid";
import { BOOK_BLOCK_ASSET_FOLDER, getBookBlockAssetFields } from "src/server/books/blocks/book-block-asset-fields";
import { BlockContainerRef, getContainerBlocks, withContainerBlocks } from "src/server/books/blocks/resolve-block-container";
import { validateBookBlock } from "src/server/books/blocks/validate-book-block";
import { ExpectedRevisionDto } from "src/server/books/dto/expected-revision.dto";
import { bookRepository } from "src/server/books/books.repository";
import { assetProvider, destroyReplacedAssets, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";
import type { BookBlock } from "src/common/interfaces/book-block.interface";

export async function replaceBookBlock(request: NextRequest, bookId: string, containerRef: BlockContainerRef, blockId: string) {
  const { fields, files } = await parseMultipartFormData(request);
  const payload = JSON.parse(fields.payload ?? "{}");
  // See add-book-block.ts for why this is narrowed to one field before validating.
  const { expectedRevision } = await validateDto(ExpectedRevisionDto, { expectedRevision: payload.expectedRevision });
  delete payload.expectedRevision;

  const book = await bookRepository.findOne({ where: { _id: bookId } });
  const containerBlocks = getContainerBlocks(book, containerRef);
  const blockIndex = containerBlocks.findIndex((block) => block.id === blockId);
  if (blockIndex === -1) throw new NotFoundError(`No block exists with id "${blockId}".`, { blockId });
  const previousBlock = containerBlocks[blockIndex];
  // Never trust a client-sent type on replace — the type of a block never changes after creation.
  payload.type = previousBlock.type;

  const assetFields = getBookBlockAssetFields(previousBlock.type);
  const { uploaded } = await processAssetUploadFields({ files, payload, fields: assetFields, provider: assetProvider, folder: BOOK_BLOCK_ASSET_FOLDER });

  let saved;
  try {
    const dto = (await validateBookBlock(payload)) as Omit<BookBlock, "id" | "order">;
    await assertBookBlockReferencesValid(dto as unknown as Record<string, unknown>, book.references);

    const updatedBlock = { ...dto, id: previousBlock.id, order: previousBlock.order } as BookBlock;
    const nextBlocks = containerBlocks.map((block, index) => (index === blockIndex ? updatedBlock : block));

    const patch = withContainerBlocks(book, containerRef, nextBlocks);
    assertBookSizeBudget({ ...book, ...patch } as unknown as Record<string, unknown>);

    try {
      saved = await bookRepository.update({ where: { _id: bookId, contentRevision: expectedRevision } }, { ...patch, contentRevision: expectedRevision + 1 });
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

  await destroyReplacedAssets({
    provider: assetProvider,
    fields: assetFields,
    files,
    payload,
    previousDocument: previousBlock as unknown as Record<string, unknown>,
  });
  return saved;
}
