import { validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import { assetProvider, destroyReplacedAssets, destroyUploadedAssets, processAssetUploadFields } from "src/server/core/assets";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { getOrCreateSingleton } from "src/server/core/singleton";
import { BOOK_SETTINGS_ASSET_FIELDS, BOOK_SETTINGS_ASSET_FOLDER } from "src/server/book-settings/book-settings-asset-fields";
import { UpdateBookSettingsDto } from "src/server/book-settings/dto/update-book-settings.dto";
import { bookSettingsRepository } from "src/server/book-settings/book-settings.repository";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: { permissions: [AppPermission.BOOK_SETTINGS.READ_ONE] },
  handler: async () => getOrCreateSingleton(bookSettingsRepository, {}),
});

// No `body` — same manual-multipart convention as any asset-bearing
// singleton (see Site Settings). No `revalidateTags`: BookSettings is a
// pre-publish input only — no published Edition depends on it, since the
// resolved values are frozen into the Edition at publish time.
export const PUT = createPutRoute({
  auth: { permissions: [AppPermission.BOOK_SETTINGS.UPDATE] },
  handler: async ({ request }) => {
    const { fields, files } = await parseMultipartFormData(request);
    const payload = JSON.parse(fields.payload ?? "{}");

    const previousDocument = await getOrCreateSingleton(bookSettingsRepository, {});

    const { uploaded } = await processAssetUploadFields({
      files,
      payload,
      fields: BOOK_SETTINGS_ASSET_FIELDS,
      provider: assetProvider,
      folder: BOOK_SETTINGS_ASSET_FOLDER,
    });

    let saved;
    try {
      const dto = await validateDto(UpdateBookSettingsDto, payload);
      saved = await bookSettingsRepository.update({ where: {} }, dto);
    } catch (error) {
      await destroyUploadedAssets(assetProvider, uploaded);
      throw error;
    }

    await destroyReplacedAssets({
      provider: assetProvider,
      fields: BOOK_SETTINGS_ASSET_FIELDS,
      files,
      payload,
      previousDocument: previousDocument as unknown as Record<string, unknown>,
    });

    return saved;
  },
});
