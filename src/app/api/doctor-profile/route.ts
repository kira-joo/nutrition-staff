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
import { DOCTOR_PROFILE_TAGS } from "src/server/core/revalidation/revalidate-entity";
import { getOrCreateSingleton } from "src/server/core/singleton";
import {
  DOCTOR_PROFILE_ASSET_FIELDS,
  DOCTOR_PROFILE_ASSET_FOLDER,
} from "src/server/doctor-profile/doctor-profile-asset-fields";
import { doctorProfileRepository } from "src/server/doctor-profile/doctor-profile.repository";
import { UpdateDoctorProfileDto } from "src/server/doctor-profile/dto/update-doctor-profile.dto";

export const dynamic = "force-dynamic";

export const GET = createGetRoute({
  auth: { permissions: [AppPermission.DOCTOR_PROFILE.READ_ONE] },
  handler: async () => getOrCreateSingleton(doctorProfileRepository, {}),
});

// No `body` here — same manual-multipart convention as any asset-bearing
// route. Never touches `gallery`: that array is managed exclusively via
// its own sub-resource routes.
export const PUT = createPutRoute({
  auth: { permissions: [AppPermission.DOCTOR_PROFILE.UPDATE] },
  handler: async ({ request }) => {
    const { fields, files } = await parseMultipartFormData(request);
    const payload = JSON.parse(fields.payload ?? "{}");

    const previousDocument = await getOrCreateSingleton(doctorProfileRepository, {});

    const { uploaded } = await processAssetUploadFields({
      files,
      payload,
      fields: DOCTOR_PROFILE_ASSET_FIELDS,
      provider: assetProvider,
      folder: DOCTOR_PROFILE_ASSET_FOLDER,
    });

    let saved;
    try {
      const dto = await validateDto(UpdateDoctorProfileDto, payload);
      saved = await doctorProfileRepository.update({ where: {} }, dto);
    } catch (error) {
      await destroyUploadedAssets(assetProvider, uploaded);
      throw error;
    }

    await destroyReplacedAssets({
      provider: assetProvider,
      fields: DOCTOR_PROFILE_ASSET_FIELDS,
      files,
      payload,
      previousDocument: previousDocument as unknown as Record<string, unknown>,
    });

    return saved;
  },
  revalidateTags: DOCTOR_PROFILE_TAGS,
});
