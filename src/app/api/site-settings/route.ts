import { validateDto } from "@kira-joo/backend-toolkit-core";
import { parseMultipartFormData } from "@kira-joo/backend-toolkit-next";
import {
  assetProvider,
  destroyReplacedAssets,
  destroyUploadedAssets,
  processAssetUploadFields,
} from "src/server/core/assets";
import { AppPermission } from "src/server/core/authorization/authorization-registry";
import { createGetRoute, createPutRoute } from "src/server/core/route-factories";
import { getOrCreateSingleton } from "src/server/core/singleton";
import { SITE_SETTINGS_ASSET_FIELDS, SITE_SETTINGS_ASSET_FOLDER } from "src/server/site-settings/site-settings-asset-fields";
import { UpdateSiteSettingsDto } from "src/server/site-settings/dto/update-site-settings.dto";
import { siteSettingsRepository } from "src/server/site-settings/site-settings.repository";

export const GET = createGetRoute({
  auth: { permissions: [AppPermission.SITE_SETTINGS.READ_ONE] },
  handler: async () => getOrCreateSingleton(siteSettingsRepository, {}),
});

// No `body` here — same manual-multipart convention as any asset-bearing
// entity route (see Review); this always expects multipart/form-data.
export const PUT = createPutRoute({
  auth: { permissions: [AppPermission.SITE_SETTINGS.UPDATE] },
  handler: async ({ request }) => {
    const { fields, files } = await parseMultipartFormData(request);
    const payload = JSON.parse(fields.payload ?? "{}");

    // Ensures the one document exists before we try to update it — a PUT
    // can legitimately be the very first write, with no prior GET.
    const previousDocument = await getOrCreateSingleton(siteSettingsRepository, {});

    const { uploaded } = await processAssetUploadFields({
      files,
      payload,
      fields: SITE_SETTINGS_ASSET_FIELDS,
      provider: assetProvider,
      folder: SITE_SETTINGS_ASSET_FOLDER,
    });

    let saved;
    try {
      const dto = await validateDto(UpdateSiteSettingsDto, payload);
      saved = await siteSettingsRepository.update({ where: {} }, dto);
    } catch (error) {
      await destroyUploadedAssets(assetProvider, uploaded);
      throw error;
    }

    await destroyReplacedAssets({
      provider: assetProvider,
      fields: SITE_SETTINGS_ASSET_FIELDS,
      files,
      payload,
      previousDocument: previousDocument as unknown as Record<string, unknown>,
    });

    return saved;
  },
});
