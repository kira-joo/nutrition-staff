import { ConflictError, NotFoundError, BadRequestError, validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import { assetProvider, destroyReplacedAssets, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createDeleteRoute, createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { BOOK_ASSET_FIELDS, BOOK_ASSET_FOLDER } from "src/server/books/book-asset-fields";
import { assertBookStatusTransition } from "src/server/books/assert-book-status-transition";
import { FindBookParamsDto } from "src/server/books/dto/find-book-params.dto";
import { UpdateBookDto } from "src/server/books/dto/update-book.dto";
import { bookRepository } from "src/server/books/books.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  params: FindBookParamsDto,
  auth: { permissions: [AppPermission.BOOK.READ_ONE] },
  handler: async ({ params }) => bookRepository.findOne({ where: { _id: params.id } }),
});

// No `body` — multipart, same convention as any asset-bearing entity.
// Never accepts chapters/frontMatter/backMatter/references (those get
// their own sub-resource routes once Phase C exists); `status` can never
// reach PUBLISHED through this route (assertBookStatusTransition enforces
// that — publishing is a dedicated action, not a field edit).
export const PUT = createPutRoute({
  params: FindBookParamsDto,
  auth: { permissions: [AppPermission.BOOK.UPDATE] },
  handler: async ({ params, request }) => {
    const { fields, files } = await parseMultipartFormData(request);
    const payload = JSON.parse(fields.payload ?? "{}");

    const previousDocument = await bookRepository.findOne({ where: { _id: params.id } });

    const { uploaded } = await processAssetUploadFields({
      files,
      payload,
      fields: BOOK_ASSET_FIELDS,
      provider: assetProvider,
      folder: BOOK_ASSET_FOLDER,
    });

    let saved;
    try {
      const dto = await validateDto(UpdateBookDto, payload);
      const nextStatus = dto.status ?? previousDocument.status;
      assertBookStatusTransition(previousDocument.status, nextStatus);

      const { expectedRevision, ...updatePayload } = dto;
      try {
        saved = await bookRepository.update(
          { where: { _id: params.id, revision: expectedRevision } },
          { ...updatePayload, revision: expectedRevision + 1 }
        );
      } catch (error) {
        if (error instanceof NotFoundError) {
          throw new ConflictError("This book was changed elsewhere. Refresh the page and try again.");
        }
        throw error;
      }
    } catch (error) {
      await destroyUploadedAssets(assetProvider, uploaded);
      throw error;
    }

    await destroyReplacedAssets({
      provider: assetProvider,
      fields: BOOK_ASSET_FIELDS,
      files,
      payload,
      previousDocument: previousDocument as unknown as Record<string, unknown>,
    });

    return saved;
  },
});

export const DELETE = createDeleteRoute({
  params: FindBookParamsDto,
  auth: { permissions: [AppPermission.BOOK.DELETE] },
  handler: async ({ params }) => {
    const book = await bookRepository.findOne({ where: { _id: params.id } });
    if (book.editionCount > 0) {
      throw new BadRequestError("This book has published editions and cannot be deleted. Archive it instead.");
    }
    await bookRepository.softDelete({ where: { _id: params.id } });
  },
});
