import { AssetKind, doctorPhotoPolicy, type AssetFieldConfig } from "src/server/core/assets";

export const DOCTOR_PROFILE_ASSET_FIELDS: readonly AssetFieldConfig[] = [
  { name: "avatar", kind: AssetKind.IMAGE, policy: doctorPhotoPolicy },
];

/** One field, reused per gallery-item request — each add/replace only ever carries a single image. */
export const DOCTOR_PROFILE_GALLERY_ASSET_FIELDS: readonly AssetFieldConfig[] = [
  { name: "image", kind: AssetKind.IMAGE, policy: doctorPhotoPolicy },
];

export const DOCTOR_PROFILE_ASSET_FOLDER = "nutrition/doctor-profile";
